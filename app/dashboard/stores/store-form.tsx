'use client';

import { useState, useEffect } from 'react';
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
import { StoreCounter } from '@/components/stores/store-counter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Store, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  platform: z.string().min(1, 'Selecione uma plataforma'),
  url: z.string().url('URL inválida'),
  apiKey: z.string().min(1, 'Chave da API é obrigatória'),
});

interface StoreFormProps {
  open: boolean;
  onClose: () => void;
  storesCount: number;
}

// Componente de Status para exibir no Header
const StoreStatus = ({ storesCount, maxStores }: { storesCount: number; maxStores: number }) => {
  const percentage = (storesCount / maxStores) * 100;
  let color, icon, text;
  
  if (percentage >= 100) {
    color = "text-rose-500 bg-rose-50";
    icon = <AlertCircle className="h-4 w-4" />;
    text = "Limite atingido";
  } else if (percentage >= 80) {
    color = "text-amber-500 bg-amber-50";
    icon = <AlertTriangle className="h-4 w-4" />;
    text = "Quase no limite";
  } else {
    color = "text-emerald-500 bg-emerald-50";
    icon = <CheckCircle2 className="h-4 w-4" />;
    text = "Espaço disponível";
  }
  
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${color}`}>
      {icon}
      <span className="font-medium">{text}</span>
    </div>
  );
};

export function StoreForm({ open, onClose, storesCount = 0 }: StoreFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const maxStores = 5;
  const canAddStore = storesCount < maxStores;

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

    try {
      setIsLoading(true);
      // TODO: Implementar integração com a API
      console.log(values);
      
      // Simulação de delay para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Loja cadastrada com sucesso!');
      form.reset();
      onClose();
    } catch (error) {
      toast.error('Erro ao cadastrar loja');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Nova Loja</DialogTitle>
            <StoreStatus storesCount={storesCount} maxStores={maxStores} />
          </div>
          <DialogDescription className="pt-1.5">
            Cadastre uma nova loja para começar a sincronizar produtos
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-5">
          <div className="bg-muted/10 p-4 rounded-lg border border-border/50">
            <StoreCounter storesCount={storesCount} maxStores={maxStores} variant="visual" />
          </div>

          {!canAddStore ? (
            <Alert variant="destructive" className="bg-rose-50 border-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-rose-700 font-medium">
                Você atingiu o limite de {maxStores} lojas. Para adicionar mais lojas, 
                considere fazer upgrade do seu plano.
              </AlertDescription>
            </Alert>
          ) : storesCount >= maxStores - 1 ? (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 font-medium">
                Esta será sua última loja disponível no plano atual.
              </AlertDescription>
            </Alert>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Nome da Loja</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Minha Loja" 
                          className="pl-10 border-border/60" 
                          {...field} 
                        />
                      </div>
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
                    <FormLabel className="font-medium">Plataforma</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-border/60">
                          <SelectValue placeholder="Selecione uma plataforma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="shopify">Shopify</SelectItem>
                        <SelectItem value="woocommerce">WooCommerce</SelectItem>
                        <SelectItem value="magento">Magento</SelectItem>
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
                    <FormLabel className="font-medium">URL da Loja</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://minhaloja.com.br"
                        className="border-border/60"
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
                    <FormLabel className="font-medium">Chave da API</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Chave da API da plataforma"
                        className="border-border/60"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Chave de acesso à API da plataforma
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex justify-between pt-4 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="border-border/60"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !canAddStore}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    'Cadastrar'
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
