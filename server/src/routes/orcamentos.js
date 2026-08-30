import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { calcularTotais } from "../services/calculo.js";
import { gerarPdfOrcamento } from "../services/pdf.js";

// ============================================================
// Rotas da API de ORÇAMENTOS
// ============================================================
//   GET    /api/orcamentos        -> lista todos (com nome do cliente)
//   GET    /api/orcamentos/:id    -> detalhe (com os itens)
//   POST   /api/orcamentos        -> cria (calcula o total)
//   PUT    /api/orcamentos/:id    -> atualiza (recalcula o total)
//   DELETE /api/orcamentos/:id    -> remove
// ============================================================

const router = Router();

// Função que valida os itens antes de salvar
function validarItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    return "O orçamento precisa de pelo menos um item (serviço ou peça).";
  }
  for (const item of itens) {
    if (!item.descricao || !item.descricao.trim()) {
      return "Todo item precisa de uma descrição.";
    }
    if (!["servico", "peca"].includes(item.tipo)) {
      return "O tipo do item deve ser 'servico' ou 'peca'.";
    }
    if (Number(item.quantidade) <= 0 || Number(item.valor_unitario) < 0) {
      return "Quantidade e valor inválidos em um dos itens.";
    }
  }
  return null;
}

// Se o Supabase não encontrar a linha, ele responde com o código PGRST116
// Aqui convertemos isso em HTTP 404 ("não encontrado" — o código certo)
function tratarNaoEncontrado(error) {
  return error?.code === "PGRST116";
}

// 1. LISTAR todos os orçamentos (com o nome/veículo do cliente)
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*, clientes(nome, veiculo, placa)")
    .order("numero", { ascending: false });

  if (error) {
    return res.status(400).json({ message: error.message });
  }
  res.json(data);
});

// 2. BAIXAR PDF - gera o arquivo do orçamento
// (precisa vir antes de "/:id" para o Express não confundir "pdf" com um id)
router.get("/:id/pdf", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("orcamentos")
    .select(
      "*, clientes(nome, telefone, email, endereco, veiculo, placa), orcamento_itens(*)",
    )
    .eq("id", id)
    .single();

  if (error) {
    if (tratarNaoEncontrado(error)) {
      return res.status(404).json({ message: "Orçamento não encontrado." });
    }
    return res.status(400).json({ message: error.message });
  }
  if (!data) {
    return res.status(404).json({ message: "Orçamento não encontrado." });
  }

  try {
    // Gera o PDF profissional
    const buffer = await gerarPdfOrcamento(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="orcamento-${String(data.numero).padStart(4, "0")}.pdf"`,
    );
    res.send(buffer);
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    res.status(500).json({ message: "Erro ao gerar o PDF do orçamento." });
  }
});

// 3. DETALHE de um orçamento (com todos os itens)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("orcamentos")
    .select("*, clientes(nome, veiculo, placa, telefone), orcamento_itens(*)")
    .eq("id", id)
    .single();

  if (error) {
    if (tratarNaoEncontrado(error)) {
      return res.status(404).json({ message: "Orçamento não encontrado." });
    }
    return res.status(400).json({ message: error.message });
  }
  if (!data) {
    return res.status(404).json({ message: "Orçamento não encontrado." });
  }
  res.json(data);
});

// 3. CRIAR um orçamento (com seus itens)
router.post("/", async (req, res) => {
  const {
    cliente_id,
    status = "rascunho",
    desconto = 0,
    observacoes,
    validade_dias = 7,
    itens = [],
  } = req.body || {};

  // Regras de negócio
  if (!cliente_id) {
    return res
      .status(400)
      .json({ message: "Escolha um cliente para o orçamento." });
  }
  const erroItens = validarItens(itens);
  if (erroItens) {
    return res.status(400).json({ message: erroItens });
  }

  // Cálculo automático (a fonte da verdade é o servidor)
  const {
    subtotal,
    desconto: descontoNum,
    total,
  } = calcularTotais(itens, desconto);

  // 1º) cria o orçamento
  const { data: orcamento, error: errOrc } = await supabase
    .from("orcamentos")
    .insert({
      cliente_id,
      status,
      desconto: descontoNum,
      total,
      observacoes: observacoes || null,
      validade_dias,
    })
    .select()
    .single();

  if (errOrc) {
    return res.status(400).json({ message: errOrc.message });
  }

  // 2º) cria os itens ligados ao orçamento
  const itensProntos = itens.map((item) => ({
    orcamento_id: orcamento.id,
    descricao: item.descricao.trim(),
    tipo: item.tipo,
    quantidade: Number(item.quantidade),
    valor_unitario: Number(item.valor_unitario),
    total: Number(item.quantidade) * Number(item.valor_unitario),
  }));

  const { error: errItens } = await supabase
    .from("orcamento_itens")
    .insert(itensProntos);

  if (errItens) {
    // se os itens falharem, desfaz o orçamento para não ficar "órfão"
    await supabase.from("orcamentos").delete().eq("id", orcamento.id);
    return res.status(400).json({ message: errItens.message });
  }

  res.status(201).json({ ...orcamento, itens: itensProntos });
});

// 4. ATUALIZAR um orçamento (recebe os itens e recalcula)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { cliente_id, status, desconto, observacoes, validade_dias, itens } =
    req.body || {};

  // monta só os campos que vieram
  const campos = {};
  if (cliente_id) campos.cliente_id = cliente_id;
  if (status) campos.status = status;
  if (desconto !== undefined) campos.desconto = Number(desconto);
  if (observacoes !== undefined) campos.observacoes = observacoes;
  if (validade_dias) campos.validade_dias = validade_dias;

  // se veio itens, valida, recalculca e recria
  if (itens) {
    const erroItens = validarItens(itens);
    if (erroItens) {
      return res.status(400).json({ message: erroItens });
    }

    const descontoUsado = campos.desconto ?? Number(0);
    const { desconto: descontoNum, total } = calcularTotais(
      itens,
      descontoUsado,
    );
    campos.desconto = descontoNum;
    campos.total = total;

    // apaga os itens antigos para inserir os novos
    await supabase.from("orcamento_itens").delete().eq("orcamento_id", id);

    const itensProntos = itens.map((item) => ({
      orcamento_id: id,
      descricao: item.descricao.trim(),
      tipo: item.tipo,
      quantidade: Number(item.quantidade),
      valor_unitario: Number(item.valor_unitario),
      total: Number(item.quantidade) * Number(item.valor_unitario),
    }));

    const { error: errItens } = await supabase
      .from("orcamento_itens")
      .insert(itensProntos);

    if (errItens) {
      return res.status(400).json({ message: errItens.message });
    }
  }

  const { data, error } = await supabase
    .from("orcamentos")
    .update(campos)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (tratarNaoEncontrado(error)) {
      return res.status(404).json({ message: "Orçamento não encontrado." });
    }
    return res.status(400).json({ message: error.message });
  }
  if (!data) {
    return res.status(404).json({ message: "Orçamento não encontrado." });
  }
  res.json(data);
});

// 5. APAGAR um orçamento (os itens são apagados junto, automaticamente)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("orcamentos").delete().eq("id", id);

  if (error) {
    return res.status(400).json({ message: error.message });
  }
  res.json({ ok: true });
});

export default router;
