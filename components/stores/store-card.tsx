'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  BarChart4, 
  ExternalLink, 
  MoreHorizontal, 
  Package, 
  ShoppingCart, 
  Wallet,
  RefreshCw,
  Edit,
  Trash,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { cn, formatCurrency, formatNumber, getPlatformColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

interface Store {
  id: string;
  name: string;
  platform: string;
  url: string;
  products: number;
  orders: number;
  revenue: number;
}

interface StoreCardProps {
  store: Store;
  maxProducts?: number;
  maxOrders?: number;
  maxRevenue?: number;
}

export function StoreCard({ store, maxProducts = 500, maxOrders = 1000, maxRevenue = 100000 }: StoreCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isHovered, setIsHovered] = useState(false);
  
  const platformColor = getPlatformColor(store.platform);
  
  const handleSyncStore = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Atualizar estados para indicar sincronização
    setIsLoading(true);
    setSyncStatus('syncing');
    
    // Simular uma sincronização com resultado aleatório
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% de chance de sucesso
      setIsLoading(false);
      setSyncStatus(success ? 'success' : 'error');
      
      // Limpar o status após alguns segundos
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    }, 2000);
  };
  
  // Calcular percentual de cada métrica para as barras de progresso
  const productsPercentage = Math.min(Math.round((store.products / maxProducts) * 100), 100);
  const ordersPercentage = Math.min(Math.round((store.orders / maxOrders) * 100), 100);
  const revenuePercentage = Math.min(Math.round((store.revenue / maxRevenue) * 100), 100);
  
  // Animação para o cartão
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' },
  };
  
  // Obter o ícone de status de sincronização
  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  // Obter cores com base na plataforma
  const getPlatformColorClasses = (platform: string) => {
    const color = getPlatformColor(platform);
    
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500',
          bgLight: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          bgLight: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200'
        };
      case 'orange':
        return {
          bg: 'bg-orange-500',
          bgLight: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500',
          bgLight: 'bg-yellow-50',
          text: 'text-yellow-700',
          border: 'border-yellow-200'
        };
      case 'amber':
        return {
          bg: 'bg-amber-500',
          bgLight: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200'
        };
      default:
        return {
          bg: 'bg-blue-500',
          bgLight: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200'
        };
    }
  };
  
  const colorClasses = getPlatformColorClasses(store.platform);

  return (
    <Link href={`/dashboard/stores/${store.id}`}>
      <motion.div
        initial="hidden"
        animate="visible"
        whileHover="hover"
        variants={cardVariants}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className={cn(
          "h-full cursor-pointer transition-all overflow-hidden border-border/80", 
          isHovered && "border-primary/50"
        )}>
          {/* Borda superior colorida baseada na plataforma */}
          <div className={`h-1.5 w-full ${colorClasses.bg}`} />
          
          <CardHeader className="p-5 pb-0">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`${colorClasses.bgLight} ${colorClasses.text} ${colorClasses.border}`}>
                {store.platform}
              </Badge>
              
              <div className="flex items-center gap-1">
                {getSyncStatusIcon()}
                
                <div onClick={(e) => e.stopPropagation()} className="ml-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 border-border/80 shadow-lg">
                      <DropdownMenuLabel>Ações para {store.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(store.url, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2 text-blue-600" />
                        <span>Visitar Loja</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        disabled={isLoading}
                        onClick={handleSyncStore}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin text-blue-600" />
                            <span>Sincronizando...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 text-blue-600" />
                            <span>Sincronizar</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2 text-amber-500" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-rose-500 focus:text-rose-500 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            <CardTitle className="text-xl mt-3 text-blue-900">
              {store.name}
            </CardTitle>
            <CardDescription className="line-clamp-1 mt-1">
              <a 
                href={store.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-blue-500 transition-colors"
              >
                {store.url}
              </a>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-5">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Produtos</span>
                  </div>
                  <span className="text-sm font-semibold">{formatNumber(store.products)}</span>
                </div>
                <Progress value={productsPercentage} className="h-1.5" indicatorClassName="bg-blue-500" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Pedidos</span>
                  </div>
                  <span className="text-sm font-semibold">{formatNumber(store.orders)}</span>
                </div>
                <Progress value={ordersPercentage} className="h-1.5" indicatorClassName="bg-emerald-500" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">Faturamento</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(store.revenue)}</span>
                </div>
                <Progress value={revenuePercentage} className="h-1.5" indicatorClassName="bg-amber-500" />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="p-5 pt-0 flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(store.url, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visitar
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="w-full"
            >
              <BarChart4 className="h-4 w-4 mr-2" />
              Detalhes
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  );
} 