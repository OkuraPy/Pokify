// Exporta todas as interfaces
export type { WebExtractor } from './interfaces/web-extractor.interface';

// Exporta os tipos
export type { ProductData } from './types/product-data';

// Exporta os extratores
export { LinkfyExtractor, FirecrawlExtractor } from './extractors';

// Exporta a factory
export { ExtractorFactory } from './factories/extractor-factory';

// Exporta os serviços
export { ConfigService } from './services/config.service';
export { ProductExtractorService } from './services/product-extractor.service';

// Configuração padrão do sistema
import dotenv from 'dotenv';
dotenv.config(); 