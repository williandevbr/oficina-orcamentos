// ============================================================
// Testes de INTEGRAÇÃO da API (supertest + banco simulado)
// ============================================================
// Testam o caminho inteiro: HTTP -> porteiro -> rota -> resposta.
// O Supabase é simulado (mock): nenhum teste encosta no banco
// de verdade, então rodam no CI sem segredos.
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "./app.js";
import { supabase } from "./lib/supabase.js";

const USER_ID = "11111111-2222-3333-4444-555555555555";

// Constrói um construtor de consulta falso (encadeável como o Supabase)
// que devolve o resultado combinado e anota os filtros usados.
function consultaFalsa(resultado, filtros) {
  const q = {
    select: () => q,
    eq: (col, val) => {
      filtros.push([col, val]);
      return q;
    },
    or: () => q,
    ilike: () => q,
    in: () => q,
    order: () => q,
    range: () => q,
    insert: () => q,
    update: () => q,
    delete: () => q,
    single: async () => resultado,
    maybeSingle: async () => resultado,
    then: (ok, nok) => Promise.resolve(resultado).then(ok, nok),
  };
  return q;
}

beforeEach(() => {
  // Login sempre válido nos testes (crachá aceito, dono = USER_ID)
  vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("saúde e porteiro", () => {
  it("GET /api/health responde sem login", async () => {
    const resp = await request(app).get("/api/health");
    expect(resp.status).toBe(200);
    expect(resp.body.status).toBe("ok");
  });

  it("GET /api/clientes sem crachá nega (401)", async () => {
    const resp = await request(app).get("/api/clientes");
    expect(resp.status).toBe(401);
  });

  it("rota desconhecida com login devolve 404", async () => {
    const resp = await request(app)
      .get("/api/nao-existe")
      .set("Authorization", "Bearer token-teste");
    expect(resp.status).toBe(404);
  });
});

describe("clientes (isolamento por dono)", () => {
  it("lista só do dono (filtra user_id) em modo legado", async () => {
    const filtros = [];
    vi.spyOn(supabase, "from").mockImplementation(() =>
      consultaFalsa(
        {
          data: [{ id: "a", nome: "Ana" }],
          error: null,
        },
        filtros,
      ),
    );

    const resp = await request(app)
      .get("/api/clientes")
      .set("Authorization", "Bearer token-teste");

    expect(resp.status).toBe(200);
    expect(resp.body).toHaveLength(1);
    expect(filtros).toContainEqual(["user_id", USER_ID]);
  });

  it("POST sem nome recusa (400) sem encostar na tabela", async () => {
    const spyFrom = vi
      .spyOn(supabase, "from")
      .mockImplementation(() => consultaFalsa({ data: [], error: null }, []));

    const resp = await request(app)
      .post("/api/clientes")
      .set("Authorization", "Bearer token-teste")
      .send({ telefone: "11999999999" });

    expect(resp.status).toBe(400);
    expect(resp.body.message).toMatch(/nome/i);
    expect(spyFrom).not.toHaveBeenCalled();
  });
});

describe("orçamentos (validação e paginação)", () => {
  it("POST vazio recusa com 'Nada para atualizar' ou cliente obrigatório", async () => {
    const resp = await request(app)
      .post("/api/orcamentos")
      .set("Authorization", "Bearer token-teste")
      .send({});

    expect(resp.status).toBe(400);
    expect(resp.body.message).toBeTruthy();
  });

  it("GET com page devolve objeto paginado", async () => {
    vi.spyOn(supabase, "from").mockImplementation(() =>
      consultaFalsa(
        { data: [{ id: "o1", numero: 7 }], error: null, count: 1 },
        [],
      ),
    );

    const resp = await request(app)
      .get("/api/orcamentos?page=1&limit=2")
      .set("Authorization", "Bearer token-teste");

    expect(resp.status).toBe(200);
    expect(resp.body.data).toHaveLength(1);
    expect(resp.body.total).toBe(1);
    expect(resp.body.page).toBe(1);
  });

  it("GET com id inválido recusa (400)", async () => {
    const resp = await request(app)
      .get("/api/orcamentos/nao-uuid")
      .set("Authorization", "Bearer token-teste");

    expect(resp.status).toBe(400);
  });
});
