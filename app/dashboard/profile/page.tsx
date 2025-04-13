'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserProfile, getUserStores, getProducts } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { ExternalLink, Edit, Store, Clock, ShoppingBag, ChevronRight, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<Record<string, number>>({});

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
        
        // Carregar lojas do usuário
        const { data: storesData, error: storesError } = await getUserStores();
        
        if (storesError) {
          console.error('Erro ao carregar lojas:', storesError);
          return;
        }
        
        setStores(storesData || []);
        
        // Carregar contagem de produtos para cada loja
        const productsCount: Record<string, number> = {};
        
        await Promise.all((storesData || []).map(async (store) => {
          const { data: products } = await getProducts(store.id);
          productsCount[store.id] = products?.length || 0;
        }));
        
        setStoreProducts(productsCount);
      } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProfileData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determinar limites de lojas
  const storesLimit = user?.stores_limit || 5;
  const storesCount = stores.length;
  
  // Calcular data desde que é membro
  const createdAt = new Date(user?.created_at);
  
  // Formatar data para exibição
  const memberSince = format(createdAt, 'dd/MM/yyyy', { locale: ptBR });

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/profile/edit')}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Perfil
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Informações Pessoais */}
        <div>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Informações Pessoais</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie suas informações pessoais
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-2xl font-semibold">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">Nome</h3>
                  <p className="text-base">{user?.full_name || 'Nome não definido'}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium">E-mail</h3>
                <p className="text-base">{user?.email}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Membro desde</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{memberSince}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Total de Lojas</h3>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{storesCount} de {storesLimit} lojas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Seção de Lojas */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Minhas Lojas</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie suas lojas e produtos ({storesCount}/{storesLimit})
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/stores')}>
            Adicionar Nova Loja
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {stores.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Você ainda não tem lojas cadastradas</p>
              </div>
            ) : (
              <div className="divide-y">
                {stores.map((store) => (
                  <div 
                    key={store.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/stores/${store.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">{store.url}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{storeProducts[store.id] || 0}</p>
                        <p className="text-sm text-muted-foreground">Produtos</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 