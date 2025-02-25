'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { StoreHeader } from './store-header';
import { StoreStats } from './store-stats';
import { ProductGrid } from './product-grid';
import { ProductForm } from './product-form';

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

interface StoreClientProps {
  store: Store;
}

export function StoreClient({ store }: StoreClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6 p-6 bg-background">
      <StoreHeader 
        store={store}
        onAddProduct={() => setIsFormOpen(true)}
      />

      <StoreStats stats={store.stats} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>
                Gerencie os produtos da sua loja
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ProductGrid storeId={store.id} />
        </CardContent>
      </Card>

      <ProductForm 
        storeId={store.id}
        open={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
      />
    </div>
  );
}
