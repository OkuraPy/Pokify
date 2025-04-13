// Edge Function para publicar reviews de forma segura
// Esta função contorna os problemas de RLS usando credenciais de serviço

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
    const { productId } = await req.json()

    if (!productId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID do produto é obrigatório',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Criar cliente Supabase com acesso admin (bypass de RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obter informações do produto
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, title, images')
      .eq('id', productId)
      .single()

    if (productError) {
      console.error('Erro ao buscar produto:', productError)
      return new Response(
        JSON.stringify({
          success: false,
          message: `Erro ao buscar produto: ${productError.message}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // 2. Buscar reviews selecionadas e publicadas
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select('id, author, content, rating, date, images, created_at')
      .eq('product_id', productId)
      .eq('is_selected', true)
      .eq('is_published', true)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (reviewsError) {
      console.error('Erro ao buscar reviews:', reviewsError)
      return new Response(
        JSON.stringify({
          success: false,
          message: `Erro ao buscar reviews: ${reviewsError.message}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // 3. Calcular estatísticas
    const reviewsData = reviews || []
    const reviewCount = reviewsData.length
    
    // Calcular média de avaliações
    let avgRating = 0
    if (reviewCount > 0) {
      const totalRating = reviewsData.reduce((sum, review) => {
        return sum + (parseInt(review.rating) || 0)
      }, 0)
      avgRating = totalRating / reviewCount
    }

    // Arredondar para 1 casa decimal
    const averageRating = Math.round(avgRating * 10) / 10

    // 4. Preparar o objeto JSON
    const productImage = product.images && product.images.length > 0 
      ? product.images[0] 
      : null  // Mudando para null em vez de uma URL placeholder

    const result = {
      product_id: productId,
      product_name: product.title || 'Produto',
      product_image: productImage,
      average_rating: averageRating,
      review_count: reviewCount,
      reviews: reviewsData,
      updated_at: new Date(),
      product: {
        image: productImage,
        title: product.title || 'Produto'
      }
    }

    // 5. Verificar se já existe um registro para este produto
    const { data: existingRecord } = await supabaseAdmin
      .from('published_reviews_json')
      .select('id')
      .eq('product_id', productId)
      .maybeSingle()

    let dbResult
    
    // 6. Inserir ou atualizar o registro
    if (existingRecord) {
      dbResult = await supabaseAdmin
        .from('published_reviews_json')
        .update({
          reviews_data: result,
          average_rating: averageRating,
          reviews_count: reviewCount,
          updated_at: new Date(),
          product_name: product.title,
          product_image: productImage
        })
        .eq('product_id', productId)
        .select()
    } else {
      dbResult = await supabaseAdmin
        .from('published_reviews_json')
        .insert({
          product_id: productId,
          reviews_data: result,
          average_rating: averageRating,
          reviews_count: reviewCount,
          updated_at: new Date(),
          product_name: product.title,
          product_image: productImage
        })
        .select()
    }

    if (dbResult.error) {
      console.error('Erro ao salvar reviews publicados:', dbResult.error)
      return new Response(
        JSON.stringify({
          success: false,
          message: `Erro ao salvar reviews publicados: ${dbResult.error.message}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // 7. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reviews publicados com sucesso',
        data: {
          productName: product.title || 'Produto',
          averageRating: averageRating,
          reviewsCount: reviewCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao publicar reviews: ${error.message}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 