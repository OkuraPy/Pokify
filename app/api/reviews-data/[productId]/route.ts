import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Garantir que a rota seja sempre dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Não utilizar cache

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { productId } = params;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Parâmetro necessário: productId' },
        { status: 400 }
      );
    }

    console.log('Buscando reviews publicados para o produto ID:', productId);

    // Esta API é pública e não requer autenticação
    // As avaliações publicadas são acessíveis para todos, pois estão na tabela public.published_reviews_json
    console.log('Acessando API pública de reviews');

    // Buscar diretamente da nova tabela de reviews publicados em JSON
    console.log('Iniciando consulta à tabela published_reviews_json...');
    // Obter os dados publicados (incluindo nome e imagem do produto)
    const { data: publishedData, error: publishedError } = await supabase
      .from('published_reviews_json')
      .select('*')
      .eq('product_id', productId)
      .maybeSingle();
    
    console.log('Resultado da consulta:', publishedData ? 'Dados encontrados' : 'Nenhum dado encontrado');
    if (publishedData) {
      console.log('Num reviews:', publishedData.reviews_data?.length || 0);
      console.log('Mu00e9dia:', publishedData.average_rating);
    }
    
    if (publishedError) {
      console.error('Erro ao buscar reviews publicados:', publishedError);
      return NextResponse.json(
        { error: 'Erro ao buscar reviews publicados: ' + publishedError.message },
        { status: 500 }
      );
    }
    
    // Se não encontrou nenhum registro publicado
    if (!publishedData) {
      console.log('Nenhum registro de reviews publicados encontrado para este produto');
      
      // Consultar informações básicas do produto
      const { data: product } = await supabase
        .from('products')
        .select('id, title')
        .eq('id', productId)
        .maybeSingle();
      
      // Retornar objeto vazio com informações mínimas
      return NextResponse.json({
        product: {
          id: productId,
          title: product?.title || 'Produto',
          reviews_count: 0,
          average_rating: 0
        },
        reviews: [],
        totalCount: 0,
        averageRating: 0
      });
    }
    
    // Extrair as informações do registro publicado
    let reviewsList = publishedData.reviews_data || [];
    const averageRating = publishedData.average_rating || 0;
    const reviewsCount = publishedData.reviews_count || 0;
    
    // Decodificar textos UTF-8 para garantir exibição correta dos caracteres especiais
    reviewsList = reviewsList.map((review: any) => {
      // Verificar se o conteúdo tem caracteres escapados (u00e9, u00e7, etc.)
      if (review.content && typeof review.content === 'string') {
        // Tenta substituir diretamente os caracteres escapados por caracteres normais
        review.content = review.content
          .replace(/u00e1/g, 'á')
          .replace(/u00e0/g, 'à')
          .replace(/u00e2/g, 'â')
          .replace(/u00e3/g, 'ã')
          .replace(/u00e9/g, 'é')
          .replace(/u00ea/g, 'ê')
          .replace(/u00ed/g, 'í')
          .replace(/u00f3/g, 'ó')
          .replace(/u00f4/g, 'ô')
          .replace(/u00f5/g, 'õ')
          .replace(/u00fa/g, 'ú')
          .replace(/u00fc/g, 'ü')
          .replace(/u00e7/g, 'ç')
          .replace(/u00f1/g, 'ñ')
          .replace(/u00c1/g, 'Á')
          .replace(/u00c9/g, 'É')
          .replace(/u00cd/g, 'Í')
          .replace(/u00d3/g, 'Ó')
          .replace(/u00da/g, 'Ú')
          .replace(/u00c7/g, 'Ç')
          .replace(/u00d1/g, 'Ñ');
      }
      
      // O mesmo para o autor
      if (review.author && typeof review.author === 'string') {
        review.author = review.author
          .replace(/u00e1/g, 'á')
          .replace(/u00e0/g, 'à')
          .replace(/u00e2/g, 'â')
          .replace(/u00e3/g, 'ã')
          .replace(/u00e9/g, 'é')
          .replace(/u00ea/g, 'ê')
          .replace(/u00ed/g, 'í')
          .replace(/u00f3/g, 'ó')
          .replace(/u00f4/g, 'ô')
          .replace(/u00f5/g, 'õ')
          .replace(/u00fa/g, 'ú')
          .replace(/u00fc/g, 'ü')
          .replace(/u00e7/g, 'ç')
          .replace(/u00f1/g, 'ñ')
          .replace(/u00c1/g, 'Á')
          .replace(/u00c9/g, 'É')
          .replace(/u00cd/g, 'Í')
          .replace(/u00d3/g, 'Ó')
          .replace(/u00da/g, 'Ú')
          .replace(/u00c7/g, 'Ç')
          .replace(/u00d1/g, 'Ñ');
      }
      
      return review;
    });
    
    console.log(`Dados extraídos: ${reviewsCount} reviews, média ${averageRating}`);
    console.log('Primeiros reviews (após decodificação):', reviewsList.slice(0, 2).map((r: any) => `${r.author}: ${r.rating} estrelas`));
    
    // Buscar informações do produto
    const { data: product } = await supabase
      .from('products')
      .select('id, title, images, thumbnail')
      .eq('id', productId)
      .maybeSingle();
      
    const productTitle = product?.title || 'Produto';
    
    // Usar o nome e imagem do produto diretamente da tabela published_reviews_json
    const productName = publishedData.product_name || productTitle;
    const productImage = publishedData.product_image || '';
    
    console.log(`Encontrados ${reviewsCount} reviews publicados para o produto ${productName}`);

    // Retornar os dados estruturados
    return NextResponse.json({
      product: {
        id: productId,
        title: productName,
        image: productImage,
        reviews_count: reviewsCount,
        average_rating: averageRating
      },
      reviews: reviewsList,
      totalCount: reviewsCount,
      averageRating: averageRating
    });
    
  } catch (error: any) {
    console.error('Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
