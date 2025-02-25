'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';

interface ProductInfoProps {
  product: {
    title: string;
    description: string;
    price: number;
    stock: number;
    active: boolean;
    views: number;
    sales: number;
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
          <Badge variant="outline" className="font-mono">
            SKU: {Math.random().toString(36).substring(7).toUpperCase()}
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
            <p className="font-medium">{product.sales} unidades</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="space-y-1">
            <span className="text-muted-foreground">Visualizações</span>
            <p className="font-medium">{product.views}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Descrição */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Descrição do Produto</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {product.description}
        </p>
      </div>

      <Separator />

      {/* Status */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Status do Produto</span>
        <div className="flex items-center gap-2">
          <Badge variant={product.active ? 'default' : 'secondary'}>
            {product.active ? 'Ativo' : 'Inativo'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {product.active
              ? 'Produto visível na loja'
              : 'Produto oculto da loja'}
          </span>
        </div>
      </div>
    </div>
  );
}
