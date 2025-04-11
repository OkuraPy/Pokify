'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2, ExternalLink, Info, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatProductForShopify, publishProductToShopify, ShopifyStore } from '@/lib/shopify';
import { getStore, getProduct, getReviews, updateProduct } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Review {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  content: string | null | undefined;
  date: string | null | undefined;
  images: string[] | null | undefined;
  is_selected: boolean;
  is_published: boolean;
  improved_content?: string;
  translated_content?: string;
  created_at?: string;
}

interface ShopifyPublishButtonProps {
  storeId: string;
  productId: string;
  isPublished?: boolean;
  onSuccess?: (data: { shopifyProductId: string; productUrl: string }) => void;
}

export function ShopifyPublishButton({ storeId, productId, isPublished = false, onSuccess }: ShopifyPublishButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    shopifyProductId?: string;
    productUrl?: string;
    error?: string;
  } | null>(null);

  const handlePublish = async () => {
    try {
      setIsLoading(true);
      setCurrentStep(2); // Avançar para o passo de processamento
      
      // Obter a loja
      const { data: storeData, error: storeError } = await getStore(storeId);
      
      if (storeError || !storeData) {
        throw new Error(storeError?.message || 'Loja não encontrada');
      }
      
      // Criar o objeto ShopifyStore para garantir compatibilidade
      const store: ShopifyStore = {
        id: storeData.id,
        name: storeData.name,
        user_id: storeData.user_id,
        platform: storeData.platform,
        url: storeData.url || '',
        api_key: storeData.api_key || '',
        api_secret: storeData.api_secret,
        api_version: storeData.api_version || '2025-01',
        products_count: storeData.products_count,
        orders_count: storeData.orders_count,
        last_sync: storeData.last_sync,
        created_at: storeData.created_at,
        updated_at: storeData.updated_at
      };
      
      // Verificar se a loja é do Shopify e tem credenciais
      if (store.platform !== 'shopify') {
        throw new Error('Esta loja não é uma loja Shopify');
      }
      
      if (!store.api_key) {
        throw new Error('Esta loja não possui as credenciais do Shopify configuradas');
      }
      
      // Obter o produto
      const { data: product, error: productError } = await getProduct(productId);
      
      if (productError || !product) {
        throw new Error(productError?.message || 'Produto não encontrado');
      }
      
      // Verificar se o produto já foi publicado anteriormente
      const isUpdateOperation = isPublished && product.shopify_product_id;
      
      // Formatar o produto para o Shopify - sem incluir reviews
      const shopifyProductData = formatProductForShopify({
        ...product,
        reviews: []
      }, false);
      
      // Publicar ou atualizar no Shopify
      const result = await publishProductToShopify(
        store, 
        shopifyProductData,
        isUpdateOperation && product.shopify_product_id ? product.shopify_product_id : undefined
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao publicar no Shopify');
      }
      
      // Atualizar o produto com os dados do Shopify se for uma nova publicação
      if (!isUpdateOperation) {
        const { error: updateError } = await updateProduct(productId, {
          shopify_product_id: result.shopifyProductId,
          shopify_product_url: result.productUrl,
          status: 'published'
        });
        
        if (updateError) {
          console.error('Erro ao atualizar produto:', updateError);
        }
      }
      
      // Definir resultados
      setCurrentStep(3); // Avançar para o passo de conclusão
      setPublishResult({
        success: true,
        shopifyProductId: result.shopifyProductId,
        productUrl: result.productUrl
      });
      
      // Notificar sucesso
      toast.success(isUpdateOperation 
        ? 'Produto atualizado com sucesso no Shopify!' 
        : 'Produto publicado com sucesso no Shopify!');
      
      // Executar callback de sucesso se fornecido
      if (onSuccess && result.shopifyProductId && result.productUrl) {
        onSuccess({
          shopifyProductId: result.shopifyProductId,
          productUrl: result.productUrl
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao publicar no Shopify:', error);
      
      // Definir resultados de erro
      setCurrentStep(3); // Avançar para o passo de conclusão, mesmo com erro
      setPublishResult({
        success: false,
        error: errorMessage
      });
      
      toast.error(`Erro ao publicar no Shopify: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openPublishDialog = () => {
    setPublishResult(null);
    setCurrentStep(1); // Redefinir para o primeiro passo
    setIsDialogOpen(true);
  };
  
  const resetDialog = () => {
    setPublishResult(null);
    setCurrentStep(1);
  };

  // Conteúdo do passo atual
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Confirmação
        return (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-700">Sobre esta ação</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    {isPublished 
                      ? 'Você está prestes a atualizar este produto na sua loja Shopify. As informações serão sincronizadas com base nos dados atuais.'
                      : 'Você está prestes a publicar este produto na sua loja Shopify, tornando-o disponível para compra online.'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">O que será enviado:</h4>
              <ul className="space-y-1">
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Título e descrição do produto
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Preço e informações de estoque
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Imagens do produto
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Informações de categorias
                </li>
              </ul>
            </div>
            
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                className="bg-[#96bf48] hover:bg-[#7aa93c] text-white gap-2"
              >
                <span>{isPublished ? 'Atualizar produto' : 'Publicar produto'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        );
        
      case 2: // Processamento
        return (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">
                {isPublished ? 'Atualizando produto...' : 'Publicando produto...'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Estamos enviando os dados do seu produto para o Shopify. 
                Isso pode levar alguns segundos.
              </p>
            </div>
          </div>
        );
        
      case 3: // Resultado
        if (!publishResult) return null;
        
        return publishResult.success ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-lg font-medium">
                {isPublished ? 'Produto atualizado!' : 'Produto publicado!'}
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Seu produto foi {isPublished ? 'atualizado' : 'publicado'} com sucesso na sua loja Shopify.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="text-sm font-medium mb-3">Detalhes da publicação:</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ID do Produto:</span>
                  <Badge variant="outline" className="font-mono bg-white">
                    {typeof publishResult.shopifyProductId === 'string' && publishResult.shopifyProductId.includes('/') 
                      ? publishResult.shopifyProductId.split('/').pop() 
                      : publishResult.shopifyProductId}
                  </Badge>
                </div>
                
                <div className="pt-2">
                  {publishResult.productUrl && (
                    <a
                      href={publishResult.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 text-[#96bf48] hover:text-[#7aa93c] bg-white border border-[#96bf48] rounded-md py-2 px-4 text-sm font-medium transition-colors"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Ver produto no Shopify</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={() => setIsDialogOpen(false)}
                className="w-full"
              >
                Concluir
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium">
                Falha na publicação
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Ocorreu um erro ao tentar {isPublished ? 'atualizar' : 'publicar'} o produto no Shopify.
              </p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-700">Detalhes do erro:</h4>
                  <p className="text-sm text-red-600 mt-1">
                    {publishResult.error}
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="space-x-2">
              <Button 
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
              >
                Fechar
              </Button>
              <Button
                onClick={resetDialog}
                variant="default"
              >
                Tentar novamente
              </Button>
            </DialogFooter>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Button
        onClick={openPublishDialog}
        size="sm"
        variant="default"
        className={`text-white border-0 font-medium ${isPublished 
          ? 'bg-amber-500 hover:bg-amber-600' 
          : 'bg-[#96bf48] hover:bg-[#7aa93c]'}`}
      >
        <ShoppingBag className="h-4 w-4 mr-2" />
        {isPublished ? 'Atualizar no Shopify' : 'Publicar no Shopify'}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        // Só permite fechar o diálogo se não estiver carregando
        if (!isLoading) setIsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#96bf48]" />
              {isPublished ? 'Atualizar no Shopify' : 'Publicar no Shopify'}
            </DialogTitle>
            {currentStep === 1 && (
              <DialogDescription>
                {isPublished 
                  ? 'Atualize este produto na sua loja Shopify' 
                  : 'Publique este produto diretamente na sua loja Shopify'}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {/* Indicador de Progresso */}
          {currentStep < 3 && (
            <div className="relative mb-2">
              <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-100">
                <div
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                  className="shadow-none flex flex-col justify-center text-center text-white whitespace-nowrap bg-[#96bf48] transition-all duration-500"
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className={currentStep >= 1 ? "font-medium text-[#96bf48]" : ""}>Confirmação</span>
                <span className={currentStep >= 2 ? "font-medium text-[#96bf48]" : ""}>Processamento</span>
                <span className={currentStep >= 3 ? "font-medium text-[#96bf48]" : ""}>Conclusão</span>
              </div>
            </div>
          )}
          
          {/* Conteúdo do passo atual */}
          {renderStepContent()}
        </DialogContent>
      </Dialog>
    </>
  );
} 