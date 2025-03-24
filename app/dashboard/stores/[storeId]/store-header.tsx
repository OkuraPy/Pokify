'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, RefreshCw, Globe, ShoppingBag, Package, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

interface Store {
  id: string;
  name: string;
  platform: string;
  url: string;
  stats?: {
    totalProducts: number;
    totalReviews: number;
    conversionRate: number;
    lastSync: string;
  };
  last_sync?: string;
  products_count: number;
}

interface StoreHeaderProps {
  store: Store;
  onAddProduct: () => void;
  totalReviews?: number;
}

export function StoreHeader({ store, onAddProduct, totalReviews = 0 }: StoreHeaderProps) {
  return (
    <Card>
      <CardHeader className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              {store.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                <a 
                  href={store.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {store.url}
                </a>
              </span>
              <span className="text-primary font-medium">{store.platform}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon"
              className="h-9 w-9 border-border/60"
              title="Sincronizar loja"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              onClick={onAddProduct}
              className="h-9 px-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{store.products_count || store.stats?.totalProducts || 0}</span> produtos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{totalReviews || store.stats?.totalReviews || 0}</span> avaliações
              </span>
            </div>
          </div>
          
          <Separator className="my-1" />
          
          <p className="text-sm text-muted-foreground">
            {store.last_sync ? (
              `Última sincronização: ${format(new Date(store.last_sync), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}`
            ) : (
              'Nenhuma sincronização realizada'
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
