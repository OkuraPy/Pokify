'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogPortal, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { saveConfig, loadConfig, publishProductReviews } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Settings, Info, Check, ArrowRight, HelpCircle, PlayCircle, ExternalLink, X, Code, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import dynamic from 'next/dynamic';

// Importação dinâmica do Plyr para evitar problemas de SSR
const Plyr = dynamic(() => import('plyr-react').then(mod => mod.default), { 
  ssr: false,
  loading: () => (
    <div className="aspect-video w-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-center p-8">
        <PlayCircle className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600 font-medium">Carregando player premium...</p>
      </div>
    </div>
  )
});
import 'plyr-react/plyr.css';

interface ConfigForm {
  reviewPosition: string;
}

// Componente personalizado de overlay com opacidade reduzida
const CustomDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
CustomDialogOverlay.displayName = "CustomDialogOverlay";

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
  
  // Estados para o tutorial
  const [showTutorial, setShowTutorial] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  // Configurações do Plyr
  const plyrOptions = {
    controls: [
      'play-large', 'play', 'progress', 'current-time', 'duration', 
      'mute', 'volume', 'settings', 'fullscreen'
    ],
    settings: ['quality', 'speed'],
    resetOnEnd: true,
    youtube: {
      noCookie: true,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
    },
    autoplay: false,
  };

  // Configuração do vídeo do YouTube com ID
  const youtubeSource = {
    type: 'video' as const,
    sources: [
      {
        src: 'T0Cc3u2jBQE',
        provider: 'youtube' as const,
      },
    ],
  };

  useEffect(() => {
    if (showTutorial) {
      // Simula o tempo de carregamento do player
      const timer = setTimeout(() => {
        setVideoLoaded(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [showTutorial]);
    
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

  const openTutorial = () => {
    setShowTutorial(true);
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
                
                {/* Banner do Tutorial */}
                <div className="mt-2 overflow-hidden rounded-xl border border-blue-100 shadow-md transition-all hover:shadow-lg animate-fadeIn">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2">
                    <div className="flex items-center gap-2 text-white pl-2">
                      <Code className="h-4 w-4" />
                      <p className="text-xs font-medium">Código para Shopify</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-b from-blue-50 to-white">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 rounded-full p-2 mt-0.5 flex-shrink-0">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-blue-800 font-semibold leading-tight">
                          Não sabe como adicionar este código na sua loja Shopify?
                        </p>
                        <p className="text-xs text-blue-700/80 leading-relaxed">
                          Veja nosso tutorial em vídeo que mostra passo a passo como incorporar reviews na sua loja.
                        </p>
                        <div className="pt-1">
                          <Button
                            type="button"
                            onClick={openTutorial}
                            className="group text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:shadow transition-all duration-200 w-full sm:w-auto"
                          >
                            <PlayCircle className="h-4 w-4 group-hover:animate-pulse" />
                            <span className="font-medium">Ver vídeo tutorial</span>
                            <span className="hidden sm:inline ml-1 text-blue-100 group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                          </Button>
                        </div>
                      </div>
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
  style="width:100%; border:none; height:1300px; overflow:hidden;" 
  title="Avaliações do Produto"
  scrolling="no"
  frameBorder="0"
></iframe>`}
                  />
                  
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe 
  src="${window.location.origin}${iframeUrl}" 
  style="width:100%; border:none; height:1300px; overflow:hidden;" 
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
      
      {/* Modal de Tutorial para adicionar o código na loja Shopify */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogPortal>
          <CustomDialogOverlay />
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[700px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] max-h-[95vh] overflow-hidden rounded-xl mx-auto"
          >
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <PlayCircle className="h-8 w-8" />
                <DialogTitle className="text-2xl font-bold">Como adicionar Reviews na sua loja Shopify</DialogTitle>
              </div>
              <DialogDescription className="text-blue-100 text-base">
                Um tutorial passo a passo para incorporar avaliações na página do produto
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {/* Player de vídeo premium customizado */}
              <div className="aspect-video w-full mb-6 rounded-xl overflow-hidden border border-gray-100 shadow-lg">
                <div className={cn(
                  "relative w-full h-full",
                  !videoLoaded && "bg-gray-100"
                )}>
                  {!videoLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                      <div className="text-center p-8">
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                          <div className="absolute inset-0 bg-blue-500/40 rounded-full animate-pulse"></div>
                          <PlayCircle className="absolute inset-0 m-auto h-16 w-16 text-blue-600" />
                        </div>
                        <p className="text-gray-700 font-medium">Carregando player premium...</p>
                      </div>
                    </div>
                  )}
                  
                  <div className={cn(
                    "plyr-react-container w-full h-full rounded-lg overflow-hidden transition-opacity duration-500",
                    videoLoaded ? "opacity-100" : "opacity-0"
                  )}>
                    <Plyr 
                      ref={videoRef}
                      options={plyrOptions} 
                      source={youtubeSource} 
                    />
                  </div>
                </div>
              </div>

              {/* Instruções passo a passo - Design aprimorado */}
              <div className="space-y-4 mb-6">
                <h3 className="font-medium text-lg flex items-center gap-2 text-blue-800">
                  <Check className="h-5 w-5 text-blue-600" />
                  Instruções passo a passo
                </h3>
                
                <div className="space-y-0">
                  <div className="step-item relative pl-10 pb-5 border-l-2 border-blue-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-blue-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">1</div>
                    <h4 className="font-medium text-blue-800">Acesse sua loja Shopify</h4>
                    <p className="text-sm text-gray-600 mt-1">Entre no painel de administração da sua loja Shopify</p>
                  </div>
                  
                  <div className="step-item relative pl-10 pb-5 border-l-2 border-blue-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-blue-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">2</div>
                    <h4 className="font-medium text-blue-800">Editar o template do produto</h4>
                    <p className="text-sm text-gray-600 mt-1">Navegue até "Temas" → "Personalizar" → Selecione a página de produto</p>
                  </div>
                  
                  <div className="step-item relative pl-10 pb-5 border-l-2 border-blue-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-blue-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">3</div>
                    <h4 className="font-medium text-blue-800">Adicione uma seção personalizada</h4>
                    <p className="text-sm text-gray-600 mt-1">Clique em "Adicionar seção" → "HTML personalizado"</p>
                  </div>
                  
                  <div className="step-item relative pl-10 pb-5 border-l-2 border-blue-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-blue-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">4</div>
                    <h4 className="font-medium text-blue-800">Cole o código gerado</h4>
                    <p className="text-sm text-gray-600 mt-1">Cole o código do iframe que você copiou no campo de HTML personalizado</p>
                  </div>
                  
                  <div className="step-item relative pl-10 border-l-2 border-blue-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-blue-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">5</div>
                    <h4 className="font-medium text-blue-800">Salve as alterações</h4>
                    <p className="text-sm text-gray-600 mt-1">Clique em "Salvar" para aplicar as alterações ao seu tema</p>
                  </div>
                </div>
              </div>

              {/* Dica pro */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full p-1 flex-shrink-0">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Dica profissional</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Você também pode usar um app como "Custom Code" ou "Script Editor" para adicionar o código do iframe em todas as páginas de produto de uma vez, sem precisar editar o tema manualmente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-between sticky bottom-0 pt-2 pb-1 bg-white">
                <Button
                  variant="outline"
                  onClick={() => setShowTutorial(false)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Fechar
                </Button>
                
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                  onClick={() => {
                    window.open('https://help.shopify.com/pt-BR/manual/online-store/themes/theme-structure/customize-sections-and-blocks', '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Documentação Shopify
                </Button>
              </div>
              
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4 text-white" />
                <span className="sr-only">Fechar</span>
              </DialogPrimitive.Close>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
};

export default ReviewConfig; 