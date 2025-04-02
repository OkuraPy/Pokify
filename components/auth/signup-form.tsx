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
        <Label htmlFor="name" className="text-gray-700 font-medium flex items-center">
          <svg className="w-4 h-4 mr-1.5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5.33788 17.3206C5.99897 15.5269 7.77369 14 10 14H14C16.2263 14 18.001 15.5269 18.6621 17.3206C18.7984 17.7168 18.9147 18.1232 19 18.5361C19.1465 19.2551 18.5885 19.9117 17.8539 19.9117H6.14607C5.41146 19.9117 4.85347 19.2551 5 18.5361C5.08534 18.1232 5.20159 17.7168 5.33788 17.3206Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          Nome Completo
        </Label>
        <div className="relative">
          <Input
            id="name"
            placeholder="João Silva"
            {...register('name')}
            className={`pl-10 bg-blue-50/50 border-blue-100 py-5 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${errors.name ? 'border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-400' : ''}`}
            disabled={isLoading || success}
          />
          <div className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"></path>
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M12 13C7.58172 13 4 16.5817 4 21H20C20 16.5817 16.4183 13 12 13Z"></path>
            </svg>
          </div>
        </div>
        {errors.name && (
          <p className="text-sm text-red-500 flex items-center mt-1.5">
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
              <path d="M12 6V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="18" r="1" fill="currentColor"/>
            </svg>
            {String(errors.name.message)}
          </p>
        )}
      </div>

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
            disabled={isLoading || success}
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
            disabled={isLoading || success}
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-700 font-medium flex items-center">
          <svg className="w-4 h-4 mr-1.5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11C9 12.1046 8.10457 13 7 13C5.89543 13 5 12.1046 5 11C5 9.89543 5.89543 9 7 9C8.10457 9 9 9.89543 9 11Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M15 2L15.8536 1.14645C16.0488 0.951184 16.0488 0.634602 15.8536 0.43934C15.6583 0.244078 15.3417 0.244078 15.1464 0.43934L15 2ZM15.2929 4.70711C15.6834 5.09763 16.3166 5.09763 16.7071 4.70711C17.0976 4.31658 17.0976 3.68342 16.7071 3.29289L15.2929 4.70711ZM14.8536 0.43934C14.6583 0.244078 14.3417 0.244078 14.1464 0.43934C13.9512 0.634602 13.9512 0.951184 14.1464 1.14645L14.8536 0.43934ZM16.7071 3.29289C16.3166 2.90237 15.6834 2.90237 15.2929 3.29289C14.9024 3.68342 14.9024 4.31658 15.2929 4.70711L16.7071 3.29289ZM15.1464 0.43934L14.2929 1.29289L15.7071 2.70711L16.5607 1.85355L15.1464 0.43934ZM14.1464 1.14645L15 2L16.4142 0.58579L15.5607 -0.267767L14.1464 1.14645ZM16.7071 3.29289L15.8536 2.43934L14.4393 3.85355L15.2929 4.70711L16.7071 3.29289ZM15 2L14.1464 2.85355L15.5607 4.26777L16.4142 3.41421L15 2Z" fill="currentColor"/>
            <path d="M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C12.5829 3 14.0577 3.44576 15.3069 4.22558" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Confirmar Senha
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className={`pl-10 bg-blue-50/50 border-blue-100 py-5 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${errors.confirmPassword ? 'border-red-300 bg-red-50/50 focus:ring-red-500/20 focus:border-red-400' : ''}`}
            disabled={isLoading || success}
          />
          <div className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M12 10L12 14"></path>
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M14 12L10 12"></path>
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M16 11.5V10.5C16 8.29086 14.2091 6.5 12 6.5V6.5C9.79086 6.5 8 8.29086 8 10.5V11.5"></path>
              <rect x="5" y="11.5" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500 flex items-center mt-1.5">
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none">
              <path d="M12 6V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="18" r="1" fill="currentColor"/>
            </svg>
            {String(errors.confirmPassword.message)}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5" 
        disabled={isLoading || success}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Criando conta...</span>
          </div>
        ) : success ? (
          <div className="flex items-center justify-center text-white">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <path d="M7 12L10.5 15.5L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Conta criada com sucesso!</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span>Criar Conta</span>
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