"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { signIn } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const loginSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (formData: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // 1. Realizamos o login
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        throw new Error((error as any).message || 'Erro ao fazer login');
      }
      
      console.log('Login realizado, atualizando estado do usuário...');
      
      // 2. Aguardamos um pouco para garantir que a sessão foi estabelecida
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 3. Atualizamos o estado do usuário no contexto de autenticação
      await refreshUser();
      
      // 4. Verificamos novamente após um curto período para garantir persistência
      setTimeout(async () => {
        await refreshUser();
        console.log('Verificação de estado do usuário após delay');
      }, 1000);
      
      // Definimos a flag para evitar loops de redirecionamento
      sessionStorage.setItem('justLoggedIn', 'true');
      
      // Informamos o usuário do sucesso
      toast.success('Login realizado com sucesso!');
      
      // 5. Redirecionamos o usuário após um pequeno atraso
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch (error: any) {
      // Tratamento de erros
      toast.error(error.message || 'Falha ao fazer login. Por favor, tente novamente.');
      console.error('Erro de login:', error);
      sessionStorage.removeItem('justLoggedIn');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...register('email')}
          className={errors.email ? 'border-destructive' : ''}
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
        />
        {errors.password && (
          <p className="text-sm text-destructive">{String(errors.password.message)}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox id="rememberMe" {...register('rememberMe')} />
          <Label htmlFor="rememberMe" className="text-sm">Lembrar-me</Label>
        </div>
        <Button 
          variant="link" 
          className="px-0" 
          type="button" 
          onClick={() => router.push('/reset-password')}
        >
          Esqueceu a senha?
        </Button>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
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
        <Button variant="outline" type="button">
          Google
        </Button>
        <Button variant="outline" type="button">
          GitHub
        </Button>
      </div>
    </form>
  );
}