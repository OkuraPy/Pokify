'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Info } from 'lucide-react';
import { updateStore } from '@/lib/supabase';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  platform: z.string({
    required_error: 'Selecione uma plataforma.',
  }),
  url: z.string()
    .transform(value => {
      // Verifica se a URL já começa com http:// ou https://
      if (!/^https?:\/\//i.test(value)) {
        // Adiciona https:// no início da URL
        return `https://${value}`;
      }
      return value;
    })
    .pipe(z.string().url({
      message: 'URL inválida.',
    })),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  apiVersion: z.string().optional(),
});

interface EditStoreFormProps {
  store: {
    id: string;
    name: string;
    platform: string;
    url: string;
    api_key?: string;
    api_secret?: string;
    api_version?: string;
  };
  onSuccess?: () => void;
}

export function EditStoreForm({ store, onSuccess }: EditStoreFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(store.platform);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: store.name,
      platform: store.platform,
      url: store.url,
      apiKey: store.api_key || '',
      apiSecret: store.api_secret || '',
      apiVersion: store.api_version || '2025-01',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsPending(true);
      
      const updatedStore = {
        name: values.name,
        platform: values.platform as 'shopify' | 'aliexpress' | 'other',
        url: values.url,
        api_key: values.apiKey || undefined,
        api_secret: values.apiSecret || undefined,
        api_version: values.apiVersion || undefined
      };
      
      const { error } = await updateStore(store.id, updatedStore);
      
      if (error) {
        throw new Error(error.message || 'Erro ao atualizar a loja');
      }
      
      toast.success('Loja atualizada com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(`Erro ao atualizar a loja: ${error.message}`);
      console.error('Erro ao atualizar a loja:', error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Loja</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Minha Loja" {...field} />
              </FormControl>
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
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedPlatform(value);
                }} 
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Loja</FormLabel>
              <FormControl>
                <Input 
                  placeholder={selectedPlatform === 'shopify' ? "your-store.myshopify.com" : "https://minhaloja.com.br"}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                {selectedPlatform === 'shopify' 
                  ? "Nome da sua loja Shopify (ex: sua-loja.myshopify.com)" 
                  : "URL completa da sua loja"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedPlatform === 'shopify' && (
          <>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800 mb-2">
              <div className="flex gap-2 items-start">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <p>
                  Para integrar com o Shopify, você precisará criar um Custom App no painel administrativo do Shopify
                  para gerar as credenciais necessárias. 
                  <a 
                    href="https://shopify.dev/apps/auth/admin-app-access-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline ml-1 hover:text-blue-800"
                  >
                    Saiba mais
                  </a>
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Access Token do Shopify
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="shpat_..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Token de acesso para a API do Shopify
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiVersion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versão da API</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a versão da API" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2025-01">2025-01 (Recomendada)</SelectItem>
                      <SelectItem value="2024-10">2024-10</SelectItem>
                      <SelectItem value="2024-07">2024-07</SelectItem>
                      <SelectItem value="2024-04">2024-04</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Versão da API do Shopify a ser utilizada
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isPending}
          >
            {isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
