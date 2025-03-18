'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Eye, Pencil, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getProducts } from '@/lib/supabase';
import { toast } from 'sonner';

interface Product {
  id: string;
  title: string;
  images: string[];
  price: number;
  compare_at_price?: number;
  average_rating?: number;
  reviews_count: number;
  status: string;
  stock: number;
  // Outros campos opcionais para estatísticas
  sales?: number;
}

interface ProductGridProps {
  storeId: string;
}

export function ProductGrid({ storeId }: ProductGridProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await getProducts(storeId);
        
        if (error) {
          console.error('Erro ao carregar produtos:', error);
          setError('Não foi possível carregar os produtos. Tente novamente mais tarde.');
          toast.error('Erro ao carregar produtos');
          return;
        }
        
        setProducts(data || []);
      } catch (err) {
        console.error('Erro inesperado:', err);
        setError('Ocorreu um erro inesperado. Tente novamente mais tarde.');
        toast.error('Erro ao carregar produtos');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProducts();
  }, [storeId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-destructive/10 rounded-full">
          <ShoppingCart className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Erro ao carregar produtos</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => router.refresh()}
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-secondary/50 rounded-full">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Nenhum produto encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Adicione um novo produto para começar a vender.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="group overflow-hidden hover:shadow-lg transition-all duration-300 border border-border/40"
        >
          <CardContent className="p-0">
            <div className="relative aspect-square overflow-hidden bg-secondary/10">
              <Image
                src={product.images?.[0] || 'https://via.placeholder.com/300?text=Sem+Imagem'}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-9 w-9 bg-white hover:bg-white/90 shadow-sm"
                  onClick={() => router.push(`/dashboard/stores/${storeId}/products/${product.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-9 w-9 bg-white hover:bg-white/90 shadow-sm"
                  onClick={() => router.push(`/dashboard/stores/${storeId}/import?productId=${product.id}`)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              {product.stock <= 20 && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-3 right-3 shadow-sm"
                >
                  {product.stock === 0 ? 'Sem estoque' : 'Estoque baixo'}
                </Badge>
              )}
            </div>
            
            <div className="p-4 space-y-4">
              <h3 className="font-medium line-clamp-2 h-12" title={product.title}>
                {product.title}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 py-1">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">Preço</p>
                  <p className="font-medium text-base">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(product.price)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">Vendas</p>
                  <p className="font-medium text-base">{product.sales || 0}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">Estoque</p>
                  <p className="font-medium text-base">{product.stock}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">Avaliação</p>
                  <p className="font-medium text-base flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {product.average_rating || 0}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={product.status === 'ready' || product.status === 'published' ? 'default' : 'secondary'}
                    className="capitalize font-medium"
                  >
                    {product.status === 'ready' ? 'Ativo' : 
                     product.status === 'published' ? 'Publicado' :
                     product.status === 'imported' ? 'Importado' :
                     product.status === 'editing' ? 'Em edição' : 'Arquivado'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {product.reviews_count} avaliações
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
