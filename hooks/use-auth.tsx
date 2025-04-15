'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signOut, User } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Função para buscar o usuário atual
  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      
      // Vamos verificar se o estado do usuário realmente mudou
      const isChanged = !user || !currentUser || user.id !== currentUser.id;
      
      if (isChanged) {
        console.log('Estado do usuário atualizado:', currentUser ? 'Autenticado' : 'Não autenticado');
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      sessionStorage.removeItem('justLoggedIn');
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Verificar usuário ao montar o componente
  useEffect(() => {
    refreshUser();
    
    // Configurar verificação periódica do estado de autenticação
    // Isso ajuda a detectar quando o token expira
    const interval = setInterval(() => {
      refreshUser();
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(interval);
  }, []);

  // Redirecionar com base no status de autenticação
  useEffect(() => {
    if (!isLoading) {
      // Rotas que não exigem autenticação
      const publicRoutes = ['/', '/reset-password', '/signup', '/login'];
      const isPublicRoute = publicRoutes.includes(pathname);
      
      // Apenas redirecionar em situações específicas:
      if (!user && !isPublicRoute) {
        // Usuário não está autenticado e está tentando acessar uma rota protegida
        console.log('Usuário não autenticado tentando acessar rota protegida. Redirecionando para home.');
        router.push('/');
      } else if (user && pathname === '/' && sessionStorage.getItem('justLoggedIn') !== 'true') {
        // FUNCIONALIDADE DESABILITADA: Não verificamos mais se o usuário precisa trocar a senha
        
        // Usuário está autenticado e na página principal
        // Redirecionamos diretamente para o dashboard
        console.log('Usuário autenticado na página inicial. Redirecionando para dashboard.');
        sessionStorage.setItem('justLoggedIn', 'true');
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);
  
  // Limpar a flag de redirecionamento quando mudar de rota
  useEffect(() => {
    const handleRouteChange = () => {
      if (pathname !== '/') {
        // Só removemos a flag quando navegamos para fora da página inicial
        sessionStorage.removeItem('justLoggedIn');
      }
    };
    
    handleRouteChange();
    
    return () => {
      // Este retorno limpa o efeito quando o componente é desmontado
    };
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
} 