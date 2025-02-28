"use client"

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useRouter, usePathname } from 'next/navigation';
import {
  Store as StoreIcon,
  ShoppingBag,
  LayoutDashboard,
  Users,
  LifeBuoy,
  Loader2,
  PlusCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { StoreCounter } from '@/components/stores/store-counter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getUserStores } from '@/lib/store-service';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface Store {
  id: string;
  name: string;
  products: number;
  status: 'active' | 'syncing' | 'error';
  href: string;
}

interface SidebarProps {
  currentStoreId?: string;
  isCollapsed: boolean;
}

export function Sidebar({ currentStoreId, isCollapsed }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  
  // Importar hook de autenticação
  const { user, logout } = useAuth();
  
  // Manter o contador de lojas atual
  const storesCount = stores.length;
  const maxStores = 5; // Definir como 5 conforme solicitado
  const canAddStore = storesCount < maxStores;
  
  // Calcular o percentual de progresso
  const storePercentage = Math.round((storesCount / maxStores) * 100);
  const remaining = maxStores - storesCount;

  // Carregar o estado inicial com base na rota atual
  useEffect(() => {
    setActiveRoute(pathname);
  }, [pathname]);

  // Carregar as lojas do usuário
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
            products: store.products_count || 0,
            status: 'active' as const, // Poderia ser determinado por alguma lógica
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
    };
    
    fetchStores();
  }, [user]);

  const navigateToStore = (storeId: string) => {
    router.push(`/dashboard/stores/${storeId}`);
  };

  const navigateToNewStore = () => {
    router.push('/dashboard/stores');
  };
  
  const handleStoreClick = (href: string) => {
    setActiveRoute(href);
  };
  
  // Estilo padrão para botões ativos
  const activeButtonStyles = 'text-blue-600 font-medium bg-blue-50 hover:bg-blue-100';
  // Estilo padrão para botões inativos
  const inactiveButtonStyles = 'text-gray-600 hover:text-blue-600 hover:bg-gray-50';
  
  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-white border-r shadow-sm flex flex-col',
        isCollapsed ? 'w-[70px]' : 'w-[240px]',
        'transition-all duration-200'
      )}
    >
      {/* Header da barra lateral */}
      <div className="px-4 py-4 flex items-center justify-between border-b">
        <div className={cn("flex items-center", isCollapsed && "justify-center")}>
          <ShoppingBag className="h-6 w-6 text-blue-600" />
          {!isCollapsed && (
            <span className="ml-2 text-lg font-semibold text-blue-600">Pokify</span>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-auto">
        <div className="px-3 py-4">
          {/* Dashboard */}
          <div className="mb-5">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start rounded-md transition-all duration-150',
                  isCollapsed && 'justify-center px-0',
                  activeRoute === '/dashboard' 
                    ? activeButtonStyles
                    : inactiveButtonStyles
                )}
                onClick={() => setActiveRoute('/dashboard')}
              >
                <LayoutDashboard className={cn(
                  'h-5 w-5', 
                  isCollapsed ? 'mx-0' : 'mr-2',
                  activeRoute === '/dashboard' ? 'text-blue-600' : 'text-gray-500'
                )} />
                {!isCollapsed && <span>Dashboard</span>}
              </Button>
            </Link>
          </div>
          
          <Separator className="my-4 bg-gray-100" />
          
          {/* Lojas */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2">
              {!isCollapsed && (
                <h4 className="text-sm font-semibold text-blue-700">
                  Suas Lojas
                </h4>
              )}
            </div>
            
            {/* Lista de Lojas */}
            <ScrollArea className={cn('h-[220px]', isCollapsed && 'h-auto')}>
              <div className="space-y-1 pr-2">
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  </div>
                ) : stores.length > 0 ? (
                  stores.map((store) => (
                    <Link href={store.href} key={store.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'w-full justify-start rounded-md transition-all duration-150',
                          isCollapsed && 'justify-center px-0',
                          activeRoute === store.href 
                            ? activeButtonStyles
                            : inactiveButtonStyles
                        )}
                        onClick={() => handleStoreClick(store.href)}
                      >
                        <div className={cn(
                          "h-2 w-2 rounded-full mr-2.5",
                          activeRoute === store.href ? "bg-blue-500" : "bg-gray-300"
                        )} />
                        {!isCollapsed ? (
                          <span className="truncate">{store.name}</span>
                        ) : (
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            activeRoute === store.href ? "bg-blue-500" : "bg-gray-300"
                          )} />
                        )}
                      </Button>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">
                    {!isCollapsed && "Nenhuma loja encontrada"}
                  </div>
                )}
                
                {/* Botão de Nova Loja */}
                {storesCount < maxStores ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          className={cn(
                            'w-full justify-start mt-2 text-blue-600 hover:bg-gray-50',
                            isCollapsed && 'justify-center px-0'
                          )}
                          onClick={navigateToNewStore}
                        >
                          {isLoading ? (
                            <Loader2 className={cn('h-4 w-4 animate-spin', isCollapsed ? 'mx-0' : 'mr-2')} />
                          ) : (
                            <PlusCircle className={cn('h-4 w-4', isCollapsed ? 'mx-0' : 'mr-2')} />
                          )}
                          {!isCollapsed && <span>Nova Loja</span>}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Adicionar nova loja</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Menu de Perfil e Suporte */}
      {!isCollapsed && (
        <div className="border-t">
          <div className="p-3 space-y-1">
            <Link href="/dashboard/profile">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start rounded-md transition-all duration-150',
                  activeRoute.includes('/dashboard/profile') 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                )}
                onClick={() => setActiveRoute('/dashboard/profile')}
              >
                <Users className="h-4 w-4 mr-2" />
                <span>Meu Perfil</span>
              </Button>
            </Link>
            
            <Link href="/dashboard/help">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start rounded-md transition-all duration-150',
                  activeRoute === '/dashboard/help' 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                )}
                onClick={() => setActiveRoute('/dashboard/help')}
              >
                <LifeBuoy className="h-4 w-4 mr-2" />
                <span>Suporte</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start rounded-md text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      )}

      {/* Barra de Progresso de Lojas */}
      {!isCollapsed ? (
        <div className="mt-auto border-t bg-gradient-to-br from-gray-50 to-white p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StoreIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Lojas</span>
              </div>
              <Badge 
                variant={storePercentage >= 100 ? "destructive" : "secondary"}
                className={cn(
                  "px-2 py-0.5 text-xs font-medium",
                  storePercentage >= 100 ? "bg-red-100 text-red-700 hover:bg-red-100" : 
                  storePercentage >= 75 ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                  "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                )}
              >
                {storesCount}/{maxStores}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="relative h-2">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full" />
                <div 
                  className={cn(
                    "absolute inset-0 rounded-full transition-all duration-300",
                    storePercentage >= 100 
                      ? "bg-gradient-to-r from-red-500 to-red-600" 
                      : storePercentage >= 75
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  )}
                  style={{ width: `${storePercentage}%` }}
                />
              </div>
              
              <p className={cn(
                "text-xs",
                storePercentage >= 100 ? "text-red-600" :
                storePercentage >= 75 ? "text-amber-600" :
                "text-emerald-600"
              )}>
                {remaining > 0 
                  ? `Você pode adicionar mais ${remaining} ${remaining === 1 ? 'loja' : 'lojas'}`
                  : 'Limite máximo atingido'
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-auto border-t p-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Badge 
                    variant={storePercentage >= 100 ? "destructive" : "secondary"}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center p-0",
                      storePercentage >= 100 
                        ? "bg-red-100 text-red-700" 
                        : storePercentage >= 75
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {storesCount}/{maxStores}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-sm">
                  {remaining > 0 
                    ? `Você pode adicionar mais ${remaining} ${remaining === 1 ? 'loja' : 'lojas'}`
                    : 'Limite máximo atingido'
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </aside>
  );
}
