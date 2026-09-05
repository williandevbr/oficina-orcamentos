# OrcaPro

**Sistema para oficinas mecânicas fazerem orçamentos e gerarem PDF profissional.**

---

## O que o sistema faz

O OrcaPro resolve o dia a dia de uma oficina mecânica:

- **Cadastra clientes** (nome, telefone, carro, placa, observações)
- **Cria orçamentos** com quantos serviços e peças quiser
- **Calcula tudo sozinho** — o total, com desconto, aparece na hora
- **Gera um PDF bonito** com o nome da oficina, os itens e os totais, pronto para mandar ao cliente
- **Controla o status** de cada orçamento (rascunho, enviado, aprovado, recusado)
- **Tem login com e-mail e senha** — cada pessoa da oficina entra com o seu acesso

O sistema está **no ar na internet** e pronto para usar. Não precisa instalar nada para começar.

---

## Como usar o sistema

### Se você quer só usar (a forma mais fácil)

1. Abra no navegador: **https://orca-pro-nine.vercel.app**
2. Crie sua conta com e-mail e senha
3. Cadastre seus clientes
4. Crie orçamentos
5. Baixe o PDF e mande para o cliente

Pronto. O sistema roda em qualquer navegador, no computador ou no celular.

### Se você é programador e quer rodar no seu computador

O sistema tem duas partes: o **site** (a parte que aparece na tela) e o **servidor** (a parte que faz as regras e guarda os dados). Para rodar no seu computador, você vai ligar as duas.

#### O que você precisa ter instalado

- **Node.js versão 22 ou superior** — baixe em https://nodejs.org (escolha a versão LTS)
- **Git** — baixe em https://git-scm.com
- **Uma conta gratuita no Supabase** — crie em https://supabase.com (é o lugar onde ficam guardados os dados do sistema)

#### Passo 1 — Baixar o projeto

Abra o terminal (no Windows, use o "Prompt de comando" ou "PowerShell"; no Mac ou Linux, use o "Terminal") e digite:

```bash
git clone https://github.com/williandevbr/oficina-orcamentos.git
cd oficina-orcamentos
```

Isso cria uma pasta chamada `oficina-orcamentos` com todo o código do sistema.

#### Passo 2 — Criar o banco de dados

O sistema precisa de um banco de dados para guardar clientes e orçamentos. Vamos usar o Supabase.

1. Entre em https://supabase.com e crie um projeto novo (é gratuito)
2. No painel do projeto, no menu lateral, clique em **SQL Editor**
3. Clique em **New query**
4. Rode os 3 arquivos abaixo **nesta ordem** (abra cada um no Bloco de Notas, copie tudo, cole no SQL Editor e clique em **Run**):
   - `supabase/migrations/0001_criar_tabelas_iniciais.sql` → cria as 3 tabelas
   - `supabase/migrations/0002_isolamento_user_validade.sql` → separa os dados por usuário + status "expirado"
   - `supabase/migrations/0003_transacoes_orcamento.sql` → deixa criar/editar orçamento à prova de falhas
5. Depois da 0002, amarre os dados antigos ao seu usuário (o passo a passo está comentado no final do arquivo 0002: descobrir seu UID em **Authentication > Users** e rodar os 2 `update`)

Pronto. Para conferir se está tudo certo, rode na pasta `server`: `npm run db:check`.

#### Passo 3 — Pegar as chaves do Supabase

Ainda no painel do Supabase:

1. No menu lateral, clique em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Você vai ver três informações importantes:
   - **Project URL** — é o endereço do seu projeto (algo como `https://abc123.supabase.co`)
   - **anon public key** — uma chave pública bem longa
   - **service_role key** — outra chave bem longa, essa é **secreta** (não compartilhe)

Deixe essa página aberta. Vamos usar essas informações nos próximos passos.

#### Passo 4 — Ligar o servidor

O servidor é a parte que faz as regras (cálculos, validações) e liga o site ao banco de dados.

1. Ainda no terminal, entre na pasta do servidor:
   ```bash
   cd server
   ```
2. Instale as dependências (pode demorar 1-2 minutos na primeira vez):
   ```bash
   npm install
   ```
3. Crie o arquivo de configuração:
   ```bash
   cp .env.example .env
   ```
