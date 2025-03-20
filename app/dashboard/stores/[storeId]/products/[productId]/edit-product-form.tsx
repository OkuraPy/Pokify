'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { ProductImagesUpload } from '@/components/products/product-images-upload';
import { getProduct, updateProduct } from '@/lib/supabase';

const productFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Preço deve ser um número positivo'),
  compare_at_price: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Preço comparativo deve ser um número positivo'),
  stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Estoque deve ser um número positivo'),
  active: z.boolean().default(true),
  tags: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface EditProductFormProps {
  storeId: string;
  productId: string;
}

export function EditProductForm({ storeId, productId }: EditProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      compare_at_price: '',
      stock: '',
      active: true,
      tags: '',
      images: [],
    },
  });

  useEffect(() => {
    async function loadProductData() {
      try {
        setIsLoading(true);
        console.log('Carregando produto ID:', productId);
        const { data, error } = await getProduct(productId);
        
        console.log('Resposta da API:', { data, error });
        
        if (error) {
          toast.error('Erro ao carregar dados do produto');
          console.error('Erro ao carregar produto:', error);
          return;
        }
        
        if (!data) {
          toast.error('Produto não encontrado');
          return;
        }
        
        setInitialData(data);
        
        // Converter dados para o formato do formulário
        form.reset({
          title: data.title,
          description: data.description || '',
          price: data.price.toString(),
          compare_at_price: data.compare_at_price ? data.compare_at_price.toString() : '',
          stock: data.stock.toString(),
          active: data.status === 'ready' || data.status === 'published',
          tags: data.tags?.join(', ') || '',
          images: data.images || [],
        });
      } catch (err) {
        console.error('Erro ao carregar produto:', err);
        toast.error('Erro ao carregar dados do produto');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadProductData();
  }, [productId, form]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setIsSaving(true);
      
      // Preparar os dados para atualização
      const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const updatedProduct = {
        title: values.title,
        description: values.description,
        price: parseFloat(values.price),
        compare_at_price: values.compare_at_price ? parseFloat(values.compare_at_price) : undefined,
        stock: parseInt(values.stock, 10),
        status: values.active 
          ? (initialData.status === 'published' ? 'published' : 'ready') 
          : 'archived' as 'published' | 'ready' | 'archived',
        images: values.images || [],
        tags: tagsArray,
        updated_at: new Date().toISOString(),
      };
      
      // Atualizar o produto no Supabase
      const { data, error } = await updateProduct(productId, updatedProduct);
      
      if (error) {
        console.error('Erro ao atualizar produto:', error);
        toast.error('Erro ao salvar alterações: ' + error.message);
        return;
      }
      
      toast.success('Produto atualizado com sucesso!');
      
      // Redirecionar para a página de detalhes
      router.push(`/dashboard/stores/${storeId}/products/${productId}`);
      router.refresh();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Carregando dados do produto...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Editar Produto</h2>
          <p className="text-muted-foreground">
            Atualize as informações e configurações do produto
          </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Detalhes principais do produto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
            </div>
            
            {/* Coluna Direita */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Imagens do Produto</CardTitle>
                  <CardDescription>
                    Adicione ou remova imagens do produto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ProductImagesUpload
                            productId={productId}
                            initialImages={field.value}
                            onImagesChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Adicione até 5 imagens do seu produto
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              {initialData?.shopify_product_id && (
                <Card>
                  <CardHeader>
                    <CardTitle>Integração Shopify</CardTitle>
                    <CardDescription>
                      Este produto está publicado no Shopify
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        ID no Shopify: <span className="font-mono">{initialData.shopify_product_id}</span>
                      </p>
                      {initialData.shopify_product_url && (
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a href={initialData.shopify_product_url} target="_blank" rel="noopener noreferrer">
                            Ver na loja Shopify
                          </a>
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        As alterações não serão automaticamente sincronizadas com o Shopify.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 