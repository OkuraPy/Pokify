'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Store, 
  Package, 
  Star, 
  TrendingUp, 
  Calendar, 
  Download, 
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getUserStores, getStoreStats, getProducts, getReviews } from '@/lib/supabase';
import { StoreCard } from '@/components/stores/store-card';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  
  type ChartDataItem = { name: string; value: number };
  
  const [aggregatedStats, setAggregatedStats] = useState({
    totalStores: 0,
    totalProducts: 0,
    totalReviews: 0,
    conversionRate: 0,
    trendsProducts: [] as ChartDataItem[],
    trendsReviews: [] as ChartDataItem[]
  });

  // Dados de exemplo para gráficos
  const productChartData = [
    { name: '1', value: 40 }, { name: '2', value: 45 }, { name: '3', value: 65 },
    { name: '4', value: 25 }, { name: '5', value: 32 }, { name: '6', value: 65 },
    { name: '7', value: 45 }, { name: '8', value: 30 }, { name: '9', value: 35 },
    { name: '10', value: 55 }, { name: '11', value: 30 }, { name: '12', value: 45 },
    { name: '13', value: 52 }, { name: '14', value: 60 }, { name: '15', value: 52 },
    { name: '16', value: 30 }, { name: '17', value: 45 }, { name: '18', value: 25 },
    { name: '19', value: 20 }, { name: '20', value: 30 }, { name: '21', value: 45 },
    { name: '22', value: 60 }, { name: '23', value: 65 }, { name: '24', value: 52 },
    { name: '25', value: 30 }, { name: '26', value: 45 }, { name: '27', value: 30 },
    { name: '28', value: 45 }, { name: '29', value: 62 }, { name: '30', value: 45 },
  ];

  const reviewChartData = [
    { name: '1', value: 15 }, { name: '2', value: 20 }, { name: '3', value: 35 },
    { name: '4', value: 10 }, { name: '5', value: 12 }, { name: '6', value: 18 },
    { name: '7', value: 22 }, { name: '8', value: 15 }, { name: '9', value: 10 },
    { name: '10', value: 20 }, { name: '11', value: 12 }, { name: '12', value: 38 },
    { name: '13', value: 15 }, { name: '14', value: 25 }, { name: '15', value: 18 },
    { name: '16', value: 12 }, { name: '17', value: 20 }, { name: '18', value: 15 },
    { name: '19', value: 10 }, { name: '20', value: 12 }, { name: '21', value: 25 },
    { name: '22', value: 30 }, { name: '23', value: 35 }, { name: '24', value: 28 },
    { name: '25', value: 20 }, { name: '26', value: 15 }, { name: '27', value: 10 },
    { name: '28', value: 25 }, { name: '29', value: 32 }, { name: '30', value: 20 },
  ];

  // Função para buscar e formatar dados de produtos para o gráfico
  async function fetchProductsChartData(period: string) {
    try {
      // Obter todos os produtos de todas as lojas do usuário
      const { data: storesData } = await getUserStores();
      if (!storesData || storesData.length === 0) return [];
      
      // Criar um array de promessas para buscar produtos de cada loja
      const productsPromises = storesData.map(store => getProducts(store.id));
      const productsResults = await Promise.all(productsPromises);
      
      // Juntar todos os produtos em um único array
      const allProducts = productsResults.flatMap(result => result.data || []);
      
      // Definir o intervalo de datas com base no período selecionado
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30); // Padrão: último mês
      }
      
      // Filtrar produtos pelo período selecionado
      const filteredProducts = allProducts.filter(product => {
        const createdAt = new Date(product.created_at);
        return createdAt >= startDate && createdAt <= endDate;
      });
      
      // Agrupar produtos por dia
      const productsByDay: { [key: string]: number } = {};
      
      // Inicializar todos os dias no período com zero produtos
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayKey = currentDate.getDate().toString();
        productsByDay[dayKey] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Contar produtos por dia
      filteredProducts.forEach(product => {
        const createdAt = new Date(product.created_at);
        const dayKey = createdAt.getDate().toString();
        productsByDay[dayKey] = (productsByDay[dayKey] || 0) + 1;
      });
      
      // Converter para o formato esperado pelo gráfico
      return Object.entries(productsByDay).map(([name, value]) => ({ name, value }));
    } catch (error) {
      console.error('Erro ao buscar dados de produtos para o gráfico:', error);
      return [];
    }
  }

  // Função para buscar e formatar dados de reviews para o gráfico
  async function fetchReviewsChartData(period: string) {
    try {
      // Obter todos os produtos de todas as lojas do usuário
      const { data: storesData } = await getUserStores();
      if (!storesData || storesData.length === 0) return [];
      
      // Criar um array de promessas para buscar produtos de cada loja
      const productsPromises = storesData.map(store => getProducts(store.id));
      const productsResults = await Promise.all(productsPromises);
      
      // Juntar todos os produtos em um único array
      const allProducts = productsResults.flatMap(result => result.data || []);
      
      // Criar um array de promessas para buscar reviews de cada produto
      const reviewsPromises = allProducts.map(product => getReviews(product.id));
      const reviewsResults = await Promise.all(reviewsPromises);
      
      // Juntar todas as reviews em um único array
      const allReviews = reviewsResults.flatMap(result => result.data || []);
      
      // Definir o intervalo de datas com base no período selecionado
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30); // Padrão: último mês
      }
      
      // Filtrar reviews pelo período selecionado
      const filteredReviews = allReviews.filter(review => {
        const createdAt = new Date(review.created_at);
        return createdAt >= startDate && createdAt <= endDate;
      });
      
      // Agrupar reviews por dia
      const reviewsByDay: { [key: string]: number } = {};
      
      // Inicializar todos os dias no período com zero reviews
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayKey = currentDate.getDate().toString();
        reviewsByDay[dayKey] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Contar reviews por dia
      filteredReviews.forEach(review => {
        const createdAt = new Date(review.created_at);
        const dayKey = createdAt.getDate().toString();
        reviewsByDay[dayKey] = (reviewsByDay[dayKey] || 0) + 1;
      });
      
      // Converter para o formato esperado pelo gráfico
      return Object.entries(reviewsByDay).map(([name, value]) => ({ name, value }));
    } catch (error) {
      console.error('Erro ao buscar dados de reviews para o gráfico:', error);
      return [];
    }
  }

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        
        // Carregar lojas do usuário
        const { data: storesData, error } = await getUserStores();
        
        if (error) {
          toast.error('Erro ao carregar lojas');
          console.error('Erro ao carregar lojas:', error);
          return;
        }
        
        // Atualizar o número real de produtos em cada loja
        const updatedStores = await Promise.all(storesData.map(async (store) => {
          try {
            // Buscar produtos reais de cada loja
            const { data: storeProducts } = await getProducts(store.id);
            // Atualizar o valor de products_count com o número real de produtos
            return {
              ...store,
              products_count: storeProducts ? storeProducts.length : 0
            };
          } catch (error) {
            console.error(`Erro ao buscar produtos da loja ${store.id}:`, error);
            return store; // manter os dados originais em caso de erro
          }
        }));
        
        setStores(updatedStores || []);
        
        // Calcular estatísticas agregadas
        if (updatedStores && updatedStores.length > 0) {
          // Totais iniciais
          let totalProducts = 0;
          let totalReviews = 0;
          let totalSales = 0;
          let totalViews = 0;
          
          // Recuperar estatísticas de cada loja
          for (const store of updatedStores) {
            // Adicionar o número de produtos diretamente da loja 
            // (não buscar produtos individuais para evitar duplicações)
            totalProducts += store.products_count || 0;
            
            try {
              // Buscar produtos apenas para contar reviews se necessário
              const { data: storeProducts } = await getProducts(store.id);
              if (storeProducts) {
                totalReviews += storeProducts.reduce((sum, product) => sum + (product.reviews_count || 0), 0);
              }
              
              // Opcionalmente, fazer chamada para obter estatísticas detalhadas da loja
              try {
                const storeStats = await getStoreStats(store.id);
                if (storeStats) {
                  totalSales += storeStats.totalSales || 0;
                  totalViews += storeStats.totalViews || 0;
                }
              } catch (storeError) {
                console.error(`Erro ao obter estatísticas da loja ${store.id}:`, storeError);
              }
            } catch (productsError) {
              console.error(`Erro ao buscar produtos da loja ${store.id}:`, productsError);
            }
          }
          
          // Calcular taxa de conversão
          const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;
          
          // Buscar dados reais para os gráficos
          const productChartData = await fetchProductsChartData(period);
          const reviewChartData = await fetchReviewsChartData(period);
          
          setAggregatedStats({
            totalStores: updatedStores.length,
            totalProducts,
            totalReviews,
            conversionRate,
            trendsProducts: productChartData.length > 0 ? productChartData : [],
            trendsReviews: reviewChartData.length > 0 ? reviewChartData : []
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDashboardData();
  }, [period]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie suas lojas e acompanhe o desempenho
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/stores')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Loja
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando estatísticas...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Lojas</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{aggregatedStats.totalStores}</div>
                <div className="flex items-center mt-1">
                  <div className={`text-xs ${aggregatedStats.totalStores > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="inline-block mr-1">8%</span>
                    <span>vs. último mês</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full mt-3">
                  <div className="h-2 bg-primary rounded-full" style={{ width: '75%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{aggregatedStats.totalProducts}</div>
                <div className="flex items-center mt-1">
                  <div className="text-xs text-green-500">
                    <span className="inline-block mr-1">12%</span>
                    <span>vs. último mês</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full mt-3">
                  <div className="h-2 bg-primary rounded-full" style={{ width: '60%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Reviews</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {aggregatedStats.totalReviews > 1000 
                    ? `${(aggregatedStats.totalReviews / 1000).toFixed(1)}k` 
                    : aggregatedStats.totalReviews}
                </div>
                <div className="flex items-center mt-1">
                  <div className="text-xs text-green-500">
                    <span className="inline-block mr-1">5%</span>
                    <span>vs. último mês</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full mt-3">
                  <div className="h-2 bg-primary rounded-full" style={{ width: '45%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{aggregatedStats.conversionRate.toFixed(1)}%</div>
                <div className="flex items-center mt-1">
                  <div className="text-xs text-red-500">
                    <span className="inline-block mr-1">-1%</span>
                    <span>vs. último mês</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full mt-3">
                  <div className="h-2 bg-primary rounded-full" style={{ width: '32%' }}></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center mt-8">
            <span className="text-sm text-muted-foreground">
              Dados atualizados em {format(new Date(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </span>
            
            <div className="flex items-center gap-4">
              <Select defaultValue="month" onValueChange={(value) => {
                setPeriod(value);
                setIsLoading(true); // Mostrar loading enquanto atualiza
              }}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Escolher data
              </Button>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos Adicionados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80 w-full p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aggregatedStats.trendsProducts}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reviews Coletados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-80 w-full p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aggregatedStats.trendsReviews}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="all" className="mt-8">
            <TabsList>
              <TabsTrigger value="all">Todas as Lojas</TabsTrigger>
              <TabsTrigger value="shopify">Shopify</TabsTrigger>
              <TabsTrigger value="aliexpress">AliExpress</TabsTrigger>
              <TabsTrigger value="other">Outras</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <StoreCard 
                    key={store.id} 
                    store={store} 
                    onClick={() => router.push(`/dashboard/stores/${store.id}`)} 
                  />
                ))}
                
                <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/stores')}>
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Adicionar Loja</h3>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Conecte uma nova loja para expandir seu negócio
                  </p>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="shopify">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores
                  .filter(store => store.platform === 'shopify')
                  .map((store) => (
                    <StoreCard 
                      key={store.id} 
                      store={store} 
                      onClick={() => router.push(`/dashboard/stores/${store.id}`)} 
                    />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="aliexpress">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores
                  .filter(store => store.platform === 'aliexpress')
                  .map((store) => (
                    <StoreCard 
                      key={store.id} 
                      store={store} 
                      onClick={() => router.push(`/dashboard/stores/${store.id}`)} 
                    />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="other">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores
                  .filter(store => store.platform !== 'shopify' && store.platform !== 'aliexpress')
                  .map((store) => (
                    <StoreCard 
                      key={store.id} 
                      store={store} 
                      onClick={() => router.push(`/dashboard/stores/${store.id}`)} 
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}