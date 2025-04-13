// Edge Function para contornar problemas de restrição de chave estrangeira
// Arquivo: edge-functions/save-review-config/index.js

// Esta edge function atua como um proxy para salvar configurações de reviews
// contornando o problema de restrição de chave estrangeira

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lidar com preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obter parâmetros da requisição
    const { config, userId, productId } = await req.json()

    // Criar cliente Supabase com acesso admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar se o usuário existe na tabela users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    console.log('Verificação do usuário:', { userData, userError })

    // Se o usuário não existir, criar um usuário "placeholder" para satisfazer a restrição de chave estrangeira
    if (!userData) {
      console.log('Usuário não encontrado, buscando dados do auth')
      
      // Tentar obter dados do usuário do auth.users
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (authUser?.user) {
        console.log('Usuário encontrado no auth, criando entry na tabela users')
        
        // Inserir o usuário na tabela users com dados do auth
        await supabaseAdmin.from('users').insert({
          id: userId,
          email: authUser.user.email || 'unknown@example.com',
          full_name: authUser.user.user_metadata?.full_name || 'Usuário Temporário',
          billing_status: 'free',
          stores_limit: 1,
          products_limit: 50
        }).select()
      } else {
        // Criar um usuário temporário com dados mínimos
        console.log('Criando usuário temporário para resolver restrição de FK')
        await supabaseAdmin.from('users').insert({
          id: userId,
          email: `temp-${userId.substring(0, 8)}@example.com`,
          full_name: 'Usuário Temporário',
          billing_status: 'free',
          stores_limit: 1,
          products_limit: 50
        }).select()
      }
    }

    // Verificar se já existe uma config para este produto/usuário
    const { data: existingConfig } = await supabaseAdmin
      .from('review_configs')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle()

    let result

    if (existingConfig) {
      // Atualizar configuração existente
      console.log('Atualizando configuração existente')
      result = await supabaseAdmin
        .from('review_configs')
        .update(config)
        .eq('id', existingConfig.id)
        .select()
    } else {
      // Inserir nova configuração
      console.log('Inserindo nova configuração')
      result = await supabaseAdmin
        .from('review_configs')
        .insert({
          ...config,
          product_id: productId,
          user_id: userId
        })
        .select()
    }

    // Verificar se a operação foi bem-sucedida
    if (result.error) {
      console.error('Erro ao salvar configuração:', result.error)
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error,
          message: 'Erro ao salvar configuração de reviews'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Publicar os reviews usando a função RPC
    console.log('Publicando reviews via RPC')
    const { data: publishResult, error: publishError } = await supabaseAdmin.rpc(
      'publish_product_reviews',
      { product_id_param: productId }
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        publishResult: publishResult || null,
        publishError: publishError || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro ao processar solicitação'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
}) 