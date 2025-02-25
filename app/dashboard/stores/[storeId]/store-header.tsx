'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, RefreshCw, Globe, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Store {
  id: string;
  name: string;
  platform: string;
  url: string;
  stats: {
    totalProducts: number;
    totalReviews: number;
    conversionRate: number;
    lastSync: string;
  };
}

interface StoreHeaderProps {
  store: Store;
  onAddProduct: () => void;
}

export function StoreHeader({ store, onAddProduct }: StoreHeaderProps) {
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
        <p className="text-sm text-muted-foreground">
          Última sincronização: {format(new Date(store.stats.lastSync), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );
}
