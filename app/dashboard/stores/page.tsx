'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Store, Loader2 } from 'lucide-react';
import { StoreList } from '@/components/stores/store-list';
import { StoreForm } from './store-form';
import { getStores, getProducts } from '@/lib/supabase';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
  platform: string;
  url: string;
  products: number;
  reviews: number;
  average_rating: number;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Constantes para limites
  const maxStores = 5;
  const storesCount = stores.length;
  const canAddStore = storesCount < maxStores;
  
  // Buscar lojas do Supabase
  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getStores();
      
      if (error) {
        console.error('Erro ao buscar lojas:', error);
        toast.error('Erro ao carregar suas lojas');
        return;
      }
      
      // Buscar produtos e calcular estatísticas para cada loja
      const storesWithStats = await Promise.all(data?.map(async (store: any) => {
        try {
          // Buscar produtos reais de cada loja
          const { data: storeProducts } = await getProducts(store.id);
          
          // Calcular o número real de produtos
          const productsCount = storeProducts ? storeProducts.length : 0;
          
          // Calcular reviews totais e média de rating
          let reviewsCount = 0;
          let totalRating = 0;
          let productsWithRating = 0;
          
          if (storeProducts && storeProducts.length > 0) {
            // Contar total de reviews
            reviewsCount = storeProducts.reduce((sum, product) => sum + (product.reviews_count || 0), 0);
            
            // Calcular média de ratings
            storeProducts.forEach(product => {
              if (product.average_rating && product.average_rating > 0) {
                totalRating += product.average_rating;
                productsWithRating++;
              }
            });
          }
          
          // Calcular média de avaliações
          const averageRating = productsWithRating > 0
            ? (totalRating / productsWithRating)
            : 0;
          
          return {
            id: store.id,
            name: store.name,
            platform: store.platform,
            url: store.url || '',
            products: productsCount,
            reviews: reviewsCount,
            average_rating: averageRating,
          };
        } catch (error) {
          console.error('Erro ao buscar dados da loja:', error);
          // Retornar dados básicos com valores padrão em caso de erro
          return {
            id: store.id,
            name: store.name,
            platform: store.platform,
            url: store.url || '',
            products: store.products_count || 0,
            reviews: 0,
            average_rating: 0,
          };
        }
      }) || []);
      
      setStores(storesWithStats);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      toast.error('Erro ao carregar suas lojas');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar lojas ao montar o componente
  useEffect(() => {
    fetchStores();
  }, []);
  
  // Atualizar lojas ao fechar o modal de criação
  const handleStoreFormClose = () => {
    setIsCreateStoreOpen(false);
    fetchStores(); // Atualizar a lista após adicionar uma nova loja
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Suas Lojas</h1>
        <p className="text-muted-foreground text-base">
          Gerencie suas lojas conectadas à plataforma Pokify
        </p>
      </div>
      
      {/* Contador de lojas e botão de criação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-sm">
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800">Limite de Lojas</h3>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-1.5 rounded-full">
              <Store className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-blue-800 font-medium">{storesCount} de {maxStores} lojas utilizadas</span>
          </div>
          {!canAddStore ? (
            <p className="text-sm text-rose-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              Você atingiu o limite de lojas disponíveis
            </p>
          ) : (
            <p className="text-sm text-blue-600 font-medium">Você ainda pode adicionar {maxStores - storesCount} {maxStores - storesCount === 1 ? 'loja' : 'lojas'}</p>
          )}
        </div>
        <Button 
          onClick={() => setIsCreateStoreOpen(true)}
          disabled={!canAddStore}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all duration-300 hover:shadow-lg"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Loja
        </Button>
      </div>
      
      {/* Alerta de limite de lojas */}
      {!canAddStore && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800 animate-appear">
          <AlertCircle className="h-5 w-5 text-rose-500" />
          <AlertTitle className="text-rose-700 font-semibold text-base">Limite de lojas atingido</AlertTitle>
          <AlertDescription className="text-rose-600">
            Você atingiu o limite de {maxStores} lojas do seu plano atual. 
            Para adicionar mais lojas, considere fazer upgrade do seu plano.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Lista de lojas */}
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <CardTitle className="text-xl text-gray-800">Gerenciar Lojas</CardTitle>
          <CardDescription className="text-gray-500">
            Visualize e gerencie todas as suas lojas conectadas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
                <div className="absolute inset-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-muted-foreground">Carregando suas lojas...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Nenhuma loja encontrada</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Você ainda não possui lojas cadastradas na plataforma
              </p>
              <Button 
                variant="outline" 
                className="mx-auto border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-all"
                onClick={() => setIsCreateStoreOpen(true)}
                disabled={!canAddStore}
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Loja
              </Button>
            </div>
          ) : (
            <StoreList stores={stores} />
          )}
        </CardContent>
      </Card>
      
      {/* Formulário de criação de loja */}
      <StoreForm 
        open={isCreateStoreOpen} 
        onClose={handleStoreFormClose} 
        storesCount={storesCount}
      />
    </div>
  );
}
