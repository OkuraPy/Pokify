'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Eye, Pencil, MoreVertical, Trash2 } from 'lucide-react';
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

interface Product {
  id: string;
  title: string;
  image: string;
  price: number;
  rating: number;
  reviewsCount: number;
  status: 'active' | 'inactive';
  sales: number;
  stock: number;
}

interface ProductGridProps {
  storeId: string;
}

export function ProductGrid({ storeId }: ProductGridProps) {
  // Mock data - Depois será substituído pela API
  const router = useRouter();
  const [products] = useState<Product[]>([
    {
      id: '1',
      title: 'Camiseta Básica Masculina Algodão Premium',
      image: 'https://via.placeholder.com/300',
      price: 49.90,
      rating: 4.5,
      reviewsCount: 128,
      status: 'active',
      sales: 256,
      stock: 45,
    },
    {
      id: '2',
      title: 'Calça Jeans Slim Fit Masculina',
      image: 'https://via.placeholder.com/300',
      price: 149.90,
      rating: 4.2,
      reviewsCount: 85,
      status: 'active',
      sales: 178,
      stock: 32,
    },
    {
      id: '3',
      title: 'Tênis Casual Esportivo Confort',
      image: 'https://via.placeholder.com/300',
      price: 199.90,
      rating: 4.8,
      reviewsCount: 234,
      status: 'active',
      sales: 412,
      stock: 18,
    },
    {
      id: '4',
      title: 'Moletom Unissex com Capuz',
      image: 'https://via.placeholder.com/300',
      price: 129.90,
      rating: 4.6,
      reviewsCount: 156,
      status: 'inactive',
      sales: 89,
      stock: 0,
    },
  ]);

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
                src={product.image}
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
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <Link 
                  href={`/dashboard/stores/${storeId}/products/${product.id}`}
                  className="font-medium leading-tight hover:text-primary cursor-pointer line-clamp-2"
                >
                  {product.title}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 -mr-2 hover:bg-secondary/80"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/stores/${storeId}/products/${product.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Visualizar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/stores/${storeId}/import?productId=${product.id}`)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Excluir</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

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
                  <p className="font-medium text-base">{product.sales}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">Estoque</p>
                  <p className="font-medium text-base">{product.stock}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs">Avaliação</p>
                  <p className="font-medium text-base flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {product.rating}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize font-medium"
                  >
                    {product.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {product.reviewsCount} avaliações
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
