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
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateStore, deleteStore } from '@/lib/store-service';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { UpdateStoreDialog } from './update-store-dialog';

interface Store {
  id: string;
  name: string;
  platform: 'aliexpress' | 'shopify' | 'other';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  
  const navigateToStore = (storeId: string) => {
    router.push(`/dashboard/stores/${storeId}`);
  };
  
  const handleSyncStore = (storeId: string) => {
    if (isLoading[storeId]) return;
    
    setIsLoading(prev => ({ ...prev, [storeId]: true }));
    
    // Simular uma sincronização
    setTimeout(() => {
      setIsLoading(prev => ({ ...prev, [storeId]: false }));
      toast.success('Loja sincronizada com sucesso!');
    }, 2000);
  };

  const handleEditClick = (store: Store) => {
    setSelectedStore(store);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    // Atualizar os dados da página após edição bem-sucedida
    router.refresh();
  };

  const handleDeleteClick = (store: Store) => {
    setSelectedStore(store);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStore) return;
    
    setIsLoading(prev => ({ ...prev, [selectedStore.id]: true }));
    
    try {
      const result = await deleteStore(selectedStore.id, { force: true });
      
      if (result.success) {
        toast.success('Loja excluída com sucesso!');
        router.refresh(); // Atualizar os dados da página
      } else {
        toast.error(`Erro ao excluir loja: ${result.error || 'Falha desconhecida'}`);
      }
    } catch (error) {
      toast.error('Erro ao excluir loja');
      console.error('Erro ao excluir loja:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [selectedStore.id]: false }));
      setIsDeleteDialogOpen(false);
    }
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
      <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-gray-100 bg-white min-h-[350px]">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">Nenhuma loja encontrada</h3>
        <p className="text-muted-foreground max-w-sm mb-4">
          Você ainda não conectou nenhuma loja à plataforma. Adicione sua primeira loja para começar.
        </p>
        <Button 
          onClick={() => router.push('/dashboard/stores/create')}
          className="flex items-center mt-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Loja
        </Button>
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
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(store);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(store);
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
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

      {/* Substituir o Dialog antigo pelo novo componente UpdateStoreDialog */}
      {selectedStore && (
        <UpdateStoreDialog
          store={selectedStore}
          open={isEditDialogOpen}
          onClose={handleEditDialogClose}
        />
      )}

      {/* Manter o AlertDialog para confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Loja</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a loja <strong>{selectedStore?.name}</strong>? Esta ação não pode ser desfeita e todos os produtos e dados associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading[selectedStore?.id || '']}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isLoading[selectedStore?.id || '']}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              {isLoading[selectedStore?.id || ''] ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Excluir Permanentemente
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 