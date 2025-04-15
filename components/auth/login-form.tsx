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
import { signIn, supabase } from '@/lib/supabase';
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
      
      // 4. Verificar se o usuário está com senha temporária
      try {
        // FUNCIONALIDADE DESABILITADA POR SOLICITAÇÃO
        // Não faremos mais a verificação de senha temporária
        console.log('Verificação de senha temporária desabilitada');
        
        /* Código comentado para referência futura
        // Verificar metadados do usuário que podem indicar senha temporária
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Verificar nos metadados se é uma senha temporária
          const needsPasswordChange = user.user_metadata?.temporary_password === true;
          
          // Se temos a informação nos metadados, usamos ela
          if (needsPasswordChange) {
            console.log('Metadados indicam que a senha é temporária');
            sessionStorage.setItem('needs_password_change', 'true');
          } else {
            // Verificar alternativa: Se o login foi feito com a senha temporária conhecida
            const password = formData.password; // Obter a senha dos dados do formulário
            console.log('Senha utilizada no login:', password);
            
            // Lista de senhas temporárias conhecidas
            const knownTempPasswords = ['fWMd8zZBIu', 'Nl#B5LdCQb'];
            
            // Padrões de senha temporária:
            // 1. Senha está na lista de conhecidas
            // 2. Senha tem 9-10 caracteres e inclui letras, números e possivelmente caracteres especiais
            const isTemporaryPassword = knownTempPasswords.includes(password) || 
              (password.length >= 8 && password.length <= 10 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password))
              
            if (isTemporaryPassword) {
              console.log('Senha segue padrão de senha temporária');
              sessionStorage.setItem('needs_password_change', 'true');
            } else {
              console.log('Senha não parece ser temporária');
            }
          }
        } else {
          console.error('Usuário não disponível após login');
        }
        */
      } catch (passwordCheckError) {
        console.error('Erro ao verificar status da senha:', passwordCheckError);
      }
      
      // 5. Verificamos novamente após um curto período para garantir persistência
      setTimeout(async () => {
        await refreshUser();
        console.log('Verificação de estado do usuário após delay');
      }, 1000);
      
      // Definimos a flag para evitar loops de redirecionamento
      sessionStorage.setItem('justLoggedIn', 'true');
      
      // Informamos o usuário do sucesso
      toast.success('Login realizado com sucesso!');
      
      // 6. Redirecionamos o usuário após um pequeno atraso
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
        <Label htmlFor="email" className="text-gray-700 font-medium flex items-center">
          <svg className="w-4 h-4 mr-1.5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 7L9.95404 12.5458C11.1874 13.4183 12.8126 13.4183 14.046 12.5458L22 7" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          Email
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...register('email')}
            className={`pl-10 bg-blue-50/50 border-blue-100 py-5 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${errors.email ? 'border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-400' : ''}`}
          />
          <div className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M4 6L12.5 12L20 6"></path>
            </svg>
          </div>
        </div>
        {errors.email && (
          <p className="text-sm text-red-500 flex items-center mt-1.5">
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
              <path d="M12 6V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="18" r="1" fill="currentColor"/>
            </svg>
            {String(errors.email.message)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700 font-medium flex items-center">
          <svg className="w-4 h-4 mr-1.5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 8V6C16 3.79086 14.2091 2 12 2C9.79086 2 8 3.79086 8 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="4" y="8" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          Senha
        </Label>
        <div className="relative">
          <Input
            id="password"
            type="password"
            {...register('password')}
            className={`pl-10 bg-blue-50/50 border-blue-100 py-5 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${errors.password ? 'border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-400' : ''}`}
          />
          <div className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M16 11.5V10.5C16 8.29086 14.2091 6.5 12 6.5V6.5C9.79086 6.5 8 8.29086 8 10.5V11.5"></path>
              <rect x="5" y="11.5" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="16" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500 flex items-center mt-1.5">
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
              <path d="M12 6V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="18" r="1" fill="currentColor"/>
            </svg>
            {String(errors.password.message)}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox id="rememberMe" {...register('rememberMe')} className="border-blue-200 text-blue-600 rounded data-[state=checked]:bg-blue-600" />
          <Label htmlFor="rememberMe" className="text-sm text-gray-600">Lembrar-me</Label>
        </div>
        <Button 
          variant="link" 
          className="px-0 text-blue-600 hover:text-blue-800 font-medium text-sm" 
          type="button" 
          onClick={() => router.push('/reset-password')}
        >
          Esqueceu a senha?
        </Button>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5" 
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Entrando...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span>Entrar</span>
            <svg className="ml-1.5 w-4 h-4" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.75 6.75L19.25 12L13.75 17.25"></path>
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H4.75"></path>
            </svg>
          </div>
        )}
      </Button>
    </form>
  );
}