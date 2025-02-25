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

const formSchema = z.object({
  images: z.array(z.string()).optional(),
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Preço deve ser um número positivo'),
  stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Estoque deve ser um número positivo'),
  active: z.boolean().default(true),
  url: z.string().url('URL inválida').optional(),
});

interface ProductFormProps {
  storeId: string;
  open: boolean;
  onClose: () => void;
}

export function ProductForm({ storeId, open, onClose }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState<'manual' | 'import'>('import');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      stock: '',
      active: true,
      url: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      // Se for o método de importação, redireciona para a página de importação
      if (method === 'import' && values.url) {
        window.location.href = `/dashboard/stores/${storeId}/import?url=${encodeURIComponent(values.url)}`;
        return;
      }

      // Caso contrário, continua com o cadastro manual
      // TODO: Implementar integração com a API
      console.log({ storeId, ...values });
      toast.success('Produto adicionado com sucesso!');
      form.reset();
      onClose();
    } catch (error) {
      toast.error('Erro ao adicionar produto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg overflow-y-auto max-h-[90vh]">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
              Novo Produto
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Adicione um novo produto à sua loja
            </DialogDescription>
          </div>

          <Tabs value={method} onValueChange={(value) => setMethod(value as 'manual' | 'import')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Importar URL
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Cadastro Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6">
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: Camiseta Básica" 
                                className="border-border/60" 
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
                              <FormLabel>Preço</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="99.90" 
                                  className="border-border/60" 
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estoque</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="100" 
                                  className="border-border/60" 
                                  {...field}
                                  type="number"
                                  min="0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva as características do produto..."
                              className="resize-none min-h-[120px] border-border/60"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between rounded-lg border border-border/60 p-4 bg-secondary/5">
                      <div className="flex flex-col gap-1">
                        <Label className="font-medium">Status do Produto</Label>
                        <span className="text-sm text-muted-foreground">
                          Produto ficará visível na loja quando ativo
                        </span>
                      </div>
                      <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem>
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

                    <div className="flex items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-8 bg-secondary/5 hover:bg-secondary/10 transition-colors cursor-pointer">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary"
                          >
                            <span>Envie uma imagem</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                          </label>
                          <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">PNG, JPG ou WEBP até 10MB</p>
                      </div>
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

            <TabsContent value="import">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL do Produto</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://exemplo.com/produto"
                            className="border-border/60"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Cole a URL do produto que deseja importar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      {isLoading ? 'Importando...' : 'Importar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
