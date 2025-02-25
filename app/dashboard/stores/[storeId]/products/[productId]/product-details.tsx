'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Edit,
  Share2,
  Trash2,
  QrCode,
  Eye,
  History,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { ImageGallery } from './components/image-gallery';
import { ProductInfo } from './components/product-info';
import { ProductStats } from './components/product-stats';
import { ProductHistory } from './components/product-history';
import { ProductMetadata } from './components/product-metadata';

interface ProductDetailsProps {
  storeId: string;
  productId: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
  views: number;
  sales: number;
  averageTicket: number;
}

export function ProductDetails({ storeId, productId }: ProductDetailsProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Buscar dados do produto da API
    setTimeout(() => {
      setProduct({
        id: productId,
        title: 'Camiseta Pokémon',
        description: 'Camiseta com estampa do Pikachu',
        price: 89.90,
        stock: 50,
        active: true,
        images: [
          'https://via.placeholder.com/800x800',
          'https://via.placeholder.com/800x800',
          'https://via.placeholder.com/800x800',
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 150,
        sales: 25,
        averageTicket: 89.90,
      });
      setIsLoading(false);
    }, 1000);
  }, [productId]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!product) {
    return <div>Produto não encontrado</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/stores/${storeId}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Produtos
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{product.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
          <p className="text-sm text-muted-foreground">
            Última atualização em{' '}
            {format(new Date(product.updatedAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          <Button size="sm" variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-5 gap-6">
        {/* Coluna Esquerda */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Galeria de Imagens</CardTitle>
            <CardDescription>
              Visualize e gerencie as imagens do produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageGallery images={product.images} />
          </CardContent>
        </Card>

        {/* Coluna Direita */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle>Informações do Produto</CardTitle>
                <CardDescription>
                  Detalhes e estatísticas do produto
                </CardDescription>
              </div>
              <Badge variant={product.active ? 'default' : 'secondary'}>
                {product.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ProductInfo product={product} />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="stats">
            <TabsList>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="metadata">SEO e Metadados</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="mt-6">
              <ProductStats product={product} />
            </TabsContent>
            <TabsContent value="history" className="mt-6">
              <ProductHistory product={product} />
            </TabsContent>
            <TabsContent value="metadata" className="mt-6">
              <ProductMetadata product={product} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam o produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Produto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
