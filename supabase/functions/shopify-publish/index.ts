// Supabase Edge Function para publicar produtos no Shopify
// Endpoint: /functions/v1/shopify-publish

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface ShopifyCredentials {
  shop: string;
  accessToken: string;
}

interface ProductData {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  stock?: number;
  variants?: any[];
  tags?: string[];
}

interface PublishRequest {
  credentials: ShopifyCredentials;
  product: ProductData;
  reviews?: any[];
}

serve(async (req) => {
  // Configurações CORS
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  });

  // Responder a preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // Verificar se é um POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { headers, status: 405 }
    );
  }

  try {
    // Obter o corpo da requisição
    const request: PublishRequest = await req.json();
    const { credentials, product, reviews } = request;

    if (!credentials || !credentials.shop || !credentials.accessToken) {
      return new Response(
        JSON.stringify({ error: 'Credenciais do Shopify são obrigatórias' }),
        { headers, status: 400 }
      );
    }

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Dados do produto são obrigatórios' }),
        { headers, status: 400 }
      );
    }

    // Formatar os dados para a API do Shopify
    const shopifyProduct = formatProductForShopify(product, reviews);

    // Fazer a chamada para a API do Shopify
    const publishedProduct = await publishToShopify(credentials, shopifyProduct);

    return new Response(
      JSON.stringify({
        success: true,
        shopifyProductId: publishedProduct.id,
        productUrl: `https://${credentials.shop}/products/${publishedProduct.handle}`
      }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error('Erro ao publicar no Shopify:', error);
    return new Response(
      JSON.stringify({ error: `Erro: ${error.message}` }),
      { headers, status: 500 }
    );
  }
});

/**
 * Formata um produto para o formato esperado pela API do Shopify
 */
function formatProductForShopify(product: ProductData, reviews?: any[]): any {
  // Construir a descrição HTML com informações do produto
  let description = product.description || '';
  
  // Adicionar avaliações selecionadas, se houver
  if (reviews && reviews.length > 0) {
    description += `
    
    <div class="product-reviews">
      <h3>Avaliações de Clientes</h3>
      <div class="reviews-container">
    `;
    
    // Adicionar cada avaliação selecionada
    reviews.forEach(review => {
      if (review.is_selected) {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        description += `
        <div class="review-item">
          <div class="review-header">
            <span class="review-author">${review.author}</span>
            <span class="review-date">${review.date}</span>
            <div class="review-rating">${stars}</div>
          </div>
          <div class="review-content">${review.content}</div>
        </div>
        `;
      }
    });
    
    description += `
      </div>
    </div>
    
    <style>
      .product-reviews {
        margin-top: 30px;
        border-top: 1px solid #eee;
        padding-top: 20px;
      }
      .review-item {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #f0f0f0;
      }
      .review-header {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 10px;
        font-size: 0.9em;
      }
      .review-author {
        font-weight: bold;
        margin-right: 10px;
      }
      .review-date {
        color: #777;
      }
      .review-rating {
        color: #ff9900;
        margin-left: auto;
      }
      .review-content {
        line-height: 1.5;
      }
    </style>
    `;
  }
  
  // Criar a estrutura do produto para o Shopify
  const shopifyProduct = {
    product: {
      title: product.title,
      body_html: description,
      vendor: "Imported Product", // Pode ser personalizado
      product_type: "Imported",   // Pode ser personalizado
      published: true,
      tags: product.tags || [],
      variants: [],
      options: [],
      images: []
    }
  };
  
  // Adicionar variantes se existirem, caso contrário, criar uma variante padrão
  if (product.variants && product.variants.length > 0) {
    // Mapear as variantes existentes
    // Implementação detalhada seria necessária para mapear corretamente as opções/variantes
    shopifyProduct.product.variants = product.variants.map(variant => ({
      price: variant.price || product.price,
      compare_at_price: variant.compare_at_price || product.compare_at_price,
      sku: variant.sku || `IMPORT-${product.id}-${Date.now()}`,
      inventory_quantity: variant.inventory_quantity || product.stock || 10,
      inventory_management: "shopify",
      // Adicionar outros campos relevantes de variantes
    }));
  } else {
    // Criar variante única padrão
    shopifyProduct.product.variants = [
      {
        price: product.price,
        compare_at_price: product.compare_at_price,
        sku: `IMPORT-${product.id}-${Date.now()}`,
        inventory_quantity: product.stock || 10,
        inventory_management: "shopify",
        option1: "Default", // Valor padrão se não houver opções
        requires_shipping: true,
        taxable: true
      }
    ];
    
    // Adicionar uma opção padrão
    shopifyProduct.product.options = [
      {
        name: "Title",
        values: ["Default"]
      }
    ];
  }
  
  // Adicionar imagens
  if (product.images && product.images.length > 0) {
    shopifyProduct.product.images = product.images.map(image => ({
      src: image,
      position: 1
    }));
  }
  
  return shopifyProduct;
}

/**
 * Publica um produto no Shopify via API
 */
async function publishToShopify(credentials: ShopifyCredentials, shopifyProduct: any): Promise<any> {
  const { shop, accessToken } = credentials;
  
  const response = await fetch(`https://${shop}/admin/api/2023-07/products.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify(shopifyProduct)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erro na API do Shopify: ${JSON.stringify(errorData)}`);
  }
  
  const data = await response.json();
  return data.product;
}

/**
 * Verifica as credenciais do Shopify
 */
async function verifyShopifyCredentials(credentials: ShopifyCredentials): Promise<boolean> {
  try {
    const { shop, accessToken } = credentials;
    
    // Tenta buscar um recurso simples para verificar se as credenciais são válidas
    const response = await fetch(`https://${shop}/admin/api/2023-07/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Erro ao verificar credenciais:', error);
    return false;
  }
} 