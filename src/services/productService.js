import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com as credenciais do ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca um produto pelo ID
 * @param {string} productId - ID do produto
 * @returns {Promise<Object|null>} - Dados do produto ou null se não encontrado
 */
export async function getProductById(productId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return null;
  }
}

/**
 * Atualiza um produto com o ID do Shopify
 * @param {string} productId - ID do produto
 * @param {string} shopifyId - ID do produto no Shopify
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function updateProductShopifyId(productId, shopifyId) {
  try {
    const { error } = await supabase
      .from('products')
      .update({ shopify_id: shopifyId, published_at: new Date() })
      .eq('id', productId);

    if (error) {
      console.error('Erro ao atualizar produto com ID do Shopify:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar produto com ID do Shopify:', error);
    return false;
  }
} 