"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { signUp } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const signupSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Por favor, insira um email válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (formData: SignupFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await signUp(
        formData.email, 
        formData.password, 
        formData.name
      );
      
      if (error) {
        throw new Error((error as any).message || 'Erro ao criar conta');
      }
      
      setSuccess(true);
      toast.success('Conta criada com sucesso! Faça login para continuar.');
      
      // Mudar para a aba de login após um breve delay
      setTimeout(() => {
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        if (loginTab) {
          loginTab.click();
        }
      }, 2000);
      
    } catch (error: any) {
      toast.error(error.message || 'Falha ao criar conta. Por favor, tente novamente.');
      console.error('Erro de cadastro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input
          id="name"
          placeholder="João Silva"
          {...register('name')}
          className={errors.name ? 'border-destructive' : ''}
          disabled={isLoading || success}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{String(errors.name.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
          disabled={isLoading || success}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{String(errors.email.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          className={errors.password ? 'border-destructive' : ''}
          disabled={isLoading || success}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{String(errors.password.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className={errors.confirmPassword ? 'border-destructive' : ''}
          disabled={isLoading || success}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{String(errors.confirmPassword.message)}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || success}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : success ? (
          'Conta criada com sucesso!'
        ) : (
          'Criar Conta'
        )}
      </Button>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" disabled={isLoading || success}>
          Google
        </Button>
        <Button variant="outline" type="button" disabled={isLoading || success}>
          GitHub
        </Button>
      </div>
    </form>
  );
}