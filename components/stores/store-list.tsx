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
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Loja</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead className="hidden md:table-cell">Produtos</TableHead>
            <TableHead className="hidden md:table-cell">Avaliações</TableHead>
            <TableHead className="hidden lg:table-cell">Média de Avaliações</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((store) => (
            <TableRow 
              key={store.id}
              className="cursor-pointer"
              onClick={() => navigateToStore(store.id)}
            >
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium">{store.name}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{store.url}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getPlatformBadgeColor(store.platform)}>
                  {store.platform}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {store.products}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {store.reviews}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {store.average_rating.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => navigateToStore(store.id)}
                        className="cursor-pointer"
                      >
                        <BarChart className="h-4 w-4 mr-2" />
                        <span>Ver Detalhes</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.open(store.url, '_blank')}
                        className="cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        <span>Visitar Loja</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSyncStore(store.id)}
                        disabled={isLoading[store.id]}
                        className="cursor-pointer"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading[store.id] ? 'animate-spin' : ''}`} />
                        <span>{isLoading[store.id] ? 'Sincronizando...' : 'Sincronizar'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive">
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