import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Verifica se o usuário atual tem privilégios de administrador
 * @returns Promise<boolean> - Verdadeiro se o usuário for administrador
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    // Obter o usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Erro ao verificar usuário:', authError);
      return false;
    }
    
    // Verificar se o usuário tem role = 'admin' na tabela users
    const { data: userData, error: dataError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (dataError) {
      console.error('Erro ao verificar privilégios de administrador:', dataError);
      return false;
    }
    
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Erro ao verificar status de administrador:', error);
    return false;
  }
}

/**
 * Hook para componentes React que precisam verificar status de admin
 * @returns Object com estado de carregamento e se é admin
 */
export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function checkAdminStatus() {
      setIsLoading(true);
      try {
        const adminStatus = await isCurrentUserAdmin();
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Erro ao verificar status de administrador:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAdminStatus();
  }, []);
  
  return { isAdmin, isLoading };
}
