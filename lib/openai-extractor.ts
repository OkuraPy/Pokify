import { OpenAI } from "openai";

export interface ExtractedProduct {
  title: string;
  price: string;
  description: string;
  mainImages: string[];
  descriptionImages: string[];
  images: string[];
  reviews?: any[];
}

export interface ExtractionResponse {
  success: boolean;
  data?: ExtractedProduct;
  error?: string;
}

export class OpenAIExtractor {
  private originalUrl: string;
  
  constructor(private openai: OpenAI, private maxRetries = 2) {
    this.originalUrl = '';
  }

  /**
   * Extrai dados do produto usando o texto markdown e uma imagem opcional da página
   * @param url URL original do produto
   * @param markdown Conteúdo markdown da página
   * @param screenshot Base64 da imagem da página (opcional)
   */
  async extractProductData(
    url: string, 
    markdown: string, 
    screenshot?: string
  ): Promise<ExtractionResponse> {
    // Armazenar a URL original para referência
    this.originalUrl = url;
    
    try {
      // Verificar se a chave API existe
      if (!process.env.OPENAI_API_KEY) {
        console.error('[OpenAI Extractor] Chave API da OpenAI não encontrada');
        throw new Error('Chave API da OpenAI não configurada');
      }

      console.log('[OpenAI Extractor] Iniciando extração de dados do produto com OpenAI');
      console.log(`[OpenAI Extractor] Tamanho do markdown: ${markdown.length} caracteres`);
      
      // Se o markdown for muito grande, truncá-lo para economizar tokens
      const truncatedMarkdown = markdown.slice(0, 8000);
      
      // Usar sempre o método de extração com markdown, ignorando screenshot
      return await this.extractWithMarkdown(url, truncatedMarkdown);
    } catch (error: any) {
      console.error('[OpenAI Extractor] Erro na extração com OpenAI:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar resposta da IA'
      };
    }
  }
  
  /**
   * Extrai dados do produto usando apenas o texto markdown
   */
  private async extractWithMarkdown(url: string, markdown: string): Promise<ExtractionResponse> {
    try {
      // Construir o prompt para o sistema
      const systemPrompt = `Você é um assistente especializado em extrair informações estruturadas de descrições de produtos e-commerce.
  
  Sua tarefa é analisar o conteúdo markdown de uma página de produto e extrair:
  1. Título exato do produto
  2. Preço atual
  3. Preço comparativo/antigo (se existir)
  4. Descrição COMPLETA e DETALHADA do produto - inclua TODAS as características, especificações, diferenciais e informações relevantes
  5. URLs de imagens principais (fotos principais do produto)
  6. URLs de imagens da descrição (imagens incorporadas na descrição)
  
  Imagens principais geralmente são as imagens de destaque/carrossel do produto, aparecem no topo da página, são maiores, mostram o produto completo, e têm foco em diferentes ângulos.
  
  Imagens de descrição geralmente são menores, mostram detalhes específicos e aparecem ao longo do texto descritivo.`;
  
      const userPrompt = `Você é um parser de HTML especializado em encontrar URLs de imagens. Analise o HTML/markdown fornecido e extraia TODAS as URLs de imagens do produto.

INSTRUÇÕES TÉCNICAS PARA EXTRAÇÃO DE IMAGENS:

1. PROCURE POR TODAS AS OCORRÊNCIAS DE:
   - <img src="URL">
   - <img data-src="URL">
   - <source srcset="URL">
   - <meta property="og:image" content="URL">
   - data-gallery-items contendo URLs
   - data-product-images contendo URLs
   - data-zoom-image="URL"
   - qualquer atributo contendo URL de imagem

2. PROCURE EM TODOS OS ELEMENTOS:
   - div.product-gallery
   - div.product-images
   - div[data-product-images]
   - section.product-images
   - [data-gallery]
   - [data-slider]
   - [data-zoom]

3. PROCURE EM SCRIPTS POR:
   - "product_images": [...]
   - "gallery_images": [...]
   - "zoom_images": [...]
   - Qualquer array de URLs de imagem

4. INCLUA TODAS AS VARIAÇÕES:
   - Diferentes resoluções
   - Diferentes formatos (jpg, png, webp)
   - Diferentes tamanhos
   - Diferentes CDNs

RETORNE NO FORMATO:
{
  "title": "título exato do produto",
  "price": "preço em formato numérico",
  "description": "descrição completa",
  "mainImages": [
    // TODAS as URLs de imagem encontradas, sem exceção
    // Uma URL por linha para facilitar a leitura
    "url1",
    "url2",
    "url3",
    ...
  ],
  "descriptionImages": [],
  "reviews": []
}

REGRAS OBRIGATÓRIAS:
1. NÃO IGNORE nenhuma URL de imagem
2. NÃO MODIFIQUE as URLs encontradas
3. INCLUA URLs mesmo que pareçam duplicadas
4. MANTENHA as URLs EXATAMENTE como estão no HTML
5. INCLUA URLs mesmo que sejam variações da mesma imagem
6. NÃO LIMITE o número de URLs retornadas

HTML/Markdown para análise:
${markdown.substring(0, 8000)}`;

      console.log('[OpenAI Extractor] Enviando prompt para OpenAI');
      
      try {
        // Chamar a API da OpenAI
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em extrair informações estruturadas de descrições de produtos em formato markdown. RETORNE APENAS JSON VÁLIDO, nada mais.'
            },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 4000,
          response_format: { type: 'json_object' }
        });

