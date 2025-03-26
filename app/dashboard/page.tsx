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
    averageRating: 0,
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
        
        if (!storesData || storesData.length === 0) {
          setStores([]);
          setAggregatedStats({
            totalStores: 0,
            totalProducts: 0,
            totalReviews: 0,
            averageRating: 0,
            conversionRate: 0,
            trendsProducts: [],
            trendsReviews: []
          });
          setIsLoading(false);
          return;
        }
        
        // Log para depuração
        console.log("Dados das lojas recebidos:", storesData);
        
        // Atualizar o número real de produtos em cada loja
        const updatedStores = await Promise.all(storesData.map(async (store) => {
          try {
            // Buscar produtos reais de cada loja
            const { data: storeProducts, error: productsError } = await getProducts(store.id);
            
            if (productsError) {
              console.error(`Erro ao buscar produtos da loja ${store.id}:`, productsError);
              return {
                ...store,
                products_count: 0,
                reviews_count: 0
              };
            }
            
            // Log para depuração de produtos
            console.log(`Produtos da loja ${store.name}:`, storeProducts);
            
            // Garantir que storeProducts seja um array válido
            const validProducts = Array.isArray(storeProducts) ? storeProducts : [];
            const productCount = validProducts.length;
            
            // Calcular o total de reviews para esta loja
            let storeReviewsCount = 0;
            if (validProducts.length > 0) {
              storeReviewsCount = validProducts.reduce((sum, product) => sum + (product.reviews_count || 0), 0);
            }
            
            // Atualizar o valor de products_count com o número real de produtos
            // e adicionar o reviews_count para cada loja
            return {
              ...store,
              products_count: productCount,
              reviews_count: storeReviewsCount
            };
          } catch (error) {
            console.error(`Erro ao buscar produtos da loja ${store.id}:`, error);
            return {
              ...store,
              products_count: 0,
              reviews_count: 0
            }; // definir valores padrão em caso de erro
          }
        }));
        
        // Log para depuração das lojas atualizadas
        console.log("Lojas atualizadas com contagem de produtos:", updatedStores);
        
        setStores(updatedStores || []);
        
        // Calcular estatísticas agregadas
        if (updatedStores && updatedStores.length > 0) {
          // Totais iniciais
          let totalProducts = 0;
          let totalReviews = 0;
          let totalRatingsSum = 0;
          let productsWithRatings = 0;
          
          // Recuperar estatísticas de cada loja
          for (const store of updatedStores) {
            // Somar produtos de cada loja
            const storeProductCount = store.products_count || 0;
            totalProducts += storeProductCount;
            
            // Somar reviews de cada loja
            const storeReviewCount = store.reviews_count || 0;
            totalReviews += storeReviewCount;
            
            try {
              // Buscar produtos apenas para calcular ratings médios se necessário
              const { data: storeProducts } = await getProducts(store.id);
              if (storeProducts && storeProducts.length > 0) {
                // Calcular a soma dos ratings para média geral
                storeProducts.forEach(product => {
                  if (product.average_rating && product.average_rating > 0) {
                    totalRatingsSum += product.average_rating;
                    productsWithRatings++;
                  }
                });
              }
            } catch (productsError) {
              console.error(`Erro ao buscar produtos para ratings da loja ${store.id}:`, productsError);
            }
          }
          
          // Log para depuração dos totais
          console.log("Estatísticas calculadas:", { 
            totalStores: updatedStores.length,
            totalProducts,
            totalReviews,
            avgRating: productsWithRatings > 0 ? (totalRatingsSum / productsWithRatings) : 0
          });
          
          // Calcular média geral de avaliações
          const averageRating = productsWithRatings > 0 ? (totalRatingsSum / productsWithRatings) : 0;
          
          // Buscar dados reais para os gráficos
          const productsData = await fetchProductsChartData(period);
          const reviewsData = await fetchReviewsChartData(period);
          
          setAggregatedStats({
            totalStores: updatedStores.length,
            totalProducts,
            totalReviews,
            averageRating,
            conversionRate: 0, // Removido cálculo que dependia de totalViews e totalSales
            trendsProducts: productsData.length > 0 ? productsData : [],
            trendsReviews: reviewsData.length > 0 ? reviewsData : []
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-muted-foreground text-base">
          Acompanhe as estatísticas de suas lojas conectadas
        </p>
      </div>
      
      {/* Seletor de período */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-800">
            {format(new Date(), "PPPP", { locale: ptBR })}
          </h2>
        </div>
        
        <Select defaultValue={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] bg-white border-gray-200 shadow-sm">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Últimos 7 dias</SelectItem>
            <SelectItem value="month">Últimos 30 dias</SelectItem>
            <SelectItem value="quarter">Último trimestre</SelectItem>
            <SelectItem value="year">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Lojas Card */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Lojas</CardTitle>
              <div className="rounded-full bg-blue-100 p-1.5 flex items-center justify-center">
                <Store className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-14 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                aggregatedStats.totalStores
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lojas conectadas à plataforma
            </p>
          </CardContent>
        </Card>
        
        {/* Produtos Card */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Produtos</CardTitle>
              <div className="rounded-full bg-indigo-100 p-1.5 flex items-center justify-center">
                <Package className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-14 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                aggregatedStats.totalProducts
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de produtos cadastrados
            </p>
          </CardContent>
        </Card>
        
        {/* Avaliações Card */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Avaliações</CardTitle>
              <div className="rounded-full bg-amber-100 p-1.5 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-14 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                aggregatedStats.totalReviews
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de avaliações recebidas
            </p>
          </CardContent>
        </Card>
        
        {/* Média de Avaliações Card */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">Média de Avaliações</CardTitle>
              <div className="rounded-full bg-green-100 p-1.5 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-14 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  aggregatedStats.averageRating.toFixed(1)
                )}
              </div>
              {!isLoading && (
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className={`h-4 w-4 ${star <= Math.round(aggregatedStats.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média de todas as avaliações
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart: Produtos */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-md font-semibold text-gray-700">Produtos Adicionados</CardTitle>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-gray-200">
                <Download className="h-3.5 w-3.5" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            {isLoading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={aggregatedStats.trendsProducts.length > 0 ? aggregatedStats.trendsProducts : productChartData}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} produtos`, 'Quantidade']}
                      labelFormatter={(label) => `Dia ${label}`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #f0f0f0',
                        borderRadius: '6px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#4f46e5" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Chart: Avaliações */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-md font-semibold text-gray-700">Avaliações Recebidas</CardTitle>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-gray-200">
                <Download className="h-3.5 w-3.5" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            {isLoading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={aggregatedStats.trendsReviews.length > 0 ? aggregatedStats.trendsReviews : reviewChartData}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} avaliações`, 'Quantidade']}
                      labelFormatter={(label) => `Dia ${label}`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #f0f0f0',
                        borderRadius: '6px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#eab308" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 5, fill: '#eab308', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Stores */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Suas Lojas</h2>
          <Button 
            onClick={() => router.push('/dashboard/stores')} 
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ver Todas Lojas
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <div key={index} className="border rounded-lg p-6 h-[170px] flex flex-col justify-between animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded"></div>
                  <div className="h-3 w-5/6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="border border-dashed rounded-lg p-8 text-center bg-gray-50">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Store className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma loja encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              Você ainda não possui lojas conectadas à plataforma Pokify.
            </p>
            <Button 
              onClick={() => router.push('/dashboard/stores')} 
              variant="outline"
              className="mx-auto border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Loja
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stores.slice(0, 3).map(store => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}