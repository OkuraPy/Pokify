'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DebugPage() {
  const [userId, setUserId] = useState<string>('');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [storeDetails, setStoreDetails] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: 'Clique em "Testar Conexão" para verificar a conexão com o Supabase'
  });
  
  const router = useRouter();

  // Verificar usuário atual ao carregar
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
        toast.success(`Usuário autenticado: ${user.email}`);
        loadAllStores();
      } else {
        toast.error("Nenhum usuário autenticado");
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      toast.error("Erro ao verificar usuário");
    } finally {
      setLoading(false);
    }
  };

  async function loadAllStores() {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/stores');
      const data = await response.json();
      
      if (data.success && data.stores) {
        setStores(data.stores);
        toast.success(`Lojas carregadas: ${data.stores.length}`);
      } else {
        toast.error(data.error || "Nenhuma loja encontrada");
      }
    } catch (error) {
      console.error("Erro ao carregar lojas:", error);
      toast.error("Falha ao carregar lojas");
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    try {
      setConnectionTest({
        status: 'loading',
        message: 'Testando conexão com o Supabase...'
      });
      
      const response = await fetch('/api/debug/stores');
      await response.json(); // Apenas para verificar se há erros de parsing
      
      setConnectionTest({
        status: 'success',
        message: 'Conexão com o Supabase estabelecida com sucesso!'
      });
    } catch (error) {
      setConnectionTest({
        status: 'error',
        message: `Erro de conexão: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  async function fetchStore(storeId?: string) {
    try {
      setLoading(true);
      
      if (!storeId && !selectedStore) {
        toast.error("Nenhuma loja selecionada");
        return;
      }
      
      const id = storeId || selectedStore;
      const response = await fetch(`/api/debug/store?id=${id}`);
      const data = await response.json();
      
      if (data.success && data.store) {
        setStoreDetails(data.store);
        toast.success(`Loja carregada: ${data.store.name}`);
      } else {
        setStoreDetails(null);
        toast.error(data.error || "Loja não encontrada");
      }
    } catch (error) {
      console.error("Erro ao buscar loja:", error);
      toast.error("Falha ao buscar detalhes da loja");
      setStoreDetails(null);
    } finally {
      setLoading(false);
    }
  }

  async function createDemoStore() {
    try {
      setLoading(true);
      
      if (!userId) {
        toast.error("Nenhum usuário autenticado");
        return;
      }
      
      const response = await fetch('/api/debug/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          name: `Loja Demo ${new Date().toLocaleTimeString()}`,
          platform: 'shopify',
          url: `https://demo-${Math.floor(Math.random() * 1000)}.myshopify.com`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Loja criada: ${data.store?.name || 'Nome não disponível'}`);
        loadAllStores();
        
        if (data.store?.id) {
          setSelectedStore(data.store.id);
          fetchStore(data.store.id);
        }
      } else {
        toast.error(data.error || "Erro ao criar loja");
      }
    } catch (error) {
      console.error("Erro ao criar loja:", error);
      toast.error("Falha ao criar loja");
    } finally {
      setLoading(false);
    }
  }

  async function createSimpleStore() {
    try {
      setLoading(true);
      
      if (!userId) {
        toast.error("Nenhum usuário autenticado");
        return;
      }
      
      // Usar a API de debug para criação simplificada
      const response = await fetch('/api/debug/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          name: `Loja Simples ${new Date().toLocaleTimeString()}`,
          platform: 'aliexpress',
          url: `https://aliexpress-${Math.floor(Math.random() * 1000)}.com`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Loja criada com ID: ${data.store?.id || data.storeId || 'ID não disponível'}`);
        loadAllStores();
        
        if (data.store?.id || data.storeId) {
          const newId = data.store?.id || data.storeId;
          setSelectedStore(newId);
          if (newId !== 'unknown') {
            fetchStore(newId);
          }
        }
      } else {
        toast.error(data.error || "Erro ao criar loja");
      }
    } catch (error) {
      console.error("Erro ao criar loja:", error);
      toast.error("Falha ao criar loja simples");
    } finally {
      setLoading(false);
    }
  }

  const selectStore = (id: string) => {
    setSelectedStore(id);
    fetchStore(id);
  };
  
  const navigateToStore = (id: string) => {
    router.push(`/dashboard/stores/${id}`);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Debug & Diagnóstico</h1>
        <Link href="/dashboard">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Usuário Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">ID do Usuário:</p>
              <p className="font-mono bg-muted p-2 rounded text-sm break-all">{userId || 'Nenhum usuário autenticado'}</p>
            </div>
            
            <Button 
              onClick={checkCurrentUser} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Verificando...' : 'Verificar Usuário'}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Teste de Conexão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-3 mb-4 rounded ${
              connectionTest.status === 'success' ? 'bg-green-100 text-green-800' :
              connectionTest.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              <p>{connectionTest.message}</p>
            </div>
            
            <Button 
              onClick={testConnection} 
              disabled={connectionTest.status === 'loading'}
              className="w-full"
              variant={connectionTest.status === 'success' ? 'default' : 'outline'}
            >
              {connectionTest.status === 'loading' ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Suas Lojas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button 
                onClick={loadAllStores} 
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? 'Carregando...' : 'Recarregar Lojas'}
              </Button>
              
              <Button 
                onClick={createSimpleStore} 
                disabled={loading || !userId}
                variant="default"
                className="flex-1"
              >
                Criar Loja Simples
              </Button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              {stores.length > 0 ? (
                <div className="divide-y">
                  {stores.map((store) => (
                    <div 
                      key={store.id} 
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${selectedStore === store.id ? 'bg-muted' : ''}`}
                      onClick={() => selectStore(store.id)}
                    >
                      <div className="font-medium">{store.name}</div>
                      <div className="text-xs text-muted-foreground flex justify-between mt-1">
                        <span>{store.platform}</span>
                        <span>{new Date(store.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  Nenhuma loja encontrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes da Loja</CardTitle>
          </CardHeader>
          <CardContent>
            {storeDetails ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{storeDetails.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: <span className="font-mono">{storeDetails.id}</span></p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plataforma</p>
                    <p className="font-medium">{storeDetails.platform}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">URL</p>
                    <p className="font-medium">{storeDetails.url || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produtos</p>
                    <p className="font-medium">{storeDetails.products_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última Sincronização</p>
                    <p className="font-medium">{storeDetails.last_sync ? new Date(storeDetails.last_sync).toLocaleString() : 'Nunca'}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold mb-2">JSON da Loja</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[200px]">
                    {JSON.stringify(storeDetails, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                Selecione uma loja para ver os detalhes
              </div>
            )}
          </CardContent>
          {storeDetails && (
            <CardFooter className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => fetchStore()}
                disabled={loading}
              >
                Atualizar
              </Button>
              <Button 
                onClick={() => navigateToStore(storeDetails.id)}
                disabled={loading}
              >
                Abrir Loja
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
} 