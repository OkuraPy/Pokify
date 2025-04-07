import { Store } from './supabase';

// Interface para o produto formatado para o Shopify
export interface ShopifyProductData {
  title: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags?: string[];
  images?: string[];
  variants?: {
    price: string;
    compareAtPrice?: string;
    inventoryQuantity: number;
    sku?: string;
  }[];
  status?: 'ACTIVE' | 'DRAFT';
}

// Tipo extendido do Store para incluir api_version
export interface ShopifyStore {
  id: string;
  name: string;
  user_id: string;
  platform: 'shopify' | 'aliexpress' | 'other';
  url: string;
  api_key: string;
  api_secret?: string | null;
  api_version?: string;
  products_count: number;
  orders_count: number;
  last_sync?: string | null;
  created_at: string;
  updated_at: string;
}

// Tipo para o input da API GraphQL do Shopify
interface ShopifyGraphQLVariables {
  input: {
    title: string;
    descriptionHtml: string;
    vendor: string;
    productType: string;
    status: string;
    tags: string[];
    images?: Array<{ src: string }>;
    variants?: Array<{
      price: string;
      compareAtPrice?: string;
      inventoryQuantities?: {
        availableQuantity: number;
        locationId: string;
      };
    }>;
  };
}

/**
 * Publica um produto na loja Shopify usando a API GraphQL
 */
export async function publishProductToShopify(
  store: ShopifyStore,
  productData: ShopifyProductData
): Promise<{ success: boolean; shopifyProductId?: string; productUrl?: string; error?: string }> {
  try {
    // Usamos nossa própria API para evitar problemas de CORS
    const response = await fetch('/api/shopify/publish-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store,
        productData
      }),
    });

    // Se a resposta não for ok, lançamos um erro
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    // Processamos a resposta
    const data = await response.json();
    
    return {
      success: data.success,
      shopifyProductId: data.shopifyProductId,
      productUrl: data.productUrl,
      error: data.error
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
 * Verifica se as credenciais da loja Shopify são válidas usando GraphQL
 */
export async function verifyShopifyCredentials(
  url: string,
  api_key: string
): Promise<{ valid: boolean; message?: string; shopInfo?: any }> {
  try {
    // Usamos nossa própria API para evitar problemas de CORS
    const response = await fetch('/api/shopify/verify-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, api_key }),
    });

    // Processar a resposta
    const data = await response.json();
    
    return {
      valid: data.valid,
      message: data.message,
      shopInfo: data.shopInfo
    };
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
  let descriptionHtml = product.description || '';
  
  // Adicionar avaliações se solicitado
  if (includeReviews && product.reviews && product.reviews.length > 0) {
    descriptionHtml += '<div class="product-reviews">';
    descriptionHtml += '<h3>Avaliações dos Clientes</h3>';
    
    product.reviews
      .filter((review: any) => review.is_selected || review.is_published)
      .forEach((review: any) => {
        const content = review.improved_content || review.translated_content || review.content;
        descriptionHtml += `
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
    
    descriptionHtml += '</div>';
  }

  return {
    title: product.title,
    descriptionHtml,
    vendor: product.vendor || 'Dropfy Import',
    productType: product.category || 'Importado',
    tags: product.tags || [],
    images: product.images || [],
    variants: [
      {
        price: product.price.toString(),
        compareAtPrice: product.compare_at_price?.toString(),
        inventoryQuantity: product.stock || 100,
        sku: product.sku || `IMPORT-${product.id}-${Date.now()}`
      }
    ],
    status: 'ACTIVE'
  };
} 