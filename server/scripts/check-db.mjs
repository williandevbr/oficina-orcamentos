// ============================================================
// Script de diagnóstico da conexão com o Supabase
// Uso: node scripts/check-db.mjs
// ============================================================
import { supabase } from '../src/lib/supabase.js';

console.log('Verificando conexão com o Supabase...\n');

const { count, error } = await supabase
  .from('clientes')
  .select('*', { count: 'exact', head: true });

if (error) {
  console.log('1. Conexão com o servidor: OK (o banco respondeu!)');
  console.log(`2. Mensagem do banco: ${error.message}\n`);

  if (error.message.includes('does not exist')) {
    console.log(
      '=> As tabelas ainda nao foram criadas.\n' +
        '   Falta aplicar a migration 0001 no SQL Editor do Supabase.\n' +
        '   (Eu te guio em seguida.)'
    );
  } else if (error.message.includes('permission denied')) {
    console.log(
      '=> A conexão funciona E a segurança RLS esta ativa.\n' +
        '   (Bloqueio esperado: o acesso real sera feito com a service_role.)'
    );
  } else {
    console.log('=> Verifique as mensagens acima.');
  }
} else {
  console.log('1. Conexão com o servidor: OK (o banco respondeu!)');
  console.log(`2. Tabela "clientes" acessível. Total de clientes: ${count}`);
}