import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Garantir que a rota seja sempre dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Não utilizar cache

export async function GET(request: Request, { params }: { params: { productId: string } }) {
  try {
    const productId = params.productId;
    
    // Verificar se o ID é válido
    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }

    console.log('Buscando reviews publicados para o produto:', productId);

    // Buscar dados da tabela published_reviews_json
    const { data, error } = await supabase
      .from('published_reviews_json')
      .select('reviews_data')
      .eq('product_id', productId)
      .single();

    if (error) {
      console.error('Erro ao buscar dados do JSON publicado:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do produto: ' + error.message },
        { status: 500 }
      );
    }

    if (!data?.reviews_data) {
      return NextResponse.json(
        { error: 'Produto não encontrado ou sem reviews publicados' },
        { status: 404 }
      );
    }

    // Retornar o JSON completo
    return NextResponse.json(data.reviews_data);
  } catch (err) {
    console.error('Erro ao processar requisição:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
