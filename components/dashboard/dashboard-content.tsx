"use client"

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { OverviewStats } from './overview-stats';
import { PerformanceCharts } from './performance-charts';
import { RecentActivities } from './recent-activities';
import { getUserStores } from '@/lib/store-service';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { StoreSkeleton } from './store-skeleton';

// Interface para o tipo Store
interface Store {
  id: string;
  name: string;
  productsCount?: number;
  products_count?: number;
  platform: string;
  url?: string;
  stats: {
    totalProducts: number;
    totalReviews: number;
    conversionRate: number;
    lastSync: string;
  };
}

export function DashboardContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  // Carregar as lojas do usuário ao montar o componente
  useEffect(() => {
    const fetchStores = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { success, stores: userStores, error } = await getUserStores(user.id);
        
        if (success && userStores) {
          // Transformar os dados da API no formato necessário para o componente
          const formattedStores = userStores.map(store => ({
            id: store.id,
            name: store.name,
            productsCount: store.products_count || 0,
            platform: store.platform || 'Outro',
            url: store.url || undefined,
            stats: {
              totalProducts: store.products_count || 0,
              totalReviews: 0, // Substituir por valor real quando disponível
              conversionRate: 0, // Substituir por valor real quando disponível
              lastSync: typeof store.last_sync === 'string' ? store.last_sync : new Date().toISOString()
            },
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
    };
    
    fetchStores();
  }, [user]);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Gerencie suas lojas e acompanhe o desempenho
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/stores')}
          className="h-9 px-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Loja
        </Button>
      </div>

      {/* Overview Stats */}
      <OverviewStats />

      {/* Performance Charts */}
      <PerformanceCharts />

      {/* Stores Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Suas Lojas</h3>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/stores')}
            className="h-8 border-border/60"
          >
            Ver todas
          </Button>
        </div>
        {isLoading ? (
          // Skeleton loader enquanto carrega
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <StoreSkeleton key={i} />
            ))}
          </div>
        ) : stores.length > 0 ? (
          // Grid de lojas
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stores.map((store) => (
              <motion.div
                key={store.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.push(`/dashboard/stores/${store.id}`)}
                className="cursor-pointer"
              >
                <div className="rounded-lg border border-border/40 hover:border-border/60 bg-card text-card-foreground p-6 transition-all">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">{store.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{store.platform}</span>
                        <span>•</span>
                        <span>{store.productsCount || 0} produtos</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/20"
                        style={{ 
                          width: `${Math.min(((store.stats.conversionRate || 0) / 5) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Mensagem quando não há lojas
          <div className="rounded-lg border border-border/40 bg-card text-card-foreground p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Nenhuma loja encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não possui nenhuma loja cadastrada.
            </p>
            <Button
              onClick={() => router.push('/dashboard/stores')}
              className="mx-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar minha primeira loja
            </Button>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Atividades Recentes</h3>
        <RecentActivities />
      </div>
    </div>
  );
}
