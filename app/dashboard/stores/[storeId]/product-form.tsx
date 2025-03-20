'use client';

import { useState } from 'react';
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
import { Package, Link, Upload, X } from 'lucide-react';
import { ProductImagesUpload } from '@/components/products/product-images-upload';
import { createProduct } from '@/lib/supabase';

const formSchema = z.object({
  images: z.array(z.string()).optional(),
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
  const [method, setMethod] = useState<'manual' | 'import'>('manual');

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
    },
  });

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogTitle>Novo Produto</DialogTitle>
        <DialogDescription>
          Adicione um novo produto à sua loja
        </DialogDescription>

        <Tabs defaultValue="manual" value={method} onValueChange={(value) => setMethod(value as 'manual' | 'import')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Cadastro Manual</TabsTrigger>
            <TabsTrigger value="import">Importar Produto</TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Cole a URL de um produto para importar automaticamente suas informações.
              </p>
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Produto</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input placeholder="https://exemplo.com/produto" {...field} />
                        <Button type="button" className="shrink-0">
                          <Upload className="mr-2 h-4 w-4" />
                          Importar
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Funciona com AliExpress, Shopify e outros
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                            <ProductImagesUpload
                              productId={storeId}
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
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
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
      </DialogContent>
    </Dialog>
  );
}
