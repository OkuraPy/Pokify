import { supabase } from './supabase';
import { Store, Product, Review } from './supabase';
import { verifyShopifyCredentials } from './shopify';

/**
 * Cria uma nova loja no Supabase
 */
export async function createStore(
  userId: string,
  storeData: Partial<Store> & { access_token?: string }
): Promise<{ success: boolean; storeId?: string; error?: string }> {
  try {
    // Validar as credenciais do Shopify se a plataforma for Shopify
    if (storeData.platform === 'shopify' && storeData.url && storeData.access_token) {
      const { valid, message } = await verifyShopifyCredentials(
        storeData.url,
        storeData.access_token
      );
      
      if (!valid) {
        return {
          success: false,
          error: message || 'Credenciais do Shopify inválidas'
        };
      }
    }
    
    // Preparar os dados da loja
    const newStore = {
      user_id: userId,
      name: storeData.name || 'Nova Loja',
      platform: storeData.platform || 'other',
      url: storeData.url,
      api_key: storeData.api_key,
      api_secret: storeData.api_secret,
      products_count: 0,
      orders_count: 0,
    };
    
    // Contornar os problemas de tipagem com o Supabase
    const { data, error } = await (supabase
      .from('stores')
      .insert(newStore)
      .select() as any);
    
    if (error) {
      throw new Error(`Erro ao criar loja: ${(error as any).message}`);
    }
    
    return {
      success: true,
      storeId: data?.[0]?.id
    };
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    return { 
      success: false, 
      error: (error as any).message || 'Erro ao criar a loja'
    };
  }
}

/**
 * Obtém todas as lojas de um usuário
 */
