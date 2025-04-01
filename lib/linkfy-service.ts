/**
 * Serviço para comunicar com a API Linkfy para extração de dados de páginas web
 */

/**
 * Resposta da extração de markdown da API Linkfy
 */
export interface LinkfyResponse {
  success: boolean;
  data?: {
    title: string;
    description: string;
    markdown: string;
    images?: string[];
    metadata?: any;
  };
  error?: string;
}

/**
 * Procura recursivamente URLs de imagens em um objeto
 */
function findImagesInObject(obj: any, depth = 0): string[] {
  if (depth > 5) return []; // Limitar profundidade da busca
  
  if (!obj) return [];
  if (typeof obj !== 'object') return [];
  
  let foundImages: string[] = [];
  
  // Verificar se o objeto atual contém propriedades que parecem ser URLs de imagens
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'string' && 
         (item.includes('.jpg') || 
          item.includes('.jpeg') || 
          item.includes('.png') || 
          item.includes('.webp') || 
          item.includes('.gif')) &&
         (item.startsWith('http') || item.startsWith('//'))) {
        foundImages.push(item);
      } else if (typeof item === 'object') {
        foundImages = [...foundImages, ...findImagesInObject(item, depth + 1)];
      }
    }
  } else {
    // Procurar em propriedades que podem conter imagens
    const imagePropertyNames = ['images', 'photos', 'gallery', 'media', 'featured_image', 'image', 'src', 'url'];
    
    for (const key in obj) {
      if (imagePropertyNames.includes(key.toLowerCase())) {
        if (Array.isArray(obj[key])) {
          for (const img of obj[key]) {
            if (typeof img === 'string') {
              foundImages.push(img);
            } else if (img && typeof img === 'object' && 'src' in img) {
              foundImages.push(img.src);
            } else if (img && typeof img === 'object' && 'url' in img) {
              foundImages.push(img.url);
            }
          }
        } else if (typeof obj[key] === 'string') {
          foundImages.push(obj[key]);
        } else if (obj[key] && typeof obj[key] === 'object') {
          if ('src' in obj[key]) foundImages.push(obj[key].src);
          if ('url' in obj[key]) foundImages.push(obj[key].url);
        }
      } else if (typeof obj[key] === 'object') {
        foundImages = [...foundImages, ...findImagesInObject(obj[key], depth + 1)];
      }
    }
  }
  
  return foundImages;
}

/**
 * Extrai o conteúdo markdown de uma URL usando a API Linkfy
 * @param url URL da página a ser extraída
 * @returns Objeto contendo os dados extraídos ou erro
 */
export async function extractMarkdownFromUrl(url: string): Promise<LinkfyResponse> {
  try {
    console.log(`[Linkfy Service] Extraindo dados da URL: ${url}`);
    console.log(`[Linkfy Service] Token API: ${process.env.LINKFY_API_TOKEN || 'usando fallback'}`);
    
    const response = await fetch('https://api.linkfy.io/api/text/extract-web-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-token': process.env.LINKFY_API_TOKEN || 'FV1CTFNIs7skgnrdZz9JdbVloNTP3WuA'
      },
      body: JSON.stringify({ url })
    });
    
    console.log(`[Linkfy Service] Status resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Linkfy Service] Erro na API (${response.status}): ${errorText}`);
      return {
        success: false,
        error: `Erro na API Linkfy: ${response.statusText || 'Status ' + response.status}`
      };
    }
    
    const data = await response.json();
    
    // Log completo para depuração
    console.log('[Linkfy Service] Resposta bruta da API:');
    try {
      console.log(JSON.stringify(data));
    } catch (e) {
      console.log('[Linkfy Service] Não foi possível converter a resposta para JSON string:', e);
      console.log('Tipo de resposta:', typeof data);
      console.log('Possui propriedade data?', data && 'data' in data);
      if (data && 'data' in data) {
        console.log('Tipo da propriedade data:', typeof data.data);
        console.log('É um array?', Array.isArray(data.data));
      }
    }
    
    // Verificar diferentes formatos possíveis da resposta
    let markdown = '';
    let title = '';
    let description = '';
    let images: string[] = [];
    
    // Caso 1: formato esperado com array data
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      const firstItem = data.data[0];
      markdown = firstItem.markdown || firstItem.content || firstItem.text || '';
      title = firstItem.title || '';
      description = firstItem.description || '';
      images = firstItem.images || [];
    } 
    // Caso 2: formato direto sem array
    else if (data && (data.markdown || data.content || data.text)) {
      markdown = data.markdown || data.content || data.text || '';
      title = data.title || '';
      description = data.description || '';
      images = data.images || [];
    }
    // Caso 3: formato aninhado diferente
    else if (data && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      const dataObj = data.data;
      markdown = dataObj.markdown || dataObj.content || dataObj.text || '';
      title = dataObj.title || '';
      description = dataObj.description || '';
      images = dataObj.images || [];
    }
    
    if (!markdown) {
      console.error('[Linkfy Service] Markdown não encontrado na resposta');
      console.log('[Linkfy Service] Estrutura completa:', JSON.stringify(data));
      return {
        success: false,
        error: 'Markdown não encontrado na resposta da API Linkfy'
      };
    }
    
    console.log(`[Linkfy Service] Extração concluída. Tamanho do markdown: ${markdown.length} caracteres`);
    
    return {
      success: true,
      data: {
        title: title,
        description: description,
        markdown: markdown,
        images: images,
        metadata: data.metadata || {}
      }
    };
  } catch (error: any) {
    console.error('[Linkfy Service] Erro ao extrair dados:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao extrair dados'
    };
  }
}

