'use client';

import { formatPrice } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductInfoProps {
  product: {
    id: string;
    title: string;
    price: number;
    compare_at_price?: number | null;
    stock: number;
    status: string;
    reviews_count: number;
    average_rating?: number | null;
    shopify_product_id?: string | null;
    created_at: string;
    updated_at: string;
    sales?: number;
    views?: number;
  };
}

export function ProductInfo({ product }: ProductInfoProps) {
  return (
    <div className="space-y-6">
      {/* Preço e Estoque */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-muted-foreground line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
          <Badge variant="outline" className="font-mono">
            SKU: {product.id.substring(0, 8).toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground">Estoque</span>
            <p className="font-medium">{product.stock} unidades</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="space-y-1">
            <span className="text-muted-foreground">Vendas</span>
            <p className="font-medium">{product.sales || 0} unidades</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="space-y-1">
            <span className="text-muted-foreground">Visualizações</span>
            <p className="font-medium">{product.views || 0}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Status e ID */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Status</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">ID do Produto</span>
            <p className="text-sm font-mono">{product.id}</p>
          </div>
          {product.shopify_product_id && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">ID no Shopify</span>
              <p className="text-sm font-mono">{product.shopify_product_id}</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Datas */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Datas</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Criado em</span>
            <p className="text-sm">
              {format(new Date(product.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Atualizado em</span>
            <p className="text-sm">
              {format(new Date(product.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Avaliações */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Avaliações</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg 
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(product.average_rating || 0) 
                    ? "text-yellow-400 fill-yellow-400" 
                    : "text-gray-300 fill-gray-300"
                }`}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-medium">{product.average_rating ? product.average_rating.toFixed(1) : '0.0'}</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">{product.reviews_count} avaliações</span>
        </div>
      </div>
    </div>
  );
}