export async function getUserStores(
  userId: string
): Promise<{ success: boolean; stores?: Store[]; error?: string }> {
  try {
    // Contornar os problemas de tipagem com o Supabase
    const { data, error } = await (supabase
      .from('stores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as any);
    
    if (error) {
      throw new Error(`Erro ao buscar lojas: ${(error as any).message}`);
    }
    
    return {
      success: true,
      stores: data || []
    };
  } catch (error) {
    console.error('Erro ao buscar lojas do usuário:', error);
    return { 
      success: false, 
      error: (error as any).message || 'Erro ao buscar lojas do usuário'
    };
  }
}

/**
 * Obtém uma loja específica pelo ID
 */
export async function getStoreById(
  storeId: string
): Promise<{ success: boolean; store?: Store; error?: string }> {
  try {
    console.log('[getStoreById] Iniciando busca da loja. ID:', storeId);
    
    // Validar o ID
    if (!storeId || typeof storeId !== 'string' || storeId.trim() === '') {
      console.error('[getStoreById] ID de loja inválido:', storeId);
      return {
        success: false,
        error: 'ID de loja inválido'
      };
    }
    
    console.log('[getStoreById] Consultando banco de dados...');
    
    // Buscar a loja no banco de dados
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId.trim())
      .single();
    
    if (error) {
      console.error('[getStoreById] Erro na consulta:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Verificar se encontrou a loja
    if (!data) {
      console.log('[getStoreById] Nenhuma loja encontrada com o ID:', storeId);
      return {
        success: false,
        error: 'Loja não encontrada'
      };
    }
    
    console.log('[getStoreById] Dados brutos da loja:', data);
    
    // Garantir que os campos obrigatórios existam
    const store: Store = {
      id: data.id,
      name: data.name || 'Nome não disponível',
      user_id: data.user_id,
      platform: data.platform || 'other',
      url: data.url || '',
      products_count: data.products_count || 0,
      orders_count: data.orders_count || 0,
      last_sync: data.last_sync || undefined,
      created_at: data.created_at
    };
    
    console.log('[getStoreById] Loja formatada:', store);
    
    return {
      success: true,
      store: store
    };
  } catch (error) {
    console.error('[getStoreById] Erro inesperado:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Atualiza uma loja existente
 */
export async function updateStore(
  storeId: string,
  storeData: Partial<Store> & { access_token?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar os dados
    if (!storeId) {
      return {
        success: false,
        error: 'ID da loja não fornecido'
      };
    }
    
    // Verificar credenciais do Shopify se estiverem sendo atualizadas
    if (storeData.platform === 'shopify' && storeData.url && storeData.access_token) {
      const { valid, message } = await verifyShopifyCredentials(
        storeData.url,
        storeData.access_token
      );
      
      if (!valid) {
        return {
          success: false,
          error: message || 'Credenciais do Shopify inválidas'
        };
      }
    }
    
    // Remover campos que não existem na tabela
    const { access_token, ...storeDataWithoutToken } = storeData;
    
    // Criar um novo objeto garantindo que todos os campos Date sejam convertidos para string
    const updateData: Record<string, any> = {};
    
    // Processar todos os campos, convertendo Date para string ISO
    Object.entries(storeDataWithoutToken).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'toISOString' in value) {
        updateData[key] = (value as Date).toISOString();
      } else {
        updateData[key] = value;
      }
    });
    
    // Contornar os problemas de tipagem com o Supabase
    const { error } = await (supabase
      .from('stores')
      .update(updateData)
      .eq('id', storeId) as any);
    
    if (error) {
      throw new Error(`Erro ao atualizar loja: ${(error as any).message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    return { 
      success: false, 
      error: (error as any).message || 'Erro ao atualizar a loja'
    };
  }
}

/**
 * Opções para exclusão de loja
 */
interface DeleteStoreOptions {
  force?: boolean;
}

/**
 * Exclui uma loja e todas as suas dependências usando a função SQL cascade_delete_store
 */
export async function deleteStore(
  storeId: string,
  options?: DeleteStoreOptions
): Promise<{ success: boolean; error?: string; message?: string; data?: any }> {
  console.log(`[INFO] Iniciando exclusão da loja ${storeId}...`);
  
  try {
    // Usar a função SQL cascade_delete_store que foi criada especificamente para esta finalidade
    // Esta função executa todas as exclusões dentro de uma mesma transação, garantindo consistência
    console.log(`[INFO] Usando função cascade_delete_store para exclusão segura...`);
    
    // Usando 'as any' para contornar restriu00e7u00f5es de tipagem do Supabase
    const { data, error } = await (supabase
      .rpc('cascade_delete_store', { store_id_param: storeId })
      .single() as any);
      
    if (error) {
      console.error(`[ERRO] Falha ao executar cascade_delete_store:`, error);
      
      // Se estiver no modo forçado, tentar método alternativo
      if (options?.force) {
        console.log(`[INFO] Modo forçado ativado. Tentando exclusão alternativa...`);
        return await executeFallbackDelete(storeId);
      }
      
      return { 
        success: false, 
        error: `Falha na exclusão da loja: ${error.message}`
      };
    }
    
    console.log(`[SUCESSO] Loja excluída com sucesso via função SQL!`, data);
    return { 
      success: true,
      message: data?.message || 'Loja excluída com sucesso',
      data
    };
  } catch (error) {
    console.error(`[ERRO] Exceção ao excluir loja:`, error);
    
    // Se estiver no modo forçado, tentar método alternativo
    if (options?.force) {
      console.log(`[INFO] Modo forçado ativado após exceção. Tentando exclusão alternativa...`);
      return await executeFallbackDelete(storeId);
    }
    
    return { 
      success: false, 
      error: `Erro ao excluir loja: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Método alternativo para exclusão de lojas caso o principal falhe
 */
async function executeFallbackDelete(storeId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[INFO] Executando método alternativo de exclusão para a loja ${storeId}...`);
  
  try {
    // Esta SQL faz a mesma coisa que a função cascade_delete_store, mas de forma direta
    const rawQuery = `
      BEGIN;
        -- 1. Remover avaliações
        DELETE FROM reviews WHERE product_id IN (SELECT id FROM products WHERE store_id = '${storeId}');
        
        -- 2. Remover histórico de publicação
        DELETE FROM publication_history WHERE product_id IN (SELECT id FROM products WHERE store_id = '${storeId}');
        DELETE FROM publication_history WHERE store_id = '${storeId}';
        
        -- 3. Remover produtos
        DELETE FROM products WHERE store_id = '${storeId}';
        
        -- 4. Remover a loja
        DELETE FROM stores WHERE id = '${storeId}';
      COMMIT;
    `;
    
    // Executar a SQL diretamente
    // Usando 'as any' para contornar restriu00e7u00f5es de tipagem do Supabase
    const { data, error } = await (supabase.rpc('exec_sql', { sql_query: rawQuery }) as any);
    
    if (error) {
      console.error(`[ERRO] Falha no método alternativo de exclusão:`, error);
      return { 
        success: false, 
        error: `Falha no método alternativo: ${error.message}`
      };
    }
    
    console.log(`[SUCESSO] Loja excluída com sucesso via método alternativo!`);
    return { success: true };
  } catch (finalError) {
    console.error(`[ERRO FATAL] Exceção no método alternativo:`, finalError);
    return { 
      success: false, 
      error: `Falha total na exclusão: ${finalError instanceof Error ? finalError.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Obtém a contagem de lojas de um usuário
 */
export async function getUserStoresCount(
  userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    // Contornar os problemas de tipagem com o Supabase
    const { data, count, error } = await (supabase
      .from('stores')
      .select('*')
      .eq('user_id', userId) as any);
    
    if (error) {
      throw new Error(`Erro ao contar lojas: ${(error as any).message}`);
    }
    
    return {
      success: true,
      count: data?.length || 0
    };
  } catch (error) {
    console.error('Erro ao contar lojas do usuário:', error);
    return { 
      success: false, 
      error: (error as any).message || 'Erro ao contar lojas do usuário'
    };
  }
}

/**
 * Obtém estatísticas de uma loja
 */
export async function getStoreStats(
  storeId: string
): Promise<{ 
  success: boolean; 
  stats?: { 
    totalProducts: number;
    totalPublishedProducts: number;
    totalRevenue: number;
    totalReviews: number;
  }; 
  error?: string 
}> {
  try {
    // Obter contagem de produtos
    const { data: productsData, error: productsError } = await (supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId) as any);
    
    if (productsError) {
      throw new Error(`Erro ao contar produtos: ${(productsError as any).message}`);
    }
    const totalProducts = productsData?.length || 0;
    
    // Obter contagem de produtos publicados
    const { data: publishedData, error: publishedError } = await (supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId) as any)
      .eq('status', 'published');
    
    if (publishedError) {
      throw new Error(`Erro ao contar produtos publicados: ${(publishedError as any).message}`);
    }
    const totalPublishedProducts = publishedData?.length || 0;
    
    // Obter dados para cálculo de receita
    const { data: revenueData, error: revenueError } = await (supabase
      .from('products')
      .select('price, sales_count')
      .eq('store_id', storeId) as any)
      .eq('status', 'published');
    
    if (revenueError) {
      throw new Error(`Erro ao calcular receita: ${(revenueError as any).message}`);
    }
    
    // Calcular receita total baseada em produtos publicados e suas vendas
    const totalRevenue = (revenueData || []).reduce((sum: number, product: any) => {
      const salesCount = product.sales_count || 0;
      return sum + (product.price * salesCount);
    }, 0);
    
    // Obter IDs de produtos da loja
    const { data: productIdsData, error: productIdsError } = await (supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId) as any);
    
    if (productIdsError) {
      throw new Error(`Erro ao obter IDs de produtos: ${(productIdsError as any).message}`);
    }
    
    const productIds = (productIdsData || []).map((p: any) => p.id);
    
    let totalReviews = 0;
    
    if (productIds.length > 0) {
      // Obter contagem total de avaliações
      const { data: reviewsData, error: reviewsError } = await (supabase
        .from('reviews')
        .select('*') as any)
        .in('product_id', productIds);
      
      if (reviewsError) {
        throw new Error(`Erro ao contar avaliações: ${(reviewsError as any).message}`);
      }
      
      totalReviews = reviewsData?.length || 0;
    }
    
    return {
      success: true,
      stats: {
        totalProducts,
        totalPublishedProducts,
        totalRevenue,
        totalReviews
      }
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas da loja:', error);
    return {
      success: false,
      error: (error as any).message || 'Erro ao obter estatísticas da loja'
    };
  }
} 