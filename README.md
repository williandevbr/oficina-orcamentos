<div align="center">

# OrcaPro

**Sistema profissional de orçamentos para oficinas mecânicas**

Gere orçamentos bonitos e organizados em poucos cliques, com PDF pronto para enviar ao cliente.

[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![Node](https://img.shields.io/badge/Node.js-22-339933)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18)](https://vitest.dev)
[![pdfmake](https://img.shields.io/badge/pdfmake-0.3-A020F0)](https://pdfmake.github.io/docs/)

</div>

---

## O que é o OrcaPro

O OrcaPro é um sistema completo para o dia a dia de uma oficina:

1. **Cadastre o cliente** (nome, telefone, veículo, placa)
2. **Monte o orçamento** adicionando serviços e peças — o total é calculado sozinho
3. **Baixe um PDF profissional** com o cabeçalho da oficina, a tabela de itens e os totais
4. **Acompanhe o status** de cada orçamento (rascunho, enviado, aprovado, recusado)

Tudo protegido por **login seguro**, com testes automáticos e implantação contínua.

---

## Funcionalidades

| Área       | O que faz                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------- |
| Login      | Criação de conta, entrada, sair e recuperação de senha (Supabase Auth)                      |
| Dashboard  | Painel inicial com os números reais da oficina (clientes, orçamentos, aprovados, pendentes) |
| Clientes   | Cadastro completo: criar, ver, editar e excluir clientes                                    |
| Orçamentos | Itens dinâmicos (serviço ou peça), cálculo automático de total e desconto                   |
| PDF        | Documento profissional com identidade da oficina, pronto para enviar ao cliente             |
| Segurança  | Toda a API exige um token de acesso (nada é público sem login)                              |
| Testes     | 23 testes unitários cobrindo cálculo, validações e formatação                               |
| CI/CD      | Robô no GitHub que roda testes e build a cada envio de código                               |

---

## Tecnologias

| Camada             | Tecnologia              | Papel                                  |
| ------------------ | ----------------------- | -------------------------------------- |
| Site (frontend)    | React 19 + Vite 8       | Interface do usuário                   |
| Visual             | Tailwind CSS 4 + Lucide | Estilo azul profissional e ícones      |
| Servidor (backend) | Node.js + Express 5     | API que liga o site ao banco           |
| Banco de dados     | Supabase (PostgreSQL)   | Guarda clientes, orçamentos e usuários |
| Autenticação       | Supabase Auth           | Login seguro com e-mail e senha        |
| PDF                | pdfmake                 | Geração do documento do orçamento      |
| Testes             | Vitest                  | Testes unitários de regras e cálculo   |

---

## Arquitetura

```
┌─────────────┐   pedidos   ┌─────────────┐   dados   ┌─────────────┐
│   Site      │ ──────────▶ │  Servidor   │ ────────▶ │  Supabase   │
│ React/Vite  │             │ Express API │           │ PostgreSQL  │
│ (porta 5173)│ ◀────────── │ (porta 3333)│ ◀──────── │  (nuvem)    │
└─────────────┘  respostas  └─────────────┘           └─────────────┘
```

- O **site** conversa com o **servidor** (que repassa tudo para o **Supabase**);
- O **login** é emitido pelo Supabase e conferido pelo servidor a cada pedido;
- Em desenvolvimento, o Vite faz a ponte (`proxy`) entre o site e o servidor.

---

## Primeiros passos

### Pré-requisitos

- [Node.js](https://nodejs.org) **22 ou superior**
- Uma conta gratuita no [Supabase](https://supabase.com) (para o banco e o login)

### 1. Baixar o projeto

```bash
git clone https://github.com/williandevbr/oficina-orcamentos.git
cd oficina-orcamentos
```

### 2. Preparar o banco de dados (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com)
2. Abra **SQL Editor** no painel e execute o arquivo `supabase/migrations/0001_criar_tabelas_iniciais.sql`
3. Em **Authentication → Providers → Email**, deixe "Confirm email" **desligado** para o primeiro acesso ser imediato (opcional)

### 3. Configurar o servidor

```bash
cd server
npm install
cp .env.example .env   # preencha as chaves no .env (veja a seção Configuração)
npm run dev
```

O servidor sobe em `http://localhost:3333`.

### 4. Configurar o site

```bash
cd client
npm install
cp .env.example .env   # preencha as chaves no .env (veja a seção Configuração)
npm run dev
```

Abra o site em `http://localhost:5173`, crie sua conta e comece a usar.

---

## Configuração (variáveis de ambiente)

### Servidor — `server/.env`

| Variável                    | De onde vem                                       | O que faz                                      |
| --------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| `SUPABASE_URL`              | Painel do Supabase → Settings → API → Project URL | Endereço do seu projeto                        |
| `SUPABASE_ANON_KEY`         | Painel → Settings → API → anon public             | Chave pública do cliente                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Painel → Settings → API → service_role            | Chave de serviço (secreta) usada pelo servidor |
| `OFICINA_NOME`              | Você escolhe                                      | Nome da oficina (aparece no PDF)               |
| `OFICINA_TELEFONE`          | Você escolhe                                      | Telefone no rodapé do PDF                      |
| `OFICINA_ENDERECO`          | Você escolhe                                      | Endereço no rodapé do PDF                      |
| `OFICINA_CNPJ`              | Você escolhe                                      | CNPJ no rodapé do PDF                          |

### Site — `client/.env`

| Variável                 | De onde vem                        | O que faz                        |
| ------------------------ | ---------------------------------- | -------------------------------- |
| `VITE_SUPABASE_URL`      | Mesmo valor de `SUPABASE_URL`      | Liga o login do site ao Supabase |
| `VITE_SUPABASE_ANON_KEY` | Mesmo valor de `SUPABASE_ANON_KEY` | Chave pública usada pelo site    |

> As chaves reais **nunca** vão para o Git. Use os arquivos `.env.example` como modelo.

---

## API

Toda rota abaixo de `/api` exige o cabeçalho `Authorization: Bearer <token>` (o token é obtido ao entrar no sistema). A única exceção é a verificação de saúde.

### Saúde

| Método | Rota          | Descrição                    |
| ------ | ------------- | ---------------------------- |
| GET    | `/api/health` | Diz se o servidor está no ar |

### Clientes

| Método | Rota                | Descrição               |
| ------ | ------------------- | ----------------------- |
| GET    | `/api/clientes`     | Lista todos os clientes |
| POST   | `/api/clientes`     | Cria um cliente         |
| PUT    | `/api/clientes/:id` | Atualiza um cliente     |
| DELETE | `/api/clientes/:id` | Exclui um cliente       |

### Orçamentos

| Método | Rota                      | Descrição                                |
| ------ | ------------------------- | ---------------------------------------- |
| GET    | `/api/orcamentos`         | Lista orçamentos (com o nome do cliente) |
| POST   | `/api/orcamentos`         | Cria um orçamento (calcula o total)      |
| GET    | `/api/orcamentos/:id`     | Detalhe completo (com os itens)          |
| PUT    | `/api/orcamentos/:id`     | Atualiza (recalcula o total)             |
| DELETE | `/api/orcamentos/:id`     | Exclui                                   |
| GET    | `/api/orcamentos/:id/pdf` | Baixa o PDF do orçamento                 |

Exemplo com `curl`:

```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3333/api/clientes
```

---

## Testes

Os testes verificam as regras de negócio de forma isolada (cálculo, validação e formatação).

```bash
cd server && npm test    # 17 testes
cd client && npm test    # 6 testes
```

No GitHub, **o robô executa todos os testes e o build automaticamente** a cada envio de código — veja o resultado na aba **Actions** do repositório.

---

## Estrutura do projeto

```
oficina-orcamentos/
├── .github/workflows/     → automação (testes + build a cada envio)
├── client/                → site (React + Vite + Tailwind)
│   ├── src/pages/         → páginas (Login, Dashboard, Clientes, Orçamentos)
│   ├── src/components/    → peças visuais (menu, formulários, cartões)
│   ├── src/contexts/      → controle da sessão de login
│   ├── src/lib/           → ponte com o Supabase e a API
│   └── src/utils/         → formatadores de moeda e data
├── server/                → API (Node.js + Express)
│   ├── src/routes/        → rotas de clientes e orçamentos
│   ├── src/services/      → regras de cálculo, validação e PDF
│   ├── src/middlewares/   → porteiro de autenticação
│   ├── src/lib/           → conexão com o Supabase
│   └── fonts/             → fontes usadas no PDF (Roboto)
└── supabase/migrations/   → criação das tabelas do banco
```

---

## Publicação (deploy)

O sistema está publicado na internet e funciona de ponta a ponta:

- **Site:** https://orca-pro-nine.vercel.app
- **API:** https://orca-api-yezh.onrender.com
- **Publicação automática (CI/CD):** a cada envio para a branch `main` do GitHub, o robô (GitHub Actions) roda os **testes** e, se tudo passar, **publica o site sozinho** na Vercel. O servidor no Render também atualiza sozinho a cada envio. Nada vai para o ar sem passar pelos testes.

> No plano gratuito, o servidor (Render) "adormece" após alguns minutos sem uso; o primeiro acesso depois disso pode demorar de 30 a 60 segundos para "acordar".

---

## Banco de dados

- **clientes** — dados dos clientes (nome, contato, veículo, placa...)
- **orcamentos** — orçamentos com número, status, descontos e totais
- **orcamento_itens** — itens de cada orçamento (serviço ou peça)

As tabelas são criadas pela migration `0001_criar_tabelas_iniciais.sql`.
