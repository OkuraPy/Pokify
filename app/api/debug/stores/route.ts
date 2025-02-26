import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createStore, getUserStores, getStoreById } from '@/lib/store-service';

// Endpoint para listar todas as lojas
export async function GET() {
  try {
    console.log('[DEBUG API] Buscando todas as lojas');
    
    // Buscar todas as lojas diretamente do Supabase sem filtro de usuário
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[DEBUG API] Erro ao buscar lojas:', error.message);
      return NextResponse.json({ 
        success: false, 
        error: `Erro ao buscar lojas: ${error.message}` 
      }, { status: 500 });
    }
    
    console.log(`[DEBUG API] ${data.length} lojas encontradas`);
    return NextResponse.json({ success: true, stores: data });
    
  } catch (error) {
    console.error('[DEBUG API] Erro ao processar requisição:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
}

// Endpoint para criar uma nova loja para debug
// Contorna as restrições de RLS - APENAS PARA DEBUGGING
export async function POST(request: Request) {
  try {
    console.log('[DEBUG API] Recebendo solicitação para criar loja de teste');
    
    // Extrair os dados do corpo da requisição
    const body = await request.json();
    
    const { name, userId, platform, url } = body;
    
    if (!userId) {
      console.error('[DEBUG API] Erro: userId é obrigatório');
      return NextResponse.json({ 
        success: false, 
        error: 'userId é obrigatório' 
      }, { status: 400 });
    }
    
    console.log('[DEBUG API] Criando nova loja (modo debug):', { name, userId, platform, url });
    
    // Criar a loja diretamente sem usar a função de serviço
    // Isso contorna as restrições de RLS
    const generatedId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const storeData = {
      id: generatedId,
      user_id: userId,
      name: name || 'Loja de Teste',
      platform: platform || 'shopify',
      url: url || 'https://example.myshopify.com',
      products_count: 0,
      orders_count: 0,
      created_at: now,
      updated_at: now
    };
    
    // Inserção direta no banco de dados
    const { data, error } = await supabase.from('stores').insert(storeData);
    
    if (error) {
      console.error('[DEBUG API] Erro ao criar loja (modo direto):', error);
      
      // Tentativa alternativa: usar SQL direto para contornar RLS
      // @ts-ignore - Ignorar erro de tipagem, pois a função debug_create_store existe no banco mas não no tipo
      const { data: rpcData, error: rpcError } = await supabase.rpc('debug_create_store', {
        store_data: storeData
      });
      
      if (rpcError) {
        console.error('[DEBUG API] Erro também na tentativa via RPC:', rpcError);
        return NextResponse.json({ 
          success: false, 
          error: `Erro ao criar loja: ${error.message}. RPC falhou com: ${rpcError.message}` 
        }, { status: 500 });
      }
      
      console.log('[DEBUG API] Loja criada via RPC:', rpcData);
      return NextResponse.json({
        success: true,
        message: 'Loja criada com sucesso via RPC',
        store: storeData
      });
    }
    
    console.log('[DEBUG API] Loja criada com sucesso (modo direto):', generatedId);
    return NextResponse.json({
      success: true,
      message: 'Loja criada com sucesso',
      store: storeData
    });
    
  } catch (error) {
    console.error('[DEBUG API] Erro ao processar requisição:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 });
  }
} 