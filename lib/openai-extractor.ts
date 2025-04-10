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

export type ExtractionMode = 'standard' | 'pro_copy';

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
   * @param mode Modo de extração ('standard' ou 'pro_copy')
   */
  async extractProductData(
    url: string, 
    markdown: string, 
    screenshot?: string,
    mode: ExtractionMode = 'standard'
  ): Promise<ExtractionResponse> {
    // Armazenar a URL original para referência
    this.originalUrl = url;
    
    try {
      // Verificar se a chave API existe
      if (!process.env.OPENAI_API_KEY) {
        console.error('[OpenAI Extractor] Chave API da OpenAI não encontrada');
        throw new Error('Chave API da OpenAI não configurada');
      }

      console.log(`[OpenAI Extractor] Iniciando extração de dados do produto com OpenAI (Modo: ${mode})`);
      console.log(`[OpenAI Extractor] Tamanho do markdown: ${markdown.length} caracteres`);
      
      // Se o markdown for muito grande, truncá-lo para economizar tokens
      const truncatedMarkdown = markdown.slice(0, 8000);
      
      // Usar o método de extração apropriado com base no modo
      if (mode === 'pro_copy') {
        return await this.extractWithProCopy(url, truncatedMarkdown);
      } else {
        return await this.extractWithMarkdown(url, truncatedMarkdown);
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
   * Extrai dados do produto usando apenas o texto markdown
   */
  private async extractWithMarkdown(url: string, markdown: string): Promise<ExtractionResponse> {
    try {
      // Construir o prompt para o sistema
      const systemPrompt = `Você é um extrator especializado em analisar páginas de produtos e-commerce.
  
SUA MISSÃO É EXTRAIR TODAS AS INFORMAÇÕES IMPORTANTES DO PRODUTO:

1. TÍTULO COMPLETO E EXATO do produto
2. PREÇO ATUAL em formato numérico
3. PREÇO COMPARATIVO/ANTERIOR (se existir)
4. DESCRIÇÃO COMPLETA E DETALHADA do produto em formato HTML (com tags <p>, <br>, <ul>, <li>)
5. TODAS AS IMAGENS do produto, separadas em:
   - Imagens principais (carrossel/galeria)
   - Imagens da descrição (incorporadas no texto)

ATENÇÃO ESPECIAL PARA O TÍTULO:
- O título é o nome real do produto que está à venda
- NÃO confunda elementos da interface com o título (exemplos incorretos: "Guia de Tamanho", "Adicionar ao Carrinho", "Compartilhar")
- O título DEVE ser o nome comercial do produto principal, não um recurso ou complemento
- Procure o título em elementos de destaque, geralmente no topo da página ou perto das imagens principais
- Título correto exemplo: "Camiseta Dry-Fit Esportiva Masculina", não "Guia de Tamanho" ou "Compartilhar Produto"

PARA EXTRAÇÃO DE IMAGENS, PROCURE APENAS POR ARQUIVOS DE IMAGEM REAIS:
- URLs que terminam com .jpg, .jpeg, .png, .webp, .gif
- <img src="URL"> onde URL é um arquivo de imagem
- <source srcset="URL"> onde URL é um arquivo de imagem
- <meta property="og:image" content="URL">
- data-gallery-items contendo URLs de imagens
- data-product-images contendo URLs de imagens
- data-zoom-image="URL"

NÃO CONSIDERE COMO IMAGENS:
- Arquivos JavaScript (.js)
- Arquivos CSS (.css)
- Arquivos PHP (.php)
- Outros recursos que não são imagens

USE ESTAS REGRAS PARA VALIDAR IMAGENS:
1. A URL deve aparentar ser de uma imagem (terminando em .jpg, .jpeg, .png, .webp, etc)
2. OU estar em um contexto claramente de imagem, como src de uma tag <img>
3. NUNCA incluir arquivos JavaScript, CSS ou outros recursos

OBSERVE QUE É FUNDAMENTAL IDENTIFICAR CORRETAMENTE:
- As imagens da descrição: que aparecem dentro de <div> ou <p> no texto de descrição
- As imagens principais: que aparecem no carrossel/galeria de fotos do produto
   
NÃO IGNORE NENHUMA INFORMAÇÃO. EXTRAIA ABSOLUTAMENTE TUDO.`;
  
      const userPrompt = `Este é um HTML/markdown de uma página de produto de e-commerce. 
EXTRAIA TODAS AS INFORMAÇÕES DO PRODUTO, incluindo:

1. TÍTULO: O título exato e completo do produto (o nome comercial real do produto à venda)
   - CUIDADO! NÃO use como título elementos da interface como "Guia de Tamanho", "Compartilhar", "Detalhes" ou outros
   - O título correto geralmente é o texto mais destacado próximo às imagens principais ou no topo da página
   - Exemplo correto: "Camisa Polo Ralph Lauren Masculina Azul", não "Guia de Tamanho" ou "Entrega Rápida"

2. PREÇO: O preço atual do produto (em formato numérico COM PONTO como separador decimal, exemplo correto: 143.65, exemplo incorreto: 143,65)

3. DESCRIÇÃO: A descrição completa em formato HTML válido (não apenas texto plano)

4. IMAGENS: Todas as imagens do produto, com atenção especial às IMAGENS DA DESCRIÇÃO

PARA IMAGENS, SEPARE EM:
- mainImages: imagens principais do carrossel do produto (grandes, mostram o produto em diferentes ângulos)
- descriptionImages: imagens menores que aparecem DENTRO da descrição, entre os parágrafos, mostrando detalhes específicos

ATENÇÃO ESPECIAL PARA IMAGENS:
- APENAS inclua URLs que são REALMENTE imagens (.jpg, .jpeg, .png, .webp, .gif, .svg)
- NUNCA inclua arquivos JavaScript (.js), CSS (.css), PHP ou outros recursos
- VERIFIQUE se a URL é de uma imagem legítima, geralmente contendo termos como "image", "img", "photo", "product", "produto"
- EXCLUA qualquer URL que contenha termos como "vendor.js", "theme.js", "custom.js"
- CONSIDERE o contexto onde a URL foi encontrada (dentro de tag <img>, atributo src, etc)

REQUISITOS PARA A DESCRIÇÃO:
- DEVE ser em formato HTML válido com tags apropriadas (<p>, <br>, <ul>, <li>)
- NÃO use apenas quebras de linha (\\n)
- INCORPORE as imagens que encontrar na descrição usando tags <img>
- MANTENHA a formatação original (negrito, itálico, listas, etc.)
- PRESERVE emojis e símbolos especiais

FORMATAÇÃO ESPECÍFICA DO PREÇO:
- SEMPRE use PONTO como separador decimal (correto: 149.90, incorreto: 149,90)
- NUNCA use VÍRGULA para separar decimais
- Não inclua o símbolo de moeda (R$)
- Retorne apenas o valor numérico

REGRAS OBRIGATÓRIAS:
1. NUNCA deixe campos vazios (título, preço e descrição são OBRIGATÓRIOS)
2. IDENTIFIQUE CUIDADOSAMENTE quais imagens aparecem na descrição do produto
3. Inclua TODOS os detalhes do produto na descrição
4. NÃO IGNORE nenhuma URL de imagem real
5. EXCLUA URLs que não são imagens (JavaScript, CSS, PHP, etc)
6. RETORNE EXATAMENTE no formato JSON abaixo:

{
  "title": "Título exato do produto",
  "price": "149.90",
  "comparePrice": "199.90",
  "description": "<p>Descrição completa em <strong>HTML</strong> com todas as formatações</p><p><img src='url_imagem_descricao' alt='Detalhe do produto'></p>",
  "mainImages": ["url1", "url2", "url3", ...],
  "descriptionImages": ["url1", "url2", ...]
}

HTML/Markdown para análise:
${markdown.substring(0, 12000)}`;

      console.log('[OpenAI Extractor] Enviando prompt melhorado para OpenAI');
      console.log(`[OpenAI Extractor] Tamanho do prompt: ${userPrompt.length} caracteres`);
      
      try {
        // Chamar a API da OpenAI
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1, // Reduzir temperatura para resultados mais consistentes
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

        console.log(`[OpenAI Extractor] Total de imagens encontradas: ${allImages.length}`);
        console.log(`[OpenAI Extractor] Detalhamento: ${extractedData.mainImages?.length || 0} imagens principais, ${extractedData.descriptionImages?.length || 0} imagens de descrição`);

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

        // Buscar imagens adicionais para descrição se o array estiver vazio
        if (result.descriptionImages.length === 0) {
          console.log(`[OpenAI Extractor] OpenAI não encontrou imagens de descrição, buscando no markdown original`);
          
          // Usar regex para encontrar imagens no markdown
          const imageRegex = /!\[.*?\]\((.*?)\)|<img.*?src=["'](.*?)["']/g;
          const urlsFoundInMarkdown: string[] = [];
          let match;
          
          while ((match = imageRegex.exec(markdown)) !== null) {
            const imgUrl = match[1] || match[2];
            if (imgUrl && 
                this.isValidImageUrl(imgUrl) && 
                !urlsFoundInMarkdown.includes(imgUrl) &&
                !result.mainImages.includes(imgUrl)) {
              urlsFoundInMarkdown.push(imgUrl);
            }
          }
          
          // Se encontramos mais de 3 imagens, assumir que algumas são da descrição
          if (urlsFoundInMarkdown.length > 3) {
            // Assumir que as primeiras imagens são principais, e as restantes são da descrição
            // Começar após as 3 primeiras imagens
            const potentialDescImages = urlsFoundInMarkdown.slice(3);
            
            if (potentialDescImages.length > 0) {
              console.log(`[OpenAI Extractor] Encontradas ${potentialDescImages.length} possíveis imagens de descrição no markdown`);
              result.descriptionImages = potentialDescImages;
            }
          }
        }

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

        // Buscar imagens adicionais para descrição se o array estiver vazio
        if (result.descriptionImages.length === 0) {
          console.log(`[OpenAI Extractor] OpenAI não encontrou imagens de descrição, buscando no markdown original`);
          
          // Usar regex para encontrar imagens no markdown
          const imageRegex = /!\[.*?\]\((.*?)\)|<img.*?src=["'](.*?)["']/g;
          const urlsFoundInMarkdown: string[] = [];
          let match;
          
          while ((match = imageRegex.exec(markdown)) !== null) {
            const imgUrl = match[1] || match[2];
            if (imgUrl && 
                this.isValidImageUrl(imgUrl) && 
                !urlsFoundInMarkdown.includes(imgUrl) &&
                !result.mainImages.includes(imgUrl)) {
              urlsFoundInMarkdown.push(imgUrl);
            }
          }
          
          // Se encontramos mais de 3 imagens, assumir que algumas são da descrição
          if (urlsFoundInMarkdown.length > 3) {
            // Assumir que as primeiras imagens são principais, e as restantes são da descrição
            // Começar após as 3 primeiras imagens
            const potentialDescImages = urlsFoundInMarkdown.slice(3);
            
            if (potentialDescImages.length > 0) {
              console.log(`[OpenAI Extractor] Encontradas ${potentialDescImages.length} possíveis imagens de descrição no markdown`);
              result.descriptionImages = potentialDescImages;
            }
          }
        }

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
   * Verifica se uma URL é uma imagem válida
   */
  private isValidImageUrl(url: string): boolean {
    // Verificar se a URL parece válida
    if (!url || typeof url !== 'string') return false;
    
    // Rejeitar URLs de recursos que definitivamente não são imagens
    const invalidExtensions = ['.js', '.css', '.php', '.aspx', '.jsp'];
    const hasInvalidExtension = invalidExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );
    if (hasInvalidExtension) return false;
    
    // Verificar se termina com uma extensão de imagem comum
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const hasValidExtension = validExtensions.some(ext => 
      url.toLowerCase().endsWith(ext) || url.toLowerCase().includes(`${ext}?`)
    );
    
    // Se não tem extensão válida, verificar se contém padrões comuns de URLs de imagem
    if (!hasValidExtension) {
      const validImagePatterns = ['image', 'img', 'photo', 'picture', 'produto', 'product'];
      const containsImagePattern = validImagePatterns.some(pattern => 
        url.toLowerCase().includes(pattern)
      );
      // Se não tiver extensão válida e nem padrões conhecidos, rejeitar
      if (!containsImagePattern) return false;
    }
    
    return true;
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
      // Tentar encontrar e extrair JSON válido da resposta
      const jsonRegex = /\{[\s\S]*\}/g;
      const jsonMatch = content.match(jsonRegex);
      
      let jsonContent = content;
      if (jsonMatch && jsonMatch[0] !== content) {
        console.log('[OpenAI Extractor] Encontrado JSON incorporado na resposta, tentando extrair');
        jsonContent = jsonMatch[0];
      }
      
      // Tentar parsear o JSON extraído/corrigido
      console.log('[OpenAI Extractor] Tentando parsear JSON:', jsonContent.substring(0, 200) + '...');
      const data = JSON.parse(jsonContent);
      console.log('[OpenAI Extractor] JSON parseado com sucesso');
      
      // Validar e normalizar URLs de imagens
      console.log('[OpenAI Extractor] Imagens principais antes da normalização:', data.mainImages?.length || 0);
      
      if (data.mainImages && Array.isArray(data.mainImages)) {
        data.mainImages = this.removeDuplicateUrls(data.mainImages);
        console.log('[OpenAI Extractor] Imagens principais após normalização:', data.mainImages.length);
      } else {
        console.log('[OpenAI Extractor] Nenhuma imagem principal encontrada no JSON');
        data.mainImages = [];
      }
      
      if (data.descriptionImages && Array.isArray(data.descriptionImages)) {
        console.log('[OpenAI Extractor] Imagens de descrição antes da normalização:', data.descriptionImages.length);
        data.descriptionImages = this.removeDuplicateUrls(data.descriptionImages);
        console.log('[OpenAI Extractor] Imagens de descrição após normalização:', data.descriptionImages.length);
      } else {
        console.log('[OpenAI Extractor] Nenhuma imagem de descrição encontrada no JSON');
        data.descriptionImages = [];
      }
      
      return data;
    } catch (error) {
      console.error('[OpenAI Extractor] Erro ao parsear resposta JSON:', error);
      console.error('[OpenAI Extractor] Conteúdo que causou erro (primeiros 500 caracteres):', content.substring(0, 500));
      
      // Tentar recuperação mais agressiva
      try {
        console.log('[OpenAI Extractor] Tentando recuperação de emergência do JSON...');
        
        // 1. Tentar encontrar o objeto JSON usando expressão regular mais agressiva
        const jsonMatch = content.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          console.log('[OpenAI Extractor] Encontrado possível JSON com regex:', jsonMatch[0].substring(0, 100) + '...');
          
          try {
            const extractedData = JSON.parse(jsonMatch[0]);
            console.log('[OpenAI Extractor] Recuperação bem-sucedida!');
            return this.validateAndNormalizeData(extractedData);
          } catch (e) {
            console.log('[OpenAI Extractor] Falha ao parsear JSON extraído por regex');
          }
        }
        
        // 2. Tentar construir um objeto JSON mínimo a partir do conteúdo
        console.log('[OpenAI Extractor] Tentando criar JSON mínimo a partir da resposta...');
        
        // Buscar o título com regex
        const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
        // Buscar o preço com regex
        const priceMatch = content.match(/"price"\s*:\s*"([^"]+)"/);
        // Buscar a descrição (pode ser muito longa, então pegamos só o início)
        const descMatch = content.match(/"description"\s*:\s*"([\s\S]+?)"/);
        
        // Construir objeto mínimo
        const minimalData: any = {};
        
        if (titleMatch) minimalData.title = titleMatch[1];
        if (priceMatch) minimalData.price = priceMatch[1];
        if (descMatch) {
          // Limpar a descrição e garantir que é HTML válido
          let desc = descMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ');
          if (!desc.includes('<')) {
            desc = `<p>${desc}</p>`;
          }
          minimalData.description = desc;
        } else {
          // Se não encontrarmos a descrição, criar uma genérica
          minimalData.description = '<p>Descrição não disponível. Por favor, entre em contato para mais informações sobre este produto.</p>';
        }
        
        // Inicializar arrays vazios para imagens
        minimalData.mainImages = [];
        minimalData.descriptionImages = [];
        
        console.log('[OpenAI Extractor] Objeto mínimo criado:', minimalData);
        return minimalData;
      } catch (e) {
        console.error('[OpenAI Extractor] Todas as tentativas de recuperação falharam:', e);
        // Retornar um objeto vazio mas válido em último caso
        return {
          title: '',
          price: '',
          description: '<p>Não foi possível extrair a descrição deste produto.</p>',
          mainImages: [],
          descriptionImages: []
        };
      }
    }
  }
  
  /**
   * Valida e normaliza os dados extraídos
   */
  private validateAndNormalizeData(data: any): any {
    // Garantir que temos um objeto válido
    const validatedData: any = typeof data === 'object' ? data : {};
    
    // Validar e normalizar URLs de imagens
    if (validatedData.mainImages && Array.isArray(validatedData.mainImages)) {
      validatedData.mainImages = this.removeDuplicateUrls(validatedData.mainImages);
    } else {
      validatedData.mainImages = [];
    }
    
    if (validatedData.descriptionImages && Array.isArray(validatedData.descriptionImages)) {
      validatedData.descriptionImages = this.removeDuplicateUrls(validatedData.descriptionImages);
    } else {
      validatedData.descriptionImages = [];
    }
    
    return validatedData;
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

  /**
   * Extrai dados do produto usando o modo Pro Copy com estrutura AIDA
   */
  private async extractWithProCopy(url: string, markdown: string): Promise<ExtractionResponse> {
    try {
      // Construir o prompt para o sistema - específico para Pro Copy
      const systemPrompt = `Você é um copywriter profissional de e-commerce especializado em criar descrições de produtos de alta conversão.

Como copywriter especialista, você tem duas tarefas:

TAREFA 1: EXTRAÇÃO DE DADOS
Extraia com precisão:
- Título completo e exato do produto (o nome REAL do produto sendo vendido)
- Preço atual em formato numérico (com ponto decimal)
- URLs de imagens do produto (apenas imagens reais)

REGRAS CRÍTICAS PARA EXTRAÇÃO DO TÍTULO:
- O título é o nome COMERCIAL REAL do produto físico que está à venda
- "Guia de Tamanho" é um elemento da interface, NÃO um produto
- "Compre Agora", "Adicionar ao Carrinho", "Compartilhar" são elementos da interface, NÃO produtos
- O título DEVE ser um produto físico como "Camiseta", "Body", "Vestido", "Calça" etc.
- Tire o título de elementos de destaque perto das imagens principais
- EXEMPLOS CORRETOS de título: "Body Shaper Canelado", "Camiseta Dry-Fit Masculina"
- EXEMPLOS INCORRETOS de título: "Guia de Tamanho", "Adicionar ao Carrinho", "Compartilhar"

TAREFA 2: CRIAR UMA COPY PROFISSIONAL
Crie uma descrição de produto detalhada seguindo a estrutura AIDA:
- ATENÇÃO: Gancho poderoso com título em <h2>
- INTERESSE: Solução e benefícios principais 
- DESEJO: Detalhes do produto e prova social
- AÇÃO: Chamada à ação clara e persuasiva

PROIBIÇÕES ABSOLUTAS:
- PROIBIDO incluir qualquer botão como "Compre Agora", "Adicionar ao Carrinho", etc.
- PROIBIDO incluir qualquer elemento <a href> com links
- PROIBIDO incluir galerias de imagens, cards ou qualquer estrutura de exibição
- PROIBIDO incluir tags <button>, <div class="button">, ou similar
- PROIBIDO incluir tags <a> estilizadas como botões
- PROIBIDO incluir trechos como \`html, \`\`\`html, ou código
- PROIBIDO incluir <div class="product-image-gallery"> ou similar

REGRAS PARA A DESCRIÇÃO:
- Use APENAS as seguintes tags HTML: <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>
- A chamada à ação deve ser um texto simples, NUNCA um botão
- Terminar com um parágrafo simples, sem botões ou links
- Exemplo correto de chamada à ação: "<p>Adquira agora e transforme seu visual!</p>"
- Exemplo INCORRETO: "<a href...>Compre Agora</a>" ou qualquer botão`;
  
      const userPrompt = `Analise este HTML/markdown de produto e FAÇA DUAS COISAS:

1. EXTRAIA as informações básicas do produto:
   - Título exato do produto (o nome COMERCIAL REAL do produto físico à venda)
     * ATENÇÃO: "Guia de Tamanho" NÃO é um produto, é uma seção da interface
     * O título correto deve ser algo como "Body", "Camiseta", "Vestido" etc.
     * Procure o nome real do produto junto às imagens principais
   - Preço com ponto decimal
   - URLs das imagens

2. CRIE uma descrição completa usando a estrutura AIDA:

   A) ATENÇÃO:
      - Título chamativo em <h2>
      - Gancho poderoso que gere curiosidade
      - Problema que o cliente enfrenta

   B) INTERESSE:
      - Solução oferecida pelo produto
      - 5+ benefícios detalhados
      - Subtítulos em <h3>

   C) DESEJO:
      - Características técnicas completas
      - Listas organizadas <ul><li>
      - Prova social e exclusividade

   D) AÇÃO:
      - Chamada à ação EM TEXTO SIMPLES (apenas um parágrafo <p>)
      - Urgência e escassez
      - Garantia de satisfação

PROIBIÇÕES ABSOLUTAS (sua resposta será rejeitada se incluir):
- PROIBIDO incluir QUALQUER botão "Compre Agora" ou similar
- PROIBIDO incluir QUALQUER elemento <a href...>
- PROIBIDO incluir galerias, cards, ou divs de imagem
- PROIBIDO incluir QUALQUER tag estilizada como botão
- PROIBIDO usar <div>, <section>, <article> ou elementos estruturais

USE APENAS estas tags HTML:
- <h2>, <h3> para títulos
- <p> para parágrafos 
- <ul>, <li> para listas
- <strong>, <em> para ênfase
- NADA MAIS é permitido

Estruture sua resposta exatamente assim:
{
  "title": "Nome real do produto (não use 'Guia de Tamanho')",
  "price": "149.90",
  "mainImages": ["url1", "url2"],
  "description": "<h2>Título Persuasivo</h2><p>Texto AIDA completo aqui...</p>"
}

HTML/Markdown para análise:
${markdown.substring(0, 8000)}`;

      console.log('[OpenAI Extractor] Enviando prompt Pro Copy simplificado para OpenAI');
      console.log(`[OpenAI Extractor] Tamanho do prompt: ${userPrompt.length} caracteres`);
      
      try {
        // Chamar a API da OpenAI com configurações otimizadas
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: 'json_object' }
        });

        const responseContent = response.choices[0]?.message?.content || '';

        if (!responseContent) {
          console.error('[OpenAI Extractor] Resposta vazia da OpenAI');
          throw new Error('Resposta vazia da OpenAI');
        }

        // Registrar a resposta para depuração
        console.log('[OpenAI Extractor] Resposta recebida da OpenAI (Pro Copy)');
        console.log(`[OpenAI Extractor] Tamanho da resposta: ${responseContent.length} caracteres`);
        
        // Processar o conteúdo da resposta com o método robusto
        const extractedData = this.parseResponseContent(responseContent);
        
        // Aplicar filtro de segurança para remover elementos proibidos
        if (extractedData.description) {
          extractedData.description = this.sanitizeDescription(extractedData.description);
          console.log('[OpenAI Extractor] Descrição sanitizada para remover elementos proibidos');
        }
        
        // Verificar se a descrição é longa o suficiente
        if (extractedData.description) {
          // Remover todas as tags HTML para contar apenas o texto
          const textOnly = extractedData.description.replace(/<[^>]*>/g, ' ');
          const wordCount = textOnly.split(/\s+/).filter((word: string) => word.length > 0).length;
          
          console.log(`[OpenAI Extractor] Descrição gerada com ${wordCount} palavras`);
          
          // Se a descrição for muito curta, talvez enriquecer (não implementado aqui)
          if (wordCount < 400) {
            console.warn(`[OpenAI Extractor] A descrição gerada é curta (${wordCount} palavras).`);
          }
        }

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

        console.log(`[OpenAI Extractor] Extração Pro Copy concluída com sucesso.`);
        return { success: true, data: result };
      } catch (apiError: any) {
        console.error('[OpenAI Extractor] Erro na chamada da API OpenAI (Pro Copy):', apiError);
        
        // Tentar com uma abordagem diferente se falhar
        try {
          console.log('[OpenAI Extractor] Tentando abordagem alternativa para Pro Copy...');
          
          // Extrair apenas dados básicos primeiro
          const basicDataPrompt = `Extraia APENAS as informações básicas deste produto:
- Título exato (ATENÇÃO: "Guia de Tamanho" NÃO é um produto real)
- Preço com ponto decimal
- URLs das imagens

Resposta apenas em JSON:
{
  "title": "Nome real do produto (ex: Body Shaper, Camiseta)",
  "price": "123.45",
  "mainImages": ["url1", "url2"]
}

HTML/Markdown do produto:
${markdown.substring(0, 5000)}`;

          const basicResponse = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'Extraia apenas dados básicos do produto em formato JSON.' },
              { role: 'user', content: basicDataPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
          });
          
          const basicData = JSON.parse(basicResponse.choices[0]?.message?.content || '{}');
          console.log('[OpenAI Extractor] Dados básicos extraídos:', basicData);
          
          // Agora gerar apenas a descrição
          const descriptionPrompt = `Crie uma descrição AIDA profissional para este produto:
${basicData.title || 'Produto'}

A descrição deve:
- Seguir a estrutura AIDA (Atenção, Interesse, Desejo, Ação)
- Ser muito detalhada e persuasiva
- Ter formato HTML apenas com h2, h3, p, ul, li, strong, em
- NUNCA incluir botões, links ou galerias
- Terminar com chamada à ação em texto simples

HTML/Markdown original:
${markdown.substring(0, 3000)}`;

          const descResponse = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'Crie uma descrição AIDA profissional em HTML.' },
              { role: 'user', content: descriptionPrompt }
            ],
            temperature: 0.7,
            max_tokens: 3000
          });
          
          // Combinar os resultados
          const description = descResponse.choices[0]?.message?.content || '';
          
          // Formatar a descrição como HTML se não estiver
          let formattedDescription = description;
          if (!description.includes('<')) {
            formattedDescription = `<h2>${basicData.title || 'Produto'}</h2>\n<p>${description.replace(/\n\n/g, '</p><p>')}</p>`;
          }
          
          // Sanitizar descrição para remover elementos proibidos
          formattedDescription = this.sanitizeDescription(formattedDescription);
          
          const combinedResult: ExtractedProduct = {
            title: basicData.title || '',
            price: basicData.price || '',
            description: formattedDescription,
            mainImages: this.removeDuplicateUrls(basicData.mainImages || []),
            descriptionImages: [],
            images: this.removeDuplicateUrls(basicData.mainImages || [])
          };
          
          console.log('[OpenAI Extractor] Recuperação alternativa bem-sucedida');
          return { success: true, data: combinedResult };
        } catch (recoveryError) {
          console.error('[OpenAI Extractor] Tentativa de recuperação alternativa falhou:', recoveryError);
          throw new Error(`Erro na API OpenAI: ${apiError.message}`);
        }
      }
    } catch (error: any) {
      console.error('[OpenAI Extractor] Erro na extração Pro Copy com OpenAI:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar resposta da IA'
      };
    }
  }
  
  /**
   * Sanitiza a descrição para remover elementos proibidos
   */
  private sanitizeDescription(description: string): string {
    if (!description) return '';
    
    let sanitized = description;
    
    // Remover botões e links
    sanitized = sanitized.replace(/<a\b[^>]*>.*?<\/a>/gi, '');
    sanitized = sanitized.replace(/<button\b[^>]*>.*?<\/button>/gi, '');
    
    // Remover divs de galeria e similares
    sanitized = sanitized.replace(/<div\b[^>]*?product-image-gallery[^>]*?>[\s\S]*?<\/div>/gi, '');
    sanitized = sanitized.replace(/<div\b[^>]*?gallery[^>]*?>[\s\S]*?<\/div>/gi, '');
    sanitized = sanitized.replace(/<div\b[^>]*?image-grid[^>]*?>[\s\S]*?<\/div>/gi, '');
    
    // Remover outros elementos estruturais
    sanitized = sanitized.replace(/<div\b[^>]*>|<\/div>/gi, '');
    sanitized = sanitized.replace(/<section\b[^>]*>|<\/section>/gi, '');
    sanitized = sanitized.replace(/<article\b[^>]*>|<\/article>/gi, '');
    
    // Limpar estilos inline
    sanitized = sanitized.replace(/style=["'][^"']*["']/gi, '');
    
    // Substituir frases específicas
    sanitized = sanitized.replace(/Compre agora/gi, 'Adquira este produto');
    sanitized = sanitized.replace(/Adicione ao carrinho/gi, 'Escolha este produto');
    
    // Substituir "Guia de Tamanho" como título
    sanitized = sanitized.replace(/<h2[^>]*>Guia de Tamanho[^<]*<\/h2>/gi, '<h2>Produto Premium para seu Conforto</h2>');
    
    // Permitir apenas tags seguras
    const allowedTags = ['h2', 'h3', 'p', 'ul', 'li', 'strong', 'em', 'br'];
    const allowedTagsRegex = new RegExp(`<(?!\/?(?:${allowedTags.join('|')})\\b)[^>]+>`, 'gi');
    sanitized = sanitized.replace(allowedTagsRegex, '');
    
    return sanitized;
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
  screenshot?: string,
  mode?: string
): Promise<ExtractionResponse> {
  const extractor = createOpenAIExtractor();
  return extractor.extractProductData(
    url, 
    markdown, 
    screenshot, 
    mode === 'pro_copy' ? 'pro_copy' : 'standard'
  );
} 