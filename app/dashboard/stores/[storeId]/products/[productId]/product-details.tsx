'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Eye, ShoppingCart, Pencil, Loader2, Languages } from 'lucide-react';
import { ImageGallery } from './components/image-gallery';
import { ProductInfo } from './components/product-info';
import { ReviewsList } from './components/reviews-list';
import { ProductAnalytics } from './components/product-analytics';
import { TranslationDialog } from './components/translation-dialog';
import { getProduct, updateProduct } from '@/lib/supabase';
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
  const [isTranslationDialogOpen, setIsTranslationDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
        
        // Garantir que a descrição não seja null
        const safeProduct = {
          ...data,
          description: data.description || ""
        };
        
        setProduct(safeProduct as Product);
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

  const handleSaveTranslation = async (data: { title?: string; description?: string }) => {
    if (!product) return;
    
    try {
      const { error } = await updateProduct(product.id, data);
      
      if (error) {
        throw new Error('Falha ao atualizar o produto');
      }
      
      // Update local product state with the new translated data
      setProduct(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...data
        };
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao salvar tradução:', error);
      return Promise.reject(error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Barra de navegação superior */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 truncate max-w-[500px]">{product.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <span>•</span>
                <Badge variant={statusVariant} className="capitalize">
                  {statusLabel}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsTranslationDialogOpen(true)}
              className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Languages className="h-4 w-4 mr-2" />
              Traduzir
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const url = `/dashboard/stores/${storeId}/products/${product.id}/edit`;
                window.location.href = url;
              }}
              className="bg-white"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
            
            {product.shopify_product_url && (
              <Button 
                size="sm" 
                asChild
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <a href={product.shopify_product_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver na loja
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Barra lateral de navegação */}
        <aside className="hidden md:block w-64 border-r bg-white p-6 space-y-8">
          <nav className="space-y-1">
            <Button 
              variant="ghost" 
              className={`w-full justify-start text-sm ${activeTab === "overview" ? "bg-blue-50 text-blue-700" : "text-gray-600"}`}
              onClick={() => setActiveTab("overview")}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
              </svg>
              Visão Geral
            </Button>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start text-sm ${activeTab === "media" ? "bg-blue-50 text-blue-700" : "text-gray-600"}`}
              onClick={() => setActiveTab("media")}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M5 19L8.5 15.5L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 19L16 15L19 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Mídia
            </Button>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start text-sm ${activeTab === "info" ? "bg-blue-50 text-blue-700" : "text-gray-600"}`}
              onClick={() => setActiveTab("info")}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                <path d="M12 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 8V8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Informações
            </Button>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start text-sm ${activeTab === "description" ? "bg-blue-50 text-blue-700" : "text-gray-600"}`}
              onClick={() => setActiveTab("description")}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Descrição
            </Button>
            
            <Button 
              variant="ghost" 
              className={`w-full justify-start text-sm ${activeTab === "reviews" ? "bg-blue-50 text-blue-700" : "text-gray-600"}`}
              onClick={() => setActiveTab("reviews")}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Avaliações
            </Button>
            
            {product.variants && Object.keys(product.variants).length > 0 && (
              <Button 
                variant="ghost" 
                className={`w-full justify-start text-sm ${activeTab === "variants" ? "bg-blue-50 text-blue-700" : "text-gray-600"}`}
                onClick={() => setActiveTab("variants")}
              >
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2H16L22 8V16L16 22H8L2 16V8L8 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Variações
              </Button>
            )}
          </nav>
          
          {/* Ferramentas de IA */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">FERRAMENTAS DE IA</h3>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-sm px-3 py-2 h-auto bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
              onClick={() => setActiveTab("reviews")}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 10V3L4 14H7V21L16 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-left">
                <span className="font-medium">Gerar Avaliações</span>
                <p className="text-xs text-indigo-600/70 mt-0.5">Crie reviews com IA</p>
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-sm px-3 py-2 h-auto bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
              onClick={() => setIsTranslationDialogOpen(true)}
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 3V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 14L14 9M8 9H16H8ZM9 21L14 9L9 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-left">
                <span className="font-medium">Traduzir Produto</span>
                <p className="text-xs text-blue-600/70 mt-0.5">Tradução automática</p>
              </div>
            </Button>
          </div>
        </aside>
        
        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Conteúdo baseado na aba selecionada */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna da esquerda - Imagens */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardHeader className="border-b bg-gray-50 px-6">
                    <CardTitle className="text-lg">Galeria de Imagens</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ImageGallery images={product.images} />
                  </CardContent>
                </Card>
              </div>
              
              {/* Coluna da direita - Informações do produto */}
              <div>
                <Card className="border-0 shadow-sm overflow-hidden h-full">
                  <CardHeader className="border-b bg-gray-50 px-6">
                    <CardTitle className="text-lg">Informações do Produto</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ProductInfo product={product} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Conteúdo de mídia */}
          {activeTab === "media" && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-gray-50 px-6">
                <CardTitle className="text-lg">Galeria de Mídia</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="aspect-square relative rounded-md overflow-hidden border group">
                        <img 
                          src={image} 
                          alt={`Imagem ${index + 1} do ${product.title}`} 
                          className="object-cover w-full h-full transition-transform group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" className="mr-2">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h10a4 4 0 004-4v-4a4 4 0 00-4-4H7a4 4 0 00-4 4v4z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9V5" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 13L12 9 8 13" />
                      </svg>
                      Adicionar Imagem
                    </Button>
                    <Button variant="outline">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Organizar Ordem
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Conteúdo de informações */}
          {activeTab === "info" && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-gray-50 px-6">
                <CardTitle className="text-lg">Informações do Produto</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ProductInfo product={product} />
              </CardContent>
            </Card>
          )}
          
          {/* Conteúdo de descrição */}
          {activeTab === "description" && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-gray-50 px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Descrição do Produto</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const url = `/dashboard/stores/${storeId}/products/${product.id}/edit`;
                      window.location.href = url;
                    }}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Descrição
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none">
                  {product.description ? (
                    <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  ) : (
                    <p className="text-muted-foreground italic">
                      Este produto não possui uma descrição detalhada.
                    </p>
                  )}
                </div>
                
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-50">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {product.original_url && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium mb-2">Origem do Produto</h4>
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Plataforma: {product.original_platform || 'Desconhecida'}</p>
                        <p className="text-sm text-gray-500 truncate max-w-md">{product.original_url}</p>
                      </div>
                      <a 
                        href={product.original_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Ver original
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Conteúdo de avaliações */}
          {activeTab === "reviews" && (
            <ReviewsList productId={product.id} reviewsCount={product.reviews_count} />
          )}
          
          {/* Conteúdo de variações */}
          {activeTab === "variants" && product.variants && Object.keys(product.variants).length > 0 && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-gray-50 px-6">
                <CardTitle className="text-lg">Variações do Produto</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[500px] text-xs">
                  {JSON.stringify(product.variants, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      
      {/* Navegação móvel - Visível apenas em telas pequenas */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="grid grid-cols-5 gap-1 p-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center py-2 px-0 rounded-none ${activeTab === "overview" ? "text-blue-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("overview")}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
              <rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="text-xs mt-1">Visão</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center py-2 px-0 rounded-none ${activeTab === "media" ? "text-blue-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("media")}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M5 19L8.5 15.5L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L16 15L19 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs mt-1">Mídia</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center py-2 px-0 rounded-none ${activeTab === "info" ? "text-blue-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("info")}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 8V8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-xs mt-1">Info</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center py-2 px-0 rounded-none ${activeTab === "description" ? "text-blue-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("description")}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-xs mt-1">Desc</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center py-2 px-0 rounded-none ${activeTab === "reviews" ? "text-blue-600" : "text-gray-600"}`}
            onClick={() => setActiveTab("reviews")}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs mt-1">Reviews</span>
          </Button>
        </div>
      </div>
      
      {/* Diálogo de tradução */}
      {product && (
        <TranslationDialog
          isOpen={isTranslationDialogOpen}
          onClose={() => setIsTranslationDialogOpen(false)}
          product={product}
          onSaveTranslation={handleSaveTranslation}
        />
      )}
    </div>
  );
}
