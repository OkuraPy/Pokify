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
  Image as ImageIcon,
  ShoppingCart,
  CreditCard
} from 'lucide-react';
import { StoreCounter } from '@/components/stores/store-counter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useStores } from '@/hooks/use-stores';
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
  const [isTrendHunterDialogOpen, setIsTrendHunterDialogOpen] = useState(false);
  
  // Importar hooks
  const { user, logout } = useAuth();
  const { stores, isLoading, storesCount, maxStores, canAddStore } = useStores();
  
  // Calcular o percentual de progresso
  const storePercentage = Math.round((storesCount / maxStores) * 100);
  const remaining = maxStores - storesCount;

  // Carregar o estado inicial com base na rota atual
  useEffect(() => {
    if (pathname) {
      setActiveRoute(pathname);
    }
  }, [pathname]);

  // Verificar se o usuário é gratuito
  const isFreeUser = user?.billing_status === 'free';

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
          'h-screen sticky top-0 border-r shadow-sm flex flex-col',
          isCollapsed ? 'w-[70px]' : 'w-[250px]',
          'transition-all duration-300 ease-in-out bg-gradient-to-b from-white via-white to-gray-50/50'
        )}
      >
        {/* Header da barra lateral - com gradiente premium */}
        <div className="px-4 py-5 flex items-center justify-between border-b bg-gradient-to-r from-white to-blue-50/50">
          <div className={cn("flex items-center", isCollapsed && "justify-center")}>
            <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl h-9 w-9 shadow-md shadow-blue-100/60 hover:shadow-blue-200/80 transition-all duration-300 hover:scale-105">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3H14C18.4183 3 22 6.58172 22 11C22 15.4183 18.4183 19 14 19H6V3Z" fill="currentColor"/>
                <path d="M6 3V19" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            {!isCollapsed && (
              <span className="ml-3 text-lg font-semibold text-slate-800 tracking-tight">Dropfy</span>
            )}
          </div>
        </div>

        {/* Conteúdo principal com design premium */}
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-blue-100 scrollbar-track-transparent">
          <div className="px-3 py-5">
            {/* Menu principal com microtransições */}
            <div className="mb-5 space-y-1.5">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start rounded-xl transition-all duration-200 h-10 border border-transparent',
                    isCollapsed && 'justify-center p-0',
                    activeRoute === '/dashboard'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100/70 text-blue-700 font-medium border-blue-200/70 shadow-sm hover:shadow hover:border-blue-300/50'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 hover:border-blue-100/50'
                  )}
                  onClick={() => setActiveRoute('/dashboard')}
                >
                  <div className={cn(
                    'flex items-center justify-center h-7 w-7 rounded-lg transition-all duration-200',
                    activeRoute === '/dashboard' 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm'
                      : 'text-slate-500 bg-slate-100/80 hover:bg-blue-100/50 group-hover:text-blue-600'
                  )}>
                    <LayoutDashboard className="h-4 w-4 drop-shadow-sm" />
                  </div>
                  {!isCollapsed && <span className="ml-2.5 font-medium">Dashboard</span>}
                </Button>
              </Link>
              
              {/* TrendHunter IA Button com design premium e cadeado reposicionado */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start rounded-xl transition-all duration-200 h-10 border border-transparent group relative',
                  isCollapsed && 'justify-center p-0',
                  'hover:bg-purple-50/50 hover:text-purple-700 hover:border-purple-100/50'
                )}
                onClick={() => setIsTrendHunterDialogOpen(true)}
              >
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 transition-all duration-200 shadow-sm group-hover:bg-gradient-to-br group-hover:from-purple-200 group-hover:to-purple-300/80">
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
                    <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 flex items-center transition-all duration-200 group-hover:scale-110">
                      <div className="bg-blue-50 rounded-full p-0.5">
                        <Lock className="h-3 w-3 text-blue-500" />
                      </div>
                    </div>
                  </>
                )}
                {isCollapsed && (
                  <div className="absolute -right-1 -top-1">
                    <div className="bg-blue-50 rounded-full p-0.5 shadow-sm">
                      <div className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                    </div>
                  </div>
                )}
              </Button>
            </div>
            
            {/* Separador estilizado com elegância premium */}
            <div className="my-6 flex items-center px-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-70"></div>
            </div>
            
            {/* Lojas com design refinado */}
            <div className="mb-5">
              <div className="flex items-center justify-between px-2 pb-3">
                {!isCollapsed && (
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Suas Lojas
                  </h4>
                )}
              </div>
              
              {/* Lista de Lojas com microinterações aprimoradas */}
              <ScrollArea className={cn('h-[230px] pr-2', isCollapsed && 'h-auto')}>
                <div className="space-y-1.5 pr-1">
                  {isLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="relative h-6 w-6">
                        <div className="absolute inset-0 rounded-full border-2 border-blue-100 opacity-20 animate-ping"></div>
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      </div>
                    </div>
                  ) : stores.length > 0 ? (
                    stores.map((store) => (
                      <Link href={store.href} key={store.id}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'w-full justify-start rounded-xl transition-all duration-200 h-10 group border border-transparent',
                            isCollapsed && 'justify-center p-0',
                            activeRoute === store.href 
                              ? 'bg-blue-50/80 text-blue-700 font-medium border-blue-200/60 shadow-sm hover:shadow-md hover:border-blue-300/50'
                              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/40 hover:border-blue-100/40'
                          )}
                          onClick={() => handleStoreClick(store.href)}
                        >
                          <div className={cn(
                            "h-2 w-2 rounded-full mr-2.5 transition-all duration-200",
                            activeRoute === store.href 
                              ? "bg-blue-500 shadow-sm shadow-blue-200" 
                              : "bg-slate-300 group-hover:bg-blue-400"
                          )} />
                          {!isCollapsed ? (
                            <span className="truncate text-sm font-medium">{store.name}</span>
                          ) : (
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              activeRoute === store.href 
                                ? "bg-blue-500 shadow-sm shadow-blue-200" 
                                : "bg-slate-300 group-hover:bg-blue-400"
                            )} />
                          )}
                        </Button>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      {!isCollapsed && (
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 mb-4 transition-all duration-300 hover:shadow-sm">
                          <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <ShoppingBag className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="text-sm text-slate-500 font-medium">Nenhuma loja encontrada</div>
                          <div className="text-xs text-slate-400 mt-1 mb-2">Crie sua primeira loja abaixo</div>
                          
                          {/* Botão movido para dentro do container vazio */}
                          {storesCount < maxStores && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isLoading}
                              className={cn(
                                'w-full justify-center mt-4 rounded-xl h-10 min-h-[40px] transition-all duration-300 border shadow-sm',
                                'bg-gradient-to-r from-blue-50 to-blue-100/50 hover:from-blue-100/80 hover:to-blue-200/50 text-blue-700 border-blue-200/50 hover:shadow-md hover:scale-[1.01]'
                              )}
                              onClick={navigateToNewStore}
                            >
                              {isLoading ? (
                                <div className="relative h-6 w-6">
                                  <div className="absolute inset-0 rounded-full border-2 border-blue-100 opacity-40 animate-ping"></div>
                                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                </div>
                              ) : (
                                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm mr-2">
                                  <PlusCircle className="h-4 w-4 text-white" />
                                </div>
                              )}
                              <span className="font-medium">Nova Loja</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Botão de Nova Loja - APENAS VISÍVEL QUANDO HÁ LOJAS EXISTENTES */}
                  {storesCount < maxStores && stores.length > 0 ? (
                    <div className="mt-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isLoading}
                              className={cn(
                                'w-full justify-start rounded-xl h-10 min-h-[40px] transition-all duration-300 border shadow-sm whitespace-nowrap overflow-visible',
                                isCollapsed && 'justify-center p-0',
                                'bg-gradient-to-r from-blue-50 to-blue-100/50 hover:from-blue-100/80 hover:to-blue-200/50 text-blue-700 border-blue-200/50 hover:shadow-md hover:scale-[1.01]'
                              )}
                              onClick={navigateToNewStore}
                            >
                              {isLoading ? (
                                <div className="relative h-6 w-6">
                                  <div className="absolute inset-0 rounded-full border-2 border-blue-100 opacity-40 animate-ping"></div>
                                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                </div>
                              ) : (
                                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                  <PlusCircle className="h-4 w-4 text-white" />
                                </div>
                              )}
                              {!isCollapsed && <span className="ml-2.5 font-medium">Nova Loja</span>}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-gradient-to-br from-blue-700 to-blue-800 text-white border-none shadow-lg">
                            <div className="px-1 py-1">
                              <span>Adicionar nova loja</span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Menu de Perfil e Suporte com design premium */}
        {!isCollapsed && (
          <div className="border-t border-slate-100 mt-auto">
            <div className="p-3 space-y-1.5">
              <Link href="/dashboard/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start rounded-xl transition-all duration-200 h-10 border border-transparent',
                    activeRoute.includes('/dashboard/profile') 
                      ? 'text-blue-700 bg-blue-50 font-medium border-blue-100/70 shadow-sm'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/40 hover:border-blue-100/40'
                  )}
                  onClick={() => setActiveRoute('/dashboard/profile')}
                >
                  <div className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center shadow-sm',
                    activeRoute.includes('/dashboard/profile') 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100'
                  )}>
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="ml-2.5">Meu Perfil</span>
                </Button>
              </Link>
              
              <Link href="/dashboard/billing">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start rounded-xl transition-all duration-200 h-10 border border-transparent',
                    activeRoute.includes('/dashboard/billing') 
                      ? 'text-blue-700 bg-blue-50 font-medium border-blue-100/70 shadow-sm'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/40 hover:border-blue-100/40'
                  )}
                  onClick={() => setActiveRoute('/dashboard/billing')}
                >
                  <div className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center shadow-sm',
                    activeRoute.includes('/dashboard/billing') 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100'
                  )}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="ml-2.5">Assinatura</span>
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start rounded-xl transition-all duration-200 h-10 border border-transparent',
                  activeRoute === '/dashboard/help' 
                    ? 'text-blue-700 bg-blue-50 font-medium border-blue-100/70 shadow-sm'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 hover:border-blue-100/40'
                )}
                onClick={() => {
                  // Abrir WhatsApp no navegador
                  window.open('https://wa.me/553291262639', '_blank');
                }}
              >
                <div className={cn(
                  'h-7 w-7 rounded-lg flex items-center justify-center shadow-sm',
                  activeRoute === '/dashboard/help' 
                    ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}>
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <span className="ml-2.5">Suporte</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start rounded-xl h-10 border border-transparent text-red-600 hover:bg-red-50/70 hover:text-red-700 hover:border-red-100/40 transition-all duration-200 mt-2"
                onClick={() => logout()}
              >
                <div className="h-7 w-7 rounded-lg bg-red-50 flex items-center justify-center shadow-sm">
                  <LogOut className="h-4 w-4 text-red-500" />
                </div>
                <span className="ml-2.5">Sair</span>
              </Button>
            </div>
          </div>
        )}

        {/* Barra de Progresso de Lojas com design premium */}
        {!isCollapsed ? (
          <div className="border-t bg-gradient-to-br from-white via-slate-50 to-blue-50/10 p-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-sm">
                    <StoreIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">Limite de Lojas</span>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {isFreeUser 
                        ? "Plano necessário" 
                        : `${storesCount} de ${maxStores} utilizadas`}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={isFreeUser ? "outline" : (storePercentage >= 100 ? "destructive" : "secondary")}
                  className={cn(
                    "px-2.5 py-0.5 text-xs font-medium rounded-full shadow-sm",
                    isFreeUser ? "bg-orange-50 text-orange-700 border-orange-200/50" :
                    storePercentage >= 100 ? "bg-gradient-to-br from-red-100 to-red-200 text-red-700 border-red-200/50" : 
                    storePercentage >= 75 ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 border-blue-200/50" :
                    "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 border-emerald-200/50"
                  )}
                >
                  {isFreeUser ? "0/0" : `${storesCount}/${maxStores}`}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="h-2.5 relative rounded-full overflow-hidden bg-slate-100 shadow-inner">
                  <div 
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                      isFreeUser 
                        ? "bg-gradient-to-r from-orange-500 to-orange-400 w-0"
                        : storePercentage >= 100 
                          ? "bg-gradient-to-r from-red-500 to-red-400" 
                          : storePercentage >= 75
                          ? "bg-gradient-to-r from-blue-500 to-blue-400"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    )}
                    style={{ width: isFreeUser ? "0%" : `${storePercentage}%` }}
                  />
                </div>
                
                <div className={cn(
                  "text-xs flex items-center",
                  isFreeUser ? "text-orange-600" :
                  storePercentage >= 100 ? "text-red-600" :
                  storePercentage >= 75 ? "text-blue-600" :
                  "text-emerald-600"
                )}>
                  {isFreeUser 
                    ? <>
                        <div className="h-5 w-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mr-1.5 shadow-sm">
                          <ShoppingCart className="h-3 w-3" />
                        </div>
                        <span>Adquira um plano para criar lojas</span>
                      </>
                    : remaining > 0 
                      ? <>
                          <div className="h-5 w-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mr-1.5 shadow-sm">
                            <PlusCircle className="h-3 w-3" />
                          </div>
                          <span>Você pode adicionar mais {remaining} {remaining === 1 ? 'loja' : 'lojas'}</span>
                        </> 
                      : <>
                          <div className="h-5 w-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mr-1.5 shadow-sm">
                            <AlertCircle className="h-3 w-3" />
                          </div>
                          <span>Limite máximo atingido</span>
                        </>
                  }
                </div>
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
                      variant={isFreeUser ? "outline" : (storePercentage >= 100 ? "destructive" : "secondary")}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center p-0 shadow-sm hover:shadow-md transition-all duration-200",
                        isFreeUser ? "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 hover:from-orange-200 hover:to-orange-300" :
                        storePercentage >= 100 
                          ? "bg-gradient-to-br from-red-100 to-red-200 text-red-600 hover:from-red-200 hover:to-red-300" 
                          : storePercentage >= 75
                          ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 hover:from-blue-200 hover:to-blue-300"
                          : "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 hover:from-emerald-200 hover:to-emerald-300"
                      )}
                    >
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="text-xs font-bold">{isFreeUser ? "0" : storesCount}</span>
                        <div className="my-0.5 h-px w-4 bg-current opacity-40" />
                        <span className="text-[9px]">{isFreeUser ? "0" : maxStores}</span>
                      </div>
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn(
                  "border-none text-white shadow-md", 
                  isFreeUser ? "bg-gradient-to-br from-orange-600 to-orange-700" :
                  storePercentage >= 100 ? "bg-gradient-to-br from-red-600 to-red-700" : 
                  storePercentage >= 75 ? "bg-gradient-to-br from-blue-600 to-blue-700" :
                  "bg-gradient-to-br from-emerald-600 to-emerald-700"
                )}>
                  <div className="px-1 py-1">
                    <span className="text-sm">
                      {isFreeUser 
                        ? "Adquira um plano para criar lojas"
                        : remaining > 0 
                          ? `Você pode adicionar mais ${remaining} ${remaining === 1 ? 'loja' : 'lojas'}`
                          : 'Limite máximo atingido'
                      }
                    </span>
                  </div>
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
                  <span className="text-xs text-gray-600 block">
                    Descubra produtos escaláveis com potencial explosivo.
                  </span>
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
                  <span className="text-xs text-gray-600 block">
                    Identifique tendências antes que virem mainstream.
                  </span>
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
                  <span className="text-xs text-gray-600 block">
                    Configure filtros avançados para produtos específicos.
                  </span>
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
                  <span className="mt-1 text-xs text-purple-700 block">
                    Nossa tecnologia de IA vasculha milhares de produtos na biblioteca de anúncios para identificar itens com alto potencial de vendas.
                  </span>
                  
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-2 border border-purple-100">
                      <div className="flex items-start">
                        <Check className="h-3 w-3 mt-0.5 text-purple-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-medium text-purple-800">Identificação de campeões</h4>
                          <span className="text-[10px] text-purple-700 block">
                            Produtos com histórico de vendas e engajamento
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-2 border border-purple-100">
                      <div className="flex items-start">
                        <Check className="h-3 w-3 mt-0.5 text-purple-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-medium text-purple-800">Análise de mercado</h4>
                          <span className="text-[10px] text-purple-700 block">
                            Avaliação de saturação e potencial de crescimento
                          </span>
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
                          <span className="font-medium truncate">Pulseira magnética</span>
                          <span className="text-green-600 block">+430% vendas em 30 dias</span>
                        </div>
                      </div>
                      <div className="rounded overflow-hidden border border-gray-100 flex items-center text-[10px]">
                        <div className="w-8 h-8 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                          <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none">
                            <path d="M19 14C19 16.7614 16.7614 19 14 19M19 14C19 11.2386 16.7614 9 14 9M19 14H5M14 19C11.2386 19 9 16.7614 9 14M14 19C14.7956 19 15.5587 18.6839 16.1213 18.1213C16.6839 17.5587 17 16.7956 17 16M14 9C11.2386 9 9 11.2386 9 14M14 9C14.7956 9 15.5587 9.31607 16.1213 9.87868C16.6839 10.4413 17 11.2044 17 12M9 14C9 12.4087 9.63214 10.8826 10.7574 9.75736C11.8826 8.63214 13.4087 8 15 8C16.5913 8 18.1174 8.63214 19.2426 9.75736C20.3679 10.8826 21 12.4087 21 14C21 15.5913 20.3679 17.1174 19.2426 18.2426C18.1174 19.3679 16.5913 20 15 20H5L9 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="p-1">
                          <span className="font-medium truncate">Mini projetor LED</span>
                          <span className="text-green-600 block">Alta margem de lucro</span>
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
