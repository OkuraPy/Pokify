'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Star, TrendingUp, ClipboardCheck } from 'lucide-react';

interface StoreStatsProps {
  stats: {
    totalProducts: number;
    totalReviews: number;
    averageRating?: number;
    readyProducts?: number;
    pendingProducts?: number;
    lastSync?: string;
  };
}

export function StoreStats({ stats }: StoreStatsProps) {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };
  
  const calculateReadyPercentage = () => {
    if (!stats.totalProducts || stats.totalProducts === 0) return 0;
    return Math.round(((stats.readyProducts || 0) / stats.totalProducts) * 100);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalProducts || 0)}</div>
          <p className="text-xs text-muted-foreground">
            Produtos cadastrados na loja
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalReviews || 0)}</div>
          <p className="text-xs text-muted-foreground">
            Avaliações importadas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageRating?.toFixed(1) || 'N/A'}</div>
          <p className="text-xs text-muted-foreground">
            Média de avaliações dos produtos
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Produtos Prontos</CardTitle>
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{calculateReadyPercentage()}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.readyProducts || 0} de {stats.totalProducts || 0} produtos prontos
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-muted">
            <div 
              className="h-2 rounded-full bg-primary" 
              style={{ width: `${calculateReadyPercentage()}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
