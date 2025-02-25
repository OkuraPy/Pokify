import { supabase } from './supabase';
import { Product, Review } from './supabase';

export interface ExtractedProduct {
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  stock?: number;
  variants?: any[];
  reviews?: Review[];
  original_url: string;
  original_platform: 'aliexpress' | 'shopify' | 'other';
  tags?: string[];
  category?: string;
  average_rating?: number;
}

/**
 * Extrai informações de um produto a partir de sua URL
 * Este serviço faz uma requisição para o Supabase Edge Functions
 */
export async function extractProductFromUrl(
  url: string
): Promise<{ success: boolean; data?: ExtractedProduct; error?: string }> {
  try {
    // Verificar qual plataforma a URL pertence
    const platform = identifyPlatform(url);
    
    if (!platform) {
      return {
        success: false,
        error: 'URL não suportada. Por favor, forneça uma URL do AliExpress ou Shopify.',
      };
    }

    // Aqui fazemos uma chamada para a função serverless no Supabase
    const { data, error } = await supabase.functions.invoke('extract-product', {
      body: { url, platform },
    });

    if (error) {
      console.error('Erro ao extrair dados do produto:', error);
      return {
        success: false,
        error: (error as any).message || 'Erro na extração do produto.',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Não foi possível extrair os dados do produto. Verifique o URL e tente novamente.',
      };
    }

    return {
      success: true,
      data: {
        ...data as any,
        original_url: url,
        original_platform: platform,
      },
    };
  } catch (error) {
    console.error('Erro ao extrair produto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na extração do produto.',
    };
  }
}

/**
 * Extrai avaliações adicionais de um produto
 */
export async function extractProductReviews(
  url: string,
  page: number = 1,
  limit: number = 20
): Promise<{ success: boolean; data?: Review[]; error?: string }> {
  try {
    const platform = identifyPlatform(url);
    
    if (!platform) {
      return {
        success: false,
        error: 'URL não suportada para extração de avaliações.',
      };
    }

    const { data, error } = await supabase.functions.invoke('extract-reviews', {
      body: { url, platform, page, limit },
    });

    if (error) {
      console.error('Erro ao extrair avaliações:', error);
      return {
        success: false,
        error: (error as any).message || 'Erro na extração das avaliações.',
      };
    }

    return {
      success: true,
      data: (data || []) as Review[],
    };
  } catch (error) {
    console.error('Erro ao extrair avaliações:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na extração das avaliações.',
    };
  }
}

/**
 * Salva um produto extraído no banco de dados Supabase
 */
export async function saveExtractedProduct(
  storeId: string,
  product: ExtractedProduct
): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    // Primeiro, salvamos as imagens no Storage do Supabase
    const imagePromises = product.images.map(async (imageUrl) => {
      // Gera um nome único para a imagem
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
      
      // Baixa a imagem e faz upload para o Supabase Storage
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`${storeId}/${filename}`, blob);
      
      if (error) throw new Error(`Falha ao fazer upload da imagem: ${(error as any).message || 'erro desconhecido'}`);
      
      // Retorna a URL pública da imagem
      const { data: publicUrl } = supabase.storage
        .from('product-images')
        .getPublicUrl(`${storeId}/${filename}`);
      
      return publicUrl.publicUrl;
    });
    
    // Processa todas as promessas de upload de imagens
    const supabaseImageUrls = await Promise.all(imagePromises);
    
    // Prepara o objeto do produto para inserção no banco
    const newProduct: Partial<Product> = {
      store_id: storeId,
      title: product.title,
      description: product.description,
      price: product.price,
      compare_at_price: product.compare_at_price,
      images: supabaseImageUrls,
      original_url: product.original_url,
      original_platform: product.original_platform,
      stock: product.stock || 100,
      status: 'imported',
      reviews_count: product.reviews?.length || 0,
      average_rating: product.average_rating,
      tags: product.tags,
      variants: product.variants,
    };
    
    // Insere o produto na tabela de produtos
    const productResult: any = await supabase
      .from('products')
      .insert(newProduct)
      .select();
    
    const productData = productResult?.data;
    const productError = productResult?.error;
    
    if (productError) {
      throw new Error(`Erro ao salvar produto: ${(productError as any).message || 'erro desconhecido'}`);
    }
    
    // Extrair o ID do produto salvo
    const productId = productData && productData.length > 0 ? productData[0].id : null;
    
    if (!productId) {
      throw new Error('Não foi possível obter o ID do produto salvo');
    }
    
    // Se houver avaliações, salvamos na tabela de reviews
    if (product.reviews && product.reviews.length > 0) {
      const reviewsToInsert = product.reviews.map(review => ({
        ...review,
        product_id: productId,
        is_selected: false,
        is_published: false,
      }));
      
      const reviewsResult: any = await supabase
        .from('reviews')
        .insert(reviewsToInsert);
      
      const reviewsError = reviewsResult?.error;
      
      if (reviewsError) {
        console.error('Erro ao salvar avaliações:', reviewsError);
        // Continuamos mesmo com erro ao salvar avaliações
      }
    }
    
    return {
      success: true,
      productId: productId.toString(),
    };
  } catch (error) {
    console.error('Erro ao salvar produto extraído:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao salvar o produto.',
    };
  }
}

/**
 * Identifica a plataforma com base na URL
 */
function identifyPlatform(url: string): 'aliexpress' | 'shopify' | 'other' | null {
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('aliexpress.com')) {
    return 'aliexpress';
  }
  
  if (lowerUrl.includes('myshopify.com') || 
      lowerUrl.includes('/products/') && 
      !lowerUrl.includes('aliexpress.com')) {
    return 'shopify';
  }
  
  // Outras plataformas podem ser adicionadas aqui
  
  return null;
} 