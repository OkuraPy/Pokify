import { getProductById, updateProductShopifyId } from '../../../services/productService';
import { getShopById } from '../../../services/shopService';

/**
 * Endpoint para publicar um produto do Pokify no Shopify
 */
export default async function handler(req, res) {
  // Verifica se o mu00e9todo da requisiu00e7u00e3o u00e9 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Mu00e9todo nu00e3o permitido' });
  }

  try {
    const { productId, storeId } = req.body;

    // Valida os paru00e2metros obrigatu00f3rios
    if (!productId || !storeId) {
      return res.status(400).json({ 
        message: 'ID do produto e ID da loja su00e3o obrigatu00f3rios' 
      });
    }

    // Busca os dados do produto
    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produto nu00e3o encontrado' });
    }

    // Busca os dados da loja
    const store = await getShopById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Loja nu00e3o encontrada' });
    }

    // Verifica se a loja tem as credenciais do Shopify configuradas
    if (!store.shopifyApiKey || !store.shopifyApiPassword || !store.shopifyStoreName) {
      return res.status(400).json({ 
        message: 'Credenciais do Shopify nu00e3o configuradas para esta loja' 
      });
    }

    // Configura as credenciais do Shopify
    const shopifyCredentials = {
      shopName: store.shopifyStoreName,
      apiKey: store.shopifyApiKey,
      password: store.shopifyApiPassword
    };

    // Converte o produto para o formato do Shopify
    const shopifyProduct = {
      product: {
        title: product.title,
        body_html: product.description,
        vendor: product.brand || "Importado",
        product_type: product.category,
        status: "active",
        images: product.images.map(img => ({ src: img })),
        variants: [
          {
            price: product.price,
            sku: product.sku || "",
            inventory_quantity: product.inventory || 10,
            requires_shipping: true
          }
        ]
      }
    };

    // Envia o produto para o Shopify
    const response = await publishToShopify(shopifyProduct, shopifyCredentials);

    // Atualiza o produto no Pokify com o ID do Shopify
    await updateProductShopifyId(productId, response.id);

    // Retorna a resposta bem-sucedida
    return res.status(200).json({
      message: 'Produto publicado com sucesso no Shopify',
      shopifyProductId: response.id,
      shopifyProductUrl: `https://${shopifyCredentials.shopName}/admin/products/${response.id}`
    });
  } catch (error) {
    console.error('Erro ao publicar produto no Shopify:', error);
    return res.status(500).json({ 
      message: 'Erro ao publicar produto no Shopify', 
      error: error.message 
    });
  }
}

/**
 * Publica um produto no Shopify
 * @param {Object} shopifyProduct - Produto no formato do Shopify
 * @param {Object} credentials - Credenciais do Shopify
 * @returns {Promise<Object>} - Resposta da API do Shopify
 */
async function publishToShopify(shopifyProduct, credentials) {
  const { shopName, apiKey, password } = credentials;
  
  const url = `https://${shopName}/admin/api/2023-10/products.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': password
    },
    body: JSON.stringify(shopifyProduct)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.errors || 'Erro ao publicar no Shopify');
  }

  return await response.json();
}
