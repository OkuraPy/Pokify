import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuração
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Cliente Supabase com role de serviço para ter permissões completas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Logs de configuração
console.log('=== CONFIGURAÇÕES ===');
console.log(`Supabase URL: ${supabaseUrl ? 'OK' : 'FALTANDO'}`);
console.log(`Supabase Key: ${supabaseServiceKey ? 'OK' : 'FALTANDO'}`);

// Função principal para excluir uma conta de usuário e todos os seus dados relacionados
async function deleteUserAccount(userEmail) {
  try {
    console.log(`Iniciando exclusão da conta para o email: ${userEmail}`);
    
    // 1. Encontrar o ID do usuário pelo email
    console.log(`Buscando usuário com email: ${userEmail}`);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail.toLowerCase())
      .single();
      
    if (userError || !userData) {
      console.error('Usuário não encontrado:', userError);
      return {
        success: false,
        error: userError || {
          message: 'Usuário não encontrado'
        }
      };
    }
    
    const userId = userData.id;
    console.log(`Usuário encontrado com ID: ${userId}`);
    
    // 2. Verificar se existem lojas associadas e excluí-las (primeiro os produtos)
    console.log(`Verificando lojas para o usuário ${userId}...`);
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', userId);
      
    if (!storesError && storesData && storesData.length > 0) {
      console.log(`Encontradas ${storesData.length} lojas para exclusão`);
      
      // Para cada loja, excluir todas as dependências relacionadas aos produtos
      for (const store of storesData) {
        // Buscar todos os produtos da loja
        const { data: storeProducts, error: productsError } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id);
          
        if (!productsError && storeProducts && storeProducts.length > 0) {
          console.log(`Encontrados ${storeProducts.length} produtos para a loja ${store.id}`);
          
          // Para cada produto, excluir reviews e published_reviews_json
          for (const product of storeProducts) {
            // Excluir published_reviews_json
            console.log(`Excluindo reviews publicados do produto ${product.id}...`);
            const { error: publishedReviewsDeleteError } = await supabase
              .from('published_reviews_json')
              .delete()
              .eq('product_id', product.id);
              
            if (publishedReviewsDeleteError) {
              console.warn(`Aviso ao excluir reviews publicados do produto ${product.id}:`, publishedReviewsDeleteError);
            }
            
            // Excluir reviews
            console.log(`Excluindo reviews do produto ${product.id}...`);
            const { error: reviewsDeleteError } = await supabase
              .from('reviews')
              .delete()
              .eq('product_id', product.id);
              
            if (reviewsDeleteError) {
              console.warn(`Aviso ao excluir reviews do produto ${product.id}:`, reviewsDeleteError);
            }
          }
          
          // Depois de excluir todas as dependências, excluir os produtos
          console.log(`Excluindo produtos da loja ${store.id}...`);
          const { error: productsDeleteError } = await supabase
            .from('products')
            .delete()
            .eq('store_id', store.id);
            
          if (productsDeleteError) {
            console.warn(`Aviso ao excluir produtos da loja ${store.id}:`, productsDeleteError);
          }
          
          // Verificar se produtos foram efetivamente excluídos
          const { data: remainingProducts, count } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('store_id', store.id);
            
          if (count && count > 0) {
            console.warn(`Ainda existem ${count} produtos para a loja ${store.id}`);
            return {
              success: false,
              error: {
                message: `Não foi possível excluir todos os produtos da loja ${store.id}. Restam ${count} produtos.`
              }
            };
          }
        }
      }
      
      // Depois de excluir produtos e suas dependências, excluir as lojas uma a uma
      for (const store of storesData) {
        console.log(`Excluindo loja ${store.id}...`);
        const { error: storeDeleteError } = await supabase
          .from('stores')
          .delete()
          .eq('id', store.id);
          
        if (storeDeleteError) {
          console.error(`Erro ao excluir loja ${store.id}:`, storeDeleteError);
          return {
            success: false,
            error: {
              message: `Falha ao excluir loja ${store.id}: ${storeDeleteError.message}`
            }
          };
        }
      }
      
      // Verificar se ainda existem lojas
      const { data: remainingStores, count: storesCount } = await supabase
        .from('stores')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
        
      if (storesCount && storesCount > 0) {
        console.error(`FALHA: Ainda existem ${storesCount} lojas vinculadas ao usuário ${userId}`);
        return {
          success: false,
          error: {
            message: `Não foi possível excluir todas as lojas do usuário. Restam ${storesCount} lojas.`
          }
        };
      }
    }
    
    // 3. Excluir assinaturas
    console.log(`Excluindo assinaturas para o usuário ${userId}...`);
    const { error: subscriptionDeleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
      
    if (subscriptionDeleteError) {
      console.warn('Aviso ao excluir assinaturas:', subscriptionDeleteError);
    }
    
    // 4. Excluir configurações de usuário
    console.log(`Excluindo configurações para o usuário ${userId}...`);
    const { error: settingsDeleteError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId);
      
    if (settingsDeleteError) {
      console.warn('Aviso ao excluir configurações de usuário:', settingsDeleteError);
    }
    
    // 5. Excluir configurações de reviews
    console.log(`Excluindo configurações de reviews para o usuário ${userId}...`);
    const { error: reviewConfigsDeleteError } = await supabase
      .from('review_configs')
      .delete()
      .eq('user_id', userId);
      
    if (reviewConfigsDeleteError) {
      console.warn('Aviso ao excluir configurações de reviews:', reviewConfigsDeleteError);
    }
    
    // 6. Excluir o registro do usuário na tabela 'users'
    console.log(`Excluindo registro do usuário ${userId} da tabela users...`);
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (userDeleteError) {
      console.error('Erro ao excluir registro do usuário:', userDeleteError);
      return {
        success: false,
        error: userDeleteError
      };
    }
    
    // 7. Finalmente, excluir o usuário do sistema de autenticação
    console.log(`Excluindo usuário ${userId} do sistema de autenticação...`);
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Erro ao excluir usuário do sistema de autenticação:', authDeleteError);
      return {
        success: false,
        error: authDeleteError,
        message: 'Usuário parcialmente excluído. Registro removido das tabelas, mas falha ao remover da autenticação.'
      };
    }
    
    console.log(`Usuário ${userId} (${userEmail}) excluído com sucesso!`);
    return {
      success: true,
      message: 'Usuário excluído com sucesso',
      userId
    };
  } catch (error) {
    console.error('Erro ao excluir conta de usuário:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    };
  }
}

serve(async (req) => {
  try {
    console.log('Recebida nova requisição para delete-account');
    
    // Verificar método
    if (req.method !== 'POST') {
      console.log(`Método não permitido: ${req.method}`);
      return new Response(JSON.stringify({
        error: 'Método não permitido'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Obter e validar o corpo da requisição
    const data = await req.json();
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    // Verificar parâmetros obrigatórios
    if (!data.userEmail) {
      console.log('Dados incompletos:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({
        error: 'Dados incompletos',
        message: 'userEmail é obrigatório'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Processar a exclusão da conta
    console.log('Iniciando processo de exclusão de conta...');
    const result = await deleteUserAccount(data.userEmail);
    
    if (!result.success) {
      console.error('Falha ao excluir conta:', result.error);
      return new Response(JSON.stringify({
        error: 'Falha ao excluir conta',
        message: result.error?.message || 'Não foi possível excluir a conta para o email fornecido'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Retornar sucesso
    const responseData = {
      success: true,
      message: 'Conta excluída com sucesso',
      data: {
        userEmail: data.userEmail,
        userId: result.userId
      }
    };
    
    console.log('Resposta de sucesso:', JSON.stringify(responseData, null, 2));
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erro na função de exclusão de conta:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}); 