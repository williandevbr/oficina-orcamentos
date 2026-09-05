import { Router } from "express";
import rateLimit from "express-rate-limit";
import { supabase } from "../lib/supabase.js";
import { mensagemBanco } from "../lib/mensagensErro.js";
import { calcularTotais, calcularSubtotal } from "../services/calculo.js";
import {
  idValido,
  orcamentoCriarSchema,
  orcamentoAtualizarSchema,
  primeiraMensagemZod,
} from "../services/validacao.js";
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

// PDF é rota cara (gera arquivo): freio riêngido — 30 por 15 min por IP.
// O limite geral da API (300/15min) continua valendo no index.js.
const limitadorPdf = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Aguarde alguns minutos." },
});

// Se o Supabase não encontrar a linha, ele responde com o código PGRST116
// Aqui convertemos isso em HTTP 404 ("não encontrado" — o código certo)
function tratarNaoEncontrado(error) {
  return error?.code === "PGRST116";
}

// 1. LISTAR orçamentos do usuário logado (com o nome/veículo do cliente)
// Sem ?page -> array (compatível com o site atual).
// Com ?page -> { data, total, page, limit, totalPages }.
// Filtros: ?search= (observações ou número), ?status=, ?cliente_id=
router.get("/", async (req, res, next) => {
  try {
    const { page, limit, search, status, cliente_id } = req.query || {};

    const aplicarFiltros = (query) => {
      let q = query.eq("user_id", req.userId);
      if (typeof status === "string" && status.trim() !== "") {
        q = q.eq("status", status.trim());
      }
      if (typeof cliente_id === "string" && cliente_id.trim() !== "") {
        if (!idValido(cliente_id.trim())) {
          throw Object.assign(new Error("Cliente inválido."), { status: 400 });
        }
        q = q.eq("cliente_id", cliente_id.trim());
      }
      if (typeof search === "string" && search.trim() !== "") {
        const s = search.trim().replace(/[%_,"'().]/g, "");
        if (s === "") return q;
        if (/^\d+$/.test(s)) {
          q = q.or(`numero.eq.${s},observacoes.ilike.%${s}%`);
        } else {
          q = q.ilike("observacoes", `%${s}%`);
        }
      }
      return q;
    };

    if (page === undefined) {
      const { data, error } = await aplicarFiltros(
        supabase.from("orcamentos").select("*, clientes(nome, veiculo, placa)"),
      ).order("numero", { ascending: false });
      if (error) {
        return res.status(400).json({ message: mensagemBanco(error) });
      }
      return res.json(data);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data, error, count } = await aplicarFiltros(
      supabase
        .from("orcamentos")
        .select("*, clientes(nome, veiculo, placa)", { count: "exact" }),
    )
      .order("numero", { ascending: false })
      .range(from, to);

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    const total = count ?? 0;
    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (e) {
    next(e);
  }
});

// 2. BAIXAR PDF - gera o arquivo do orçamento
// (precisa vir antes de "/:id" para o Express não confundir "pdf" com um id)
router.get("/:id/pdf", limitadorPdf, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

  const { data, error } = await supabase
    .from("orcamentos")
    .select(
      "*, clientes(nome, telefone, email, endereco, veiculo, placa), orcamento_itens(*)",
    )
    .eq("id", id)
    .eq("user_id", req.userId)
    .single();

  if (error) {
    if (tratarNaoEncontrado(error)) {
      return res.status(404).json({ message: "Orçamento não encontrado." });
    }
    return res.status(400).json({ message: mensagemBanco(error) });
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
  } catch (e) {
    next(e);
  }
});

// 3. DETALHE de um orçamento (com todos os itens)
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

  const { data, error } = await supabase
    .from("orcamentos")
    .select("*, clientes(nome, veiculo, placa, telefone), orcamento_itens(*)")
    .eq("id", id)
    .eq("user_id", req.userId)
    .single();

  if (error) {
    if (tratarNaoEncontrado(error)) {
      return res.status(404).json({ message: "Orçamento não encontrado." });
    }
    return res.status(400).json({ message: mensagemBanco(error) });
  }
  if (!data) {
    return res.status(404).json({ message: "Orçamento não encontrado." });
  }
  res.json(data);
  } catch (e) {
    next(e);
  }
});

