import { ProductData } from '../types/product-data';
import { ExtractorFactory } from '../factories/extractor-factory';

/**
 * Serviço para extração de dados de produtos
 */
export class ProductExtractorService {
  /**
   * Extrai dados de um produto a partir de uma URL
   * @param url URL da página do produto a ser extraído
   * @returns Dados estruturados do produto
   */
  static async extractProductData(url: string): Promise<ProductData> {
    try {
      console.log(`[ProductExtractorService] Iniciando extração da URL: ${url}`);
      
      // Obter o extrator adequado através da factory
      const extractor = ExtractorFactory.createExtractor();
      
      // Extrair dados do produto
      const productData = await extractor.extractData(url);
      
      console.log(`[ProductExtractorService] Extração concluída com sucesso`);
      console.log(`[ProductExtractorService] Título: ${productData.title}`);
      console.log(`[ProductExtractorService] Preço: ${productData.price}`);
      
      return productData;
    } catch (error) {
      console.error('[ProductExtractorService] Erro durante a extração:', error);
      throw new Error(`Falha ao extrair dados do produto: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 