'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
  DialogClose,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Store, 
  Loader2, 
  Globe, 
  ShoppingBag, 
  Key, 
  CheckCircle2,
  Package,
  HelpCircle,
  PlayCircle,
  ExternalLink,
  X,
  Lightbulb,
} from 'lucide-react';
import { createStore } from '@/lib/supabase';
import { verifyShopifyCredentials } from '@/lib/shopify';
import { useAuth } from '@/hooks/use-auth';
import { useStores } from '@/hooks/use-stores';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Importação dinâmica do Plyr para evitar problemas de SSR
const Plyr = dynamic(() => import('plyr-react').then(mod => mod.default), { 
  ssr: false,
  loading: () => (
    <div className="aspect-video w-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-center p-8">
        <PlayCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-600 font-medium">Carregando player premium...</p>
      </div>
    </div>
  )
});
import 'plyr-react/plyr.css';

// Schema atualizado - todos os campos obrigatórios para Shopify
const formSchema = z.object({
  name: z.string({ required_error: 'O nome da loja é obrigatório' })
    .min(2, 'O nome deve ter pelo menos 2 caracteres'),
  platform: z.string({ required_error: 'A plataforma é obrigatória' })
    .min(1, 'A plataforma é obrigatória'),
  url: z.string({ required_error: 'A URL da loja é obrigatória' })
    .url('URL inválida'),
  apiKey: z.string({ required_error: 'A chave da API é obrigatória' })
    .min(1, 'A chave da API é obrigatória'),
});

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

interface StoreFormProps {
  open: boolean;
  onClose: () => void;
  storesCount: number;
}