/**
 * Tenta extrair o conteúdo diretamente da página HTML, como fallback se a API falhar
 * @param url URL da página para extrair
 */
export async function extractDirectlyFromPage(url: string): Promise<LinkfyResponse> {
  const maxRetries = 3;
  const timeout = 30000; // 30 segundos
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Direct Extractor] Tentativa ${attempt}/${maxRetries} de extrair da URL: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Buscar o HTML da página
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      console.log(`[Direct Extractor] Status resposta direta: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      console.log(`[Direct Extractor] HTML recebido: ${html.length} caracteres`);
      
      // Extrair imagens do HTML usando regex
      const imageUrls = new Set<string>();
      
      // Padrão para src de imagens
      const srcPattern = /src=["'](.*?)["']/g;
      let match;
      
      while ((match = srcPattern.exec(html)) !== null) {
        if (match[1] && !match[1].includes('placeholder')) {
          imageUrls.add(match[1]);
        }
      }
      
      // Padrão para data-src (lazy loading)
      const dataSrcPattern = /data-src=["'](.*?)["']/g;
      while ((match = dataSrcPattern.exec(html)) !== null) {
        if (match[1] && !match[1].includes('placeholder')) {
          imageUrls.add(match[1]);
        }
      }
      
      // Padrão para srcset
      const srcsetPattern = /srcset=["'](.*?)["']/g;
      while ((match = srcsetPattern.exec(html)) !== null) {
        const srcset = match[1].split(',');
        for (const src of srcset) {
          const url = src.trim().split(' ')[0];
          if (url && !url.includes('placeholder')) {
            imageUrls.add(url);
          }
        }
      }
      
      // Filtrar apenas URLs de imagem válidas
      const validImageUrls = Array.from(imageUrls).filter(url => {
        return (
          url.match(/\.(jpg|jpeg|png|gif|webp)/i) || // Extensões de imagem
          url.includes('/cdn/shop/') || // URLs do Shopify
          url.includes('shopifypreview.com') // URLs de preview do Shopify
        );
      });
      
      console.log(`[Direct Extractor] Encontradas ${validImageUrls.length} imagens válidas`);
      
      // Extrair título e descrição
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      const descriptionMatch = html.match(/<meta\s+name="description"\s+content="(.*?)"/);
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';
      
      return {
        success: true,
        data: {
          title,
          description,
          markdown: html,
          images: validImageUrls
        }
      };
    } catch (error: any) {
      console.error(`[Direct Extractor] Erro na tentativa ${attempt}:`, error);
      
      if (attempt === maxRetries) {
        return {
          success: false,
          error: `Falha após ${maxRetries} tentativas: ${error.message}`
        };
      }
      
      // Esperar antes da próxima tentativa (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      console.log(`[Direct Extractor] Aguardando ${waitTime}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return {
    success: false,
    error: 'Falha após todas as tentativas'
  };
} 