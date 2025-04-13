'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface PaymentProtectionProps {
  children: ReactNode;
}

/**
 * Componente de proteção que verifica o status de pagamento do usuário
 * e redireciona para a página de cobrança se o pagamento estiver pendente.
 * 
 * Este componente deve envolver todas as páginas que requerem um pagamento ativo.
 */
export function PaymentProtection({ children }: PaymentProtectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Obter a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Se não houver sessão, redirecionar para login
          router.push('/');
          return;
        }

        // Verificar o status de pagamento do usuário
        const { data, error } = await supabase
          .from('users')
          .select('billing_status')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Erro ao verificar status de pagamento:', error);
          // Em caso de erro, não permitimos o acesso
          router.push('/dashboard/billing');
          return;
        }

        if (data?.billing_status === 'pending') {
          // Se o pagamento estiver pendente, redirecionar para a página de cobrança
          console.warn('Acesso bloqueado: usuário com pagamento pendente');
          router.push('/dashboard/billing');
          return;
        }

        // Se chegou até aqui, o usuário está autorizado
        setIsAuthorized(true);
      } catch (err) {
        console.error('Erro ao verificar autorização:', err);
        // Em caso de erro, redirecionar para o dashboard
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();

    // Verificar status a cada 5 minutos (impede que uma sessão longa contorne o bloqueio)
    const intervalId = setInterval(checkPaymentStatus, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [router]);

  // Durante a carga, mostramos uma página em branco ou um loader
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se autorizado, mostra o conteúdo da página
  return isAuthorized ? <>{children}</> : null;
}
