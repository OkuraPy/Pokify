import axios from 'axios';
import { WebExtractor } from '../interfaces/web-extractor.interface';
import { ProductData } from '../types/product-data';

export class LinkfyExtractor implements WebExtractor {
  private readonly apiToken: string;
  
  constructor() {
    this.apiToken = process.env.LINKFY_API_TOKEN || '';
    if (!this.apiToken) {
      console.warn('LINKFY_API_TOKEN não definido no .env');
    }
  }
  
  async extractData(url: string): Promise<ProductData> {
    try {
      const response = await axios.post('https://api.linkfy.io/api/text/extract-web-info', {
        url: url
      }, {
        headers: {
          'Content-Type': 'application/json',
          'api-token': this.apiToken
        }
      });
      
      const data = response.data;
      
      // Extrai preço, desconto e parcelamento do markdown
      const priceInfo = this.extractPriceInfo(data.data.markdownText);
      
      return {
        title: data.data.title || '',
        description: data.data.description || '',
        price: priceInfo.price,
        originalPrice: priceInfo.originalPrice,
        discountPercentage: priceInfo.discountPercentage,
        currency: 'BRL', // Assume padrão para o Brasil
        imageUrl: this.extractFirstImage(data.data.markdownText),
        url: url,
        installments: priceInfo.installments,
        variants: this.extractVariants(data.data.markdownText)
      };
    } catch (error) {
      console.error('Erro ao extrair dados com Linkfy:', error);
      throw new Error(`Falha na extração com Linkfy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private extractPriceInfo(markdown: string): any {
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
  
  private extractFirstImage(markdown: string): string {
    const imageRegex = /!\[.*?\]\((.*?)\)/;
    const match = markdown.match(imageRegex);
    return match ? match[1] : '';
  }
  
  private extractVariants(markdown: string): string[] {
    // Implementação para extrair variantes como tamanhos
    const variants = [];
    const sizes = ['P', 'M', 'G', 'GG', 'XG', '2XG', '3XG'];
    
    for (const size of sizes) {
      if (markdown.includes(`\n${size}\n`)) {
        variants.push(size);
      }
    }
    
    return variants;
  }
} 