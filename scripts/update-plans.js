#!/usr/bin/env node

/**
 * Este script atualiza a configuração dos planos no Supabase:
 * 1. Adiciona a coluna is_lifetime na tabela plans
 * 2. Define todos os planos com produtos ilimitados
 * 3. Marca o plano Pro como vitalício
 * 4. Atualiza os textos de recursos para mencionar "Produtos ilimitados"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carrega as variáveis de ambiente do arquivo .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ As variáveis de ambiente do Supabase não estão configuradas');
  console.error('Por favor, verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// IDs dos planos (conforme consulta anterior)
const BASIC_PLAN_ID = 'e4438651-8994-4917-8c0f-c6718efa50fd';
const PRO_PLAN_ID = '947a9f35-0797-44c6-accf-e8c98c9b4b51';
const ENTERPRISE_PLAN_ID = '9d04bac4-7882-450e-a924-f28bc4c9fe2b';

async function main() {
  console.log('🔄 Iniciando atualização dos planos...');

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

    // 2. Atualizar o plano Pro para ser vitalício
    console.log('2. Definindo plano Pro como vitalício...');
    const { error: updateProError } = await supabase
      .from('plans')
      .update({ is_lifetime: true })
      .eq('id', PRO_PLAN_ID);
    
    if (updateProError) {
      throw new Error(`Erro ao atualizar plano Pro: ${updateProError.message}`);
    }
    console.log('   ✅ Plano Pro marcado como vitalício!');

    // 3. Definir produtos ilimitados para todos os planos
    console.log('3. Definindo produtos ilimitados para todos os planos...');
    const { error: updateProductsError } = await supabase
      .from('plans')
      .update({ products_limit: -1 })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Atualiza todos os planos
    
    if (updateProductsError) {
      throw new Error(`Erro ao atualizar limite de produtos: ${updateProductsError.message}`);
    }
    console.log('   ✅ Todos os planos agora têm produtos ilimitados!');

    // 4. Atualizar features de cada plano
    console.log('4. Atualizando recursos dos planos...');
    
    // Básico
    const { error: basicFeaturesError } = await supabase
      .from('plans')
      .update({ 
        features: ['1 loja', 'Produtos ilimitados', 'Suporte por email']
      })
      .eq('id', BASIC_PLAN_ID);
    
    if (basicFeaturesError) {
      throw new Error(`Erro ao atualizar recursos do plano Básico: ${basicFeaturesError.message}`);
    }
    
    // Pro
    const { error: proFeaturesError } = await supabase
      .from('plans')
      .update({ 
        features: ['3 lojas', 'Produtos ilimitados', 'Suporte prioritário', 'Integração com Shopify', 'Acesso vitalício'],
        description: 'Plano vitalício com 3 lojas e produtos ilimitados'
      })
      .eq('id', PRO_PLAN_ID);
    
    if (proFeaturesError) {
      throw new Error(`Erro ao atualizar recursos do plano Pro: ${proFeaturesError.message}`);
    }
    
    // Empresarial
    const { error: enterpriseFeaturesError } = await supabase
      .from('plans')
      .update({ 
        features: ['10 lojas', 'Produtos ilimitados', 'Suporte VIP', 'Integração com Shopify', 'Análise avançada']
      })
      .eq('id', ENTERPRISE_PLAN_ID);
    
    if (enterpriseFeaturesError) {
      throw new Error(`Erro ao atualizar recursos do plano Empresarial: ${enterpriseFeaturesError.message}`);
    }
    
    console.log('   ✅ Recursos de todos os planos atualizados!');

    // 5. Verificar resultado final
    console.log('5. Verificando resultado final...');
    const { data: updatedPlans, error: getPlansError } = await supabase
      .from('plans')
      .select('id, name, description, is_lifetime, products_limit, features');
    
    if (getPlansError) {
      throw new Error(`Erro ao buscar planos atualizados: ${getPlansError.message}`);
    }
    
    console.log('Planos após atualização:');
    updatedPlans.forEach(plan => {
      console.log(`- ${plan.name}:`);
      console.log(`  Vitalício: ${plan.is_lifetime ? 'Sim' : 'Não'}`);
      console.log(`  Limite de produtos: ${plan.products_limit === -1 ? 'Ilimitado' : plan.products_limit}`);
      console.log(`  Recursos: ${plan.features.join(', ')}`);
      console.log(`  Descrição: ${plan.description}`);
      console.log('---');
    });

    console.log('✨ Atualização dos planos concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a atualização dos planos:', error.message);
    process.exit(1);
  }
}

main(); 