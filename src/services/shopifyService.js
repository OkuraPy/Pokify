import axios from 'axios';

/**
 * Publica um produto do Pokify no Shopify
 * @param {string} productId - ID do produto no Pokify
 * @param {string} storeId - ID da loja no Pokify
 * @returns {Promise<Object>} - Resposta da API com os detalhes do produto publicado
 */
export async function publishProductToShopify(productId, storeId) {
  try {
    // Faz a requisiu00e7u00e3o para o endpoint da API do Pokify
    const response = await axios.post('/api/products/publish-to-shopify', {
      productId,
      storeId
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao publicar produto no Shopify:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      'Ocorreu um erro ao publicar o produto no Shopify. Verifique as credenciais da loja.'
    );
  }
}

/**
 * Verifica se as credenciais do Shopify de uma loja su00e3o vu00e1lidas
 * @param {Object} credentials - Credenciais do Shopify
 * @param {string} credentials.shopName - Nome da loja no Shopify (ex: minha-loja.myshopify.com)
 * @param {string} credentials.apiKey - API Key do Shopify
 * @param {string} credentials.apiPassword - API Password do Shopify
 * @returns {Promise<boolean>} - true se as credenciais forem vu00e1lidas
 */
export async function verifyShopifyCredentials(credentials) {
  try {
    const response = await axios.post('/api/shops/verify-shopify-credentials', credentials);
    return response.data.valid;
  } catch (error) {
    console.error('Erro ao verificar credenciais do Shopify:', error.response?.data || error.message);
    return false;
  }
}