// 3. CRIAR um orçamento (com seus itens) - TRANSACAO ATOMICA
// Tudo (cabecalho + itens) e salvo junto ou nada e salvo.
router.post("/", async (req, res, next) => {
  try {
    const validado = orcamentoCriarSchema.safeParse(req.body || {});
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }
    const {
      cliente_id,
      status = "rascunho",
      desconto = 0,
      observacoes,
      validade_dias = 7,
      itens,
    } = validado.data;
    const validadeNum = validade_dias;

    // Cálculo automático (a fonte da verdade é o servidor)
    const subtotal = calcularSubtotal(itens);
    if (Number(desconto) > subtotal) {
      return res.status(400).json({
        message: `Desconto não pode ser maior que o subtotal (R$ ${subtotal.toFixed(2)}).`,
      });
    }
    const { desconto: descontoNum, total } = calcularTotais(itens, desconto);

    const itensJson = itens.map((item) => ({
      descricao: item.descricao.trim(),
      tipo: item.tipo,
      quantidade: Number(item.quantidade),
      valor_unitario: Number(item.valor_unitario),
    }));

    // Chama a funcao SQL que insere tudo numa transacao so
    const { data: novoId, error: errRpc } = await supabase.rpc(
      "criar_orcamento_com_itens",
      {
        p_user_id: req.userId,
        p_cliente_id: cliente_id,
        p_status: status,
        p_desconto: descontoNum,
        p_total: total,
        p_observacoes: observacoes || null,
        p_validade_dias: validadeNum,
        p_itens: itensJson,
      },
    );

    if (errRpc) {
      const msg = errRpc.message || "";
      if (msg.includes("CLIENTE_INVALIDO")) {
        return res
          .status(400)
          .json({ message: "Escolha um cliente válido para o orçamento." });
      }
      if (
        msg.includes("ITENS_OBRIGATORIOS") ||
        msg.includes("ITEM_SEM_DESCRICAO") ||
        msg.includes("ITEM_TIPO_INVALIDO") ||
        msg.includes("ITEM_QTD_INVALIDA") ||
        msg.includes("ITEM_VALOR_INVALIDO")
      ) {
        return res.status(400).json({ message: "Itens inválidos." });
      }
      return res.status(400).json({ message: mensagemBanco(errRpc) });
    }

    // Busca o registro completo para devolver ao site
    const { data: completo, error: errBusca } = await supabase
      .from("orcamentos")
      .select("*, orcamento_itens(*)")
      .eq("id", novoId)
      .eq("user_id", req.userId)
      .single();

    if (errBusca) {
      return res.status(201).json({ id: novoId });
    }

    res.status(201).json(completo);
  } catch (e) {
    next(e);
  }
});

