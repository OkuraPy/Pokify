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
export async function saveExtractedProduct(product: ExtractedProduct, storeId: string): Promise<{ success: boolean; error?: string; data?: any }> {
  const errorHandler = (error: any, stage: string): { success: boolean; error: string } => {
    console.error(`[saveExtractedProduct] Erro ao ${stage}:`, error);
    return { success: false, error: `Erro ao ${stage}: ${error.message || error}` };
  };

  console.log(`[saveExtractedProduct] Iniciando salvamento do produto "${product.title}" para loja ${storeId}`);
  console.log(`[saveExtractedProduct] Total de imagens para processar: ${product.images?.length || 0}`);

  try {
    // Verificar imagens inválidas
    const filteredImages = product.images.filter(url => {
      // Verificar se é uma URL válida
      try {
        new URL(url);
      } catch (e) {
        console.log(`[saveExtractedProduct] URL inválida descartada: ${url}`);
        return false;
      }

      // Verificar se a URL termina com uma extensão de imagem conhecida
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const hasValidExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));
      
      if (!hasValidExtension) {
        console.log(`[saveExtractedProduct] URL sem extensão de imagem válida: ${url}`);
        return false;
      }

      return true;
    });

    console.log(`[saveExtractedProduct] Imagens filtradas: ${filteredImages.length} de ${product.images.length} são válidas`);

    // Processar imagens
    const imageUrls: string[] = [];
    for (let i = 0; i < filteredImages.length; i++) {
      try {
        console.log(`[saveExtractedProduct] Processando imagem ${i + 1}/${filteredImages.length}: ${filteredImages[i].substring(0, 50)}...`);
        
        // Gerar nome de arquivo único baseado no timestamp e índice
        const fileName = `${Date.now()}_${i}_${Math.random().toString(36).substring(2, 10)}.jpg`;
        const storageUrl = `products/${storeId}/${fileName}`;
        
        // Baixar a imagem
        const start = Date.now();
        const imageResponse = await fetch(filteredImages[i], {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!imageResponse.ok) {
          console.log(`[saveExtractedProduct] Falha ao baixar imagem ${i + 1}: Status ${imageResponse.status}`);
          continue;
        }
        
        const imageBlob = await imageResponse.blob();
        console.log(`[saveExtractedProduct] Imagem ${i + 1} baixada em ${Date.now() - start}ms. Tamanho: ${(imageBlob.size / 1024).toFixed(2)}KB`);
        
        // Fazer upload para o Supabase Storage
        const buffer = await imageBlob.arrayBuffer();
        const { data, error } = await supabase.storage
          .from('products')
          .upload(storageUrl, buffer, {
            contentType: 'image/jpeg',
            upsert: true
          });
        
        if (error) {
          console.log(`[saveExtractedProduct] Erro ao fazer upload da imagem ${i + 1}:`, error.message);
          continue;
        }
        
        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(storageUrl);
        
        imageUrls.push(urlData.publicUrl);
        console.log(`[saveExtractedProduct] Imagem ${i + 1} processada com sucesso: ${urlData.publicUrl.substring(0, 50)}...`);
      } catch (error) {
        console.error(`[saveExtractedProduct] Erro ao processar imagem ${i + 1}:`, error);
        // Continue para a próxima imagem
      }
    }

    console.log(`[saveExtractedProduct] Processamento de imagens concluído. ${imageUrls.length} imagens salvas com sucesso.`);

    // Inserir produto
    try {
      // Prepara o objeto do produto para inserção no banco
      const newProduct = {
        store_id: storeId,
        title: product.title,
        description: product.description,
        price: product.price,
        compare_at_price: product.compare_at_price,
        images: imageUrls,
        original_url: product.original_url,
        original_platform: product.original_platform,
        stock: product.stock || 100,
        status: 'imported' as const,
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
        const reviewsToInsert = product.reviews.map(review => {
          // Converter created_at para string se for um objeto Date
          const created_at = typeof review.created_at === 'object' && review.created_at 
            ? (review.created_at as Date).toISOString() 
            : (review.created_at as string || new Date().toISOString());
          
          return {
            product_id: productId,
            author: review.author,
            rating: review.rating,
            content: review.content,
            date: review.date,
            images: review.images,
            is_selected: false,
            is_published: false,
            created_at
          };
        });
        
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
        data: {
          id: productId.toString(),
          title: product.title,
          images: imageUrls.length
        }
      };
    } catch (error) {
      return errorHandler(error, 'inserir produto');
    }
  } catch (error) {
    return errorHandler(error, 'salvar produto');
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