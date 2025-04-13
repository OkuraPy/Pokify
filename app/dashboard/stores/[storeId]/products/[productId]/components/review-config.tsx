'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { saveConfig, loadConfig, publishProductReviews } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Settings, Info, Check, ArrowRight } from 'lucide-react';

interface ConfigForm {
  reviewPosition: string;
}

const ReviewConfig: React.FC<{ productId: string; userId: string; shopDomain: string; }> = ({ productId, userId, shopDomain }) => {
  const { register, handleSubmit, setValue } = useForm<ConfigForm>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [iframeUrl, setIframeUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      // Só busca se todos os valores estiverem definidos
      if (!shopDomain || !productId || !userId) {
        console.log('Parâmetros incompletos para carregar configuração:', { shopDomain, productId, userId });
        return;
      }

      try {
        const config = await loadConfig(shopDomain, productId, userId);
        if (config) {
          setValue('reviewPosition', 'apos_descricao');
          
          // Verificar se já há reviews publicados
          try {
            const { data: publishedReviews } = await supabase
              .from('published_reviews_json')
              .select('id')
              .eq('product_id', productId)
              .maybeSingle();
              
            setIsPublished(!!publishedReviews);
          } catch (error) {
            console.error('Erro ao verificar reviews publicados:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        // Definir valores padrão em caso de erro
        setValue('reviewPosition', 'apos_descricao');
      }
    };
    fetchConfig();
  }, [productId, userId, shopDomain, setValue]);

  const handlePublishReviews = async (data: ConfigForm) => {
    setLoading(true);
    setCurrentStep(2); // Avançar para o passo de processamento
    
    try {
      // Verifica se todos os valores necessários estão presentes
      if (!shopDomain || !productId || !userId) {
        throw new Error('Parâmetros incompletos para salvar configuração');
      }

      // 1. Salvar a configuração
      const configToSave = {
        shopDomain,
        productId,
        userId,
        reviewPosition: 'apos_descricao',
        customSelector: '',
        active: true,
        // Valores padrão para os campos simplificados
        css_selector: '',
        display_format: 'default',
        primary_color: '#7e3af2',
        secondary_color: '#c4b5fd'
      };

      await saveConfig(configToSave);
      
      // 2. Publicar os reviews
      const result = await publishProductReviews(productId);
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao publicar avaliações');
      }
      
      // 3. Gerar URL para o iframe
      const iframeUrl = `/api/reviews/${productId}/iframe?shopDomain=${encodeURIComponent(shopDomain)}&userId=${encodeURIComponent(userId)}`;
      setIframeUrl(iframeUrl);
      
      // 4. Definir resultado
      setPublishResult({
        success: true,
        message: 'Reviews publicados com sucesso'
      });
      
      setIsPublished(true);
      setCurrentStep(3); // Avançar para o passo de conclusão
    } catch (error) {
      console.error('Erro ao publicar reviews:', error);
      
      setPublishResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      toast.error('Erro ao publicar reviews: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      setCurrentStep(3); // Avançar para o passo de conclusão com erro
    } finally {
      setLoading(false);
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
      case 1: // Configuração e Confirmação
        return (
          <form onSubmit={handleSubmit(handlePublishReviews)} className="space-y-6 py-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-700">Sobre esta ação</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    {isPublished 
                      ? 'Esta ação irá atualizar os reviews deste produto e gerar um código para incorporação na sua loja.'
                      : 'Esta ação irá publicar os reviews deste produto e gerar um código para incorporação na sua loja.'}
                  </p>
                  <input type="hidden" {...register('reviewPosition')} value="apos_descricao" />
                </div>
              </div>
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
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <span>{isPublished ? 'Atualizar reviews' : 'Publicar reviews'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
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
                {isPublished ? 'Atualizando reviews...' : 'Publicando reviews...'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Estamos processando e publicando suas avaliações. 
                Isso pode levar alguns segundos.
              </p>
            </div>
          </div>
        );
        
      case 3: // Resultado
        if (!publishResult) return null;
        
        return (
          <div className="space-y-6 py-4">
            {publishResult.success ? (
              <div className="space-y-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-green-700">Reviews publicados com sucesso!</h4>
                      <p className="text-sm text-green-600 mt-1">
                        Os reviews foram publicados com sucesso. Utilize o código abaixo para exibi-los na sua loja.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Código do Iframe para exibir os Reviews</h4>
                  <Textarea
                    className="font-mono text-sm"
                    readOnly
                    rows={5}
                    value={`<iframe 
  src="${window.location.origin}${iframeUrl}" 
  style="width:100%; border:none; height:1000px; overflow:hidden;" 
  title="Avaliações do Produto"
  scrolling="no"
  frameBorder="0"
></iframe>`}
                  />
                  
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe 
  src="${window.location.origin}${iframeUrl}" 
  style="width:100%; border:none; height:1000px; overflow:hidden;" 
  title="Avaliações do Produto"
  scrolling="no"
  frameBorder="0"
></iframe>`);
                      toast.success('Código copiado para a área de transferência!');
                    }}
                    className="w-full"
                  >
                    Copiar Código
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500">
                  Copie este código e adicione-o à página do produto na sua loja Shopify para exibir os reviews.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-700">Erro ao publicar reviews</h4>
                      <p className="text-sm text-red-600 mt-1">
                        {publishResult.error || 'Ocorreu um erro ao publicar seus reviews. Tente novamente.'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={resetDialog}
                  className="w-full"
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div>
      <Button 
        onClick={openPublishDialog} 
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md shadow-sm w-full hidden"
        data-publish-reviews="true"
      >
        <span className="flex items-center justify-center">
          <Settings className="w-5 h-5 mr-2" />
          Publicar Reviews
        </span>
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isPublished ? 'Atualizar Reviews' : 'Publicar Reviews'}
            </DialogTitle>
            <DialogDescription>
              {isPublished 
                ? 'Atualize os reviews deste produto e obtenha o código para exibi-los na sua loja' 
                : 'Publique os reviews deste produto e obtenha o código para exibi-los na sua loja'}
            </DialogDescription>
          </DialogHeader>
          
          {renderStepContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewConfig; 