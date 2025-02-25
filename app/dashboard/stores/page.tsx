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
import { Plus, Store as StoreIcon, AlertTriangle, AlertCircle } from 'lucide-react';
import { StoreForm } from './store-form';
import { StoreList } from './store-list';
import { StoreCounter } from '@/components/stores/store-counter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Definir interface que corresponde à expectativa do componente StoreList
interface Store {
  id: string;
  name: string;
  platform: string;
  url: string;
  products: number;
  orders: number;
  revenue: number;
}

export default function StoresPage() {
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([
    {
      id: '1',
      name: 'Loja Pokémon',
      platform: 'Shopify',
      url: 'https://lojakpokemon.com.br',
      products: 124,
      orders: 56,
      revenue: 4500,
    },
    {
      id: '2',
      name: 'Loja Digimon',
      platform: 'WooCommerce',
      url: 'https://lojadigimon.com.br',
      products: 87,
      orders: 32,
      revenue: 2800,
    },
  ]);

  const storeCount = stores.length;
  const maxStores = 5;
  const canAddStore = storeCount < maxStores;
  const storePercentage = (storeCount / maxStores) * 100;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Suas Lojas</h2>
          <p className="text-muted-foreground">
            Gerencie suas lojas e conecte-as à plataforma Pokify
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-auto">
            <StoreCounter storesCount={storeCount} maxStores={maxStores} variant="visual" />
          </div>
          <Button
            onClick={() => setIsCreateStoreOpen(true)}
            disabled={!canAddStore}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Loja
          </Button>
        </div>
      </div>

      {storePercentage >= 100 ? (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertTitle className="text-rose-700 font-medium">Limite de lojas atingido</AlertTitle>
          <AlertDescription className="text-rose-600">
            Você atingiu o limite de {maxStores} lojas do seu plano atual. Para adicionar 
            mais lojas, considere fazer upgrade do seu plano.
          </AlertDescription>
        </Alert>
      ) : storePercentage >= 80 ? (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700 font-medium">Quase no limite de lojas</AlertTitle>
          <AlertDescription className="text-amber-600">
            Você está chegando ao limite de lojas permitidas. Ainda pode adicionar 
            {maxStores - storeCount === 1 
              ? ' mais 1 loja.' 
              : ` mais ${maxStores - storeCount} lojas.`}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <CardTitle>Suas Lojas</CardTitle>
              <CardDescription className="mt-1">
                Visualize e gerencie todas as suas lojas conectadas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StoreList stores={stores} />
        </CardContent>
      </Card>

      <StoreForm 
        open={isCreateStoreOpen} 
        onClose={() => setIsCreateStoreOpen(false)} 
        storesCount={storeCount}
      />
    </div>
  );
}
