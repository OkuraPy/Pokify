// Script para criar lojas de demonstração no banco de dados
// Execute com: node scripts/setup-demo-stores.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas.');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidos no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de demonstração para lojas
const demoStores = [
  {
    name: 'Fashion Store',
    platform: 'shopify',
    url: 'https://fashion-demo.myshopify.com',
    products_count: 42,
    orders_count: 128
  },
  {
    name: 'Electronics Hub',
    platform: 'other',
    url: 'https://electronics-hub.com',
    products_count: 156,
    orders_count: 315
  },
  {
    name: 'Home Decor',
    platform: 'shopify',
    url: 'https://home-decor-demo.myshopify.com',
    products_count: 87,
    orders_count: 210
  },
  {
    name: 'Sports Gear',
    platform: 'shopify',
    url: 'https://sports-gear.myshopify.com',
    products_count: 63,
    orders_count: 95
  }
];

async function setupDemoStores() {
  try {
    console.log('🔍 Verificando se há usuários no sistema...');
    
    // Buscar o primeiro usuário disponível
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      throw new Error(`Erro ao buscar usuários: ${usersError.message}`);
    }
    
    if (!users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado. Crie um usuário antes de configurar lojas de demonstração.');
      console.log('Você pode criar um usuário através da interface de autenticação.');
      process.exit(1);
    }
    
    const userId = users[0].id;
    console.log(`✅ Usuário encontrado com ID: ${userId}`);
    
    // Verificar se já existem lojas para este usuário
    const { data: existingStores, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', userId);
    
    if (storesError) {
      throw new Error(`Erro ao verificar lojas existentes: ${storesError.message}`);
    }
    
    if (existingStores && existingStores.length > 0) {
      console.log(`📊 Lojas existentes encontradas para o usuário:`);
      existingStores.forEach(store => {
        console.log(`   - ${store.name} (ID: ${store.id})`);
      });
      
      // Perguntar se deseja continuar
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Deseja criar novas lojas de demonstração? (s/N): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 's') {
        console.log('❌ Operação cancelada pelo usuário.');
        process.exit(0);
      }
    }
    
    // Criar lojas de demonstração
    console.log('📥 Criando lojas de demonstração...');
    
    const createdStores = [];
    
    for (const store of demoStores) {
      const { data: newStore, error: createError } = await supabase
        .from('stores')
        .insert({
          ...store,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createError) {
        console.error(`❌ Erro ao criar loja ${store.name}: ${createError.message}`);
      } else {
        console.log(`✅ Loja criada: ${newStore.name} (ID: ${newStore.id})`);
        createdStores.push(newStore);
      }
    }
    
    console.log('\n📊 Resumo da operação:');
    console.log(`   - ${createdStores.length} lojas criadas com sucesso`);
    console.log(`   - ${demoStores.length - createdStores.length} falhas`);
    
    if (createdStores.length > 0) {
      console.log('\n🚀 Você pode acessar as lojas nos seguintes URLs:');
      createdStores.forEach(store => {
        console.log(`   - http://localhost:3000/dashboard/stores/${store.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante a configuração das lojas:', error);
    process.exit(1);
  }
}

// Executar o script
console.log('🚀 Iniciando configuração de lojas de demonstração...');
setupDemoStores()
  .then(() => {
    console.log('✨ Configuração concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }); 