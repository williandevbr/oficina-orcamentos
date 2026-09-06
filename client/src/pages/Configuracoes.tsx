import { useEffect, useState } from "react";
import {
  Store,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  Loader2,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { mascararTelefone, mascararCnpj } from "../utils/mascaras";
import { mensagemErroRede } from "../utils/erros";
import { apiFetch } from "../lib/api";

// ============================================================
// Página de CONFIGURAÇÕES (dados da oficina)
// ============================================================
// Nome, telefone, endereço, CNPJ... O PDF usa estes dados
// no cabeçalho e na assinatura automática.
// ============================================================

async function lerJsonSeguro(resp: Response): Promise<any> {
  try {
    return await resp.json();
  } catch {
    return {};
  }
}

interface FormLoja {
  nome_loja: string;
  telefone: string;
  email: string;
  endereco: string;
  cnpj: string;
}

function formVazio(): FormLoja {
  return { nome_loja: "", telefone: "", email: "", endereco: "", cnpj: "" };
}

interface CampoLoja {
  nome: keyof FormLoja;
  label: string;
  tipo: string;
  placeholder?: string;
  icone: LucideIcon;
  maxLength?: number;
}

export default function Configuracoes() {
  const [form, setForm] = useState<FormLoja>(formVazio);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controle = new AbortController();
    (async () => {
      try {
        const resp = await apiFetch("/api/loja", { signal: controle.signal });
        if (controle.signal.aborted) return;
        if (resp.status === 404) return; // nunca cadastrou: form vazio
        const dados = await lerJsonSeguro(resp);
        if (!resp.ok) throw new Error(dados.message || "Não foi possível carregar.");
        setForm({
          nome_loja: dados.nome_loja || "",
          telefone: dados.telefone || "",
          email: dados.email || "",
          endereco: dados.endereco || "",
          cnpj: dados.cnpj || "",
        });
      } catch (e) {
        if (controle.signal.aborted) return;
        const msg = mensagemErroRede(e, "Não foi possível carregar.");
        if (msg !== null) setErro(msg);
      } finally {
        if (!controle.signal.aborted) setCarregando(false);
      }
    })();
    return () => controle.abort();
  }, []);

  function aoMudar(campo: keyof FormLoja, valor: string) {
    if (campo === "telefone") {
      setForm((atual) => ({ ...atual, telefone: mascararTelefone(valor) }));
    } else if (campo === "cnpj") {
      setForm((atual) => ({ ...atual, cnpj: mascararCnpj(valor) }));
    } else if (campo === "nome_loja") {
      setForm((atual) => ({ ...atual, nome_loja: valor }));
    } else if (campo === "email") {
      setForm((atual) => ({ ...atual, email: valor }));
    } else {
      setForm((atual) => ({ ...atual, endereco: valor }));
    }
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (form.nome_loja.trim().length < 2) {
      setErro("Digite o nome da oficina (mínimo 2 letras).");
      return;
    }
    try {
      setSalvando(true);
      setErro("");
      const resp = await apiFetch("/api/loja", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_loja: form.nome_loja.trim(),
          telefone: form.telefone.trim() || undefined,
          email: form.email.trim() || undefined,
          endereco: form.endereco.trim() || undefined,
          cnpj: form.cnpj.trim() || undefined,
        }),
      });
      const dados = await lerJsonSeguro(resp);
      if (!resp.ok) {
        setErro(dados.message || "Erro ao salvar.");
        return;
      }
      toast.success("Dados da oficina salvos!");
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  const campos: CampoLoja[] = [
    {
      nome: "nome_loja",
      label: "Nome da oficina *",
      tipo: "text",
      placeholder: "Ex.: Auto Center Silva",
      icone: Store,
      maxLength: 120,
    },
    {
      nome: "telefone",
      label: "Telefone / WhatsApp",
      tipo: "text",
      placeholder: "(11) 3456-7890",
      icone: Phone,
      maxLength: 15,
    },
    {
      nome: "email",
      label: "E-mail",
      tipo: "email",
      placeholder: "contato@oficina.com",
      icone: Mail,
      maxLength: 160,
    },
    {
      nome: "endereco",
      label: "Endereço",
      tipo: "text",
      placeholder: "Rua, número, bairro, cidade",
      icone: MapPin,
      maxLength: 200,
    },
    {
      nome: "cnpj",
      label: "CNPJ",
      tipo: "text",
      placeholder: "00.000.000/0001-00",
      icone: FileText,
      maxLength: 18,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Store className="h-6 w-6 text-blue-600" />
          Configurações
        </h2>
        <p className="text-slate-500">Dados da oficina (aparecem no PDF)</p>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          O nome, telefone, endereço e CNPJ daqui saem no cabeçalho, no rodapé
          e na assinatura de todo orçamento em PDF.
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {carregando ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          <form onSubmit={salvar} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {campos.map((campo) => (
                <div
                  key={campo.nome}
                  className={campo.nome === "nome_loja" || campo.nome === "endereco" ? "sm:col-span-2" : ""}
                >
                  <label
                    htmlFor={`loja-${campo.nome}`}
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    {campo.label}
                  </label>
                  <div className="relative">
                    <campo.icone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id={`loja-${campo.nome}`}
                      type={campo.tipo}
                      value={form[campo.nome]}
                      onChange={(e) => aoMudar(campo.nome, e.target.value)}
                      placeholder={campo.placeholder}
                      maxLength={campo.maxLength}
                      required={campo.nome === "nome_loja"}
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              ))}
            </div>

            {erro && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {erro}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {salvando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {salvando ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