        const responseContent = response.choices[0]?.message?.content || '';

        if (!responseContent) {
          console.error('[OpenAI Extractor] Resposta vazia da OpenAI');
          throw new Error('Resposta vazia da OpenAI');
        }

        // Registrar a resposta para depuração
        console.log('[OpenAI Extractor] Resposta recebida da OpenAI');
        console.log(`[OpenAI Extractor] Tamanho da resposta: ${responseContent.length} caracteres`);
        console.log(`[OpenAI Extractor] Primeiros 200 caracteres: ${responseContent.substring(0, 200)}...`);

        // Processar o conteúdo da resposta
        const extractedData = this.parseResponseContent(responseContent);

        // Combinar imagens principais e de descrição em uma única lista
        const allImages = [
          ...(extractedData.mainImages || []),
          ...(extractedData.descriptionImages || [])
        ];

        // Adicionar as imagens combinadas ao objeto final
        const result: ExtractedProduct = {
          title: extractedData.title || '',
          price: extractedData.price || '',
          description: extractedData.description || '',
          mainImages: extractedData.mainImages || [],
          descriptionImages: extractedData.descriptionImages || [],
          images: this.removeDuplicateUrls(allImages),
          reviews: extractedData.reviews || []
        };

        console.log(`[OpenAI Extractor] Extração concluída com sucesso.`);
        console.log(`[OpenAI Extractor] Título: ${result.title}`);
        console.log(`[OpenAI Extractor] Preço: ${result.price}`);
        console.log(`[OpenAI Extractor] Imagens principais: ${result.mainImages.length}`);
        console.log(`[OpenAI Extractor] Imagens de descrição: ${result.descriptionImages.length}`);
        console.log(`[OpenAI Extractor] Total de imagens: ${result.images.length}`);