4. Abra o arquivo `.env` no seu editor de texto (no Windows, `notepad .env`; no Mac ou Linux, `nano .env`)
5. Preencha as informações (use os valores que você copiou do Supabase):

   ```
   SUPABASE_URL=https://abc123.supabase.co
   SUPABASE_ANON_KEY=cole-aqui-a-chave-anon
   SUPABASE_SERVICE_ROLE_KEY=cole-aqui-a-chave-service-role
   OFICINA_NOME=Auto Mecânica do João
   OFICINA_TELEFONE=(11) 99999-9999
   OFICINA_ENDERECO=Rua das Oficinas, 123 — São Paulo/SP
   OFICINA_CNPJ=00.000.000/0001-00
   ```

   O nome, telefone, endereço e CNPJ da oficina aparecem no PDF. Preencha com os dados da sua oficina.

6. Salve o arquivo e volte ao terminal. Inicie o servidor:
   ```bash
   npm run dev
   ```

O servidor vai mostrar uma mensagem dizendo que está rodando em `http://localhost:3333`. **Deixe essa janela do terminal aberta.**

#### Passo 5 — Ligar o site

Abra **outra janela do terminal** (não feche a do servidor) e digite:

1. Entre na pasta do site:
   ```bash
   cd client
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie o arquivo de configuração:
   ```bash
   cp .env.example .env
   ```
4. Abra o arquivo `.env` no editor e preencha:
   ```
   VITE_SUPABASE_URL=https://abc123.supabase.co
   VITE_SUPABASE_ANON_KEY=cole-aqui-a-chave-anon
   VITE_API_URL=http://localhost:3333
   ```
   (O `VITE_SUPABASE_URL` e o `VITE_SUPABASE_ANON_KEY` são os mesmos valores que você colocou no servidor.)
5. Salve o arquivo. Inicie o site:
   ```bash
   npm run dev
   ```

O site vai abrir sozinho no navegador em `http://localhost:5173`. **Deixe essa janela do terminal aberta também.**

#### Passo 6 — Entrar no sistema

1. Abra http://localhost:5173 no navegador
2. Clique em **Criar conta**
3. Digite seu e-mail e uma senha (com pelo menos 6 caracteres)
4. Pronto! Você já está dentro do sistema

Agora você pode cadastrar clientes, criar orçamentos e gerar PDFs. Tudo funciona offline, no seu computador.

#### Para parar o sistema

Quando quiser desligar, feche as duas janelas do terminal ou pressione `Ctrl+C` em cada uma.

---

## Como usar o sistema no dia a dia

### Cadastrar um cliente

1. No menu lateral, clique em **Clientes**
2. Clique no botão **Novo cliente** (canto superior direito)
3. Preencha nome, telefone, e-mail, carro e placa
4. Clique em **Salvar**

### Criar um orçamento

1. No menu lateral, clique em **Orçamentos**
2. Clique em **Novo orçamento**
3. Escolha o cliente (ou cadastre um novo, se precisar)
4. Adicione os itens: para cada serviço ou peça, clique em **Adicionar item** e preencha o que é, a quantidade e o valor
5. Se quiser dar um desconto, preencha o campo **Desconto**
6. O **total** é calculado sozinho, embaixo
7. Clique em **Salvar**

### Gerar o PDF

1. Abra o orçamento que você criou (clique nele na lista)
2. Clique no botão **Baixar PDF**
3. O PDF vai ser salvo no seu computador, pronto para mandar ao cliente por WhatsApp ou e-mail

---

## Estrutura do projeto

```
oficina-orcamentos/
├── client/              → o site (a parte visual)
│   ├── src/pages/       → as telas (Login, Painel, Clientes, Orçamentos)
│   ├── src/components/  → peças reutilizáveis (menu, formulários, cartões)
│   ├── src/contexts/    → controle do usuário logado
│   ├── src/lib/         → ligação com o Supabase e com o servidor
│   └── src/utils/       → funções auxiliares (formatação de moeda)
├── server/              → o servidor (a parte que faz as regras)
│   ├── src/routes/      → rotas de clientes, orçamentos e PDF
│   ├── src/services/    → regras de cálculo, validação e geração de PDF
│   ├── src/middlewares/ → porteiro que confere o login
│   ├── src/lib/         → ligação com o Supabase
│   └── fonts/           → fontes usadas no PDF
└── supabase/
    └── migrations/      → arquivo de criação das tabelas do banco
```

---

## Configurações (variáveis de ambiente)

Essas são as informações que o sistema precisa para funcionar. Todas ficam em arquivos `.env` que **não vão para o Git** (são segredos).

### Servidor — `server/.env`

| Campo                       | De onde vem                                        |
| --------------------------- | -------------------------------------------------- |
| `SUPABASE_URL`              | Painel do Supabase → Settings → API → Project URL  |
| `SUPABASE_ANON_KEY`         | Painel do Supabase → Settings → API → anon public  |
| `SUPABASE_SERVICE_ROLE_KEY` | Painel do Supabase → Settings → API → service_role |
| `OFICINA_NOME`              | Você escolhe (aparece no PDF)                      |
| `OFICINA_TELEFONE`          | Você escolhe (aparece no rodapé do PDF)            |
| `OFICINA_ENDERECO`          | Você escolhe (aparece no rodapé do PDF)            |
| `OFICINA_CNPJ`              | Você escolhe (aparece no rodapé do PDF)            |

