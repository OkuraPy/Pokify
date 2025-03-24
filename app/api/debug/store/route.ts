import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Endpoint para buscar uma loja específica pelo ID
export async function GET(request: Request) {
  try {
    // Esta função foi temporariamente desativada para o deploy
    return NextResponse.json({
      success: false,
      error: 'Endpoint de debug desativado temporariamente'
    }, { status: 503 });

    /*
    // Extrair o ID da loja da URL
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('id');
    
    console.log('[DEBUG API] Buscando loja pelo ID:', storeId);
    
    if (!storeId) {
      return NextResponse.json({
        success: false,
        error: 'ID da loja não fornecido'
      }, { status: 400 });
    }
    
    // Buscar os detalhes da loja diretamente do banco, ignorando RLS
    const { data, error } = await supabase
      .rpc('debug_get_store', { store_id: storeId } as { store_id: string });
    
    if (error) {
      console.error('[DEBUG API] Erro ao buscar loja:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    if (!data) {
      console.log('[DEBUG API] Loja não encontrada');
      return NextResponse.json({
        success: false,
        error: 'Loja não encontrada'
      }, { status: 404 });
    }
    
    console.log('[DEBUG API] Loja encontrada:', data);
    
    // Formatar os dados da loja
    const store = {
      id: data.id,
      name: data.name,
      user_id: data.user_id,
      platform: data.platform,
      url: data.url || '',
      products_count: data.products_count || 0,
      orders_count: data.orders_count || 0,
      last_sync: data.last_sync,
      created_at: data.created_at
    };
    
    return NextResponse.json({
      success: true,
      store: store
    });
    */
    
  } catch (error) {
    console.error('[DEBUG API] Erro ao processar requisição:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
} 