        return {
          success: true,
          data: result
        };
      } catch (apiError: any) {
        console.error('[OpenAI Extractor] Erro na chamada da API OpenAI:', apiError);
        throw new Error(`Erro na API OpenAI: ${apiError.message}`);
      }
    } catch (error: any) {
      console.error('[OpenAI Extractor] Erro na extração com OpenAI:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar resposta da IA'
      };
    }
  }
  
  /**
   * Extrai dados do produto usando o texto markdown e uma imagem da página
   * Esta abordagem é mais precisa para identificar quais imagens pertencem ao carousel e quais à descrição
   */
  private async extractWithScreenshot(
    url: string, 
    markdown: string, 
    screenshot: string
  ): Promise<ExtractionResponse> {
    try {
      console.log('[OpenAI Extractor] Iniciando extração com análise de imagem');
      console.log('[OpenAI Extractor] Detalhando prompt para análise com GPT-4-Vision:');
      
      // Prompt adaptado para incluir análise da imagem
      const userPrompt = `Analise cuidadosamente o screenshot e o markdown desta página de produto e extraia informações estruturadas.

Examine a screenshot para:
1. Identificar a estrutura visual da página de produto
2. Localizar o carrossel/galeria de imagens principais (normalmente no topo da página)
3. Identificar quais imagens estão dentro do texto da descrição do produto
4. Distinguir elementos visuais como banners, ícones e fotos reais do produto

IMPORTANTE: Diferencie corretamente entre:
- Imagens PRINCIPAIS: fotos grandes do produto, geralmente no topo da página, em um carrossel/galeria, mostrando diferentes ângulos do produto completo
- Imagens da DESCRIÇÃO: imagens menores que aparecem incorporadas no texto descritivo, mostrando detalhes, dimensões, modo de uso, etc.

A correta separação entre imagens principais e imagens da descrição é CRUCIAL para o resultado.

Retorne os dados no seguinte formato JSON:

{
  "title": "Título exato do produto",
  "price": "Preço do produto (apenas números e ponto decimal, ex: 129.90)",
  "description": "Descrição completa do produto",
  "mainImages": ["url1", "url2", ...],
  "descriptionImages": ["url1", "url2", ...],
  "reviews": [
    {
      "author": "Nome do autor",
      "rating": 5,
      "text": "Texto da avaliação"
    }
  ]
}

Instruções específicas:
1. Inclua todas as imagens principais (até 30 URLs)
2. Para imagens da descrição, identifique APENAS as que realmente fazem parte do conteúdo descritivo (máximo 5 URLs)
3. Não inclua banners, ícones, logos ou thumbnails como imagens principais
4. Se uma URL de imagem começar com // adicione https: no início
5. Certifique-se de que as URLs das imagens sejam completas e válidas
6. Observe atentamente onde cada imagem aparece visualmente na página

Markdown da página (complemento para sua análise):
${markdown.substring(0, 5000)}

Sua tarefa principal é categorizar corretamente as imagens com base em sua localização e função na página.`;

      console.log('[OpenAI Extractor] Prompt para Vision API:');
      console.log('-------------------------------------------');
      console.log(userPrompt);
      console.log('-------------------------------------------');
      console.log(`[OpenAI Extractor] Tamanho da imagem: ${Math.round(screenshot.length / 1024)} KB`);
      
      // Chamada para a API GPT-4 Vision
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "Você é especialista em extrair dados estruturados de páginas de e-commerce, analisando tanto o markdown quanto screenshots visuais."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${screenshot}`
                  }
                }
              ]
            }
          ],
          max_tokens: 3000,
        });

        const responseContent = response.choices[0]?.message?.content || '';

        if (!responseContent) {
          console.error('[OpenAI Extractor] Resposta vazia da API Vision');
          throw new Error('Resposta vazia da API Vision');
        }

        // Extrair JSON da resposta
        const jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || 
                          responseContent.match(/```\n([\s\S]*?)\n```/) ||
                          responseContent.match(/\{[\s\S]*\}/);
                          
        let extractedJson = '';
        if (jsonMatch) {
          extractedJson = jsonMatch[0].replace(/```json\n|```\n|```/g, '');
        } else {
          extractedJson = responseContent;
        }
        
        console.log('[OpenAI Extractor] JSON extraído da resposta Vision:', extractedJson.substring(0, 100) + '...');

        // Processar o JSON
        const extractedData = this.parseResponseContent(extractedJson);

        // Combinar imagens principais e de descrição em uma única lista
        const allImages = [
          ...(extractedData.mainImages || []),
          ...(extractedData.descriptionImages || [])
        ];

        // Adicionar as imagens combinadas ao objeto final
        const result: ExtractedProduct = {
          title: extractedData.title || '',
          price: extractedData.price || '',
          description: extractedData.description || '',
          mainImages: extractedData.mainImages || [],
          descriptionImages: extractedData.descriptionImages || [],
          images: this.removeDuplicateUrls(allImages),
          reviews: extractedData.reviews || []
        };

        console.log(`[OpenAI Extractor] Extração com Vision concluída com sucesso`);
        console.log(`[OpenAI Extractor] Título: ${result.title}`);
        console.log(`[OpenAI Extractor] Preço: ${result.price}`);
        console.log(`[OpenAI Extractor] Imagens principais: ${result.mainImages.length}`);
        console.log(`[OpenAI Extractor] Imagens de descrição: ${result.descriptionImages.length}`);
        console.log(`[OpenAI Extractor] Total de imagens: ${result.images.length}`);

        return {
          success: true,
          data: result
        };
      } catch (apiError: any) {
        console.error('[OpenAI Extractor] Erro na chamada da API Vision:', apiError);
        
        // Fallback para extração baseada apenas em texto se falhar
        console.log('[OpenAI Extractor] Fazendo fallback para extração baseada em texto');
        return await this.extractWithMarkdown(url, markdown);
      }
    } catch (error: any) {
      console.error('[OpenAI Extractor] Erro na extração com OpenAI Vision:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar resposta da IA'
      };
    }
  }

  /**
   * Tenta consertar um JSON truncado
   */
  private tryToFixTruncatedJson(content: string): string {
    // Se a string não começar com '{', não podemos consertar
    if (!content.trim().startsWith('{')) {
      return content;
    }

    // Procurar o último atributo válido
    const lastValidAttrIndex = Math.max(
      content.lastIndexOf('",'),
      content.lastIndexOf('",\n'),
      content.lastIndexOf('"]'),
      content.lastIndexOf('"],\n'),
      content.lastIndexOf('"}')
    );

    if (lastValidAttrIndex > 0) {
      // Fechar o objeto corretamente
      return content.substring(0, lastValidAttrIndex + 2) + '}';
    }

    return content;
  }

  private normalizeImageUrl(url: string): string {
    if (!url) return '';
    
    console.log(`[URL Normalizer] Processando URL: ${url}`);
    
    // Remover parâmetros de query que podem causar problemas
    url = url.split('?')[0];
    console.log(`[URL Normalizer] Sem parâmetros: ${url}`);
    
    // Verificar se a URL começa com // e adicionar https:
    if (url.startsWith('//')) {
      const httpsUrl = `https:${url}`;
      console.log(`[URL Normalizer] Convertida URL relativa para HTTPS: ${httpsUrl}`);
      return httpsUrl;
    }
    
    // Verificar se a URL é relativa e não tem domínio
    if (url.startsWith('/')) {
      // Extrair domínio da URL original (se disponível)
      const originalUrl = this.originalUrl || '';
      try {
        const urlObj = new URL(originalUrl);
        const fullUrl = `${urlObj.protocol}//${urlObj.host}${url}`;
        console.log(`[URL Normalizer] URL relativa convertida usando domínio original: ${fullUrl}`);
        return fullUrl;
      } catch (e) {
        // Se não conseguir extrair o domínio, tentar usar o domínio do Shopify
        if (url.includes('/cdn/shop/')) {
          const shopifyUrl = `https://midastime.com.br${url}`;
          console.log(`[URL Normalizer] URL Shopify convertida: ${shopifyUrl}`);
          return shopifyUrl;
        }
        console.log(`[URL Normalizer] Mantendo URL relativa: ${url}`);
        return url;
      }
    }
    
    // Se já for uma URL completa mas for do Shopify Preview, converter para produção
    if (url.includes('shopifypreview.com')) {
      const prodUrl = url.replace(/https:\/\/.*?\.shopifypreview\.com/, 'https://midastime.com.br');
      console.log(`[URL Normalizer] URL preview convertida para produção: ${prodUrl}`);
      return prodUrl;
    }
    
    // Se for uma URL do CDN do Shopify, converter para o domínio correto
    if (url.includes('cdn.shopify.com')) {
      const shopifyUrl = url.replace('cdn.shopify.com', 'midastime.com.br');
      console.log(`[URL Normalizer] URL CDN Shopify convertida: ${shopifyUrl}`);
      return shopifyUrl;
    }
    
    console.log(`[URL Normalizer] URL mantida sem alterações: ${url}`);
    return url;
  }

  /**
   * Verifica se a URL fornecida é uma URL de imagem válida
   */
  isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    console.log(`[URL Validator] Verificando URL: ${url}`);
    
    // Verificar se a URL tem formato de imagem ou é uma URL válida
    const isImageUrl = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null;
    const isValidUrl = url.match(/^(https?:\/\/|\/\/)/i) !== null;
    const isShopifyImage = url.includes('/cdn/shop/') || 
                          url.includes('shopifypreview.com') || 
                          url.includes('cdn.shopify.com');
    
    const isValid = isImageUrl || (isValidUrl && isShopifyImage);
    console.log(`[URL Validator] Resultado: ${isValid ? 'Válida' : 'Inválida'} (formato: ${isImageUrl}, estrutura: ${isValidUrl}, shopify: ${isShopifyImage})`);
    
    return isValid;
  }

  /**
   * Remove URLs duplicadas de um array e normaliza todas as URLs
   */
  removeDuplicateUrls(urls: string[]): string[] {
    if (!urls || !Array.isArray(urls)) return [];
    
    console.log(`[URL Deduplicator] Processando ${urls.length} URLs`);
    
    const uniqueUrls: string[] = [];
    const urlSet = new Set<string>();
    let invalidCount = 0;
    let duplicateCount = 0;
    
    for (const url of urls) {
      const normalizedUrl = this.normalizeImageUrl(url);
      // Verificar se é uma URL válida antes de adicionar
      if (normalizedUrl && this.isValidImageUrl(normalizedUrl)) {
        if (!urlSet.has(normalizedUrl)) {
          urlSet.add(normalizedUrl);
          uniqueUrls.push(normalizedUrl);
        } else {
          duplicateCount++;
          console.log(`[URL Deduplicator] URL duplicada ignorada: ${normalizedUrl}`);
        }
      } else {
        invalidCount++;
        console.log(`[URL Deduplicator] URL inválida ignorada: ${normalizedUrl}`);
      }
    }
    
    console.log(`[URL Deduplicator] Resultado: ${uniqueUrls.length} URLs únicas (${duplicateCount} duplicadas, ${invalidCount} inválidas removidas)`);
    
    return uniqueUrls;
  }

  private parseResponseContent(content: string): any {
    try {
      // Tentar parsear o JSON normalmente
      console.log('[OpenAI Extractor] Resposta bruta da OpenAI:', content);
      const data = JSON.parse(content);
      console.log('[OpenAI Extractor] JSON parseado:', JSON.stringify(data, null, 2));
      console.log('[OpenAI Extractor] Resposta parseada com sucesso');
      
      // Validar e normalizar as URLs das imagens
      console.log('[OpenAI Extractor] Imagens principais antes da normalização:', data.mainImages?.length || 0);
      console.log('[OpenAI Extractor] Primeiras 3 URLs principais:', data.mainImages?.slice(0, 3));
      
      if (data.mainImages && Array.isArray(data.mainImages)) {
        data.mainImages = this.removeDuplicateUrls(data.mainImages);
        console.log('[OpenAI Extractor] Imagens principais após normalização:', data.mainImages.length);
        console.log('[OpenAI Extractor] Primeiras 3 URLs normalizadas:', data.mainImages.slice(0, 3));
      } else {
        console.log('[OpenAI Extractor] Nenhuma imagem principal encontrada no JSON');
        data.mainImages = [];
      }
      
      if (data.descriptionImages && Array.isArray(data.descriptionImages)) {
        console.log('[OpenAI Extractor] Imagens de descrição antes da normalização:', data.descriptionImages.length);
        console.log('[OpenAI Extractor] URLs de descrição:', data.descriptionImages);
        data.descriptionImages = this.removeDuplicateUrls(data.descriptionImages);
        console.log('[OpenAI Extractor] Imagens de descrição após normalização:', data.descriptionImages.length);
      } else {
        console.log('[OpenAI Extractor] Nenhuma imagem de descrição encontrada no JSON');
        data.descriptionImages = [];
      }
      
      return data;
    } catch (error) {
      console.error('[OpenAI Extractor] Erro ao parsear resposta JSON:', error);
      console.error('[OpenAI Extractor] Conteúdo que causou erro:', content);
      
      // Tentar recuperar JSON parcial
      try {
        // Se o conteúdo for truncado, tentar consertá-lo
        const fixedContent = this.tryToFixTruncatedJson(content);
        if (fixedContent !== content) {
          console.log('[OpenAI Extractor] Tentando recuperar JSON truncado');
          const fixedData = JSON.parse(fixedContent);
          
          // Validar e normalizar as URLs das imagens
          if (fixedData.mainImages && Array.isArray(fixedData.mainImages)) {
            fixedData.mainImages = this.removeDuplicateUrls(fixedData.mainImages);
          } else {
            fixedData.mainImages = [];
          }
          
          if (fixedData.descriptionImages && Array.isArray(fixedData.descriptionImages)) {
            fixedData.descriptionImages = this.removeDuplicateUrls(fixedData.descriptionImages);
          } else {
            fixedData.descriptionImages = [];
          }
          
          return fixedData;
        }
      } catch (e) {
        console.error('[OpenAI Extractor] Falha na recuperação do JSON truncado:', e);
      }
      
      throw new Error('Formato de resposta inválido');
    }
  }

  /**
   * Converte o resultado da API Linkfy para o formato esperado pelo frontend
   */
  convertLinkfyToExtractedProduct(linkfyData: any): ExtractedProduct {
    if (!linkfyData || !linkfyData.data) {
      throw new Error('Dados da API Linkfy inválidos');
    }

    // Extrair dados do primeiro item
    const data = linkfyData.data[0] || {};
    
    // Extrair imagens adicionais do markdown
    const imagePattern = /!\[.*?\]\((.*?)\)|<img.*?src=["'](.*?)["']/g;
    let match;
    const imageMatches = [];
    
    while ((match = imagePattern.exec(data.markdown || '')) !== null) {
      imageMatches.push(match);
    }
    
    const extractedImages = imageMatches
      .map(match => match[1])
      .filter(url => url && !url.includes('placeholder') && this.isValidImageUrl(url));
    
    // Combinar com imagens já fornecidas
    const allImages = [...(data.images || []), ...extractedImages];
    const uniqueImages = this.removeDuplicateUrls(allImages);
    
    // Extrair possível preço do texto
    let price = '';
    const priceMatch = (data.markdown || '').match(/R\$\s*([\d.,]+)/);
    if (priceMatch && priceMatch[1]) {
      price = priceMatch[1].trim().replace(',', '.');
    }
    
    return {
      title: data.title || '',
      price: price || '',
      description: data.markdown || '',
      mainImages: uniqueImages || [],
      descriptionImages: [],
      images: uniqueImages || []
    };
  }
}

/**
 * Função de fábrica para criar uma instância do extrator OpenAI
 */
export function createOpenAIExtractor(): OpenAIExtractor {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  return new OpenAIExtractor(openai);
}

/**
 * Extrai dados do produto a partir do markdown usando a API OpenAI
 */
export async function extractProductDataWithOpenAI(
  url: string,
  markdown: string,
  screenshot?: string
): Promise<ExtractionResponse> {
  const extractor = createOpenAIExtractor();
  return extractor.extractProductData(url, markdown, screenshot);
} 