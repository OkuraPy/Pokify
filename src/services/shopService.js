import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com as credenciais do ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca uma loja pelo ID
 * @param {string} storeId - ID da loja
 * @returns {Promise<Object|null>} - Dados da loja ou null se não encontrada
 */
export async function getShopById(storeId) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error) {
      console.error('Erro ao buscar loja:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar loja:', error);
    return null;
  }
}

/**
 * Atualiza as credenciais do Shopify de uma loja
 * @param {string} storeId - ID da loja
 * @param {Object} credentials - Credenciais do Shopify (shopifyApiKey, shopifyApiPassword, shopifyStoreName)
 * @returns {Promise<boolean>} - Sucesso da operação
 */
export async function updateShopifyCredentials(storeId, credentials) {
  const { shopifyApiKey, shopifyApiPassword, shopifyStoreName } = credentials;
  
  try {
    const { error } = await supabase
      .from('stores')
      .update({
        shopify_api_key: shopifyApiKey,
        shopify_api_password: shopifyApiPassword,
        shopify_store_name: shopifyStoreName,
        updated_at: new Date()
      })
      .eq('id', storeId);

    if (error) {
      console.error('Erro ao atualizar credenciais da loja:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar credenciais da loja:', error);
    return false;
  }
} 