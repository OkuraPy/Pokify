'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogPortal, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Package, Link, Upload, X, Loader2, Sparkles, Zap, Cpu, BarChart, FileText, AlertCircle, CheckCircle2, Wand2 } from 'lucide-react';
import { ProductImagesUpload } from '@/components/products/product-images-upload';
import { createProduct } from '@/lib/supabase';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  images: z.array(z.string()).optional(),
  description_images: z.array(z.string()).optional(),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Preço deve ser um número positivo'),
  compare_at_price: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Preço comparativo deve ser um número positivo'),
  stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Estoque deve ser um número positivo'),
  active: z.boolean().default(true),
  tags: z.string().optional(),
  url: z.string().optional(),
});

interface ProductFormProps {
  storeId: string;
  open: boolean;
  onClose: () => void;
}

export function ProductForm({ storeId, open, onClose }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [method, setMethod] = useState<'manual' | 'import'>('manual');
  const [extractorType, setExtractorType] = useState<'simple' | 'ai' | 'pro_copy'>('simple');
  const [imageCount, setImageCount] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'extracting' | 'processing' | 'completed' | 'error'>('idle');
  const MAX_IMAGES = 20;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      compare_at_price: '',
      stock: '1',
      active: true,
      tags: '',
      images: [],
      description_images: [],
      url: '',
    },
  });

  // Monitorar a quantidade de imagens para mostrar contador
  useEffect(() => {
    const images = form.getValues('images') || [];
    setImageCount(images.length);
  }, [form.watch('images')]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      // Preparar o produto para salvar no banco de dados
      const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const newProduct = {
        store_id: storeId,
        title: values.title,
        description: values.description,
        price: parseFloat(values.price),
        compare_at_price: values.compare_at_price ? parseFloat(values.compare_at_price) : undefined,
        stock: parseInt(values.stock, 10),
        status: values.active ? 'ready' : 'archived' as 'ready' | 'archived',
        images: values.images || [],
        description_images: values.description_images || [],
        tags: tagsArray,
        reviews_count: 0,
        average_rating: 0,
      };

      // Salvar o produto usando a função do Supabase
      const { data, error } = await createProduct(newProduct);

      if (error) {
        console.error('Erro ao criar produto:', error);
        toast.error('Erro ao cadastrar produto: ' + error.message);
        return;
      }

      toast.success('Produto adicionado com sucesso!');
      form.reset();
      onClose();

      // Recarregar a página para mostrar o novo produto
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error('Erro ao processar formulário');
    } finally {
      setIsLoading(false);
    }
  };

  const importProduct = async (url: string | undefined) => {
    if (!url) {
      toast.error('Por favor, insira uma URL válida');
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress(10);
      setImportStatus('extracting');
      
      // Atualizar o progresso gradualmente para dar feedback visual
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Manter em 90% até a conclusão
          }
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 800);
      
      // Determinar qual endpoint usar com base no tipo de extrator selecionado
      const endpoint = extractorType === 'simple' 
        ? '/api/product/extract' 
        : '/api/products/extract-openai';
      
      // Para o modo pro_copy, adicionar o parâmetro mode à URL
      const apiUrl = new URL(endpoint, window.location.origin);
      if (extractorType === 'pro_copy') {
        apiUrl.searchParams.append('mode', 'pro_copy');
      }
      
      setImportStatus('extracting');
      toast.info(`Extraindo dados do produto usando ${
        extractorType === 'simple' ? 'extração simples' : 
        extractorType === 'ai' ? 'inteligência artificial' : 
        'copywriting profissional'
      }`);
      
      // Fazer a chamada para nossa API interna
      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      clearInterval(progressInterval);
      
      if (!response.ok) {
        setImportStatus('error');
        setImportProgress(0);
        throw new Error(`Erro ao importar produto: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.data && extractorType === 'simple') {
        setImportStatus('error');
        setImportProgress(0);
        throw new Error('Não foi possível extrair informações do produto');
      }
      
      setImportStatus('processing');
      setImportProgress(95);

      // Processar o resultado dependendo do tipo de extrator
      if (extractorType === 'simple') {
        // Processamento para extrator simples (atual)
        const productData = result.data;
        
        // Extrair imagens do markdown (URLs de imagens)
        const imageRegex = /!\[.*?\]\((.*?)\)/g;
        const markdownText = productData.markdownText || '';
        const imageMatches = [...markdownText.matchAll(imageRegex)];
        const images = imageMatches
          .map(match => match[1])
          .filter((url: string) => url && !url.includes('placeholder') && (url.includes('.jpg') || url.includes('.png') || url.includes('.webp')))
          .slice(0, 5); // Limitar a 5 imagens

        // Extrair possíveis tags do conteúdo
        const possibleTags = productData.title
          ?.toLowerCase()
          .split(' ')
          .filter((word: string) => word.length > 3)
          .slice(0, 5)
          .join(', ') || '';

        // Extrair possível preço do texto
        let price = '';
        const priceRegex = /R\$\s*(\d+[.,]\d+)/;
        const priceMatch = markdownText.match(priceRegex);
        if (priceMatch && priceMatch[1]) {
          price = priceMatch[1].replace(',', '.');
        }

        // Preencher o formulário com os dados extraídos
        form.setValue('title', productData.title || '');
        form.setValue('description', productData.description || '');
        if (price) form.setValue('price', price);
        form.setValue('tags', possibleTags);
        
        // Se encontrou imagens, definir no formulário
        if (images.length > 0) {
          form.setValue('images', images);
        }
      } else {
        // Processamento para extrator com IA (OpenAI)
        // O extrator OpenAI já retorna dados estruturados
        console.log(`[Extrator] Processando resposta da extração com IA`, {
          titulo: result.title || 'Não encontrado',
          preco: result.price || 'Não encontrado',
          totalImagens: (result.mainImages?.length || 0) + (result.descriptionImages?.length || 0) || (result.images?.length || 0)
        });
        
        form.setValue('title', result.title || '');
        form.setValue('description', result.description || '');
        
        // Garantir que o preço está no formato correto (com ponto decimal, não vírgula)
        if (result.price) {
          const priceStr = result.price.toString();
          // Sempre substituir vírgula por ponto para garantir o formato correto
          const formattedPrice = priceStr.replace(',', '.');
          console.log(`[Extrator] Preço formatado: ${priceStr} -> ${formattedPrice}`);
          form.setValue('price', formattedPrice);
        }
        
        // Usar tags do título se disponível
        const possibleTags = result.title
          ?.toLowerCase()
          .split(' ')
          .filter((word: string) => word.length > 3)
          .slice(0, 5)
          .join(', ') || '';
        form.setValue('tags', possibleTags);
        
        // Usar imagens principais retornadas pela IA - SEM LIMITAR A QUANTIDADE
        console.log(`[Extrator] Imagens disponíveis:`, {
          mainImages: result.mainImages?.length || 0,
          descriptionImages: result.descriptionImages?.length || 0,
          allImages: result.images?.length || 0
        });
        
        // Verificar e filtrar URLs válidas
        const validateImageUrl = (url: string) => {
          // Verificar se a URL é válida
          try {
            new URL(url);
          } catch {
            console.log(`[Extrator] URL inválida ignorada: ${url}`);
            return false;
          }
          
          // Verificar extensão de arquivo
          const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
          const hasValidExtension = validExtensions.some(ext => 
            url.toLowerCase().includes(ext)
          );
          
          if (!hasValidExtension) {
            console.log(`[Extrator] URL sem extensão válida ignorada: ${url}`);
            return false;
          }
          
          return true;
        };
        
        if (result.mainImages && result.mainImages.length > 0) {
          // Filtrar imagens válidas e limitar a quantidade
          const validImages = result.mainImages
            .filter(validateImageUrl)
            .slice(0, MAX_IMAGES);
          console.log(`[Extrator] Total de imagens: ${result.mainImages.length}, Válidas: ${validImages.length}, Limite: ${MAX_IMAGES}`);
          
          form.setValue('images', validImages);
        } else if (result.images && result.images.length > 0) {
          // Alternativa: usar todas as imagens
          const validImages = result.images
            .filter(validateImageUrl)
            .slice(0, MAX_IMAGES);
          console.log(`[Extrator] Usando imagens alternativas: ${validImages.length} válidas de ${result.images.length} total, Limite: ${MAX_IMAGES}`);
          
          form.setValue('images', validImages);
        }

        // Ao processar resultado do OpenAI, salvar imagens da descrição específicas
        if (result.description_images && result.description_images.length > 0) {
          // Verificar e filtrar URLs válidas (mesmo código que temos para as imagens principais)
          const validDescImages = result.description_images.filter(validateImageUrl);
          console.log(`[Extrator] Imagens da descrição: ${validDescImages.length} válidas de ${result.description_images.length} total`);
          
          form.setValue('description_images', validDescImages);
        } else if (result.descriptionImages && result.descriptionImages.length > 0) {
          // Alternativa: tentar usar descriptionImages se description_images não existir
          const validDescImages = result.descriptionImages.filter(validateImageUrl);
          console.log(`[Extrator] Imagens da descrição alternativas: ${validDescImages.length}`);
          
          form.setValue('description_images', validDescImages);
        }
      }

      // Completar o progresso e notificar sucesso
      setImportProgress(100);
      setImportStatus('completed');
      
      // Mensagem personalizada com base no tipo de extrator
      if (extractorType === 'pro_copy') {
        toast.success('Produto importado com descrição persuasiva AIDA');
      } else if (extractorType === 'ai') {
        toast.success('Produto importado com detalhes enriquecidos por IA');
      } else {
        toast.success('Produto importado com sucesso!');
      }
      
      // Mudar para a aba de cadastro manual para editar os detalhes
      setMethod('manual');
      
      // Reset do estado após um tempo
      setTimeout(() => {
        setImportProgress(0);
        setImportStatus('idle');
        setIsImporting(false);
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao importar produto:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao importar produto');
      setImportProgress(0);
      setImportStatus('error');
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogTitle>Novo Produto</DialogTitle>
        <DialogDescription>
          Adicione um novo produto à sua loja
        </DialogDescription>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="manual" value={method} onValueChange={(value) => setMethod(value as 'manual' | 'import')}>
            <TabsList className="grid w-full grid-cols-2 sticky top-0 z-10 bg-background">
              <TabsTrigger value="manual">Cadastro Manual</TabsTrigger>
              <TabsTrigger value="import">Importar Produto</TabsTrigger>
            </TabsList>

            <TabsContent value="import">
              <Form {...form}>
                <div className="space-y-6 py-6">
                  <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-medium">Importar Produto</h3>
                    <p className="text-sm text-muted-foreground">
                      Cole a URL de um produto para importar automaticamente suas informações.
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg -z-10" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-1">
                      <Card 
                        className={cn(
                          "flex flex-col h-full border overflow-hidden transition-all duration-200",
                          extractorType === "simple" 
                            ? "border-primary/50 shadow-md shadow-primary/10 scale-[1.02] bg-card" 
                            : "bg-card/80 hover:border-primary/30 hover:shadow-sm"
                        )}
                        onClick={() => setExtractorType("simple")}
                      >
                        <div className={cn(
                          "p-4 flex justify-between items-start gap-2 border-b transition-colors",
                          extractorType === "simple" ? "bg-primary/10 border-primary/20" : "bg-muted/30"
                        )}>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Extração Simples</span>
                            <span className="text-xs text-muted-foreground">Rápido e básico</span>
                          </div>
                          <div className={cn(
                            "rounded-full p-1.5 transition-colors",
                            extractorType === "simple" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <Zap className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="p-4 text-xs space-y-3 flex-1 flex flex-col">
                          <div className="space-y-1.5">
                            <div className="flex items-center">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5", extractorType === "simple" ? "text-primary" : "text-muted-foreground")} />
                              <span>Extração de título e preço</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5", extractorType === "simple" ? "text-primary" : "text-muted-foreground")} />
                              <span>Processamento rápido</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5", extractorType === "simple" ? "text-primary" : "text-muted-foreground")} />
                              <span>Descrição básica</span>
                            </div>
                          </div>
                          <div className="mt-auto">
                            <Badge variant={extractorType === "simple" ? "default" : "outline"} className="w-full justify-center py-1 mt-2">
                              {extractorType === "simple" ? "Selecionado" : "Selecionar"}
                            </Badge>
                          </div>
                        </div>
                      </Card>

                      <Card 
                        className={cn(
                          "flex flex-col h-full border overflow-hidden transition-all duration-200",
                          extractorType === "ai" 
                            ? "border-primary/50 shadow-md shadow-primary/10 scale-[1.02] bg-card" 
                            : "bg-card/80 hover:border-primary/30 hover:shadow-sm"
                        )}
                        onClick={() => setExtractorType("ai")}
                      >
                        <div className={cn(
                          "p-4 flex justify-between items-start gap-2 border-b transition-colors",
                          extractorType === "ai" ? "bg-primary/10 border-primary/20" : "bg-muted/30"
                        )}>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Extração com IA</span>
                            <span className="text-xs text-muted-foreground">Preciso e completo</span>
                          </div>
                          <div className={cn(
                            "rounded-full p-1.5 transition-colors",
                            extractorType === "ai" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <Cpu className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="p-4 text-xs space-y-3 flex-1 flex flex-col">
                          <div className="space-y-1.5">
                            <div className="flex items-center">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5", extractorType === "ai" ? "text-primary" : "text-muted-foreground")} />
                              <span>Detecção avançada de imagens</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5", extractorType === "ai" ? "text-primary" : "text-muted-foreground")} />
                              <span>Descrição HTML formatada</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5", extractorType === "ai" ? "text-primary" : "text-muted-foreground")} />
                              <span>Extração de especificações</span>
                            </div>
                          </div>
                          <div className="mt-auto">
                            <Badge variant={extractorType === "ai" ? "default" : "outline"} className="w-full justify-center py-1 mt-2">
                              {extractorType === "ai" ? "Selecionado" : "Selecionar"}
                            </Badge>
                          </div>
                        </div>
                      </Card>

                      <Card 
                        className={cn(
                          "flex flex-col h-full border overflow-hidden transition-all duration-200",
                          extractorType === "pro_copy" 
                            ? "border-primary/50 shadow-md shadow-primary/10 scale-[1.02] bg-card" 
                            : "bg-card/80 hover:border-primary/30 hover:shadow-sm"
                        )}
                        onClick={() => setExtractorType("pro_copy")}
                      >
                        <div className={cn(
                          "p-4 flex justify-between items-start gap-2 border-b transition-colors",
                          extractorType === "pro_copy" ? "bg-primary/10 border-primary/20" : "bg-muted/30"
                        )}>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="text-sm font-medium">Copy Pro</span>
                              <Badge variant="default" className="ml-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] px-1.5 py-0">PRO</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">Descrição AIDA otimizada</span>
                          </div>
                          <div className={cn(
                            "rounded-full p-1.5 transition-colors",
                            extractorType === "pro_copy" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <Wand2 className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="p-4 text-xs space-y-3 flex-1 flex flex-col">
                          <div className="space-y-1.5">
                            <div className="flex items-center">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5", extractorType === "pro_copy" ? "text-primary" : "text-muted-foreground")} />
                              <span>Descrição persuasiva AIDA</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5", extractorType === "pro_copy" ? "text-primary" : "text-muted-foreground")} />
                              <span>Copywriting de alta conversão</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle2 className={cn("h-3.5 w-3.5 mr-1.5", extractorType === "pro_copy" ? "text-primary" : "text-muted-foreground")} />
                              <span>Chamada para ação otimizada</span>
                            </div>
                          </div>
                          <div className="mt-auto">
                            <Badge variant={extractorType === "pro_copy" ? "default" : "outline"} className="w-full justify-center py-1 mt-2">
                              {extractorType === "pro_copy" ? "Selecionado" : "Selecionar"}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <div className="bg-card rounded-lg border p-5 space-y-4">
                          <div className="space-y-2">
                            <FormLabel className="text-base">URL do Produto</FormLabel>
                            <FormDescription>
                              Cole o endereço completo do produto que deseja importar
                            </FormDescription>
                          </div>
                          <FormControl>
                            <div className="flex gap-2 relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                <Link className="h-4 w-4" />
                              </div>
                              <Input 
                                placeholder="https://exemplo.com/produto" 
                                className="pl-9 pr-28" 
                                {...field} 
                              />
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                                <Button 
                                  type="button" 
                                  className={cn(
                                    "rounded-md text-xs h-8",
                                    isImporting ? "" : "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary hover:to-indigo-700"
                                  )}
                                  onClick={() => importProduct(field.value)}
                                  disabled={isImporting}
                                >
                                  {isImporting ? (
                                    <>
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      <span>Importando...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="mr-1 h-3 w-3" />
                                      <span>Importar Agora</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                          
                          {isImporting && (
                            <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  {importStatus === 'extracting' && 'Extraindo dados do produto...'}
                                  {importStatus === 'processing' && 'Processando informações...'}
                                  {importStatus === 'completed' && 'Importação concluída!'}
                                  {importStatus === 'error' && 'Erro na importação'}
                                </span>
                                <span className={cn(
                                  "font-medium",
                                  importStatus === 'completed' ? "text-green-500" : 
                                  importStatus === 'error' ? "text-destructive" : 
                                  "text-primary"
                                )}>
                                  {importProgress}%
                                </span>
                              </div>
                              <Progress value={importProgress} className={cn(
                                "h-1.5",
                                importStatus === 'completed' ? "bg-green-100" : 
                                importStatus === 'error' ? "bg-destructive/20" : 
                                "bg-primary/20"
                              )} 
                              indicatorClassName={cn(
                                importStatus === 'completed' ? "bg-green-500" : 
                                importStatus === 'error' ? "bg-destructive" : 
                                ""
                              )} />
                              <div className={cn(
                                "p-3 rounded-md flex items-center text-xs",
                                importStatus === 'completed' ? "bg-green-50 text-green-700" : 
                                importStatus === 'error' ? "bg-destructive/10 text-destructive" : 
                                "bg-muted/50 text-muted-foreground"
                              )}>
                                {importStatus === 'error' ? (
                                  <>
                                    <AlertCircle className="h-3.5 w-3.5 mr-2 text-destructive" />
                                    Ocorreu um erro. Tente novamente ou use um outro link.
                                  </>
                                ) : importStatus === 'completed' ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                                    Produto importado com sucesso! Você pode editar os detalhes agora.
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                    Não feche essa janela enquanto a importação estiver em andamento
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg border bg-card/50 flex">
                            <BarChart className="h-5 w-5 mr-3 text-green-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium">Análise Inteligente</h4>
                              <p className="text-xs text-muted-foreground">Nossa IA analisa o produto e extrai as informações mais relevantes automaticamente.</p>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg border bg-card/50 flex">
                            <FileText className="h-5 w-5 mr-3 text-blue-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium">Compatibilidade</h4>
                              <p className="text-xs text-muted-foreground">Funciona com a maioria dos e-commerces como Shopify, WooCommerce, Magento e mais.</p>
                            </div>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </TabsContent>

            <TabsContent value="manual">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título do Produto</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Camiseta Estampada" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço (R$)</FormLabel>
                              <FormControl>
                                <Input placeholder="99.90" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="compare_at_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço Comparativo (R$)</FormLabel>
                              <FormControl>
                                <Input placeholder="129.90" {...field} />
                              </FormControl>
                              <FormDescription>
                                Opcional
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estoque</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <Input placeholder="roupas, camisetas, etc" {...field} />
                            </FormControl>
                            <FormDescription>
                              Separe as tags por vírgula
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Produto Ativo
                              </FormLabel>
                              <FormDescription>
                                Desative para esconder o produto
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição do Produto</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva seu produto..." 
                                className="min-h-[150px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Imagens do Produto</FormLabel>
                            <FormControl>
                              <div className="max-h-[250px] overflow-y-auto border rounded-md p-2">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-muted-foreground">
                                    {imageCount} de {MAX_IMAGES} imagens
                                  </span>
                                  {imageCount >= MAX_IMAGES && (
                                    <span className="text-xs text-destructive">
                                      Limite de imagens atingido
                                    </span>
                                  )}
                                </div>
                                <ProductImagesUpload
                                  productId={storeId}
                                  initialImages={field.value}
                                  onImagesChange={(images) => {
                                    // Limitar a quantidade de imagens
                                    if (images.length > MAX_IMAGES) {
                                      toast.warning(`Limite de ${MAX_IMAGES} imagens atingido. Algumas imagens foram removidas.`);
                                      field.onChange(images.slice(0, MAX_IMAGES));
                                    } else {
                                      field.onChange(images);
                                    }
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Adicione imagens do seu produto (as principais aparecem primeiro)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 sticky bottom-0 pt-4 pb-2 bg-background border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isLoading}
                      className="border-border/60"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
