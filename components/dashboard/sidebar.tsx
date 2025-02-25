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
  Store,
  ShoppingBag,
  LayoutDashboard,
  Users,
  LifeBuoy,
  Loader2,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { StoreCounter } from '@/components/stores/store-counter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

interface Store {
  id: string;
  name: string;
  products: number;
  status: 'active' | 'syncing' | 'error';
  href: string;
}

const initialStores: Store[] = [
  { id: '1', name: 'Fashion Store', products: 156, status: 'active', href: '/dashboard/stores/1' },
  { id: '2', name: 'Electronics Hub', products: 89, status: 'syncing', href: '/dashboard/stores/2' },
  { id: '3', name: 'Home Decor', products: 234, status: 'active', href: '/dashboard/stores/3' },
  { id: '4', name: 'Sports Gear', products: 45, status: 'error', href: '/dashboard/stores/4' },
];

interface SidebarProps {
  currentStoreId?: string;
  isCollapsed: boolean;
}

export function Sidebar({ currentStoreId, isCollapsed }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>(initialStores);
  
  // Manter o contador de lojas atual
  const storesCount = stores.length;
  const maxStores = 5;
  const canAddStore = storesCount < maxStores;

  // Carregar o estado inicial com base na rota atual
  useEffect(() => {
    setActiveRoute(pathname);
  }, [pathname]);

  const navigateToStore = (storeId: string) => {
    router.push(`/dashboard/stores/${storeId}`);
  };

  const navigateToNewStore = () => {
    router.push('/dashboard/stores');
  };
  
  // Simular um atraso ao adicionar uma nova loja
  const handleAddStore = () => {
    if (storesCount >= maxStores) return;
    
    setIsLoading(true);
    setTimeout(() => {
      const newStore = {
        id: `${stores.length + 1}`,
        name: `Nova Loja ${stores.length + 1}`,
        href: `/dashboard/stores/${stores.length + 1}`,
        products: 0,
        status: 'active' as const
      };
      setStores([...stores, newStore]);
      setIsLoading(false);
    }, 1000);
  };
  
  // Navegar para a página da loja quando clicar
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
              {!isCollapsed && (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 px-2 py-0.5">
                  {storesCount}/{maxStores}
                </Badge>
              )}
            </div>
            
            {/* Lista de Lojas */}
            <ScrollArea className={cn('h-[220px]', isCollapsed && 'h-auto')}>
              <div className="space-y-1 pr-2">
                {stores.map((store) => (
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
                ))}
                
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
              <Users className={cn(
                'h-4 w-4', 
                isCollapsed ? 'mx-0' : 'mr-2',
                activeRoute.includes('/dashboard/profile') ? 'text-blue-600' : 'text-gray-500'
              )} />
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
        </div>
      </div>
      
      {/* Contador de Lojas no Rodapé */}
      <div className={cn(
        "py-3 px-3 border-t bg-blue-50/50",
        isCollapsed ? "px-1" : "px-3"
      )}>
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Badge variant={storesCount >= maxStores ? "destructive" : "outline"} 
                    className="w-8 h-8 rounded-full flex items-center justify-center p-0 bg-white text-blue-600 border-blue-300 shadow-sm hover:bg-blue-50 transition-colors">
                    {storesCount}/{maxStores}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="w-64">
                <StoreCounter storesCount={storesCount} maxStores={maxStores} variant="visual" />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <StoreCounter storesCount={storesCount} maxStores={maxStores} variant="visual" />
        )}
      </div>
    </aside>
  );
}
