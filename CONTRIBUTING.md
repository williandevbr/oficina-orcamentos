# Como contribuir (padrão de commits e PRs)

Para o histórico ficar fácil de entender para qualquer pessoa,
seguimos 3 regras simples.

## 1. Nunca commite direto na `main`

1. Crie uma branch com nome claro: `fix/...` (correção), `feat/...` (novidade), `docs/...` (manual).
2. Suba a branch e abra um **Pull Request** para a `main`.
3. Só faça merge com o robô (CI) verde.

## 2. Mensagem de commit no padrão

```
tipo(escopo): assunto curto no imperativo
```

- **tipo**: `feat` (novidade), `fix` (correção), `seguranca`, `banco`, `docs`, `test`, `chore`
- **escopo**: `site`, `servidor`, ou vazio
- **assunto**: curto, sem ponto final. Ex: `isola clientes por usuario`
- Se precisar explicar o porquê, pule uma linha e escreva o corpo.

Exemplos bons:
- `banco: isolamento por usuario e transacoes atomicas`
- `fix(site): filtro de status inclui expirado`
- `docs: manual com ordem das migrations`

Evite: "corrigi o botão", "ajuste", "wip", "teste" — ninguém entende depois.

## 3. Antes de abrir o PR

- `npm test` verde em `server/` e `client/`
- `npm run build` verde em `client/`
- `npm run db:check` em `server/` se mexeu no banco
- Sem segredos no código (`.env` nunca entra no Git)
