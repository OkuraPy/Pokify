import { WebExtractor } from '../interfaces/web-extractor.interface';
import { LinkfyExtractor, FirecrawlExtractor } from '../extractors';
import { ConfigService } from '../services/config.service';

/**
 * Factory para criar instâncias do extrator apropriado
 */
export class ExtractorFactory {
  /**
   * Cria e retorna a instância do extrator a ser utilizado
   * com base na configuração do sistema
   */
  static createExtractor(): WebExtractor {
    // Verifica se deve usar o novo extrator
    if (ConfigService.useNewExtractor()) {
      console.log('[ExtractorFactory] Usando FirecrawlExtractor');
      return new FirecrawlExtractor();
    }
    
    // Usa o extrator padrão (Linkfy)
    console.log('[ExtractorFactory] Usando LinkfyExtractor');
    return new LinkfyExtractor();
  }
} 