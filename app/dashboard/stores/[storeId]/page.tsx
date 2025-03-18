import { StoreClient } from './store-client';
import { getStoreById, getUserStores } from '@/lib/store-service';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase';

// Esta função não é mais necessária já que removemos output: 'export'
// export async function generateStaticParams() {
//   return [
//     { storeId: '1' },
//     { storeId: '2' },
//     { storeId: '3' },
//     { storeId: '4' },
//   ];
// }

/**
 * Redireciona para a primeira loja do usuário atual, ou para a página de criação de loja se não houver nenhuma.
 */
async function redirectToFirstStore(currentStoreId?: string) {
  console.log('Iniciando redirecionamento para a primeira loja. ID atual:', currentStoreId);
  
  try {
    // Verificar usuário atual
    const user = await getCurrentUser();
    if (!user) {
      console.log('Usuário não autenticado, redirecionando para a página inicial');
      redirect('/');
      return;
    }
    
    console.log('Buscando lojas do usuário:', user.id);
    const storesResult = await getUserStores(user.id);
    
    if (!storesResult.success || !storesResult.stores) {
      console.error('Erro ao buscar lojas do usuário:', storesResult.error);
      redirect('/dashboard/stores');
      return;
    }
    
    const stores = storesResult.stores;
    console.log(`Encontradas ${stores.length} lojas para o usuário`);
    
    if (stores.length === 0) {
      console.log('Nenhuma loja encontrada, redirecionando para página de criação');
      redirect('/dashboard/stores');
      return;
    }
    
    // Se temos um ID atual e ele é a primeira loja, não precisamos redirecionar
    if (currentStoreId && currentStoreId === stores[0].id) {
      console.log('Já estamos na primeira loja, não é necessário redirecionar');
      return;
    }
    
    // Redirecionar para a primeira loja
    console.log('Redirecionando para a primeira loja:', stores[0].id);
    redirect(`/dashboard/stores/${stores[0].id}`);
  } catch (error) {
    console.error('Erro ao redirecionar para a primeira loja:', error);
    redirect('/dashboard');
  }
}

interface StorePageProps {
  params: {
    storeId: string;
  };
}

/**
 * Componente da página de loja
 */
export default function StorePage({ params }: StorePageProps) {
  return (
    <StoreClient storeId={params.storeId} />
  );
}
