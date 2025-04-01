import { extractDirectlyFromPage } from './linkfy-service';
import { extractProductDataWithOpenAI } from './openai-extractor';

export interface ExtractorResult {
  success: boolean;
  data?: {
    title?: string;
    description?: string;
    markdown?: string;
    images?: string[];
    mainImages?: string[];
    descriptionImages?: string[];
    price?: string;
    metadata?: any;
  };
  error?: string;
}

export class DirectExtractor {
  async extract(url: string): Promise<ExtractorResult> {
    try {
      console.log(`[Direct Extractor] Iniciando extração direta da URL: ${url}`);
      const result = await extractDirectlyFromPage(url);
      
      if (!result.success) {
        console.error(`[Direct Extractor] Falha na extração: ${result.error}`);
        return {
          success: false,
          error: result.error || 'Falha na extração direta'
        };
      }
      
      console.log(`[Direct Extractor] Extração bem sucedida. Encontradas ${result.data?.images?.length || 0} imagens`);
      return result;
    } catch (error: any) {
      console.error('[Direct Extractor] Erro durante extração:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido na extração direta'
      };
    }
  }
}

export class OpenAIExtractor {
  async extract(markdown: string): Promise<ExtractorResult> {
    try {
      console.log(`[OpenAI Extractor] Iniciando extração do markdown (${markdown.length} caracteres)`);
      const result = await extractProductDataWithOpenAI('', markdown);
      
      if (!result.success) {
        console.error(`[OpenAI Extractor] Falha na extração: ${result.error}`);
        return {
          success: false,
          error: result.error || 'Falha na extração com OpenAI'
        };
      }
      
      console.log(`[OpenAI Extractor] Extração bem sucedida. Encontradas ${result.data?.mainImages?.length || 0} imagens principais`);
      return result;
    } catch (error: any) {
      console.error('[OpenAI Extractor] Erro durante extração:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido na extração com OpenAI'
      };
    }
  }
} 