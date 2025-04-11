'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Package 
} from 'lucide-react';
import { createStore } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useStores } from '@/hooks/use-stores';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Schema atualizado - apenas nome e URL são obrigatórios
const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  platform: z.string().optional(),
  url: z.string().url('URL inválida'),
  apiKey: z.string().optional(),
});

interface StoreFormProps {
  open: boolean;
  onClose: () => void;
  storesCount: number;
}

export function StoreForm({ open, onClose, storesCount = 0 }: StoreFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const { user } = useAuth();
  const { maxStores, canAddStore, refreshStores } = useStores();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      platform: '',
      url: '',
      apiKey: '',
    },
  });

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
                      </div>
                      <FormControl>
                        <Input
                          placeholder="https://minhaloja.com.br"
                          {...field}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground pt-1">
                        URL completa da sua loja (ex: https://minhaloja.com.br)
                      </FormDescription>
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
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground pt-1">
                        {selectedPlatform === 'shopify' 
                          ? "Necessária para integração com o Shopify" 
                          : "Chave de acesso à API da plataforma (opcional)"}
                      </FormDescription>
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
                    disabled={isLoading || !canAddStore}
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
  );
}
