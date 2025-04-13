'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { isCurrentUserAdmin } from '@/lib/admin-utils';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const hasAdminRole = await isCurrentUserAdmin();
        
        if (!hasAdminRole) {
          console.log('Acesso não autorizado à área de administração');
          router.push('/dashboard');
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Erro ao verificar permissão de administrador:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminAccess();
  }, [router]);

  // Mostra um indicador de carregamento enquanto verifica o status de admin
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-lg">Verificando acesso...</p>
      </div>
    );
  }

  // Se não for admin, não renderiza o conteúdo (já deveria ter sido redirecionado)
  if (!isAdmin) {
    return null;
  }

  // Layout para usuários admin
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto bg-gray-50 dark:bg-gray-800">
        {children}
      </main>
    </div>
  );
}
