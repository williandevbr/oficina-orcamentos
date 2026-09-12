# OrcaPro

**Sistema de orçamentos para oficinas mecânicas — clientes, veículos, orçamentos, PDF profissional e controle de pagamentos.**

→ Demo: https://orca-pro-nine.vercel.app

## O problema

Oficina que controla orçamento no caderno perde papel, esquece peça na cobrança e não tem resposta pronta quando o cliente pergunta "e aí?". O OrcaPro troca o improviso por um sistema: tudo salvo por cliente e placa, com documento profissional e pagamento à vista.

## Funcionalidades

- **Clientes e veículos** — nome, telefone, observações; vários veículos por cliente, cada um com placa
- **Orçamentos** — peças, serviços e mão de obra no mesmo documento; desconto; validade em dias calculada sozinha; numeração sequencial
- **PDF profissional** — com nome, telefone, endereço e CNPJ da oficina; pronto para enviar ao cliente (ex.: WhatsApp)
- **Status e pagamento** — controle de recebido/pendente, filtro por status, alerta de orçamentos vencendo
- **Catálogo de preços** — cadastre peças e serviços uma vez, monte orçamentos sem redigitar
- **Painel** — resumo de clientes, aprovados e pendentes
- **Acesso por login** — cada usuário enxerga só os próprios dados (isolamento por `user_id` validado no servidor)
- **Perfil e dados da loja** — onboarding guiado; dados da oficina saem em todo PDF

## Stack

**Frontend** — React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · react-pdf
**Backend** — Node.js · Express · TypeScript · Zod
**Banco e auth** — Supabase (PostgreSQL + Auth com JWT)
**Qualidade** — Vitest (67 testes no servidor, 27 no cliente) · TypeScript estrito (`tsc --noEmit`)

## Estrutura

```
client/                 # React + Vite (landing, login, app)
server/src/             # API Express (routes, middlewares, validação Zod)
server/src/app.test.ts  # testes do servidor
supabase/migrations/    # 0001–0007: tabelas, isolamento por usuário, pago/pendente
```

## Como executar

### Usar (sem instalar nada)

1. Abra https://orca-pro-nine.vercel.app
2. Crie a conta, complete o perfil e cadastre os dados da oficina
3. Cadastre clientes, crie orçamentos e baixe o PDF

### Rodar localmente (para desenvolvedores)

Pré-requisitos: Node.js 22+, Git, conta gratuita no Supabase.

```bash
git clone https://github.com/williandevbr/oficina-orcamentos.git
cd oficina-orcamentos
```

**Banco** — no SQL Editor do Supabase, rode `supabase/migrations/0001` a `0007` nesta ordem.

**Servidor:**

```bash
cd server
npm install
cp .env.example .env   # preencha SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

**Site:**

```bash
cd client
npm install
npm run dev   # http://localhost:5173
```

**Verificações:**

```bash
npm run typecheck   # client e server
npm run test        # Vitest (client e server)
npm run build       # build de produção
```
