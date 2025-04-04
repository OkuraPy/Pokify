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
import { AlertCircle, Store, Loader2 } from 'lucide-react';
import { createStore } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useStores } from '@/hooks/use-stores';
import { useRouter } from 'next/navigation';

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nova Loja</DialogTitle>
          <DialogDescription>
            Cadastre uma nova loja para começar a sincronizar produtos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!canAddStore ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você atingiu o limite de {maxStores} lojas. Para adicionar mais lojas, 
                considere fazer upgrade do seu plano.
              </AlertDescription>
            </Alert>
          ) : storesCount >= maxStores - 1 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta será sua última loja disponível no plano atual.
              </AlertDescription>
            </Alert>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Loja *</FormLabel>
                    <FormControl>
                      <Input placeholder="Minha Loja" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome para identificar sua loja
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plataforma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma plataforma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="shopify">Shopify</SelectItem>
                        <SelectItem value="aliexpress">AliExpress</SelectItem>
                        <SelectItem value="other">Outra</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Plataforma de e-commerce utilizada
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Loja *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://minhaloja.com.br"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      URL completa da sua loja
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave da API</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Chave da API da plataforma (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Chave de acesso à API da plataforma (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || !canAddStore}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    'Cadastrar Loja'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
