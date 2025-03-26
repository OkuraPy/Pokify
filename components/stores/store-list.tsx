'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  MoreHorizontal, 
  Package, 
  Trash, 
  ExternalLink, 
  BarChart,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Store {
  id: string;
  name: string;
  platform: string;
  url: string;
  products: number;
  reviews: number;
  average_rating: number;
}

interface StoreListProps {
  stores: Store[];
}

export function StoreList({ stores }: StoreListProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  
  const navigateToStore = (storeId: string) => {
    router.push(`/dashboard/stores/${storeId}`);
  };
  
  const handleSyncStore = (storeId: string) => {
    if (isLoading[storeId]) return;
    
    setIsLoading(prev => ({ ...prev, [storeId]: true }));
    
    // Simular uma sincronização
    setTimeout(() => {
      setIsLoading(prev => ({ ...prev, [storeId]: false }));
    }, 2000);
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'shopify':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'woocommerce':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'magento':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">Nenhuma loja encontrada</h3>
        <p className="text-muted-foreground max-w-sm mb-4">
          Você ainda não conectou nenhuma loja à plataforma. Adicione sua primeira loja para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      <Table>
        <TableHeader className="bg-gray-50 border-b">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">Loja</TableHead>
            <TableHead className="font-semibold text-gray-700">Plataforma</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-gray-700">Produtos</TableHead>
            <TableHead className="hidden md:table-cell font-semibold text-gray-700">Avaliações</TableHead>
            <TableHead className="hidden lg:table-cell font-semibold text-gray-700">Média de Avaliações</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((store) => (
            <TableRow 
              key={store.id}
              className="cursor-pointer hover:bg-blue-50 transition-colors duration-200"
              onClick={() => navigateToStore(store.id)}
            >
              <TableCell className="font-medium">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {store.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{store.name}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">{store.url}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`${getPlatformBadgeColor(store.platform)} px-2 py-1`}>
                  {store.platform}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1 rounded-full">
                    <Package className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="font-medium">{store.products}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 p-1 rounded-full">
                    <svg className="h-3.5 w-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <span className="font-medium">{store.reviews}</span>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star} 
                        className={`h-4 w-4 ${star <= Math.round(store.average_rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {store.average_rating.toFixed(1)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 h-8 px-3"
                    onClick={() => navigateToStore(store.id)}
                  >
                    <BarChart className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Detalhes</span>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 bg-gray-100 hover:bg-gray-200">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => navigateToStore(store.id)}
                        className="cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                      >
                        <BarChart className="h-4 w-4 mr-2" />
                        <span>Ver Detalhes</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(store.url, '_blank')}
                        className="cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        <span>Visitar Loja</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSyncStore(store.id)}
                        disabled={isLoading[store.id]}
                        className="cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading[store.id] ? 'animate-spin' : ''}`} />
                        <span>{isLoading[store.id] ? 'Sincronizando...' : 'Sincronizar'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer hover:bg-blue-50 hover:text-blue-600">
                        <Edit className="h-4 w-4 mr-2" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                        <Trash className="h-4 w-4 mr-2" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 