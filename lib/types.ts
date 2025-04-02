export interface Product {
  id: string;
  store_id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  stock: number;
  status: 'imported' | 'editing' | 'ready' | 'published' | 'archived';
  images: string[];
  description_images?: string[];
  tags?: string[];
  reviews_count: number;
  average_rating?: number | null;
  original_url?: string | null;
  original_platform?: 'aliexpress' | 'shopify' | 'other' | null;
  shopify_product_id?: string | null;
  shopify_product_url?: string | null;
  variants?: any;
  language?: string; // Código do idioma da descrição (pt, en, es, etc)
  created_at: string;
  updated_at: string;
} 