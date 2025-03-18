'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Eye, ShoppingCart, Pencil, Loader2 } from 'lucide-react';
import { ImageGallery } from './components/image-gallery';
import { ProductInfo } from './components/product-info';
import { ReviewsList } from './components/reviews-list';
import { ProductAnalytics } from './components/product-analytics';
import { getProduct } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface ProductDetailsProps {
  storeId: string;
  productId: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  stock: number;
  status: string;
  images: string[];
  tags?: string[];
  reviews_count: number;
  average_rating?: number;
  original_url?: string;
  original_platform?: string;
  shopify_product_id?: string;
  shopify_product_url?: string;
  variants?: any;
  created_at: string;
  updated_at: string;
}

export function ProductDetails({ storeId, productId }: ProductDetailsProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProductDetails() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await getProduct(productId);
        
        if (error) {
          console.error('Erro ao carregar detalhes do produto:', error);
          setError('Não foi possível carregar os detalhes do produto. Tente novamente mais tarde.');
          toast.error('Erro ao carregar detalhes do produto');
          return;
        }
        
        if (!data) {
          setError('Produto não encontrado');
          return;
        }
        
        setProduct(data);
      } catch (err) {
        console.error('Erro inesperado:', err);
        setError('Ocorreu um erro inesperado. Tente novamente mais tarde.');
        toast.error('Erro ao carregar detalhes do produto');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProductDetails();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando detalhes do produto...</p>
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
          <h3 className="text-lg font-medium">Erro ao carregar produto</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mt-2"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-secondary/50 rounded-full">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Produto não encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Este produto pode ter sido removido ou não existe.
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/stores/${storeId}`)}
            className="mt-2"
          >
            Voltar para loja
          </Button>
        </div>
      </div>
    );
  }

  const statusVariant = 
    product.status === 'ready' || product.status === 'published' 
      ? 'default' 
      : 'secondary';
  
  const statusLabel = 
    product.status === 'ready' ? 'Ativo' : 
    product.status === 'published' ? 'Publicado' :
    product.status === 'imported' ? 'Importado' :
    product.status === 'editing' ? 'Em edição' : 'Arquivado';

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">{product.title}</h2>
          <p className="text-muted-foreground">
            Gerencie os detalhes e configurações deste produto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant} className="capitalize py-1 px-2">
            {statusLabel}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const url = `/dashboard/stores/${storeId}/products/${product.id}/edit`;
              console.log('Navegando para:', url);
              window.location.href = url; // Forçar navegação direta
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar (Teste)
          </Button>
          {product.shopify_product_url && (
            <Button size="sm" asChild>
              <a href={product.shopify_product_url} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Ver na loja
              </a>
            </Button>
          )}
        </div>
      </div>

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
              <Badge variant={statusVariant}>
                {statusLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ProductInfo product={product} />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="space-y-4">
        <TabsList>
          <TabsTrigger value="description">Descrição</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          <TabsTrigger value="analytics">Estatísticas</TabsTrigger>
          {product.variants && Object.keys(product.variants).length > 0 && (
            <TabsTrigger value="variants">Variações</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="description" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Descrição do Produto</CardTitle>
              <CardDescription>
                Informações detalhadas sobre o produto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p className="text-muted-foreground italic">
                    Este produto não possui uma descrição detalhada.
                  </p>
                )}
              </div>
              
              {product.tags && product.tags.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {product.original_url && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium">Produto Importado</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Origem: {product.original_platform || 'Desconhecida'}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <a 
                      href={product.original_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Ver produto original
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reviews">
          <ReviewsList productId={product.id} reviewsCount={product.reviews_count} />
        </TabsContent>
        
        <TabsContent value="analytics">
          <ProductAnalytics productId={product.id} />
        </TabsContent>
        
        {product.variants && Object.keys(product.variants).length > 0 && (
          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <CardTitle>Variações do Produto</CardTitle>
                <CardDescription>
                  Visualize e gerencie as variações disponíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Renderização das variações do produto */}
                <pre className="bg-secondary p-4 rounded-md overflow-auto max-h-96 text-xs">
                  {JSON.stringify(product.variants, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
