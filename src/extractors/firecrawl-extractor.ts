import axios from 'axios';
import { WebExtractor } from '../interfaces/web-extractor.interface';
import { ProductData } from '../types/product-data';

export class FirecrawlExtractor implements WebExtractor {
  private readonly apiKey: string;
  
  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FIRECRAWL_API_KEY não definido no .env');
    }
  }
  
  async extractData(url: string): Promise<ProductData> {
    try {
      console.log(`[FirecrawlExtractor] Iniciando extração da URL: ${url}`);
      console.log(`[FirecrawlExtractor] Usando API Key: ${this.apiKey.substring(0, 5)}...`);
      
      const response = await axios.post('https://api.firecrawl.dev/v1/scrape', {
        url: url
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      console.log(`[FirecrawlExtractor] Resposta recebida com status: ${response.status}`);
      
      if (!response.data.success) {
        throw new Error(`API retornou status de erro: ${JSON.stringify(response.data)}`);
      }
      
      const responseData = response.data.data;
      const metadata = responseData.metadata || {};
      
      console.log(`[FirecrawlExtractor] Metadados recebidos: ${JSON.stringify(metadata)}`);
      
      // Procurar imagens em vários locais na resposta
      const imageUrls = this.extractAllImages(responseData);
      console.log(`[FirecrawlExtractor] Todas as imagens encontradas: ${JSON.stringify(imageUrls)}`);
      
      // Obter a imagem principal (primeira ou a mais específica)
      const mainImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
      
      // Tentar extrair preço do markdown usando regex
      const priceInfo = this.extractPriceInfoFromMarkdown(responseData.markdown || '');
      
      return {
        title: metadata.title || '',
        description: metadata.description || '',
        price: priceInfo.price,
        originalPrice: priceInfo.originalPrice,
        discountPercentage: priceInfo.discountPercentage,
        currency: 'BRL', // Assume padrão para o Brasil
        imageUrl: mainImageUrl,
        url: metadata.sourceURL || url,
        variants: this.extractVariantsFromMarkdown(responseData.markdown || ''),
        material: this.extractMaterialFromMarkdown(responseData.markdown || ''),
        allImages: imageUrls // Armazenar todas as imagens para uso posterior
      };
    } catch (error) {
      console.error('Erro ao extrair dados com Firecrawl:', error);
      throw new Error(`Falha na extração com Firecrawl: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private extractAllImages(data: any): string[] {
    const images: string[] = [];
    const seenUrls = new Set<string>();
    
    // Função para adicionar URL se for válida e não duplicada
    const addImageIfValid = (url: string) => {
      if (!url) return;
      
      // Normalizar URL
      let normalizedUrl = url.trim();
      if (normalizedUrl.startsWith('//')) {
        normalizedUrl = 'https:' + normalizedUrl;
      }
      
      // Verificar se é uma URL de imagem válida
      const isValidImageUrl = 
        normalizedUrl.includes('.jpg') || 
        normalizedUrl.includes('.jpeg') || 
        normalizedUrl.includes('.png') || 
        normalizedUrl.includes('.webp') || 
        normalizedUrl.includes('.gif') ||
        normalizedUrl.includes('cdn/shop') || // URLs Shopify
        normalizedUrl.includes('/image/') ||
        normalizedUrl.includes('/images/');
      
      // Ignorar URLs de placeholder ou ícones
      const isPlaceholder = 
        normalizedUrl.includes('placeholder') || 
        normalizedUrl.includes('icon') ||
        normalizedUrl.includes('logo') ||
        normalizedUrl.length < 10;
      
      if (isValidImageUrl && !isPlaceholder && !seenUrls.has(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        images.push(normalizedUrl);
        console.log(`[FirecrawlExtractor] Imagem válida encontrada: ${normalizedUrl}`);
      }
    };
    
    // 1. Verificar metadata.ogImage
    if (data.metadata && data.metadata.ogImage) {
      addImageIfValid(data.metadata.ogImage);
    }
    
    // 2. Verificar campos específicos em metadata
    if (data.metadata) {
      const checkFields = ['image', 'productImage', 'coverImage', 'thumbnailUrl', 'imageUrl'];
      checkFields.forEach(field => {
        if (data.metadata[field]) {
          addImageIfValid(data.metadata[field]);
        }
      });
    }
    
    // 3. Procurar imagens no markdown
    if (data.markdown) {
      // Regex para encontrar imagens no markdown: ![alt](url)
      const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
      let match;
      while ((match = markdownImageRegex.exec(data.markdown)) !== null) {
        addImageIfValid(match[1]);
      }
      
      // Regex para encontrar tags img no HTML dentro do markdown: <img src="url">
      const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/g;
      while ((match = htmlImageRegex.exec(data.markdown)) !== null) {
        addImageIfValid(match[1]);
      }
    }
    
    // 4. Verificar html, se disponível
    if (data.html) {
      const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/g;
      let match;
      while ((match = htmlImageRegex.exec(data.html)) !== null) {
        addImageIfValid(match[1]);
      }
    }
    
    console.log(`[FirecrawlExtractor] Total de ${images.length} imagens únicas encontradas`);
    return images;
  }
  
  private extractPriceInfoFromMarkdown(markdown: string): any {
    // Implementação da extração de preço do markdown
    const priceRegex = /R\$\s*([\d.,]+)/g;
    const discountRegex = /(\d+)%\s*OFF/i;
    const installmentRegex = /(\d+)x\s*de\s*R\$\s*([\d.,]+)/i;
    
    const prices = [];
    let match;
    while ((match = priceRegex.exec(markdown)) !== null) {
      prices.push(match[1].replace('.', '').replace(',', '.'));
    }
    
    // Assume o primeiro preço como o atual e o segundo como original
    const price = prices[0] || '';
    const originalPrice = prices.length > 1 ? prices[1] : '';
    
    // Extrai desconto
    const discountMatch = markdown.match(discountRegex);
    const discountPercentage = discountMatch ? discountMatch[1] : '';
    
    // Extrai parcelamento
    const installmentMatch = markdown.match(installmentRegex);
    const installments = installmentMatch ? {
      count: parseInt(installmentMatch[1]),
      value: installmentMatch[2].replace(',', '.')
    } : undefined;
    
    return { price, originalPrice, discountPercentage, installments };
  }
  
  private extractVariantsFromMarkdown(markdown: string): string[] {
    // Implementação para extrair variantes como tamanhos
    const variants = [];
    const sizes = ['P', 'M', 'G', 'GG', 'XG', '2XG', '3XG'];
    
    for (const size of sizes) {
      if (markdown.includes(`\n${size}\n`) || markdown.includes(` ${size} `)) {
        variants.push(size);
      }
    }
    
    return variants;
  }
  
  private extractMaterialFromMarkdown(markdown: string): string {
    // Procurar por menções de material no markdown
    const materialRegex = /(\d+%)\s*(algodão|poliéster|elastano|nylon|viscose|linho)/gi;
    const materials = [];
    
    let match;
    while ((match = materialRegex.exec(markdown)) !== null) {
      materials.push(`${match[1]} ${match[2]}`);
    }
    
    return materials.join(', ');
  }
} 