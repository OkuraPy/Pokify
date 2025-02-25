// Script para configurar o Supabase
// Execute com: node scripts/setup-supabase.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // Tentar carregar do .env.local
  require('dotenv').config({ path: '.env.local' });
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Erro: As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar definidas.');
    console.error('Por favor, crie um arquivo .env.local com estas variáveis ou defina-as no ambiente.');
    process.exit(1);
  }
}

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔄 Iniciando configuração do Supabase para Pokify...');
  
  try {
    // Ler o arquivo SQL de migração
    const migrationFilePath = path.join(__dirname, '../supabase/migrations/20231201000000_initial_schema.sql');
    const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Executar o SQL
    console.log('⚙️ Criando tabelas e configurações...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (error) {
      throw new Error(`Erro ao executar a migração: ${error.message}`);
    }
    
    console.log('✅ Migração concluída com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.warn('⚠️ Não foi possível verificar se as tabelas foram criadas:', tablesError.message);
    } else {
      console.log('\n📋 Tabelas criadas:');
      tables.forEach(table => {
        console.log(`  - ${table.tablename}`);
      });
    }
    
    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('\nAgora você pode iniciar o aplicativo com:');
    console.log('  npm run dev');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
    process.exit(1);
  }
}

main(); 