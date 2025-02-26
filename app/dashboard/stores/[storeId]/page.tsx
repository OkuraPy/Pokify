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

/**
 * Componente da página de loja
 */
export default async function StorePage({ params }: { params: { storeId: string } }) {
  console.log('[StorePage] Iniciando carregamento da loja. ID:', params.storeId);
  
  const storeId = params.storeId;
  
  // Validar formato do ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  let storeData;
  
  // Tentar buscar a loja no banco de dados
  if (uuidRegex.test(storeId)) {
    try {
      console.log('[StorePage] Buscando dados da loja no banco...');
      const storeResult = await getStoreById(storeId);
      
      console.log('[StorePage] Resultado da busca:', storeResult);
      
      // Se encontrou a loja, usar os dados reais
      if (storeResult.success && storeResult.store) {
        const store = storeResult.store;
        console.log('[StorePage] Loja encontrada:', {
          id: store.id,
          name: store.name,
          platform: store.platform,
          url: store.url
        });
        
        // Construir dados para o cliente
        storeData = {
          id: store.id,
          name: store.name || 'Nome não disponível', // Fallback para nome
          platform: store.platform,
          url: store.url || '', 
          stats: {
            totalProducts: store.products_count || 0,
            totalReviews: 0,
            conversionRate: 0,
            lastSync: store.last_sync 
              ? typeof store.last_sync === 'string' 
                ? store.last_sync 
                : store.last_sync.toISOString() 
              : new Date().toISOString()
          }
        };
      } else {
        console.error('[StorePage] Erro ao buscar loja:', storeResult.error);
      }
    } catch (error) {
      console.error('[StorePage] Erro ao buscar loja:', error);
    }
  } else {
    console.warn('[StorePage] ID inválido:', storeId);
  }
  
  // Se não encontrou a loja ou o ID é inválido, criar dados mockados
  if (!storeData) {
    console.log('[StorePage] Usando dados mockados para a loja');
    
    // Dados mockados para a loja
    storeData = {
      id: storeId,
      name: `Loja de Teste ${storeId.substring(0, 6)}`,
      platform: 'shopify',
      url: 'https://exemplo-loja.myshopify.com',
      stats: {
        totalProducts: Math.floor(Math.random() * 100) + 1,
        totalReviews: Math.floor(Math.random() * 500),
        conversionRate: 0,
        lastSync: new Date().toISOString()
      }
    };
  }
  
  console.log('[StorePage] Dados finais da loja:', storeData);
  return <StoreClient store={storeData} />;
}
