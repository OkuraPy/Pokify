'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Eye, ShoppingCart, Pencil, Loader2, Languages, X, ImagePlus, GripVertical, Sparkles, Lock, Store, Search, Image as ImageIcon, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ImageGallery } from './components/image-gallery';
import { ProductInfo } from './components/product-info';
import { ReviewsList } from './components/reviews-list';
import { ProductAnalytics } from './components/product-analytics';
import { TranslationDialog } from './components/translation-dialog';
import { ImproveDescriptionDialog } from './components/improve-description-dialog';
import { DescriptionImages } from './components/description-images';
import { ShopifyPublishButton } from './components/shopify-publish-button';
import { getProduct, updateProduct } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from '@/components/ui/dialog';

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
  description_images?: string[];
  tags?: string[];
  reviews_count: number;
  average_rating?: number;
  original_url?: string;
  original_platform?: string;
  shopify_product_id?: string;
  shopify_product_url?: string;
  variants?: any;
  language?: string;
  created_at: string;
  updated_at: string;
}

export function ProductDetails({ storeId, productId }: ProductDetailsProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslationDialogOpen, setIsTranslationDialogOpen] = useState(false);
  const [isImproveDescriptionDialogOpen, setIsImproveDescriptionDialogOpen] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSupplierFeatureDialogOpen, setIsSupplierFeatureDialogOpen] = useState(false);
  const [isImageTranslationDialogOpen, setIsImageTranslationDialogOpen] = useState(false);
  const [isTrendHunterDialogOpen, setIsTrendHunterDialogOpen] = useState(false);

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

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    try {
      // Se a imagem estiver no Supabase Storage, remove ela
      if (imageUrl.includes('supabase')) {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        const { error } = await supabase.storage
          .from('images')
          .remove([`${storeId}/${fileName}`]);
          
        if (error) throw error;
      }

      // Atualiza o produto no banco
      const { error: updateError } = await supabase
        .from('products')
        .update({
          images: product!.images.filter((_, i) => i !== index)
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Atualiza o estado local
      setProduct(prev => prev ? {
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      } : null);

      toast.success('Imagem removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  const handleUploadImages = async (files: FileList) => {
    try {
      setIsUploading(true);
      
      const imagePromises = Array.from(files).map(async (file) => {
        // Gera um nome único para a imagem
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;
        
        // Faz upload para o Supabase Storage
        const { data, error } = await supabase.storage
          .from('images')
          .upload(`${storeId}/${filename}`, file);
        
        if (error) throw error;
        
        // Retorna a URL pública da imagem
        const { data: publicUrl } = supabase.storage
          .from('images')
          .getPublicUrl(`${storeId}/${filename}`);
        
        return publicUrl.publicUrl;
      });
      
      // Processa todos os uploads
      const newImageUrls = await Promise.all(imagePromises);
      
      // Atualiza o produto no banco com as novas imagens
      const updatedImages = [...(product?.images || []), ...newImageUrls];
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: updatedImages })
        .eq('id', productId);
      
      if (updateError) throw updateError;
      
      // Atualiza o estado local
      setProduct(prev => prev ? {
        ...prev,
        images: updatedImages
      } : null);
      
      toast.success('Imagens adicionadas com sucesso');
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error);
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !product) return;

    const items = Array.from(product.images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    try {
      // Atualiza o produto no banco
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: items })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Atualiza o estado local
      setProduct(prev => prev ? {
        ...prev,
        images: items
      } : null);

      toast.success('Ordem das imagens atualizada');
    } catch (error) {
      console.error('Erro ao reordenar imagens:', error);
      toast.error('Erro ao atualizar ordem das imagens');
    }
  };

  // Função para formatar e limpar a descrição do produto
  const formatProductDescription = (description: string): string => {
    let formatted = description;
    
    // Se a descrição já contiver elementos HTML, especialmente tags IMG, não modificá-la
    if (formatted.includes('<img') || formatted.includes(' src=')) {
      // Certifique-se apenas de que as imagens tenham estilo adequado
      formatted = formatted.replace(/<img/g, '<img class="w-full max-w-full h-auto rounded-md my-4 mx-auto object-contain"');
      return formatted;
    }
    
    // Remover múltiplas quebras de linha
    formatted = formatted.replace(/(\r\n|\r|\n){2,}/g, '<br><br>');
    
    // Adicionar espaçamento entre parágrafos se não houver
    if (!formatted.includes('<p>') && !formatted.includes('<div')) {
      formatted = '<p>' + formatted.replace(/(\r\n|\r|\n)/g, '</p><p>') + '</p>';
    }
    
    // Garantir que listas estejam formatadas corretamente
    if (formatted.includes('•') || formatted.includes('-') && !formatted.includes('<li>')) {
      const listItems = formatted.split(/(?:\r\n|\r|\n)/g);
      let inList = false;
      let newContent = '';
      
      for (const item of listItems) {
        const trimmed = item.trim();
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          if (!inList) {
            newContent += '<ul>';
            inList = true;
          }
          newContent += `<li>${trimmed.substring(1).trim()}</li>`;
        } else {
          if (inList) {
            newContent += '</ul>';
            inList = false;
          }
          if (trimmed.length > 0) {
            newContent += `<p>${trimmed}</p>`;
          }
        }
      }
      
      if (inList) {
        newContent += '</ul>';
      }
      
      formatted = newContent;
    }
    
    // Remover <br> dentro de parágrafos mas manter entre parágrafos
    formatted = formatted.replace(/<p>(.*?)<br>(.*?)<\/p>/g, '<p>$1 $2</p>');
    
    // Adicionar classes para realçar características importantes
    formatted = formatted.replace(/<strong>(.*?)<\/strong>/g, '<strong class="text-gray-800 font-medium">$1</strong>');
    
    // Garantir que títulos tenham formatação adequada
    formatted = formatted.replace(/<h([1-6])>(.*?)<\/h([1-6])>/g, '<h$1 class="text-gray-800 font-semibold my-3">$2</h$3>');
    
    return formatted;
  };

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

  const handleSaveTranslation = async (data: { title?: string; description?: string; language?: string }) => {
    console.log('[TRADUÇÃO:' + Date.now() + '] [ETAPA 17-HANDLE-SAVE-TRANSLATION-START]', JSON.stringify({
      dataRecebido: {
        title: data.title?.substring(0, 50) + '...',
        descriptionLength: data.description?.length || 0,
        language: data.language
      },
      productId: product?.id,
      temProduct: !!product,
      timestamp: new Date().toISOString()
    }));
    
    if (!product) {
      console.error('[TRADUÇÃO:' + Date.now() + '] [ETAPA 18-PRODUCT-NOT-FOUND] Produto não encontrado/indefinido');
      return Promise.reject(new Error('Produto não encontrado'));
    }
    
    try {
      console.log('[TRADUÇÃO:' + Date.now() + '] [ETAPA 19-UPDATE-PRODUCT-CALL]', JSON.stringify({
        productId: product.id,
        dataKeys: Object.keys(data),
        language: data.language
      }));
      
      // Verificar se title e description não estão vazios
      if (!data.title || !data.description) {
        console.error('[TRADUÇÃO:' + Date.now() + '] [ETAPA 21-MISSING-DATA]', JSON.stringify({
          hasTitle: !!data.title,
          hasDescription: !!data.description
        }));
        return Promise.reject(new Error('Dados de tradução incompletos'));
      }
      
      // Criar cópia dos dados para evitar referência mutável
      const updateData = {
        title: data.title,
        description: data.description
      };
      
      console.log('[TRADUÇÃO:' + Date.now() + '] [ETAPA 22-BEFORE-SUPABASE-CALL]', JSON.stringify({
        updateData: {
          title: updateData.title?.substring(0, 30) + '...',
          descriptionLength: updateData.description?.length || 0
        }
      }));
      
      const { data: responseData, error } = await updateProduct(product.id, updateData);
      
      console.log('[TRADUÇÃO:' + Date.now() + '] [ETAPA 23-AFTER-SUPABASE-CALL]', JSON.stringify({
        success: !error,
        errorMessage: error?.message,
        errorDetails: error ? 'Erro ao salvar no banco de dados' : undefined,
        responseDataExists: !!responseData
      }));
      
      if (error) {
        console.error('[TRADUÇÃO:' + Date.now() + '] [ETAPA 24-SUPABASE-ERROR]', JSON.stringify({
          errorMessage: error.message,
          errorType: error.constructor.name,
          errorStack: error.stack
        }));
        throw error;
      }
      
      console.log('[TRADUÇÃO:' + Date.now() + '] [ETAPA 25-UPDATE-LOCAL-STATE]');
      setProduct(prev => {
        if (!prev) {
          console.warn('[TRADUÇÃO:' + Date.now() + '] [ETAPA 26-LOCAL-STATE-NULL] Estado anterior do produto é nulo');
          return null;
        }
        
        // Criamos um objeto completo para garantir a atualização correta
        const updatedProduct = {
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description
        };
        
        console.log('[TRADUÇÃO:' + Date.now() + '] [ETAPA 27-LOCAL-STATE-UPDATED]', JSON.stringify({
          updatedProductId: updatedProduct.id,
          hasTitle: !!updatedProduct.title,
          hasDescription: !!updatedProduct.description
        }));
        
        return updatedProduct;
      });
      
      // Navegar para a aba de descrição após tradução bem-sucedida
      setActiveTab("description");
      
      console.log('[TRADUÇÃO:' + Date.now() + '] [ETAPA 28-SUCCESS-TOAST] Exibindo mensagem de sucesso');
      toast.success('Tradução salva com sucesso');
      
      console.log('[TRADUÇÃO:' + Date.now() + '] [ETAPA 29-PROMISE-RESOLVE] Retornando Promise.resolve()');
      return Promise.resolve();
    } catch (error) {
      console.error('[TRADUÇÃO:' + Date.now() + '] [ETAPA 30-SAVE-TRANSLATION-ERROR]', JSON.stringify({
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : 'No stack available'
      }));
      
      toast.error('Erro ao salvar tradução. Por favor, tente novamente.');
      
      console.log('[TRADUÇÃO:' + Date.now() + '] [ETAPA 31-PROMISE-REJECT] Retornando Promise.reject()');
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
            <ShopifyPublishButton 
              storeId={storeId} 
              productId={product.id} 
              isPublished={!!product.shopify_product_id} 
            />
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
            
            {/* Nova opção de menu para Tradução de Imagens */}
            <Button 
              variant="ghost" 
              className={`w-full justify-start text-sm relative text-gray-500`}
              onClick={() => setIsImageTranslationDialogOpen(true)}
            >
              <div className="flex items-center">
                <Languages className="h-5 w-5 mr-3 opacity-70" />
                <span>IA Imagens</span>
                <div className="absolute right-2 flex items-center">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                </div>
              </div>
            </Button>
            
            {/* Restaurar o botão de variações */}
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
            
            {/* Opção de menu para Fornecedores */}
            <Button 
              variant="ghost" 
              className={`w-full justify-start text-sm relative ${activeTab === "suppliers" ? "bg-blue-50 text-blue-700" : "text-gray-500"}`}
              onClick={() => setIsSupplierFeatureDialogOpen(true)}
            >
              <div className="flex items-center">
                <Store className="h-5 w-5 mr-3 opacity-70" />
                <span>Fornecedores</span>
                <div className="absolute right-2 flex items-center">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                </div>
              </div>
            </Button>
          </nav>
          
          {/* Ferramentas de IA */}
          <div className="border-t pt-6">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 h-5 w-1 rounded-full mr-2"></div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ferramentas de IA</h3>
            </div>
            
            {/* Ferramentas de Produto */}
            <div className="mb-4">
              <h4 className="text-xs text-gray-500 font-medium ml-1 mb-2 flex items-center">
                <span className="h-1 w-1 rounded-full bg-blue-500 mr-1.5"></span>
                Produto
              </h4>
              
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="group w-full justify-start text-sm px-4 py-3 h-auto rounded-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 text-blue-700 shadow-sm hover:shadow"
                  onClick={() => setIsTranslationDialogOpen(true)}
                >
                  <div className="relative mr-3">
                    <div className="absolute -inset-1 bg-blue-400 rounded-full opacity-20 group-hover:opacity-40 group-hover:blur-sm transition-all duration-300"></div>
                    <Languages className="h-5 w-5 relative text-blue-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium">Traduzir Produto</span>
                    <p className="text-xs text-blue-600/70 mt-0.5">Tradução automática</p>
                  </div>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="group w-full justify-start text-sm px-4 py-3 h-auto rounded-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 text-purple-700 shadow-sm hover:shadow"
                  onClick={() => setIsImproveDescriptionDialogOpen(true)}
                >
                  <div className="relative mr-3">
                    <div className="absolute -inset-1 bg-purple-400 rounded-full opacity-20 group-hover:opacity-40 group-hover:blur-sm transition-all duration-300"></div>
                    <Sparkles className="h-5 w-5 relative text-purple-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium">Melhorar Descrição</span>
                    <p className="text-xs text-purple-600/70 mt-0.5">Otimização com IA</p>
                  </div>
                </Button>
              </div>
            </div>
            
            {/* Ferramentas de Avaliação */}
            <div>
              <h4 className="text-xs text-gray-500 font-medium ml-1 mb-2 flex items-center">
                <span className="h-1 w-1 rounded-full bg-indigo-500 mr-1.5"></span>
                Avaliações
              </h4>
              
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="group w-full justify-start text-sm px-4 py-3 h-auto rounded-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border border-indigo-200 text-indigo-700 shadow-sm hover:shadow"
                  onClick={() => setActiveTab("reviews")}
                >
                  <div className="relative mr-3">
                    <div className="absolute -inset-1 bg-indigo-400 rounded-full opacity-20 group-hover:opacity-40 group-hover:blur-sm transition-all duration-300"></div>
                    <svg className="h-5 w-5 relative text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 10V3L4 14H7V21L16 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="font-medium">Gerar Avaliações</span>
                    <p className="text-xs text-indigo-600/70 mt-0.5">Crie reviews com IA</p>
                  </div>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="group w-full justify-start text-sm px-4 py-3 h-auto rounded-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-200 text-amber-700 shadow-sm hover:shadow"
                  onClick={() => setActiveTab("reviews")}
                >
                  <div className="relative mr-3">
                    <div className="absolute -inset-1 bg-amber-400 rounded-full opacity-20 group-hover:opacity-40 group-hover:blur-sm transition-all duration-300"></div>
                    <Sparkles className="h-5 w-5 relative text-amber-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium">Melhorar Avaliações</span>
                    <p className="text-xs text-amber-600/70 mt-0.5">Otimize reviews existentes</p>
                  </div>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="group w-full justify-start text-sm px-4 py-3 h-auto rounded-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 text-green-700 shadow-sm hover:shadow"
                  onClick={() => setActiveTab("reviews")}
                >
                  <div className="relative mr-3">
                    <div className="absolute -inset-1 bg-green-400 rounded-full opacity-20 group-hover:opacity-40 group-hover:blur-sm transition-all duration-300"></div>
                    <Languages className="h-5 w-5 relative text-green-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium">Traduzir Avaliações</span>
                    <p className="text-xs text-green-600/70 mt-0.5">Traduza reviews existentes</p>
                  </div>
                </Button>
              </div>
            </div>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Galeria de Mídia</CardTitle>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleUploadImages(e.target.files)}
                    />
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Adicionar Imagens
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="images" direction="horizontal">
                      {(provided) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                        >
                          {product?.images.map((image, index) => (
                            <Draggable key={image} draggableId={image} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`aspect-square relative rounded-md overflow-hidden border group ${
                                    snapshot.isDragging ? 'ring-2 ring-primary ring-offset-2' : ''
                                  }`}
                                >
                                  <img 
                                    src={image} 
                                    alt={`Imagem ${index + 1} do ${product.title}`} 
                                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                                  />
                                  <button
                                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/70"
                                    onClick={() => handleRemoveImage(image, index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute top-2 left-2 h-6 w-6 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-move"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
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
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsTranslationDialogOpen(true)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      Traduzir
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsImproveDescriptionDialogOpen(true)}
                      className="text-purple-600 hover:bg-purple-50"
                      disabled={isImprovingDescription}
                    >
                      {isImprovingDescription ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Melhorar com IA
                    </Button>
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
                      Editar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-gray-800 prose-p:text-gray-600 prose-p:my-3 prose-strong:text-gray-800 prose-strong:font-medium prose-ul:my-3 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-a:text-blue-600 space-y-4">
                  {product.description ? (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formatProductDescription(product.description) 
                      }} 
                      className="description-content p-1 rounded-md prose prose-img:my-4 prose-img:rounded-md"
                    />
                  ) : (
                    <p className="text-muted-foreground italic">
                      Este produto não possui uma descrição detalhada.
                    </p>
                  )}
                </div>
                
                {/* Componente de imagens da descrição - APENAS imagens que estavam na descrição */}
                {product.description_images && product.description_images.length > 0 && (
                  <DescriptionImages
                    images={product.description_images}
                    title={product.title}
                  />
                )}
                
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
            <span className="text-xs mt-1">Descrição</span>
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
      
      {/* Dialogs */}
      <TranslationDialog 
        isOpen={isTranslationDialogOpen} 
        onClose={() => {
          setIsTranslationDialogOpen(false);
          // Não precisamos mais navegar aqui, já que o sistema navegará automaticamente para a aba de descrição
          // após salvamento bem-sucedido
        }}
        product={{
          id: product?.id || "",
          title: product?.title || "",
          description: product?.description || "",
          language: product?.language || "pt-BR"
        }}
        onSaveTranslation={handleSaveTranslation}
      />
      
      <ImproveDescriptionDialog
        isOpen={isImproveDescriptionDialogOpen}
        onClose={() => setIsImproveDescriptionDialogOpen(false)}
        product={{
          id: product?.id || "",
          title: product?.title || "",
          description: product?.description || ""
        }}
        onImproveDescription={(description) => {
          setIsImprovingDescription(true);
          return updateProduct(product.id, { description })
            .then(() => {
              setProduct(prev => prev ? {...prev, description} : null);
              toast.success('Descrição melhorada com sucesso');
              setIsImprovingDescription(false);
            })
            .catch(error => {
              console.error('Erro ao salvar descrição melhorada:', error);
              toast.error('Erro ao salvar descrição melhorada');
              setIsImprovingDescription(false);
              throw error;
            });
        }}
      />
      
      {/* Dialog para IA Imagens - Versão simplificada e com data corrigida */}
      <Dialog open={isImageTranslationDialogOpen} onOpenChange={setIsImageTranslationDialogOpen}>
        <DialogContent className="sm:max-w-3xl bg-gradient-to-b from-background to-muted/20 shadow-lg border-muted">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-start space-x-2">
              <div className="bg-blue-500/10 p-2 rounded-full">
                <ImageIcon className="h-5 w-5 text-blue-500" />
              </div>
              <DialogTitle className="text-xl">IA para Imagens</DialogTitle>
            </div>
            <DialogDescription className="text-base opacity-90">
              Transforme suas imagens com tecnologia avançada de Inteligência Artificial
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Modos de IA para imagens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-32 bg-gradient-to-r from-blue-100 to-cyan-50 flex items-center justify-center p-6">
                  <div className="relative">
                    <Languages className="h-14 w-14 text-blue-500 opacity-80" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-blue-700 mb-2 flex items-center">
                    Tradução de Textos
                    <Badge className="ml-2 bg-blue-100 text-blue-600 border-0">Em breve</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Identifique e traduza automaticamente qualquer texto presente nas imagens.
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-purple-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-32 bg-gradient-to-r from-purple-100 to-indigo-50 flex items-center justify-center p-6">
                  <div className="relative">
                    <Sparkles className="h-14 w-14 text-purple-500 opacity-80" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-purple-700 mb-2 flex items-center">
                    Aprimoramento de Qualidade
                    <Badge className="ml-2 bg-purple-100 text-purple-600 border-0">Premium</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Melhore automaticamente a qualidade, brilho e nitidez das suas fotos.
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-amber-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-32 bg-gradient-to-r from-amber-100 to-yellow-50 flex items-center justify-center p-6">
                  <div className="relative">
                    <ImagePlus className="h-14 w-14 text-amber-500 opacity-80" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-amber-700 mb-2 flex items-center">
                    Geração de Variações
                    <Badge className="ml-2 bg-amber-100 text-amber-600 border-0">Avançado</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Crie variações profissionais com diversos fundos e estilos.
                  </p>
                </div>
              </div>
            </div>

            {/* Informações sobre o lançamento - Data corrigida para Maio */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-500/10 p-2 rounded-full">
                  <Lock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-blue-800">Recurso Premium — Em Desenvolvimento</h3>
                  <p className="mt-1 text-sm text-blue-600">
                    Esta funcionalidade estará disponível em breve!
                  </p>
                  
                  <div className="mt-4 relative">
                    <div className="absolute inset-0 bg-blue-100/50 rounded-md flex items-center justify-center z-10">
                      <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-3 py-1 text-xs">
                        Lançamento em Maio
                      </Badge>
                    </div>
                    <div className="h-8 w-full bg-gray-100 rounded-md overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: '85%' }}
                      >
                        85% concluído
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setIsImageTranslationDialogOpen(false)}>
              Fechar
            </Button>
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsImageTranslationDialogOpen(false)}>
              <span className="mr-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Inscrever-se para novidades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para o recurso de Fornecedores */}
      <Dialog open={isSupplierFeatureDialogOpen} onOpenChange={setIsSupplierFeatureDialogOpen}>
        <DialogContent className="sm:max-w-3xl bg-gradient-to-b from-background to-muted/20 shadow-lg border-muted">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-start space-x-2">
              <div className="bg-amber-500/10 p-2 rounded-full">
                <Store className="h-5 w-5 text-amber-500" />
              </div>
              <DialogTitle className="text-xl">IA para Fornecedores</DialogTitle>
            </div>
            <DialogDescription className="text-base opacity-90">
              Encontre os melhores fornecedores para seus produtos com análise inteligente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Funcionalidades de IA para fornecedores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-amber-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-32 bg-gradient-to-r from-amber-100 to-yellow-50 flex items-center justify-center p-6">
                  <div className="relative">
                    <Search className="h-14 w-14 text-amber-500 opacity-80" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-amber-700 mb-2 flex items-center">
                    Busca Inteligente
                    <Badge className="ml-2 bg-amber-100 text-amber-600 border-0">AliExpress</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Varredura automática do AliExpress para encontrar os melhores fornecedores.
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-green-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-32 bg-gradient-to-r from-green-100 to-emerald-50 flex items-center justify-center p-6">
                  <div className="relative">
                    <svg className="h-14 w-14 text-green-500 opacity-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-green-700 mb-2 flex items-center">
                    Análise de Qualidade
                    <Badge className="ml-2 bg-green-100 text-green-600 border-0">Avaliações</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Análise detalhada de avaliações e reputação de cada fornecedor.
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-32 bg-gradient-to-r from-blue-100 to-cyan-50 flex items-center justify-center p-6">
                  <div className="relative">
                    <svg className="h-14 w-14 text-blue-500 opacity-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-blue-700 mb-2 flex items-center">
                    Comparação de Preços
                    <Badge className="ml-2 bg-blue-100 text-blue-600 border-0">Economia</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Comparação de preços e condições para maximizar sua margem de lucro.
                  </p>
                </div>
              </div>
            </div>

            {/* Detalhes do recurso */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-amber-500/10 p-2 rounded-full">
                  <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10V20M8 10L4 9.99998V20L8 20M8 10L13.1956 3.93847C13.6886 3.3633 14.4642 3.11604 15.1992 3.29977L15.2467 3.31166C16.5885 3.64711 17.1929 5.21057 16.4258 6.36135L14 9.99998H18.5604C19.8225 9.99998 20.7691 11.1546 20.5216 12.3922L19.3216 18.3922C19.1346 19.3271 18.3138 20 17.3604 20L8 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-amber-800">Como funciona</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    Nossa IA analisa milhares de fornecedores no AliExpress para encontrar os melhores parceiros para seu negócio.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-amber-100">
                      <div className="flex items-start">
                        <Check className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-medium text-amber-800">Qualidade verificada</h4>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Fornecedores com histórico comprovado de qualidade e entrega
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-amber-100">
                      <div className="flex items-start">
                        <Check className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-medium text-amber-800">Melhores preços</h4>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Comparação automática para encontrar as melhores ofertas
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 relative">
                    <div className="absolute inset-0 bg-amber-100/50 rounded-md flex items-center justify-center z-10">
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 px-3 py-1 text-xs">
                        Lançamento em Maio
                      </Badge>
                    </div>
                    <div className="h-8 w-full bg-gray-100 rounded-md overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: '90%' }}
                      >
                        90% concluído
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setIsSupplierFeatureDialogOpen(false)}>
              Fechar
            </Button>
            <Button variant="default" className="bg-amber-600 hover:bg-amber-700" onClick={() => setIsSupplierFeatureDialogOpen(false)}>
              <span className="mr-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Inscrever-se para novidades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para o TrendHunter IA - Minerador de Produtos */}
      <Dialog open={isTrendHunterDialogOpen} onOpenChange={setIsTrendHunterDialogOpen}>
        <DialogContent className="sm:max-w-3xl bg-gradient-to-b from-background to-muted/20 shadow-lg border-muted">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-start space-x-2">
              <div className="bg-purple-500/10 p-2 rounded-full">
                <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 14.5L3 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5 9.5L17 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 7L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5 9.5L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 7L13 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.25 12.25L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.5 14.5C9.5 14.5 7.5 13.5 6.75 12.75C6 12 5 10 5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 10C5 10 7 8 9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 6C9 6 10.7107 6.36396 12.25 7.75C13.7893 9.13604 14 11 14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11C14 11 13.2457 12.1233 12.25 12.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <DialogTitle className="text-xl">TrendHunter IA</DialogTitle>
            </div>
            <DialogDescription className="text-base opacity-90">
              Descubra produtos campeões de vendas com inteligência artificial avançada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Funcionalidades do TrendHunter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-purple-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-32 bg-gradient-to-r from-purple-100 to-indigo-50 flex items-center justify-center p-6">
                  <div className="relative">
                    <svg className="h-14 w-14 text-purple-500 opacity-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 10C5 10 7 8 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 6C9 6 10.7107 6.36396 12.25 7.75C13.7893 9.13604 14 11 14 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 3L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.5 9.5L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.5 14.5L3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-purple-700 mb-2 flex items-center">
                    Mineração de Produtos
                    <Badge className="ml-2 bg-purple-100 text-purple-600 border-0">Avançado</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Descubra produtos altamente escaláveis com potencial de vendas explosivo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-32 bg-gradient-to-r from-blue-100 to-cyan-50 flex items-center justify-center p-6">
                  <div className="relative">
                    <svg className="h-14 w-14 text-blue-500 opacity-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-blue-700 mb-2 flex items-center">
                    Análise de Tendências
                    <Badge className="ml-2 bg-blue-100 text-blue-600 border-0">Insights</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Identifique tendências emergentes antes que elas se tornem mainstream.
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-green-100 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] duration-300">
                <div className="h-32 bg-gradient-to-r from-green-100 to-emerald-50 flex items-center justify-center p-6">
                  <div className="relative">
                    <svg className="h-14 w-14 text-green-500 opacity-80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 6.5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 6.5H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 10C11.933 10 13.5 8.433 13.5 6.5C13.5 4.567 11.933 3 10 3C8.067 3 6.5 4.567 6.5 6.5C6.5 8.433 8.067 10 10 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 17.5H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 17.5H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 21C15.933 21 17.5 19.433 17.5 17.5C17.5 15.567 15.933 14 14 14C12.067 14 10.5 15.567 10.5 17.5C10.5 19.433 12.067 21 14 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-green-700 mb-2 flex items-center">
                    Filtros Inteligentes
                    <Badge className="ml-2 bg-green-100 text-green-600 border-0">Customizável</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Configure filtros avançados para encontrar exatamente o tipo de produto que procura.
                  </p>
                </div>
              </div>
            </div>

            {/* Detalhes do recurso com exemplos */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-purple-500/10 p-2 rounded-full">
                  <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M17.5 6.5H17.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-purple-800">Como o TrendHunter IA funciona</h3>
                  <p className="mt-1 text-sm text-purple-700">
                    Nossa tecnologia de IA avançada vasculha milhares de produtos na biblioteca de anúncios para identificar itens com alto potencial de vendas e escalabilidade.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <div className="flex items-start">
                        <Check className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-medium text-purple-800">Identificação de campeões</h4>
                          <p className="text-xs text-purple-700 mt-0.5">
                            Descubra produtos com histórico comprovado de vendas e engajamento
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <div className="flex items-start">
                        <Check className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                        <div className="ml-2">
                          <h4 className="text-xs font-medium text-purple-800">Análise de mercado</h4>
                          <p className="text-xs text-purple-700 mt-0.5">
                            Avaliação da saturação do mercado e potencial de crescimento
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-white rounded-lg p-3 border border-purple-100">
                    <h4 className="text-xs font-medium text-purple-800 mb-2">Exemplos de produtos descobertos:</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="rounded overflow-hidden border border-gray-100 flex items-center text-xs">
                        <div className="w-10 h-10 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                          <svg className="h-6 w-6 text-purple-400" viewBox="0 0 24 24" fill="none">
                            <rect width="24" height="24" fill="white"/>
                            <path d="M3 9H21M9 21V9M7 3H17L21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9L7 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="p-2">
                          <p className="font-medium truncate">Pulseira magnética</p>
                          <p className="text-green-600">+430% vendas em 30 dias</p>
                        </div>
                      </div>
                      <div className="rounded overflow-hidden border border-gray-100 flex items-center text-xs">
                        <div className="w-10 h-10 bg-gray-50 flex-shrink-0 flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none">
                            <path d="M19 14C19 16.7614 16.7614 19 14 19M19 14C19 11.2386 16.7614 9 14 9M19 14H5M14 19C11.2386 19 9 16.7614 9 14M14 19C14.7956 19 15.5587 18.6839 16.1213 18.1213C16.6839 17.5587 17 16.7956 17 16M14 9C11.2386 9 9 11.2386 9 14M14 9C14.7956 9 15.5587 9.31607 16.1213 9.87868C16.6839 10.4413 17 11.2044 17 12M9 14C9 12.4087 9.63214 10.8826 10.7574 9.75736C11.8826 8.63214 13.4087 8 15 8C16.5913 8 18.1174 8.63214 19.2426 9.75736C20.3679 10.8826 21 12.4087 21 14C21 15.5913 20.3679 17.1174 19.2426 18.2426C18.1174 19.3679 16.5913 20 15 20H5L9 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="p-2">
                          <p className="font-medium truncate">Mini projetor LED</p>
                          <p className="text-green-600">Alta margem de lucro</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 relative">
                    <div className="absolute inset-0 bg-purple-100/50 rounded-md flex items-center justify-center z-10">
                      <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0 px-3 py-1 text-xs">
                        Lançamento em Maio
                      </Badge>
                    </div>
                    <div className="h-8 w-full bg-gray-100 rounded-md overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: '80%' }}
                      >
                        80% concluído
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button variant="outline" onClick={() => setIsTrendHunterDialogOpen(false)}>
              Fechar
            </Button>
            <Button variant="default" className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsTrendHunterDialogOpen(false)}>
              <span className="mr-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Inscrever-se para novidades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}