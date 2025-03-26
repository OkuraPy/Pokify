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
  AlertTriangle,
  ShoppingBag,
  Globe,
  Star
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Store {
  id: string;
  name: string;
  platform: string;
  url: string;
  products: number;
  reviews_count: number;
  products_count: number;
  last_sync?: string;
  created_at: string;
}

interface StoreCardProps {
  store: Store;
  maxProducts?: number;
  maxReviews?: number;
  onClick?: () => void;
}

export function StoreCard({ store, maxProducts = 500, maxReviews = 1000, onClick }: StoreCardProps) {
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
  const productsPercentage = Math.min(Math.round((store.products_count / maxProducts) * 100), 100);
  const reviewsPercentage = Math.min(Math.round(((store.reviews_count || 0) / maxReviews) * 100), 100);
  
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
        <Card 
          className={cn(
            "h-full cursor-pointer transition-all overflow-hidden border shadow-sm hover:shadow-md", 
            isHovered && "border-primary/50"
          )}
          onClick={onClick}
        >
          {/* Gradiente no topo baseado na plataforma */}
          <div className={`h-2 w-full bg-gradient-to-r ${
            colorClasses.bg === 'bg-emerald-500' ? 'from-emerald-400 to-emerald-600' :
            colorClasses.bg === 'bg-purple-500' ? 'from-purple-400 to-purple-600' :
            colorClasses.bg === 'bg-orange-500' ? 'from-orange-400 to-orange-600' :
            colorClasses.bg === 'bg-yellow-500' ? 'from-yellow-400 to-yellow-600' :
            colorClasses.bg === 'bg-amber-500' ? 'from-amber-400 to-amber-600' :
            'from-blue-400 to-blue-600'
          }`} />
          
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses.bgLight}`}>
                  <Globe className={`h-4 w-4 ${colorClasses.text}`} />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">{store.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                    {store.url}
                  </CardDescription>
                </div>
              </div>
              
              <Badge variant="outline" className={`${colorClasses.bgLight} ${colorClasses.text} ${colorClasses.border} font-medium text-xs`}>
                {store.platform}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-5 pt-2">
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* Produtos Card */}
              <div className="bg-gray-50 rounded-lg p-3 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="bg-blue-100 p-1 rounded-full">
                    <Package className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Produtos</span>
                </div>
                <div className="text-lg font-bold">{formatNumber(store.products_count)}</div>
                <Progress 
                  value={productsPercentage} 
                  className="h-1.5 mt-1.5" 
                  indicatorClassName="bg-blue-500" 
                />
              </div>
              
              {/* Avaliações Card */}
              <div className="bg-gray-50 rounded-lg p-3 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="bg-amber-100 p-1 rounded-full">
                    <Star className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Avaliações</span>
                </div>
                <div className="text-lg font-bold">{formatNumber(store.reviews_count || 0)}</div>
                <Progress 
                  value={reviewsPercentage} 
                  className="h-1.5 mt-1.5" 
                  indicatorClassName="bg-amber-500" 
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="px-5 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-xs text-gray-500">
                {store.last_sync 
                  ? `Sincronizado em ${format(new Date(store.last_sync), "dd MMM", { locale: ptBR })}`
                  : `Criado em ${format(new Date(store.created_at), "dd MMM", { locale: ptBR })}`
                }
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 px-2 text-xs bg-white border border-gray-100 text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(store.url, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Visitar
              </Button>
              
              <div onClick={(e) => e.stopPropagation()} className="ml-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-white border border-gray-100 text-gray-700 hover:bg-gray-100">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-border/80 shadow-lg">
                    <DropdownMenuLabel>Ações para {store.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-blue-50 hover:text-blue-600"
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
                      className="cursor-pointer hover:bg-blue-50 hover:text-blue-600"
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
                      className="cursor-pointer hover:bg-amber-50 hover:text-amber-600"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2 text-amber-500" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
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
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  );
} 