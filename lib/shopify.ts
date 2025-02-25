import { Store } from './supabase';

// Interface para o produto formatado para o Shopify
export interface ShopifyProductData {
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: {
    price: string;
    compare_at_price?: string;
    inventory_quantity: number;
    sku?: string;
  }[];
  images: {
    src: string;
    alt?: string;
  }[];
  status: 'active' | 'draft';
}

/**
 * Publica um produto na loja Shopify
 */
export async function publishProductToShopify(
  store: Store,
  productData: ShopifyProductData
): Promise<{ success: boolean; shopify_product_id?: string; error?: string }> {
  try {
    // Configurações de autenticação para a API do Shopify
    const apiVersion = '2023-10'; // Usando a versão mais recente da API
    
    if (!store.url) {
      return { success: false, error: 'URL da loja não fornecido' };
    }
    
    const shopUrl = store.url.replace(/https?:\/\//, '');
    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': store.api_key || '',
    };

    // Endpoint para criar produtos
    const endpoint = `https://${shopUrl}/admin/api/${apiVersion}/products.json`;

    // Requisição para a API do Shopify
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ product: productData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao publicar produto no Shopify:', errorData);
      return {
        success: false,
        error: `Erro ${response.status}: ${JSON.stringify(errorData)}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      shopify_product_id: data.product.id.toString(),
    };
  } catch (error) {
    console.error('Erro ao publicar produto no Shopify:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Verifica se as credenciais da loja Shopify são válidas
 */
export async function verifyShopifyCredentials(
  url: string,
  api_key: string
): Promise<{ valid: boolean; message?: string }> {
  try {
    const apiVersion = '2023-10';
    const shopUrl = url.replace(/https?:\/\//, '');
    const endpoint = `https://${shopUrl}/admin/api/${apiVersion}/shop.json`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': api_key,
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        message: `Credenciais inválidas ou erro na conexão (${response.status})`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Formata um produto do nosso sistema para o formato aceito pelo Shopify
 */
export function formatProductForShopify(
  product: any,
  includeReviews: boolean = false
): ShopifyProductData {
  // Preparar descrição do produto
  let bodyHtml = product.description;
  
  // Adicionar avaliações se solicitado
  if (includeReviews && product.reviews && product.reviews.length > 0) {
    bodyHtml += '<div class="product-reviews">';
    bodyHtml += '<h3>Avaliações dos Clientes</h3>';
    
    product.reviews
      .filter((review: any) => review.is_selected || review.is_published)
      .forEach((review: any) => {
        const content = review.improved_content || review.translated_content || review.content;
        bodyHtml += `
          <div class="review">
            <div class="review-header">
              <span class="review-author">${review.author}</span>
              <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
              <span class="review-date">${review.date}</span>
            </div>
            <div class="review-content">${content}</div>
            ${review.images && review.images.length > 0 
              ? `<div class="review-images">${review.images.map((img: string) => 
                  `<img src="${img}" alt="Review Image" />`).join('')}</div>` 
              : ''}
          </div>
        `;
      });
    
    bodyHtml += '</div>';
  }

  return {
    title: product.title,
    body_html: bodyHtml,
    vendor: 'Sua Loja', // Pode ser personalizado
    product_type: product.category || 'Geral',
    tags: product.tags || [],
    variants: [
      {
        price: product.price.toString(),
        compare_at_price: product.compare_at_price?.toString(),
        inventory_quantity: product.stock || 100,
        sku: product.sku,
      }
    ],
    images: product.images.map((src: string) => ({ src })),
    status: 'active', // Pode ser 'draft' se desejar revisão antes de publicar
  };
} 