'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { getUserProfile, getUserStores, getProducts } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { ExternalLink, Edit, Store, Clock, ShoppingBag, ChevronRight, Loader2, CheckCircle, User, Mail, Calendar, Award, Shield } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<Record<string, number>>({});
  
  // Estados para dados da assinatura
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        setIsLoading(true);
        
        // Carregar dados do perfil do usuário
        const { data: userData, error: userError } = await getUserProfile();
        
        if (userError || !userData) {
          console.error('Erro ao carregar perfil:', userError);
          return;
        }
        
        setUser(userData);
        
        // Carregar lojas do usuário - Garantindo que apenas as lojas do usuário atual sejam carregadas
        const { data: storesData, error: storesError } = await getUserStores();
        
        if (storesError) {
          console.error('Erro ao carregar lojas:', storesError);
          return;
        }
        
        // Verificação adicional de segurança: garantir que todas as lojas pertencem ao usuário atual
        const userStores = storesData?.filter(store => store.user_id === userData.id) || [];
        setStores(userStores);
        
        // Carregar contagem de produtos para cada loja
        const productsCount: Record<string, number> = {};
        
        // Só carrega produtos para as lojas que pertencem ao usuário atual
        await Promise.all((userStores).map(async (store) => {
          const { data: products } = await getProducts(store.id);
          productsCount[store.id] = products?.length || 0;
        }));
        
        setStoreProducts(productsCount);
        
        // Agora que temos o ID do usuário, carregamos os dados da assinatura
        await loadSubscriptionData(userData.id);
      } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Função para carregar dados da assinatura da edge function
    async function loadSubscriptionData(userId: string) {
      try {
        setSubscriptionLoading(true);
        
        if (!userId) {
          setSubscriptionError('Usuário não autenticado');
          return;
        }
        
        console.log('Buscando assinatura para o usuário:', userId);
        
        // Chamar a edge function do Supabase
        const response = await fetch('https://mntescpjefghckkklslo.supabase.co/functions/v1/consulta-plano', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udGVzY3BqZWZnaGNra2tsc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NjE2MjgsImV4cCI6MjA1NjAzNzYyOH0.eXsEOWg5y5c0n3WetqjpRhiLeCVmVJT0CwJWvw9_glA',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar assinatura: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dados da assinatura:', data);
        
        if (data.success && data.subscription) {
          setSubscription(data.subscription);
        }
      } catch (err) {
        console.error('Erro:', err);
        setSubscriptionError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setSubscriptionLoading(false);
      }
    }
    
    loadProfileData();
  }, []);

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Carregando seu perfil...</p>
      </div>
    );
  }

  // Determinar limites de lojas
  const storesLimit = user?.stores_limit || 5;
  const storesCount = stores.length;
  const storesPercentage = (storesCount / storesLimit) * 100;
  
  // Calcular data desde que é membro
  const createdAt = new Date(user?.created_at);
  
  // Formatar data para exibição
  const memberSince = format(createdAt, 'dd/MM/yyyy', { locale: ptBR });

  // Calcular há quanto tempo o usuário é membro
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Definir a cor do gradiente com base no plano
  const getPlanGradient = () => {
    if (!subscription) return "from-gray-300 to-gray-500";
    
    if (subscription.plan.is_lifetime) {
      return "from-amber-300 to-amber-600";
    }
    
    if (subscription.plan.monthly_price >= 100) {
      return "from-purple-500 to-indigo-600";
    }
    
    return "from-blue-500 to-cyan-600";
  };

  return (
    <div className="container py-10 animate-fadeIn">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg p-8 mb-8 text-white shadow-lg relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black opacity-10 z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-20 w-20 rounded-full bg-white text-indigo-700 flex items-center justify-center text-2xl font-semibold shadow-md border-4 border-white">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold">{user?.full_name || 'Olá!'}</h1>
              <p className="text-blue-100 flex items-center">
                <Mail className="h-4 w-4 mr-1" /> {user?.email}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/dashboard/profile/edit')} className="bg-white hover:bg-blue-50 text-indigo-700">
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </div>
      </motion.div>
      
      <Tabs defaultValue="profile" className="mb-8">
        <TabsList className="w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="profile" className="flex-1">Perfil</TabsTrigger>
          <TabsTrigger value="subscription" className="flex-1">Assinatura</TabsTrigger>
          <TabsTrigger value="stores" className="flex-1">Lojas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 pb-2">
                <CardTitle className="flex items-center text-xl text-gray-800">
                  <User className="h-5 w-5 mr-2 text-indigo-600" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>
                  Seus dados cadastrais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Nome Completo</h3>
                    <p className="text-base font-medium">{user?.full_name || 'Nome não definido'}</p>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">E-mail</h3>
                    <p className="text-base font-medium">{user?.email}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Membro desde</h3>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-indigo-600 mr-2" />
                      <div>
                        <p className="text-base font-medium">{memberSince}</p>
                        <p className="text-xs text-slate-500">{diffDays} dias conosco</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Lojas</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{storesCount} de {storesLimit} lojas</span>
                        <span className="text-sm font-medium">{Math.round(storesPercentage)}%</span>
                      </div>
                      <Progress value={storesPercentage} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="subscription">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-6"
          >
            <Card className="shadow-md overflow-hidden">
              {subscriptionLoading ? (
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              ) : subscriptionError ? (
                <CardContent className="p-6">
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <h3 className="text-red-800 font-medium mb-2">Erro</h3>
                    <p className="text-red-600">{subscriptionError}</p>
                  </div>
                </CardContent>
              ) : !subscription ? (
                <div>
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">Sem Assinatura Ativa</h3>
                    <p>Você não possui uma assinatura no momento.</p>
                  </div>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-6">Assine agora para desbloquear todos os recursos premium!</p>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/dashboard/billing')}>
                      Ver Planos Disponíveis
                    </Button>
                  </CardContent>
                </div>
              ) : (
                <div>
                  <div className={`bg-gradient-to-r ${getPlanGradient()} p-6 text-white`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs uppercase tracking-wider mb-1 text-white/80">Sua Assinatura</p>
                        <h3 className="text-xl font-bold mb-1">{subscription.plan.name}</h3>
                        {subscription.plan.is_lifetime ? (
                          <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-300">Vitalício</Badge>
                        ) : (
                          <Badge className="bg-white/20 hover:bg-white/30">Recorrente</Badge>
                        )}
                      </div>
                      <Badge className={
                        subscription.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                        subscription.status === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
                        'bg-red-100 text-red-800 hover:bg-red-200'
                      }>
                        {subscription.status === 'active' ? 'Ativo' : 
                         subscription.status === 'pending' ? 'Pendente' : 'Cancelado'}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {subscription.plan.monthly_price > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Valor</p>
                          <p className="text-lg font-bold">{formatCurrency(subscription.plan.monthly_price)}</p>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Assinado em</p>
                        <p className="font-medium">{formatDate(subscription.created_at)}</p>
                      </div>
                      
                      {subscription.expires_at && !subscription.plan.is_lifetime && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Validade</p>
                          <p className="font-medium">{formatDate(subscription.expires_at)}</p>
                        </div>
                      )}
                    </div>
                    
                    {subscription.plan.features && subscription.plan.features.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <p className="text-sm font-medium mb-3">Recursos Incluídos:</p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {subscription.plan.features.map((feature: string, index: number) => (
                            <li key={index} className="flex items-center bg-slate-50 p-2 rounded-md">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </div>
              )}
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="stores">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Minhas Lojas</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas lojas e produtos ({storesCount}/{storesLimit})
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard/stores')} className="bg-indigo-600 hover:bg-indigo-700">
                <Store className="h-4 w-4 mr-2" />
                Nova Loja
              </Button>
            </div>
            
            <Card className="shadow-md">
              <CardContent className="p-0">
                {stores.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Store className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhuma Loja Cadastrada</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">Cadastre sua primeira loja para começar a vender seus produtos e aumentar seu faturamento</p>
                    <Button onClick={() => router.push('/dashboard/stores')} variant="outline">
                      Cadastrar Minha Primeira Loja
                    </Button>
                  </div>
                ) : (
                  <div>
                    {stores.map((store, index) => (
                      <motion.div 
                        key={store.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/stores/${store.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
                            <Store className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">{store.name}</h3>
                            <p className="text-sm text-muted-foreground">{store.url}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-100 py-1 px-3 rounded-full">
                            <p className="font-medium text-sm">{storeProducts[store.id] || 0} produtos</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 