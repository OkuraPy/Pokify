'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Package, Star, TrendingUp, ShoppingCart } from 'lucide-react';

interface StoreStatsProps {
  stats: {
    totalProducts: number;
    totalReviews: number;
    conversionRate: number;
    lastSync: string;
  };
}

export function StoreStats({ stats }: StoreStatsProps) {
  const items = [
    {
      title: 'Total de Produtos',
      value: stats.totalProducts,
      description: 'produtos cadastrados',
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total de Reviews',
      value: stats.totalReviews,
      description: 'avaliações recebidas',
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Taxa de Conversão',
      value: stats.conversionRate,
      description: 'das visitas convertidas',
      suffix: '%',
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      title: 'Vendas Diárias',
      value: Math.round(stats.totalProducts * (stats.conversionRate / 100)),
      description: 'vendas hoje',
      icon: ShoppingCart,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card 
          key={item.title} 
          className="overflow-hidden border-border/40 hover:border-border/60 transition-colors"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold tracking-tight">
                    {item.value}
                    {item.suffix}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </div>
            <div className="mt-6 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
              <div 
                className={`h-full ${item.bg} ${item.color}`}
                style={{ 
                  width: item.suffix === '%' 
                    ? `${item.value}%` 
                    : `${(item.value / Math.max(stats.totalProducts, stats.totalReviews)) * 100}%` 
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
