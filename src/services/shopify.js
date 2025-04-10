const axios = require('axios');

/**
 * Configuração básica para integração com a API do Shopify
 */
const shopifyConfig = {
  storeUrl: process.env.SHOPIFY_STORE_URL,
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_API_PASSWORD,
  apiVersion: '2023-07' // Use a versão mais recente disponível
};

/**
 * Cria um novo produto na loja Shopify
 * @param {Object} productData - Dados do produto a ser criado
 * @returns {Promise<Object>} - Produto criado no Shopify
 */
async function createProduct(productData) {
  try {
    const { storeUrl, apiKey, password, apiVersion } = shopifyConfig;
    
    // URL da API do Shopify para produtos
    const url = `https://${storeUrl}/admin/api/${apiVersion}/products.json`;
    
    // Configuração para autenticação básica
    const auth = {
      username: apiKey,
      password: password
    };
    
    // Estrutura do produto para o Shopify
    const shopifyProduct = {
      product: {
        title: productData.title,
        body_html: productData.description,
        vendor: productData.vendor || 'Pokify',
        product_type: productData.productType,
        tags: productData.tags,
        variants: productData.variants.map(variant => ({
          price: variant.price,
          sku: variant.sku,
          inventory_quantity: variant.inventory || 0,
          requires_shipping: true,
          taxable: true,
          barcode: variant.barcode || '',
          weight: variant.weight || 0,
          weight_unit: variant.weightUnit || 'kg',
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3
        })),
        options: productData.options,
        images: productData.images.map(image => ({
          src: image.src,
          alt: image.alt || ''
        }))
      }
    };
    
    // Faz a requisição POST para a API do Shopify
    const response = await axios.post(url, shopifyProduct, { auth });
    
    console.log('Produto criado com sucesso no Shopify:', response.data.product.id);
    return response.data.product;
  } catch (error) {
    console.error('Erro ao criar produto no Shopify:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Obtém um produto específico do Shopify pelo ID
 * @param {string} productId - ID do produto no Shopify
 * @returns {Promise<Object>} - Dados do produto
 */
async function getProduct(productId) {
  try {
    const { storeUrl, apiKey, password, apiVersion } = shopifyConfig;
    
    // URL da API do Shopify para o produto específico
    const url = `https://${storeUrl}/admin/api/${apiVersion}/products/${productId}.json`;
    
    // Configuração para autenticação básica
    const auth = {
      username: apiKey,
      password: password
    };
    
    // Faz a requisição GET para a API do Shopify
    const response = await axios.get(url, { auth });
    
    return response.data.product;
  } catch (error) {
    console.error('Erro ao obter produto do Shopify:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Atualiza um produto existente no Shopify
 * @param {string} productId - ID do produto no Shopify
 * @param {Object} productData - Novos dados do produto
 * @returns {Promise<Object>} - Produto atualizado
 */
async function updateProduct(productId, productData) {
  try {
    const { storeUrl, apiKey, password, apiVersion } = shopifyConfig;
    
    // URL da API do Shopify para o produto específico
    const url = `https://${storeUrl}/admin/api/${apiVersion}/products/${productId}.json`;
    
    // Configuração para autenticação básica
    const auth = {
      username: apiKey,
      password: password
    };
    
    // Estrutura do produto para o Shopify
    const shopifyProduct = {
      product: {
        id: productId,
        ...productData
      }
    };
    
    // Faz a requisição PUT para a API do Shopify
    const response = await axios.put(url, shopifyProduct, { auth });
    
    console.log('Produto atualizado com sucesso no Shopify:', productId);
    return response.data.product;
  } catch (error) {
    console.error('Erro ao atualizar produto no Shopify:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Exclui um produto do Shopify
 * @param {string} productId - ID do produto no Shopify
 * @returns {Promise<boolean>} - true se a exclusão for bem-sucedida
 */
async function deleteProduct(productId) {
  try {
    const { storeUrl, apiKey, password, apiVersion } = shopifyConfig;
    
    // URL da API do Shopify para o produto específico
    const url = `https://${storeUrl}/admin/api/${apiVersion}/products/${productId}.json`;
    
    // Configuração para autenticação básica
    const auth = {
      username: apiKey,
      password: password
    };
    
    // Faz a requisição DELETE para a API do Shopify
    await axios.delete(url, { auth });
    
    console.log('Produto excluído com sucesso do Shopify:', productId);
    return true;
  } catch (error) {
    console.error('Erro ao excluir produto do Shopify:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct
};
