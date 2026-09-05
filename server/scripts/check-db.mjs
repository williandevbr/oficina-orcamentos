// ============================================================
// Diagnóstico do banco (Supabase)
// Uso: npm run db:check   (dentro da pasta server, com o .env preenchido)
// ============================================================
// Verifica em ordem:
//   1. Conexão + tabelas da migration 0001
//   2. Colunas da migration 0002 (user_id, valido_ate)
//   3. Funções da migration 0003 (transações atômicas)
// Usa a service_role (acesso total) — rode na sua máquina, nunca no Git.
// ============================================================
import { supabase } from '../src/lib/supabase.js';

let falhas = 0;
function ok(msg) {
  console.log(`  [OK] ${msg}`);
}
function falha(msg, dica) {
  falhas += 1;
  console.log(`  [FALTA] ${msg}`);
  if (dica) console.log(`         -> ${dica}`);
}

console.log('OrcaPro — verificando o banco...\n');

console.log('1. Tabelas (migration 0001):');
for (const tabela of ['clientes', 'orcamentos', 'orcamento_itens']) {
  const { error } = await supabase
    .from(tabela)
    .select('*', { count: 'exact', head: true });
  if (error) {
    if (error.message.includes('does not exist')) {
      falha(`tabela "${tabela}" não existe`, 'rode 0001_criar_tabelas_iniciais.sql no SQL Editor');
    } else {
      falha(`tabela "${tabela}": ${error.message}`);
    }
  } else {
    ok(`tabela "${tabela}" existe`);
  }
}

console.log('\n2. Colunas por usuário (migration 0002):');
for (const tabela of ['clientes', 'orcamentos']) {
  const { error } = await supabase.from(tabela).select('user_id').limit(1);
  if (error && error.code === '42703') {
    falha(
      `coluna user_id em "${tabela}"`,
      'rode 0002_isolamento_user_validade.sql no SQL Editor',
    );
  } else if (error) {
    falha(`coluna user_id em "${tabela}": ${error.message}`);
  } else {
    ok(`coluna user_id em "${tabela}"`);
  }
}

console.log('\n3. Transações atômicas (migration 0003):');
const nulo = '00000000-0000-0000-0000-000000000000';
const r1 = await supabase.rpc('criar_orcamento_com_itens', {
  p_user_id: nulo,
  p_cliente_id: nulo,
  p_status: 'rascunho',
  p_desconto: 0,
  p_total: 0,
  p_observacoes: null,
  p_validade_dias: 7,
  p_itens: [],
});
if (r1.error && (r1.error.code === '42883' || r1.error.message.includes('Could not find the function'))) {
  falha(
    'função criar_orcamento_com_itens',
    'rode 0003_transacoes_orcamento.sql no SQL Editor',
  );
} else {
  ok('função criar_orcamento_com_itens (respondeu)');
}
const r2 = await supabase.rpc('atualizar_orcamento_com_itens', {
  p_user_id: nulo,
  p_orcamento_id: nulo,
  p_cliente_id: nulo,
  p_status: 'rascunho',
  p_desconto: 0,
  p_total: 0,
  p_observacoes: null,
  p_validade_dias: 7,
  p_itens: null,
});
if (r2.error && (r2.error.code === '42883' || r2.error.message.includes('Could not find the function'))) {
  falha(
    'função atualizar_orcamento_com_itens',
    'rode 0003_transacoes_orcamento.sql no SQL Editor',
  );
} else {
  ok('função atualizar_orcamento_com_itens (respondeu)');
}

console.log('');
if (falhas === 0) {
  console.log('Tudo certo! Banco atualizado e acessível.');
} else {
  console.log(`${falhas} item(ns) faltando — siga as dicas acima.`);
  process.exitCode = 1;
}
