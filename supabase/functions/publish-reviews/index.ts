// Edge Function para publicar reviews de produtos
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Tipos
interface Review {
  id: string
  author: string
  content: string
  rating: number
  date: string | null
  images: string[] | null
  created_at: string
}

interface PublishReviewsRequest {
  product_id: string
}

interface PublishReviewsResponse {
  success: boolean
  message: string
  data?: {
    product_id: string
    product_name: string
    product_image: string
    average_rating: number
    review_count: number
    reviews: Review[]
    updated_at: string
  }
}

serve(async (req) => {
  try {
    // Criar cliente Supabase com as credenciais da função
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Obter o ID do produto do corpo da requisição
    const { product_id } = await req.json() as PublishReviewsRequest
    
    if (!product_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID do produto é obrigatório',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 1. Obter informações do produto
    const { data: productData, error: productError } = await supabaseClient
      .from('products')
      .select('name, image_url')
      .eq('id', product_id)
      .single()

    if (productError) {
      throw new Error(`Erro ao obter informações do produto: ${productError.message}`)
    }

    // 2. Obter reviews selecionados e publicados
    const { data: reviewsData, error: reviewsError } = await supabaseClient
      .from('reviews')
      .select('id, author, content, rating, date, images, created_at')
      .eq('product_id', product_id)
      .eq('is_selected', true)
      .eq('is_published', true)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (reviewsError) {
      throw new Error(`Erro ao obter reviews: ${reviewsError.message}`)
    }

    // 3. Calcular métrica
    const reviews = reviewsData || []
    const reviewCount = reviews.length
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
    const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0

    // 4. Preparar o objeto JSON final
    const resultJson = {
      product_id,
      product_name: productData?.name || '',
      product_image: productData?.image_url || '',
      average_rating: averageRating,
      review_count: reviewCount,
      reviews,
      updated_at: new Date().toISOString()
    }

    // 5. Verificar se já existe um registro para este produto
    const { data: existingRecord, error: existingError } = await supabaseClient
      .from('published_reviews_json')
      .select('product_id')
      .eq('product_id', product_id)
      .maybeSingle()

    if (existingError) {
      throw new Error(`Erro ao verificar registro existente: ${existingError.message}`)
    }

    // 6. Inserir ou atualizar o registro
    let upsertError
    if (existingRecord?.product_id) {
      const { error } = await supabaseClient
        .from('published_reviews_json')
        .update({
          json_data: resultJson,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', product_id)
      
      upsertError = error
    } else {
      const { error } = await supabaseClient
        .from('published_reviews_json')
        .insert({
          product_id,
          json_data: resultJson,
          updated_at: new Date().toISOString()
        })
      
      upsertError = error
    }

    if (upsertError) {
      throw new Error(`Erro ao salvar JSON de reviews: ${upsertError.message}`)
    }

    // 7. Retornar resposta de sucesso
    const response: PublishReviewsResponse = {
      success: true,
      message: 'Reviews publicados com sucesso',
      data: resultJson
    }

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro ao publicar reviews: ${errorMessage}`
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
