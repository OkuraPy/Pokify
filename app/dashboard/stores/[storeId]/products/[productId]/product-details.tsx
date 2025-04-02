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
      
      toast.success('Tradução salva com sucesso');
      return Promise.resolve();
    } catch (error) {
      console.error('Erro ao salvar tradução:', error);
      toast.error('Erro ao salvar tradução');
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
        onClose={() => setIsTranslationDialogOpen(false)}
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
      
      {/* Dialog para o recurso de Fornecedores */}
      <Dialog open={isSupplierFeatureDialogOpen} onOpenChange={setIsSupplierFeatureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Recurso em Desenvolvimento</DialogTitle>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Lock className="h-5 w-5 text-amber-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Recurso Premium</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>O recurso de gerenciamento de fornecedores estará disponível em breve!</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Esta funcionalidade permitirá encontrar e comparar fornecedores alternativos para seus produtos, ajudando a melhorar suas margens.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para IA Imagens */}
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
                    Identifique e traduza automaticamente qualquer texto presente nas imagens
                    do seu produto para o idioma que desejar.
                  </p>
                  <ul className="text-xs space-y-1 text-gray-500">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-blue-500" />
                      <span>Tradução de textos embutidos</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-blue-500" />
                      <span>Preservação da fonte e estilo</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-blue-500" />
                      <span>Suporte para 40+ idiomas</span>
                    </li>
                  </ul>
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
                    Melhore automaticamente a qualidade, brilho e nitidez das 
                    fotos do seu produto.
                  </p>
                  <ul className="text-xs space-y-1 text-gray-500">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-purple-500" />
                      <span>Super-resolução 4x</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-purple-500" />
                      <span>Remoção de ruído e grãos</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-purple-500" />
                      <span>Correção automática de cor</span>
                    </li>
                  </ul>
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
                    Crie variações profissionais das suas imagens com diversos
                    fundos e estilos.
                  </p>
                  <ul className="text-xs space-y-1 text-gray-500">
                    <li className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-amber-500" />
                      <span>Remoção de fundo automática</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-amber-500" />
                      <span>Novos fundos profissionais</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-3 w-3 mr-1 text-amber-500" />
                      <span>Múltiplos ângulos de produto</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Informações sobre o lançamento */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-500/10 p-2 rounded-full">
                  <Lock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-semibold text-blue-800">Recurso Premium — Em Desenvolvimento</h3>
                  <p className="mt-1 text-sm text-blue-600">
                    Esta funcionalidade estará disponível em breve! Estamos colocando os toques finais
                    na nossa tecnologia de processamento de imagens.
                  </p>
                  
                  <div className="mt-4 relative">
                    <div className="absolute inset-0 bg-blue-100/50 rounded-md flex items-center justify-center z-10">
                      <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 px-3 py-1 text-xs">
                        Lançamento em Outubro
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
                  
                  <p className="mt-4 text-sm text-gray-600">
                    Será possível processar até <strong>100 imagens por mês</strong> no plano Premium, 
                    melhorando significativamente a qualidade das suas fotos de produto e 
                    aumentando as taxas de conversão.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <div className="flex items-start">
                  <div className="bg-indigo-500/10 p-1.5 rounded-full">
                    <svg className="h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2.67 18.95L7.6 15.64C8.39 15.11 9.53 15.17 10.24 15.78L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L22 13.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-indigo-700">Fotografias Profissionais</h4>
                    <p className="mt-1 text-xs text-indigo-600">
                      Transforme fotos amadoras em imagens com qualidade profissional 
                      usando nossa IA de aprimoramento visual.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-start">
                  <div className="bg-green-500/10 p-1.5 rounded-full">
                    <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3.5 9.08984H20.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15.6947 13.7002H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15.6947 16.7002H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.9955 13.7002H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.9955 16.7002H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.29431 13.7002H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.29431 16.7002H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-700">Prepare-se</h4>
                    <p className="mt-1 text-xs text-green-600">
                      Cadastre-se na nossa lista de espera para ser notificado 
                      quando este recurso estiver disponível para o seu plano.
                    </p>
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
    </div>
  );
}