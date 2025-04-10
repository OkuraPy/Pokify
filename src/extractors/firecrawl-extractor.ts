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
        url: url,
        formats: ['markdown', 'html']
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
      
      // Tentar extrair preço do markdown usando regex
      const priceInfo = this.extractPriceInfoFromMarkdown(responseData.markdown || '');
      
      return {
        title: metadata.title || '',
        description: metadata.description || '',
        price: priceInfo.price,
        originalPrice: priceInfo.originalPrice,
        discountPercentage: priceInfo.discountPercentage,
        currency: 'BRL', // Assume padrão para o Brasil
        imageUrl: metadata.ogImage || '',
        url: metadata.sourceURL || url,
        variants: this.extractVariantsFromMarkdown(responseData.markdown || ''),
        material: this.extractMaterialFromMarkdown(responseData.markdown || '')
      };
    } catch (error) {
      console.error('Erro ao extrair dados com Firecrawl:', error);
      throw new Error(`Falha na extração com Firecrawl: ${error instanceof Error ? error.message : String(error)}`);
    }
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