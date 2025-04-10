import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente locais
dotenv.config({ path: '.env.local' });

/**
 * Serviço para gerenciar configurações da aplicação
 */
export class ConfigService {
  /**
   * Verifica se o novo extrator deve ser usado com base na variável de ambiente
   */
  static useNewExtractor(): boolean {
    const envValue = process.env.USE_NEW_EXTRACTOR;
    console.log(`[ConfigService] Valor da variável USE_NEW_EXTRACTOR: "${envValue}"`);
    console.log(`[ConfigService] FireCrawl API Key: ${process.env.FIRECRAWL_API_KEY ? 'Configurada' : 'Não configurada'}`);
    return envValue === 'true' || envValue === '1';
  }

  /**
   * Obtém o token da API Linkfy
   */
  static getLinkfyApiToken(): string {
    return process.env.LINKFY_API_TOKEN || '';
  }

  /**
   * Obtém a chave da API FireCrawl
   */
  static getFirecrawlApiKey(): string {
    return process.env.FIRECRAWL_API_KEY || '';
  }
} 