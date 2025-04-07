'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2, ExternalLink } from 'lucide-react';
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
  const [includeReviews, setIncludeReviews] = useState(true);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    shopifyProductId?: string;
    productUrl?: string;
    error?: string;
  } | null>(null);

  const handlePublish = async () => {
    try {
      setIsLoading(true);
      
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
      
      // Obter reviews selecionadas se necessário
      let reviews: Review[] = [];
      if (includeReviews && product.reviews_count > 0) {
        const { data: reviewsData, error: reviewsError } = await getReviews(productId);
        
        if (!reviewsError && reviewsData) {
          reviews = reviewsData.filter((review: any) => review.is_selected);
        }
      }
      
      // Formatar o produto para o Shopify
      const shopifyProductData = formatProductForShopify({
        ...product,
        reviews: includeReviews ? reviews : []
      }, includeReviews);
      
      // Publicar no Shopify
      const result = await publishProductToShopify(store, shopifyProductData);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao publicar no Shopify');
      }
      
      // Atualizar o produto com os dados do Shopify
      const { error: updateError } = await updateProduct(productId, {
        shopify_product_id: result.shopifyProductId,
        shopify_product_url: result.productUrl,
        status: 'published'
      });
      
      if (updateError) {
        console.error('Erro ao atualizar produto:', updateError);
      }
      
      // Registrar na tabela de histórico de publicações
      // Esta parte seria implementada se houvesse uma função para isso
      
      // Definir resultados
      setPublishResult({
        success: true,
        shopifyProductId: result.shopifyProductId,
        productUrl: result.productUrl
      });
      
      // Notificar sucesso
      toast.success('Produto publicado com sucesso no Shopify!');
      
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
    setIsDialogOpen(true);
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isPublished ? 'Atualizar no Shopify' : 'Publicar no Shopify'}</DialogTitle>
            <DialogDescription>
              {isPublished 
                ? 'Atualize este produto na sua loja Shopify' 
                : 'Publique este produto diretamente na sua loja Shopify'}
            </DialogDescription>
          </DialogHeader>
          
          {!publishResult ? (
            <div className="space-y-4 py-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="includeReviews" 
                  checked={includeReviews} 
                  onCheckedChange={(checked) => setIncludeReviews(checked as boolean)}
                />
                <div>
                  <Label htmlFor="includeReviews" className="text-base font-medium">
                    Incluir avaliações selecionadas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Adicionar avaliações selecionadas na descrição do produto
                  </p>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isPublished ? 'Atualizando...' : 'Publicando...'}
                    </>
                  ) : (
                    isPublished ? 'Atualizar no Shopify' : 'Publicar no Shopify'
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-6">
              {publishResult.success ? (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-md border border-green-100">
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Produto publicado com sucesso!</span>
                    </div>
                    <p className="text-sm text-green-600">
                      Seu produto foi publicado com sucesso e já está disponível na sua loja Shopify.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <p className="text-sm font-medium mb-2">Detalhes da publicação:</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">ID do Produto:</span>
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {typeof publishResult.shopifyProductId === 'string' && publishResult.shopifyProductId.includes('/') 
                            ? publishResult.shopifyProductId.split('/').pop() 
                            : publishResult.shopifyProductId}
                        </span>
                      </div>
                      {publishResult.productUrl && (
                        <div className="mt-4">
                          <a
                            href={publishResult.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <span>Ver no Shopify</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-md border border-red-100">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Falha na publicação</span>
                    </div>
                    <p className="text-sm text-red-600">
                      {publishResult.error}
                    </p>
                  </div>
                </div>
              )}
              
              <DialogFooter className="mt-6">
                <Button 
                  onClick={() => setIsDialogOpen(false)} 
                  variant={publishResult.success ? "outline" : "default"}
                >
                  {publishResult.success ? "Fechar" : "Voltar"}
                </Button>
                {!publishResult.success && (
                  <Button
                    onClick={() => {
                      setPublishResult(null);
                    }}
                    variant="outline"
                  >
                    Tentar novamente
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 