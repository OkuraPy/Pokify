export interface ProductData {
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  discountPercentage?: string;
  currency: string;
  imageUrl: string;
  imageHeight?: number;
  imageWidth?: number;
  url: string;
  variants?: string[];
  material?: string;
  brand?: string;
  installments?: {
    count: number;
    value: string;
  };
  allImages?: string[];
} 