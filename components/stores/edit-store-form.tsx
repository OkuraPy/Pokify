'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
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

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  platform: z.string({
    required_error: 'Selecione uma plataforma.',
  }),
  url: z.string().url({
    message: 'URL inválida.',
  }),
});

interface EditStoreFormProps {
  store: {
    id: string;
    name: string;
    platform: string;
    url: string;
  };
  onSuccess?: () => void;
}

export function EditStoreForm({ store, onSuccess }: EditStoreFormProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: store.name,
      platform: store.platform,
      url: store.url,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsPending(true);
      // TODO: Implementar a chamada à API
      console.log(values);
      
      toast.success('Loja atualizada com sucesso!');
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao atualizar a loja. Tente novamente.');
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma plataforma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Shopify">Shopify</SelectItem>
                  <SelectItem value="WooCommerce">WooCommerce</SelectItem>
                  <SelectItem value="Nuvemshop">Nuvemshop</SelectItem>
                  <SelectItem value="VTEX">VTEX</SelectItem>
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
                <Input placeholder="https://minhaloja.com.br" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isPending}
          >
            Salvar alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}