export function StoreForm({ open, onClose, storesCount = 0 }: StoreFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Estados para validação Shopify
  const [shopifyCheck, setShopifyCheck] = useState<'idle'|'checking'|'valid'|'invalid'>('idle');
  const [shopifyError, setShopifyError] = useState<string | null>(null);

  // Função para checar credenciais em tempo real
  async function checkShopifyCreds(url: string, apiKey: string) {
    if (!url || !apiKey) {
      setShopifyCheck('idle');
      setShopifyError(null);
      return;
    }
    setShopifyCheck('checking');
    setShopifyError(null);
    try {
      const result = await verifyShopifyCredentials(url, apiKey);
      if (result.valid) {
        setShopifyCheck('valid');
        setShopifyError(null);
      } else {
        setShopifyCheck('invalid');
        setShopifyError('Chave da API ou URL inválida. Confira se você digitou corretamente. Veja o tutorial para aprender a pegar a chave correta.');
      }
    } catch (err: any) {
      setShopifyCheck('invalid');
      setShopifyError('Chave da API ou URL inválida. Confira se você digitou corretamente. Veja o tutorial para aprender a pegar a chave correta.');
    }
  }
  const videoRef = useRef(null);
  const { user } = useAuth();
  const { maxStores, canAddStore, refreshStores } = useStores();
  const router = useRouter();

  // Efeito para detectar quando o modal é aberto e definir um tempo para marcar o vídeo como carregado
  useEffect(() => {
    if (showApiKeyHelp) {
      // Simula o tempo de carregamento do player
      const timer = setTimeout(() => {
        setVideoLoaded(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [showApiKeyHelp]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      platform: '',
      url: '',
      apiKey: '',
    },
  });

  // Configurações avançadas para o Plyr
  const plyrOptions = {
    controls: [
      'play-large', // Botão de play grande no centro
      'play', // Botão de play na barra de controle
      'progress', // Barra de progresso
      'current-time', // Tempo atual
      'duration', // Duração total
      'mute', // Botão de mudo
      'volume', // Controle de volume
      'settings', // Menu de configurações
      'fullscreen', // Botão de tela cheia
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
        src: 'PCfYqnmvXKA',
        provider: 'youtube' as const,
      },
    ],
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!canAddStore) {
      toast.error('Você atingiu o limite de lojas');
      return;
    }

    if (!user) {
      toast.error('Você precisa estar autenticado para criar uma loja');
      return;
    }

    try {
      setIsLoading(true);
      
      const newStore = {
        name: values.name,
        url: values.url,
        user_id: user.id,
        platform: (values.platform || 'other') as 'aliexpress' | 'shopify' | 'other',
        api_key: values.apiKey || undefined,
      };
      
      const { data, error } = await createStore(newStore);
      
      if (error) {
        throw new Error((error as any).message || 'Erro ao cadastrar loja');
      }
      
      // Atualizar a lista de lojas no contexto compartilhado
      await refreshStores();
      
      toast.success('Loja cadastrada com sucesso!');
      form.reset();
      onClose();
    } catch (error: any) {
      toast.error(`Erro ao cadastrar loja: ${error.message}`);
      console.error('Erro ao cadastrar loja:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderiza o ícone da plataforma selecionada
  const renderPlatformIcon = () => {
    switch (selectedPlatform) {
      case 'shopify':
        return <ShoppingBag className="h-5 w-5 text-green-500" />;
      case 'aliexpress':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'other':
        return <Store className="h-5 w-5 text-blue-500" />;
      default:
        return <Store className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-lg">
          <div className="flex flex-col h-full">
            {/* Cabeçalho com destaque visual */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Store className="h-8 w-8" />
                <DialogTitle className="text-2xl font-bold">Nova Loja</DialogTitle>
              </div>
              <DialogDescription className="text-blue-100 text-base">
                Cadastre uma nova loja para começar a sincronizar produtos
              </DialogDescription>
            </div>

            <div className="p-6">
              {/* Alerta de limite */}
              {!canAddStore ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Você atingiu o limite de {maxStores} lojas. Para adicionar mais lojas, 
                    considere fazer upgrade do seu plano.
                  </AlertDescription>
                </Alert>
              ) : storesCount >= maxStores - 1 ? (
                <Alert className="mb-6 border-amber-400 text-amber-800 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    Esta será sua última loja disponível no plano atual.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex items-center gap-2 p-3 mb-6 bg-green-50 text-green-700 rounded-md border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p>Você pode adicionar até {maxStores} lojas no seu plano atual.</p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Nome da Loja */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <FormLabel className="text-sm font-medium">Nome da Loja *</FormLabel>
                          </div>
                          <FormControl>
                            <Input 
                              placeholder="Minha Loja" 
                              {...field}
                              className="mt-2" 
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground pt-1">
                            Nome para identificar sua loja
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Plataforma */}
                    <FormField
                      control={form.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            {renderPlatformIcon()}
                            <FormLabel className="text-sm font-medium">Plataforma</FormLabel>
                          </div>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedPlatform(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Selecione uma plataforma" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="shopify" className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <ShoppingBag className="h-4 w-4 text-green-500" />
                                  <span>Shopify</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="aliexpress">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-orange-500" />
                                  <span>AliExpress</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="other">
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4 text-blue-500" />
                                  <span>Outra</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs text-muted-foreground pt-1">
                            Plataforma de e-commerce utilizada
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* URL da Loja */}
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <FormLabel className="text-sm font-medium">URL da Loja *</FormLabel>
                          {/* Feedback visual para Shopify */}
                          {selectedPlatform === 'shopify' && (
                            <span>
                              {shopifyCheck === 'checking' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin ml-2" />}
                              {shopifyCheck === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />}
                              {shopifyCheck === 'invalid' && <X className="h-4 w-4 text-red-500 ml-2" />}
                            </span>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            placeholder="https://minhaloja.com.br"
                            {...field}
                            className="mt-2"
                            onBlur={async (e) => {
                              field.onBlur?.(e);
                              if (selectedPlatform === 'shopify') {
                                await checkShopifyCreds(e.target.value, form.getValues('apiKey'));
                              }
                            }}
                            onChange={async (e) => {
                              field.onChange(e);
                              if (selectedPlatform === 'shopify') {
                                // Checagem ao digitar
                                await checkShopifyCreds(e.target.value, form.getValues('apiKey'));
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground pt-1">
                          URL completa da sua loja (ex: https://minhaloja.com.br)
                        </FormDescription>
                        {/* Mensagem de erro Shopify */}
                        {selectedPlatform === 'shopify' && shopifyCheck === 'invalid' && shopifyError && (
                          <div className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                            <X className="h-3 w-3" />
                            {shopifyError} <button type="button" className="ml-1 underline text-blue-700" onClick={() => setShowApiKeyHelp(true)}>Ver tutorial</button>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Chave da API com sugestão contextual */}
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <FormLabel className="text-sm font-medium">Chave da API</FormLabel>
                          {/* Feedback visual para Shopify */}
                          {selectedPlatform === 'shopify' && (
                            <span>
                              {shopifyCheck === 'checking' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin ml-2" />}
                              {shopifyCheck === 'valid' && <CheckCircle2 className="h-4 w-4 text-green-500 ml-2" />}
                              {shopifyCheck === 'invalid' && <X className="h-4 w-4 text-red-500 ml-2" />}
                            </span>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={selectedPlatform === 'shopify' 
                              ? "Chave da API do Shopify" 
                              : selectedPlatform === 'aliexpress'
                              ? "Chave da API do AliExpress"
                              : "Chave da API da plataforma (opcional)"}
                            {...field}
                            className="mt-2"
                            onBlur={async (e) => {
                              field.onBlur?.(e);
                              if (selectedPlatform === 'shopify') {
                                await checkShopifyCreds(form.getValues('url'), e.target.value);
                              }
                            }}
                            onChange={async (e) => {
                              field.onChange(e);
                              if (selectedPlatform === 'shopify') {
                                // Checagem ao digitar
                                await checkShopifyCreds(form.getValues('url'), e.target.value);
                              }
                            }}
                          />
                        </FormControl>
                        
                        {/* Destaque para o Tutorial do Shopify - Design Premium */}
                        {selectedPlatform === 'shopify' && (
                          <div className="mt-4 overflow-hidden rounded-xl border border-blue-100 shadow-md transition-all hover:shadow-lg animate-fadeIn">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2">
                              <div className="flex items-center gap-2 text-white pl-2">
                                <ShoppingBag className="h-4 w-4" />
                                <p className="text-xs font-medium">Shopify API</p>
                              </div>
                            </div>
                            <div className="p-4 bg-gradient-to-b from-blue-50 to-white">
                              <div className="flex items-start gap-3">
                                <div className="bg-blue-100 rounded-full p-2 mt-0.5 flex-shrink-0">
                                  <HelpCircle className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm text-blue-800 font-semibold leading-tight">
                                    Precisa de ajuda para obter sua chave API do Shopify?
                                  </p>
                                  <p className="text-xs text-blue-700/80 leading-relaxed">
                                    Esta chave é <span className="font-medium">essencial</span> para sincronizar produtos e pedidos 
                                    entre o Dropfy e sua loja Shopify.
                                  </p>
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setShowApiKeyHelp(true);
                                      }}
                                      className="group text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:shadow transition-all duration-200 w-full sm:w-auto"
                                    >
                                      <PlayCircle className="h-4 w-4 group-hover:animate-pulse" />
                                      <span className="font-medium">Ver vídeo tutorial</span>
                                      <span className="hidden sm:inline ml-1 text-blue-100 group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mt-1">
                          <FormDescription className="text-xs text-muted-foreground pt-1">
                            {selectedPlatform === 'shopify' 
                              ? "Necessária para integração com o Shopify" 
                              : "Chave de acesso à API da plataforma (opcional)"}
                          </FormDescription>
                          
                          {/* Link de ajuda para obter a chave da API - mostrado apenas para Shopify */}
                          {selectedPlatform === 'shopify' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setShowApiKeyHelp(true);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-1 font-medium"
                            >
                              <HelpCircle className="h-3 w-3" />
                              Não sabe como obter?
                            </button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="pt-6 flex gap-3 mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 sm:flex-initial"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !canAddStore || (selectedPlatform === 'shopify' && shopifyCheck !== 'valid')}
                      className={cn(
                        "flex-1 sm:flex-initial gap-2",
                        !canAddStore && "opacity-50"
                      )}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          <Store className="h-4 w-4" />
                          Cadastrar Loja
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Ajuda para obter a API Key do Shopify */}
      <Dialog open={showApiKeyHelp} onOpenChange={setShowApiKeyHelp}>
        <DialogPortal>
          <CustomDialogOverlay />
          <DialogPrimitive.Content
            className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[700px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] max-h-[95vh] overflow-hidden rounded-xl mx-auto"
          >
            <DialogHeader className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <PlayCircle className="h-8 w-8" />
                <DialogTitle className="text-2xl font-bold">Como obter sua API Key do Shopify</DialogTitle>
              </div>
              <DialogDescription className="text-green-100 text-base">
                Um tutorial passo a passo para configurar e obter sua chave de API
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
                          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                          <div className="absolute inset-0 bg-green-500/40 rounded-full animate-pulse"></div>
                          <PlayCircle className="absolute inset-0 m-auto h-16 w-16 text-green-600" />
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
                <h3 className="font-medium text-lg flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Instruções passo a passo
                </h3>
                
                <div className="space-y-0">
                  <div className="step-item relative pl-10 pb-5 border-l-2 border-green-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-green-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">1</div>
                    <h4 className="font-medium text-green-800">Acesse o painel administrativo</h4>
                    <p className="text-sm text-gray-600 mt-1">Entre no painel de administração da sua loja Shopify</p>
                  </div>
                  
                  <div className="step-item relative pl-10 pb-5 border-l-2 border-green-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-green-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">2</div>
                    <h4 className="font-medium text-green-800">Acesse as configurações de Apps</h4>
                    <p className="text-sm text-gray-600 mt-1">Navegue até "Configurações" (Settings) → "Apps e canais de vendas" (Apps and sales channels)</p>
                  </div>
                  
                  <div className="step-item relative pl-10 pb-5 border-l-2 border-green-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-green-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">3</div>
                    <h4 className="font-medium text-green-800">Crie um app personalizado</h4>
                    <p className="text-sm text-gray-600 mt-1">Clique em "Desenvolver apps" (Develop apps) → "Criar app" e nomeie como "Dropfy Integration"</p>
                  </div>
                  
                  <div className="step-item relative pl-10 pb-5 border-l-2 border-green-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-green-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">4</div>
                    <h4 className="font-medium text-green-800">Configure as permissões</h4>
                    <p className="text-sm text-gray-600 mt-1">Em "Configurações da API", <span className="font-semibold text-green-700">selecione TODAS as permissões disponíveis</span> para garantir a funcionalidade completa da integração</p>
                  </div>
                  
                  <div className="step-item relative pl-10 border-l-2 border-green-200">
                    <div className="absolute top-0 left-0 transform -translate-x-1/2 bg-green-600 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">5</div>
                    <h4 className="font-medium text-green-800">Instale o app e copie o token</h4>
                    <p className="text-sm text-gray-600 mt-1">Clique em "Instalar app" e copie o "Admin API Access Token" - esta é a chave que você precisa colar aqui</p>
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
                      Certifique-se de guardar sua chave API em um lugar seguro. Você não poderá visualizá-la novamente após sair da página de criação do app.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-between sticky bottom-0 pt-2 pb-1 bg-white">
                <Button
                  variant="outline"
                  onClick={() => setShowApiKeyHelp(false)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Fechar
                </Button>
                
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 gap-2"
                  onClick={() => {
                    window.open('https://help.shopify.com/en/manual/apps/app-types/custom-apps', '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Documentação oficial
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
    </>
  );
}
