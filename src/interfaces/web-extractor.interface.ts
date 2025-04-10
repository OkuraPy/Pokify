import { ProductData } from '../types/product-data';

export interface WebExtractor {
  extractData(url: string): Promise<ProductData>;
} 