### Site — `client/.env`

| Campo                    | De onde vem                                          |
| ------------------------ | ---------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Mesmo valor de `SUPABASE_URL` do servidor            |
| `VITE_SUPABASE_ANON_KEY` | Mesmo valor de `SUPABASE_ANON_KEY` do servidor       |
| `VITE_API_URL`           | Endereço do servidor (em produção é a URL do Render) |

---

## Rotas do servidor (para programadores)

Todas as rotas abaixo de `/api` exigem o cabeçalho `Authorization: Bearer <token>` (o token é obtido ao entrar no sistema). A única exceção é a rota de saúde.

### Saúde

| Método | Rota          | Descrição                    |
| ------ | ------------- | ---------------------------- |
| GET    | `/api/health` | Diz se o servidor está no ar |

### Clientes

| Método | Rota                | Descrição                                        |
| ------ | ------------------- | ------------------------------------------------ |
| GET    | `/api/clientes`     | Lista os seus clientes (`?search=` busca por nome, telefone, placa; `?page=&limit=` pagina) |
| POST   | `/api/clientes`     | Cria um cliente (nome 2–120 letras, e-mail válido) |
| PUT    | `/api/clientes/:id` | Atualiza um cliente                              |
| DELETE | `/api/clientes/:id` | Exclui um cliente                                |

### Orçamentos

| Método | Rota                      | Descrição                                                                 |
| ------ | ------------------------- | ------------------------------------------------------------------------- |
| GET    | `/api/orcamentos`         | Lista orçamentos (`?status=`, `?cliente_id=`, `?search=` por número/observações, `?page=&limit=` pagina) |
| POST   | `/api/orcamentos`         | Cria um orçamento (transação atômica: salva tudo ou nada; desconto nunca maior que o subtotal; validade 1–365 dias; até 100 itens) |
| GET    | `/api/orcamentos/:id`     | Detalhe completo (com os itens)                                           |
| PUT    | `/api/orcamentos/:id`     | Atualiza (transação atômica, recalcula o total)                           |
| DELETE | `/api/orcamentos/:id`     | Exclui                                                                    |
| GET    | `/api/orcamentos/:id/pdf` | Baixa o PDF do orçamento (limite: 30 por 15 min por segurança)            |

Exemplo de uso com `curl`:

```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3333/api/clientes
```

---

## Banco de dados (3 tabelas + 3 atualizações)

- **clientes** — guarda os dados de cada cliente (nome, contato, carro, placa), cada um com seu dono (`user_id`)
- **orcamentos** — guarda o cabeçalho de cada orçamento (cliente, total, desconto, status, validade)
- **orcamento_itens** — guarda cada item de cada orçamento (descrição, quantidade, valor unitário)

As atualizações são aplicadas em ordem pelos arquivos em `supabase/migrations/`:

1. `0001_criar_tabelas_iniciais.sql` — cria as tabelas
2. `0002_isolamento_user_validade.sql` — dono por usuário, status "expirado", travas de valores
3. `0003_transacoes_orcamento.sql` — funções que salvam orçamento + itens numa transação só

---

## Endereços do sistema (já está no ar)

O sistema está publicado na internet e funcionando 24 horas por dia:

- **Site:** https://orca-pro-nine.vercel.app
- **Servidor:** https://orca-api-yezh.onrender.com

> No plano gratuito, o servidor "adormece" se ficar alguns minutos sem uso. O primeiro acesso depois disso pode demorar de 30 a 60 segundos para "acordar" — depois funciona normalmente.

---

## Problemas comuns

**Esqueci a senha.** Na tela de login, clique em **Esqueci minha senha**, digite seu e-mail e siga as instruções que chegar na sua caixa de entrada.

**O site está carregando devagar na primeira vez que abro.** É o servidor acordando (veja a observação acima). Aguarde 30-60 segundos e atualize a página.

**Aparece a mensagem "Faça login para continuar".** Sua sessão expirou. Entre novamente com seu e-mail e senha.

**O PDF não baixa.** Verifique se você salvou o orçamento antes de tentar baixar o PDF.

**Quero mudar o nome da oficina que aparece no PDF.** Edite o arquivo `server/.env`, campo `OFICINA_NOME`, e reinicie o servidor.

---

## Licença

Este projeto é de uso interno. Todos os direitos reservados.
