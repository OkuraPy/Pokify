#!/usr/bin/env node

/**
 * Este script cria os planos corretos no Supabase:
 * - STARTER: Plano mensal com limite de 2 lojas (49.90)
 * - GROWTH: Plano semestral com limite de 5 lojas (249.90) 
 * - PRO: Plano vitalício com limite de 5 lojas (999.90)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ As variáveis de ambiente do Supabase não estão configuradas');
  console.error('Por favor, verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔄 Iniciando criação dos planos corretos...');

  try {
    // 1. Adicionar coluna is_lifetime se não existir
    console.log('1. Verificando se a coluna is_lifetime existe...');
    
    // Verificar se a coluna já existe
    const { data: columns, error: columnsError } = await supabase
      .from('plans')
      .select('is_lifetime')
      .limit(1)
      .maybeSingle();
    
    if (columnsError && columnsError.message.includes('column "is_lifetime" does not exist')) {
      console.log('   ➡️ Coluna is_lifetime não existe, criando...');
      // Usar RPC para executar SQL diretamente (necessário para ALTER TABLE)
      const { error: alterError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE plans ADD COLUMN is_lifetime BOOLEAN DEFAULT FALSE;'
      });
      
      if (alterError) {
        throw new Error(`Erro ao adicionar coluna is_lifetime: ${alterError.message}`);
      }
      console.log('   ✅ Coluna is_lifetime criada com sucesso!');
    } else {
      console.log('   ✅ Coluna is_lifetime já existe');
    }

    // 2. Criar os planos corretos
    console.log('2. Criando os planos corretos...');

    // STARTER
    const starter = {
      name: 'STARTER',
      description: 'Plano mensal com limite de 2 lojas',
      monthly_price: 49.90,
      annual_price: 499.00,
      features: ['2 lojas', 'Produtos ilimitados', 'Suporte por email'],
      stores_limit: 2,
      products_limit: -1, // ilimitado
      is_lifetime: false,
      active: true
    };

    // GROWTH
    const growth = {
      name: 'GROWTH',
      description: 'Plano semestral com limite de 5 lojas',
      monthly_price: 249.90,
      annual_price: 1499.40,
      features: ['5 lojas', 'Produtos ilimitados', 'Suporte prioritário', 'Integração com Shopify'],
      stores_limit: 5,
      products_limit: -1, // ilimitado
      is_lifetime: false,
      active: true
    };

    // PRO
    const pro = {
      name: 'PRO',
      description: 'Plano vitalício com limite de 5 lojas',
      monthly_price: 999.90,
      annual_price: 999.90, // Mesmo valor pois é vitalício
      features: ['5 lojas', 'Produtos ilimitados', 'Suporte VIP', 'Integração com Shopify', 'Acesso vitalício'],
      stores_limit: 5,
      products_limit: -1, // ilimitado
      is_lifetime: true,
      active: true
    };

    // 3. Verificar se já existem planos com esses nomes
    console.log('3. Verificando planos existentes...');
    const { data: existingPlans, error: existingError } = await supabase
      .from('plans')
      .select('name')
      .in('name', ['STARTER', 'GROWTH', 'PRO']);

    if (existingError) {
      throw new Error(`Erro ao verificar planos existentes: ${existingError.message}`);
    }

    // Se já existem planos com esses nomes, atualizar em vez de criar
    if (existingPlans && existingPlans.length > 0) {
      console.log(`   ℹ️ Encontrados ${existingPlans.length} planos com nomes semelhantes. Atualizando...`);
      
      for (const plan of existingPlans) {
        if (plan.name === 'STARTER') {
          await supabase.from('plans').update(starter).eq('name', 'STARTER');
          console.log('   ✅ Plano STARTER atualizado');
        } 
        else if (plan.name === 'GROWTH') {
          await supabase.from('plans').update(growth).eq('name', 'GROWTH');
          console.log('   ✅ Plano GROWTH atualizado');
        }
        else if (plan.name === 'PRO') {
          await supabase.from('plans').update(pro).eq('name', 'PRO');
          console.log('   ✅ Plano PRO atualizado');
        }
      }

      // Criar os planos que não existem
      const existingNames = existingPlans.map(p => p.name);
      if (!existingNames.includes('STARTER')) {
        await supabase.from('plans').insert(starter);
        console.log('   ✅ Plano STARTER criado');
      }
      if (!existingNames.includes('GROWTH')) {
        await supabase.from('plans').insert(growth);
        console.log('   ✅ Plano GROWTH criado');
      }
      if (!existingNames.includes('PRO')) {
        await supabase.from('plans').insert(pro);
        console.log('   ✅ Plano PRO criado');
      }
    } else {
      // Criar todos os planos
      console.log('   ℹ️ Criando novos planos...');
      const { error: insertError } = await supabase
        .from('plans')
        .insert([starter, growth, pro]);
      
      if (insertError) {
        throw new Error(`Erro ao criar planos: ${insertError.message}`);
      }
      console.log('   ✅ Todos os planos criados com sucesso!');
    }

    // 4. Verificar resultado final
    console.log('4. Verificando planos atualizados...');
    const { data: finalPlans, error: finalError } = await supabase
      .from('plans')
      .select('id, name, description, monthly_price, annual_price, is_lifetime, products_limit, stores_limit, features')
      .in('name', ['STARTER', 'GROWTH', 'PRO']);
    
    if (finalError) {
      throw new Error(`Erro ao buscar planos finais: ${finalError.message}`);
    }
    
    console.log('Planos criados/atualizados:');
    finalPlans.forEach(plan => {
      console.log(`- ${plan.name}:`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  Preço mensal: ${plan.monthly_price}`);
      console.log(`  Preço anual: ${plan.annual_price}`);
      console.log(`  Vitalício: ${plan.is_lifetime ? 'Sim' : 'Não'}`);
      console.log(`  Limite de lojas: ${plan.stores_limit}`);
      console.log(`  Limite de produtos: ${plan.products_limit === -1 ? 'Ilimitado' : plan.products_limit}`);
      console.log(`  Recursos: ${plan.features.join(', ')}`);
      console.log(`  Descrição: ${plan.description}`);
      console.log('---');
    });

    console.log('✨ Criação dos planos concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a criação dos planos:', error.message);
    process.exit(1);
  }
}

main(); 