// 4. ATUALIZAR um orçamento - TRANSACAO ATOMICA
// A troca dos itens acontece dentro de uma transacao: ou troca tudo ou nao muda nada.
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }
    // Whitelist dos campos + validacao Zod (inclui "Nada para atualizar")
    const corpo = req.body || {};
    const entrada = {
      ...(corpo.cliente_id !== undefined && { cliente_id: corpo.cliente_id }),
      ...(corpo.status !== undefined && { status: corpo.status }),
      ...(corpo.desconto !== undefined && { desconto: corpo.desconto }),
      ...(corpo.observacoes !== undefined && { observacoes: corpo.observacoes }),
      ...(corpo.validade_dias !== undefined && {
        validade_dias: corpo.validade_dias,
      }),
      ...(corpo.itens !== undefined && { itens: corpo.itens }),
    };
    const validado = orcamentoAtualizarSchema.safeParse(entrada);
    if (!validado.success) {
      return res.status(400).json({ message: primeiraMensagemZod(validado) });
    }
    const { cliente_id, status, desconto, observacoes, validade_dias, itens } =
      validado.data;

    // Busca o atual (com dono) para completar os campos que nao vieram
    const { data: atual, error: errAtual } = await supabase
      .from("orcamentos")
      .select("cliente_id, status, desconto, total, observacoes, validade_dias")
      .eq("id", id)
      .eq("user_id", req.userId)
      .maybeSingle();
    if (errAtual) {
      return res.status(400).json({ message: mensagemBanco(errAtual) });
    }
    if (!atual) {
      return res.status(404).json({ message: "Orçamento não encontrado." });
    }

    // Define os valores finais do cabecalho
    const clienteFinal = cliente_id !== undefined ? cliente_id : atual.cliente_id;
    const statusFinal = status !== undefined ? status : atual.status;
    const validadeFinal =
      validade_dias !== undefined ? Number(validade_dias) : atual.validade_dias;
    const observacoesFinal =
      observacoes !== undefined ? observacoes : atual.observacoes;

    let descontoFinal;
    let totalFinal;
    let itensJson = null;

    if (itens !== undefined) {
      const descontoUsado = desconto !== undefined ? desconto : atual.desconto;
      const subtotal = calcularSubtotal(itens);
      if (Number(descontoUsado) > subtotal) {
        return res.status(400).json({
          message: `Desconto não pode ser maior que o subtotal (R$ ${subtotal.toFixed(2)}).`,
        });
      }
      const calc = calcularTotais(itens, descontoUsado);
      descontoFinal = calc.desconto;
      totalFinal = calc.total;
      itensJson = itens.map((item) => ({
        descricao: item.descricao.trim(),
        tipo: item.tipo,
        quantidade: Number(item.quantidade),
        valor_unitario: Number(item.valor_unitario),
      }));
    } else if (desconto !== undefined) {
      // Mudou só o desconto: recalcula com os itens atuais
      const { data: itensAtuais } = await supabase
        .from("orcamento_itens")
        .select("quantidade, valor_unitario")
        .eq("orcamento_id", id);
      const subtotal = calcularSubtotal(itensAtuais || []);
      if (Number(desconto) > subtotal) {
        return res.status(400).json({
          message: `Desconto não pode ser maior que o subtotal (R$ ${subtotal.toFixed(2)}).`,
        });
      }
      const calc = calcularTotais(itensAtuais || [], desconto);
      descontoFinal = calc.desconto;
      totalFinal = calc.total;
    } else {
      descontoFinal = atual.desconto;
      totalFinal = atual.total;
    }

    const { error: errRpc } = await supabase.rpc(
      "atualizar_orcamento_com_itens",
      {
        p_user_id: req.userId,
        p_orcamento_id: id,
        p_cliente_id: clienteFinal,
        p_status: statusFinal,
        p_desconto: descontoFinal,
        p_total: totalFinal,
        p_observacoes: observacoesFinal,
        p_validade_dias: validadeFinal,
        p_itens: itensJson,
      },
    );

    if (errRpc) {
      const msg = errRpc.message || "";
      if (msg.includes("ORCAMENTO_NAO_ENCONTRADO")) {
        return res.status(404).json({ message: "Orçamento não encontrado." });
      }
      if (msg.includes("CLIENTE_INVALIDO")) {
        return res.status(400).json({ message: "Cliente inválido." });
      }
      if (
        msg.includes("ITENS_OBRIGATORIOS") ||
        msg.includes("ITEM_SEM_DESCRICAO") ||
        msg.includes("ITEM_TIPO_INVALIDO") ||
        msg.includes("ITEM_QTD_INVALIDA") ||
        msg.includes("ITEM_VALOR_INVALIDO")
      ) {
        return res.status(400).json({ message: "Itens inválidos." });
      }
      return res.status(400).json({ message: mensagemBanco(errRpc) });
    }

    const { data, error } = await supabase
      .from("orcamentos")
      .select("*, clientes(nome, veiculo, placa, telefone), orcamento_itens(*)")
      .eq("id", id)
      .eq("user_id", req.userId)
      .single();

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// 5. APAGAR um orçamento (os itens são apagados junto, automaticamente)
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!idValido(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const { data, error } = await supabase
      .from("orcamentos")
      .delete()
      .eq("id", id)
      .eq("user_id", req.userId)
      .select("id")
      .maybeSingle();

    if (error) {
      return res.status(400).json({ message: mensagemBanco(error) });
    }
    if (!data) {
      return res.status(404).json({ message: "Orçamento não encontrado." });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
