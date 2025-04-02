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
  Lock,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { StoreCounter } from '@/components/stores/store-counter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getUserStores } from '@/lib/store-service';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [isTrendHunterDialogOpen, setIsTrendHunterDialogOpen] = useState(false);
  
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
    <>
      <aside
        className={cn(
          'h-screen sticky top-0 bg-white border-r shadow-sm flex flex-col',
          isCollapsed ? 'w-[70px]' : 'w-[240px]',
          'transition-all duration-300 ease-in-out'
        )}
      >
        {/* Header da barra lateral - com gradiente sutil */}
        <div className="px-4 py-5 flex items-center justify-between border-b bg-gradient-to-r from-white to-blue-50/30">
          <div className={cn("flex items-center", isCollapsed && "justify-center")}>
            <div className="flex items-center justify-center bg-blue-600 rounded-lg h-9 w-9 shadow-sm">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="ml-2.5 text-lg font-semibold text-blue-600">Pokify</span>
            )}
          </div>
        </div>

        {/* Conteúdo principal com melhor espaçamento e visuais */}
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="px-3 py-5">
            {/* Dashboard com estilo melhorado */}
            <div className="mb-5 space-y-1.5">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start rounded-xl transition-all duration-200 h-10',
                    isCollapsed && 'justify-center p-0',
                    activeRoute === '/dashboard'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-medium border border-blue-200 shadow-sm hover:shadow'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/50'
                  )}
                  onClick={() => setActiveRoute('/dashboard')}
                >
                  <div className={cn(
                    'flex items-center justify-center h-7 w-7 rounded-lg',
                    activeRoute === '/dashboard' 
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 bg-gray-100'
                  )}>
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  {!isCollapsed && <span className="ml-2.5 font-medium">Dashboard</span>}
                </Button>
              </Link>
              
              {/* TrendHunter IA Button com estilo refinado */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start rounded-xl transition-all duration-200 h-10',
                  isCollapsed && 'justify-center p-0',
                  'hover:bg-purple-50/50 hover:text-purple-700'
                )}
                onClick={() => setIsTrendHunterDialogOpen(true)}
              >
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-100 text-purple-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.5 14.5L3 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.5 9.5L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 7L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.5 9.5L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 7L13 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.25 12.25L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.5 14.5C9.5 14.5 7.5 13.5 6.75 12.75C6 12 5 10 5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 10C5 10 7 8 9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 6C9 6 10.7107 6.36396 12.25 7.75C13.7893 9.13604 14 11 14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 11C14 11 13.2457 12.1233 12.25 12.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {!isCollapsed && (
                  <>
                    <span className="ml-2.5 font-medium text-purple-700">TrendHunter IA</span>
                    <div className="absolute right-2 flex items-center">
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                  </>
                )}
                {isCollapsed && (
                  <div className="absolute -right-1 -top-1">
                    <Badge className="h-2 w-2 p-0 bg-amber-400 rounded-full border-0" />
                  </div>
                )}
              </Button>
            </div>
            
            {/* Separador estilizado */}
            <div className="my-5 flex items-center">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            </div>
            
            {/* Lojas com design moderno */}
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 pb-3">
                {!isCollapsed && (
                  <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                    Suas Lojas
                  </h4>
                )}
              </div>
              
              {/* Lista de Lojas com refinamento visual */}
              <ScrollArea className={cn('h-[220px] pr-2', isCollapsed && 'h-auto')}>
                <div className="space-y-1.5 pr-1">
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
                            'w-full justify-start rounded-xl transition-all duration-200 h-10 group',
                            isCollapsed && 'justify-center p-0',
                            activeRoute === store.href 
                              ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200 shadow-xs'
                              : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/50'
                          )}
                          onClick={() => handleStoreClick(store.href)}
                        >
                          <div className={cn(
                            "h-2 w-2 rounded-full mr-2.5 transition-all duration-200",
                            activeRoute === store.href ? "bg-blue-500" : "bg-gray-300 group-hover:bg-blue-400"
                          )} />
                          {!isCollapsed ? (
                            <span className="truncate">{store.name}</span>
                          ) : (
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              activeRoute === store.href ? "bg-blue-500" : "bg-gray-300 group-hover:bg-blue-400"
                            )} />
                          )}
                        </Button>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      {!isCollapsed && (
                        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                          <div className="bg-white h-8 w-8 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                            <ShoppingBag className="h-4 w-4 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500">Nenhuma loja encontrada</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Botão de Nova Loja aprimorado */}
                  {storesCount < maxStores ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isLoading}
                            className={cn(
                              'w-full justify-start mt-3 rounded-xl h-10 transition-all duration-200 bg-blue-50/50 border border-blue-100 hover:bg-blue-100/60 text-blue-700',
                              isCollapsed && 'justify-center p-0'
                            )}
                            onClick={navigateToNewStore}
                          >
                            {isLoading ? (
                              <Loader2 className={cn('h-4 w-4 animate-spin', isCollapsed ? 'mx-0' : 'mr-2.5')} />
                            ) : (
                              <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
                                <PlusCircle className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                            {!isCollapsed && <span className="ml-2.5 font-medium">Nova Loja</span>}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-blue-700 text-white border-blue-800">
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

        {/* Menu de Perfil e Suporte com design refinado */}
        {!isCollapsed && (
          <div className="border-t border-gray-100 mt-auto">
            <div className="p-3 space-y-1.5">
              <Link href="/dashboard/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start rounded-xl transition-all duration-200 h-10 hover:bg-blue-50/50',
                    activeRoute.includes('/dashboard/profile') 
                      ? 'text-blue-700 bg-blue-50 font-medium border border-blue-100'
                      : 'text-gray-600 hover:text-blue-700'
                  )}
                  onClick={() => setActiveRoute('/dashboard/profile')}
                >
                  <div className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center',
                    activeRoute.includes('/dashboard/profile') 
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  )}>
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="ml-2.5">Meu Perfil</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/help">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start rounded-xl transition-all duration-200 h-10 hover:bg-blue-50/50',
                    activeRoute === '/dashboard/help' 
                      ? 'text-blue-700 bg-blue-50 font-medium border border-blue-100'
                      : 'text-gray-600 hover:text-blue-700'
                  )}
                  onClick={() => setActiveRoute('/dashboard/help')}
                >
                  <div className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center',
                    activeRoute === '/dashboard/help' 
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  )}>
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                  <span className="ml-2.5">Suporte</span>
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start rounded-xl h-10 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 mt-2"
                onClick={() => logout()}
              >
                <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <LogOut className="h-4 w-4 text-red-500" />
                </div>
                <span className="ml-2.5">Sair</span>
              </Button>
            </div>
          </div>
        )}

        {/* Barra de Progresso de Lojas moderna */}
        {!isCollapsed ? (
          <div className="border-t bg-gradient-to-br from-white to-gray-50 p-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <StoreIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Limite de Lojas</span>
                </div>
                <Badge 
                  variant={storePercentage >= 100 ? "destructive" : "secondary"}
                  className={cn(
                    "px-2.5 py-0.5 text-xs font-medium rounded-full shadow-sm",
                    storePercentage >= 100 ? "bg-red-100 text-red-700 hover:bg-red-100" : 
                    storePercentage >= 75 ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                    "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  )}
                >
                  {storesCount}/{maxStores}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="h-2.5 relative rounded-full overflow-hidden bg-gray-100 shadow-inner">
                  <div 
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                      storePercentage >= 100 
                        ? "bg-gradient-to-r from-red-500 to-red-400" 
                        : storePercentage >= 75
                        ? "bg-gradient-to-r from-amber-500 to-amber-400"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    )}
                    style={{ width: `${storePercentage}%` }}
                  />
                </div>
                
                <p className={cn(
                  "text-xs flex items-center",
                  storePercentage >= 100 ? "text-red-600" :
                  storePercentage >= 75 ? "text-amber-600" :
                  "text-emerald-600"
                )}>
                  {remaining > 0 
                    ? <>
                        <PlusCircle className="h-3 w-3 mr-1.5 inline" />
                        Você pode adicionar mais {remaining} {remaining === 1 ? 'loja' : 'lojas'}
                      </> 
                    : <>
                        <AlertCircle className="h-3 w-3 mr-1.5 inline" />
                        Limite máximo atingido
                      </>
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
                        "w-9 h-9 rounded-full flex items-center justify-center p-0 shadow-sm hover:shadow-md transition-all duration-200",
                        storePercentage >= 100 
                          ? "bg-red-100 text-red-700 hover:bg-red-200" 
                          : storePercentage >= 75
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="text-xs font-bold">{storesCount}</span>
                        <span className="text-[9px]">/ {maxStores}</span>
                      </div>
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn(
                  "border-0 text-white shadow-md", 
                  storePercentage >= 100 ? "bg-red-600" : 
                  storePercentage >= 75 ? "bg-amber-600" :
                  "bg-emerald-600"
                )}>
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
      
      {/* Dialog para o TrendHunter IA - Minerador de Produtos */}
      <Dialog open={isTrendHunterDialogOpen} onOpenChange={setIsTrendHunterDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-background to-muted/20 shadow-lg border-muted">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-start space-x-2">
              <div className="bg-purple-500/10 p-2 rounded-full">
                <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 14.5L3 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5 9.5L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 7L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5 9.5L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 7L13 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.25 12.25L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.5 14.5C9.5 14.5 7.5 13.5 6.75 12.75C6 12 5 10 5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 10C5 10 7 8 9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 6C9 6 10.7107 6.36396 12.25 7.75C13.7893 9.13604 14 11 14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11C14 11 13.2457 12.1233 12.25 12.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <DialogTitle className="text-xl">TrendHunter IA</DialogTitle>
            </div>
            <DialogDescription className="text-base opacity-90">
              Descubra produtos campeões de vendas com inteligência artificial avançada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-3">
            {/* Funcionalidades do TrendHunter - versão condensada */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white border border-purple-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-24 bg-gradient-to-r from-purple-100 to-indigo-50 flex items-center justify-center p-4">
                  <div className="relative">
                    <svg className="h-12 w-12 text-purple-500 opacity-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 10C5 10 7 8 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 6C9 6 10.7107 6.36396 12.25 7.75C13.7893 9.13604 14 11 14 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 3L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.5 9.5L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.5 14.5L3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-purple-700 mb-1 flex items-center text-sm">
                    Mineração de Produtos
                    <Badge className="ml-2 bg-purple-100 text-purple-600 border-0 text-xs py-0">Avançado</Badge>
                  </h3>
                  <p className="text-xs text-gray-600">
                    Descubra produtos escaláveis com potencial explosivo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-24 bg-gradient-to-r from-blue-100 to-cyan-50 flex items-center justify-center p-4">
                  <div className="relative">
                    <svg className="h-12 w-12 text-blue-500 opacity-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-blue-700 mb-1 flex items-center text-sm">
                    Análise de Tendências
                    <Badge className="ml-2 bg-blue-100 text-blue-600 border-0 text-xs py-0">Insights</Badge>
                  </h3>
                  <p className="text-xs text-gray-600">
                    Identifique tendências antes que virem mainstream.
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-green-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-24 bg-gradient-to-r from-green-100 to-emerald-50 flex items-center justify-center p-4">
                  <div className="relative">
                    <svg className="h-12 w-12 text-green-500 opacity-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 6.5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 6.5H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 10C11.933 10 13.5 8.433 13.5 6.5C13.5 4.567 11.933 3 10 3C8.067 3 6.5 4.567 6.5 6.5C6.5 8.433 8.067 10 10 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 17.5H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 17.5H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 21C15.933 21 17.5 19.433 17.5 17.5C17.5 15.567 15.933 14 14 14C12.067 14 10.5 15.567 10.5 17.5C10.5 19.433 12.067 21 14 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-green-700 mb-1 flex items-center text-sm">
                    Filtros Inteligentes
                    <Badge className="ml-2 bg-green-100 text-green-600 border-0 text-xs py-0">Customizável</Badge>
                  </h3>
                  <p className="text-xs text-gray-600">
                    Configure filtros avançados para produtos específicos.
                  </p>
                </div>
              </div>
            </div>

            {/* Detalhes do recurso com exemplos - versão otimizada */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-purple-500/10 p-2 rounded-full">
                  <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M17.5 6.5H17.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-purple-800">Como o TrendHunter IA funciona</h3>
                  <p className="mt-1 text-xs text-purple-700">
                    Nossa tecnologia de IA vasculha milhares de produtos na biblioteca de anúncios para identificar itens com alto potencial de vendas.
                  </p>
                  
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-2 border border-purple-100">
                      <div className="flex items-start">
                        <Check className="h-3 w-3 mt-0.5 text-purple-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-medium text-purple-800">Identificação de campeões</h4>
                          <p className="text-[10px] text-purple-700">
                            Produtos com histórico de vendas e engajamento
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-2 border border-purple-100">
                      <div className="flex items-start">
                        <Check className="h-3 w-3 mt-0.5 text-purple-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-medium text-purple-800">Análise de mercado</h4>
                          <p className="text-[10px] text-purple-700">
                            Avaliação de saturação e potencial de crescimento
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 bg-white rounded-lg p-2 border border-purple-100">
                    <h4 className="text-xs font-medium text-purple-800 mb-1">Exemplos descobertos:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded overflow-hidden border border-gray-100 flex items-center text-[10px]">
                        <div className="w-8 h-8 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                          <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none">
                            <rect width="24" height="24" fill="white"/>
                            <path d="M3 9H21M9 21V9M7 3H17L21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9L7 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="p-1">
                          <p className="font-medium truncate">Pulseira magnética</p>
                          <p className="text-green-600">+430% vendas em 30 dias</p>
                        </div>
                      </div>
                      <div className="rounded overflow-hidden border border-gray-100 flex items-center text-[10px]">
                        <div className="w-8 h-8 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                          <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none">
                            <path d="M19 14C19 16.7614 16.7614 19 14 19M19 14C19 11.2386 16.7614 9 14 9M19 14H5M14 19C11.2386 19 9 16.7614 9 14M14 19C14.7956 19 15.5587 18.6839 16.1213 18.1213C16.6839 17.5587 17 16.7956 17 16M14 9C11.2386 9 9 11.2386 9 14M14 9C14.7956 9 15.5587 9.31607 16.1213 9.87868C16.6839 10.4413 17 11.2044 17 12M9 14C9 12.4087 9.63214 10.8826 10.7574 9.75736C11.8826 8.63214 13.4087 8 15 8C16.5913 8 18.1174 8.63214 19.2426 9.75736C20.3679 10.8826 21 12.4087 21 14C21 15.5913 20.3679 17.1174 19.2426 18.2426C18.1174 19.3679 16.5913 20 15 20H5L9 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="p-1">
                          <p className="font-medium truncate">Mini projetor LED</p>
                          <p className="text-green-600">Alta margem de lucro</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 relative">
                    <div className="absolute inset-0 bg-purple-100/50 rounded-md flex items-center justify-center z-10">
                      <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0 px-2 py-0.5 text-xs">
                        Lançamento em Maio
                      </Badge>
                    </div>
                    <div className="h-6 w-full bg-gray-100 rounded-md overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-medium"
                        style={{ width: '80%' }}
                      >
                        80% concluído
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setIsTrendHunterDialogOpen(false)}>
              Fechar
            </Button>
            <Button variant="default" className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsTrendHunterDialogOpen(false)}>
              <span className="mr-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Inscrever-se
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
