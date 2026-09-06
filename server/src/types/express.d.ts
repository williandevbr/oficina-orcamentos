// O porteiro (autenticar) garante usuário logado e carimba o dono.
// Declarado aqui para req.userId existir em todas as rotas.
declare global {
  namespace Express {
    interface Request {
      userId: string;
      usuario?: import("@supabase/supabase-js").User;
      token?: string;
    }
  }
}

export {};
