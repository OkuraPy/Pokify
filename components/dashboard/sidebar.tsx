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
  LogOut,
  Store,
  Home,
  Package,
  Settings,
  ShoppingCart,
  CreditCard,
  Layers,
  UserRound
} from 'lucide-react';
import { StoreCounter } from '@/components/stores/store-counter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { IconShopify, IconAliExpress } from '@/components/icons';

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
  const [storesCount, setStoresCount] = useState(0);
  const [maxStores, setMaxStores] = useState(3);
  
  // Importar hook de autenticação
  const { user, logout } = useAuth();
  
  // Manter o contador de lojas atual
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
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const { data: stores, error } = await supabase
          .from('stores')
          .select('id, name, products_count, last_sync')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erro ao buscar lojas:', error);
          toast.error('Não foi possível carregar as lojas');
          return;
        }
        
        const formattedStores = stores?.map((store) => ({
          id: store.id,
          name: store.name,
          products: store.products_count || 0,
          status: store.last_sync ? 'active' : 'syncing' as 'active' | 'syncing' | 'error',
          href: `/dashboard/stores/${store.id}`
        })) || [];
        
        setStores(formattedStores);
        setStoresCount(formattedStores.length);
      } catch (error) {
        console.error('Erro ao buscar lojas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      fetchStores();
    }
  }, [user]);

  const navigateToStore = (storeId: string) => {
    router.push(`/dashboard/stores/${storeId}`);
  };

  const navigateToNewStore = () => {
    router.push('/dashboard/stores');
  };
  
  const handleStoreClick = (href: string) => {
    console.log('Clique na loja com href:', href);
    router.push(href);
  };
  
  // Estilo padrão para botões ativos
  const activeButtonStyles = 'text-blue-600 font-medium bg-blue-50 hover:bg-blue-100';
  // Estilo padrão para botões inativos
  const inactiveButtonStyles = 'text-gray-600 hover:text-blue-600 hover:bg-gray-50';
  
  // Obter a cor da barra de progresso baseada na porcentagem
  const getProgressColor = () => {
    const ratio = storesCount / maxStores;
    if (ratio < 0.5) return 'bg-emerald-500';
    if (ratio < 0.8) return 'bg-amber-500';
    return 'bg-red-500';
  }
  
  // Links da barra lateral
  const sidebarLinks = [
    { icon: <Home size={18} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Package size={18} />, label: 'Produtos', href: '/dashboard/products' },
    { icon: <ShoppingCart size={18} />, label: 'Pedidos', href: '/dashboard/orders' },
    { icon: <CreditCard size={18} />, label: 'Financeiro', href: '/dashboard/billing' },
    { icon: <Settings size={18} />, label: 'Configurações', href: '/dashboard/settings' },
  ];

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
              {!isCollapsed && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 px-2 py-0.5">
                  {storesCount}/{maxStores}
                </Badge>
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
                    <Link 
                      href={store.href} 
                      key={store.id} 
                      prefetch={true}
                    >
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
                        onClick={() => {
                          console.log('Navegando para loja demo:', store.id);
                          handleStoreClick(store.href);
                        }}
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
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className={cn(
                            'w-full justify-start mt-2 text-muted-foreground',
                            isCollapsed && 'justify-center px-0'
                          )}
                        >
                          <AlertCircle className={cn('h-4 w-4', isCollapsed ? 'mx-0' : 'mr-2')} />
                          {!isCollapsed && <span>Limite atingido</span>}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Você atingiu o limite de lojas</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      
      {/* Perfil e Suporte no Rodapé */}
      <div className="mt-auto px-3 py-3 border-t border-gray-100">
        <div className="space-y-1 mb-1">
          <Link href="/dashboard/profile">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-start rounded-md transition-all duration-150',
                isCollapsed && 'justify-center px-0',
                activeRoute.includes('/dashboard/profile') 
                  ? activeButtonStyles
                  : inactiveButtonStyles
              )}
              onClick={() => setActiveRoute('/dashboard/profile')}
            >
              <UserRound size={isCollapsed ? 20 : 16} className={isCollapsed ? "mx-auto" : ""} />
              {!isCollapsed && <span>Meu Perfil</span>}
            </Button>
          </Link>
          <Link href="/dashboard/help">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-start rounded-md transition-all duration-150',
                isCollapsed && 'justify-center px-0',
                activeRoute === '/dashboard/help' 
                  ? activeButtonStyles
                  : inactiveButtonStyles
              )}
              onClick={() => setActiveRoute('/dashboard/help')}
            >
              <LifeBuoy className={cn(
                'h-4 w-4', 
                isCollapsed ? 'mx-0' : 'mr-2',
                activeRoute === '/dashboard/help' ? 'text-blue-600' : 'text-gray-500'
              )} />
              {!isCollapsed && <span>Suporte</span>}
            </Button>
          </Link>
          
          {/* Botão de Logout */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start rounded-md transition-all duration-150 text-red-600 hover:bg-red-50 hover:text-red-700 mt-1',
              isCollapsed && 'justify-center px-0'
            )}
            onClick={() => logout()}
          >
            <LogOut className={cn(
              'h-4 w-4', 
              isCollapsed ? 'mx-0' : 'mr-2',
              'text-red-600'
            )} />
            {!isCollapsed && <span>Sair do Sistema</span>}
          </Button>
        </div>
      </div>
      
      {/* Contador de Lojas no Rodapé - VERSÃO MELHORADA */}
      <div className={cn(
        "py-3 px-4 border-t bg-gradient-to-br from-blue-50 to-blue-100",
        isCollapsed ? "px-2" : "px-4"
      )}>
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Badge 
                    variant={storesCount >= maxStores ? "destructive" : "outline"} 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center p-0 bg-white shadow-sm hover:bg-blue-50 transition-colors",
                      storesCount >= maxStores ? "border-red-300 text-red-600" : "border-blue-300 text-blue-600"
                    )}
                  >
                    {storesCount}/{maxStores}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="w-64">
                <div className="space-y-2 p-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Limite de Lojas</span>
                    <span className="text-sm">{storesCount}/{maxStores}</span>
                  </div>
                  
                  <Progress 
                    value={storePercentage} 
                    className="h-2"
                    indicatorClassName={getProgressColor()}
                  />
                  
                  <div className="text-xs text-muted-foreground">
                    {storesCount >= maxStores ? (
                      <p className="text-red-500 font-medium">Você atingiu o limite de lojas</p>
                    ) : (
                      <p>Você ainda pode criar mais {remaining} {remaining === 1 ? 'loja' : 'lojas'}</p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <StoreIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Suas Lojas</span>
              </div>
              <span className="text-sm font-medium">{storesCount}/{maxStores}</span>
            </div>
            
            <Progress 
              value={storePercentage} 
              className="h-1.5"
              indicatorClassName={getProgressColor()}
            />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {storesCount === 0 ? 'Nenhuma loja' : (
                  storesCount === 1 ? '1 loja criada' : `${storesCount} lojas criadas`
                )}
              </span>
              <span>
                {remaining > 0 ? (
                  remaining === 1 ? '1 disponível' : `${remaining} disponíveis`
                ) : (
                  <span className="text-red-500 font-medium">Limite atingido</span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
