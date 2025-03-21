'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ShoppingCart, AlertCircle, BarChart3 } from 'lucide-react';
import { ProductGrid } from './product-grid';
import { StoreHeader } from './store-header';
import { StoreStats } from './store-stats';
import { ProductForm } from './product-form';
import { getStore, getProducts, getReviews } from '@/lib/supabase';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
  user_id: string;
  platform: string;
  url?: string;
  api_key?: string;
  products_count: number;
  orders_count: number;
  last_sync?: string;
  created_at: string;
}

interface StoreStats {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  productsSold: number;
}

interface StoreClientProps {
  storeId: string;
}

export function StoreClient({ storeId }: StoreClientProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    async function loadStoreData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Carregar dados da loja
        const { data: storeData, error: storeError } = await getStore(storeId);
        
        if (storeError || !storeData) {
          console.error('Erro ao carregar loja:', storeError);
          setError('Não foi possível carregar os dados da loja');
          return;
        }
        
        setStore(storeData as any);
        
        // Carregar produtos da loja
        const { data: productsData, error: productsError } = await getProducts(storeId);
        
        if (productsError) {
          console.error('Erro ao carregar produtos:', productsError);
          toast.error('Erro ao carregar produtos');
          // Continuar mesmo com erro nos produtos
        } else {
          setProducts(productsData || []);
        }
        
        // Calcular o total de avaliações somando reviews_count de todos os produtos
        let totalReviews = 0;
        let totalRating = 0;
        let readyProducts = 0;
        let pendingProducts = 0;
        
        if (productsData) {
          // Calcular avaliações totais
          totalReviews = productsData.reduce((total, product) => total + (product.reviews_count || 0), 0);
          setTotalReviews(totalReviews);
          
          // Calcular média das avaliações
          const productsWithRating = productsData.filter(product => product.average_rating && product.average_rating > 0);
          if (productsWithRating.length > 0) {
            totalRating = productsWithRating.reduce((sum, product) => sum + (product.average_rating || 0), 0);
            totalRating = totalRating / productsWithRating.length;
          }
          
          // Contar produtos por status
          readyProducts = productsData.filter(product => 
            product.status === 'ready' || product.status === 'published'
          ).length;
          
          pendingProducts = productsData.filter(product => 
            product.status === 'imported' || product.status === 'editing'
          ).length;
        }
        
        // Configurar as estatísticas
        setStats({
          totalProducts: productsData?.length || 0,
          totalReviews,
          averageRating: totalRating,
          readyProducts,
          pendingProducts,
          lastSync: store?.last_sync
        });
      } catch (err) {
        console.error('Erro ao carregar dados da loja:', err);
        setError('Ocorreu um erro ao carregar os dados da loja');
        toast.error('Erro ao carregar dados da loja');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStoreData();
  }, [storeId]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando dados da loja...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Erro ao carregar loja</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {error || 'Não foi possível encontrar a loja solicitada'}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
          >
            Voltar para Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 bg-background">
      <StoreHeader 
        store={{
          ...store!,
          stats: {
            totalProducts: store?.products_count || 0,
            totalReviews: totalReviews,
            conversionRate: stats?.averageOrderValue || 0,
            lastSync: store?.last_sync || new Date().toISOString()
          }
        }}
        onAddProduct={() => setIsFormOpen(true)}
        totalReviews={totalReviews}
      />

      <StoreStats stats={stats || {
        totalProducts: 0,
        totalReviews: 0,
        averageRating: 0,
        readyProducts: 0,
        pendingProducts: 0
      }} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>
                {products.length} produtos na sua loja
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <ProductGrid storeId={store.id} products={products} />
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
