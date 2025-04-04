'use client';

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { getUserStores } from '@/lib/store-service';
import { toast } from 'sonner';
import { useAuth } from './use-auth';

interface Store {
  id: string;
  name: string;
  products: number;
  status: 'active' | 'syncing' | 'error';
  href: string;
}

interface StoresContextType {
  stores: Store[];
  isLoading: boolean;
  storesCount: number;
  maxStores: number;
  canAddStore: boolean;
  refreshStores: () => Promise<void>;
}

const StoresContext = createContext<StoresContextType | undefined>(undefined);

export function StoresProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Configurações de limites
  const maxStores = 5;
  const storesCount = stores.length;
  const canAddStore = storesCount < maxStores;

  // Função para buscar as lojas do usuário
  const refreshStores = useCallback(async () => {
    if (!user) {
      setStores([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const { success, stores: userStores, error } = await getUserStores(user.id);
      
      if (success && userStores) {
        // Transformar os dados da API no formato necessário para o componente
        const formattedStores = userStores.map(store => ({
          id: store.id,
          name: store.name,
          products: store.products_count || 0,
          status: 'active' as const,
          href: `/dashboard/stores/${store.id}`
        }));
        
        setStores(formattedStores);
      } else if (error) {
        console.error("Erro ao carregar lojas:", error);
        toast.error("Não foi possível carregar suas lojas");
      }
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      toast.error("Erro ao carregar lojas");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Carregar as lojas quando o usuário mudar
  useEffect(() => {
    refreshStores();
  }, [refreshStores]);

  return (
    <StoresContext.Provider
      value={{
        stores,
        isLoading,
        storesCount,
        maxStores,
        canAddStore,
        refreshStores
      }}
    >
      {children}
    </StoresContext.Provider>
  );
}

export function useStores() {
  const context = useContext(StoresContext);
  
  if (context === undefined) {
    throw new Error('useStores deve ser usado dentro de um StoresProvider');
  }
  
  return context;
}
