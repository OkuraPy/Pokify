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

/**
 * Função principal para excluir uma conta de usuário e todos os seus dados relacionados
 * @param {string} userEmail Email do usuário a ser excluído
 * @returns {Promise<Object>} Objeto com status de sucesso, mensagem e possivelmente dados do usuário
 */
async function deleteUserAccount(userEmail) {
  if (!userEmail) {
    console.error('Email de usuário não fornecido');
    return {
      success: false,
      error: {
        message: 'Email de usuário não fornecido'
      }
    };
  }

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
    
    // 2. Verificar se existem lojas associadas e excluí-las
    console.log(`Verificando lojas para o usuário ${userId}...`);
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', userId);
      
    if (storesError) {
      console.error('Erro ao buscar lojas:', storesError);
      return {
        success: false,
        error: {
          message: `Erro ao buscar lojas: ${storesError.message}`
        }
      };
    }
    
    if (storesData && storesData.length > 0) {
      console.log(`Encontradas ${storesData.length} lojas para exclusão`);
      
      // Para cada loja, usar diretamente o método de fallback
      for (const store of storesData) {
        console.log(`Excluindo loja ${store.id} via método direto...`);
        const result = await executeStoreFallbackDelete(store.id);
        
        if (!result.success) {
          console.error(`Falha ao excluir loja ${store.id}:`, result.error);
          return {
            success: false,
            error: {
              message: `Não foi possível excluir a loja ${store.id}: ${result.error}`
            }
          };
        }
        
        console.log(`Loja ${store.id} excluída com sucesso`);
      }
      
      // Verificar se ainda existem lojas
      const { count: storesCount, error: storesCountError } = await supabase
        .from('stores')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (storesCountError) {
        console.error(`Erro ao verificar lojas restantes do usuário ${userId}:`, storesCountError);
        return {
          success: false,
          error: {
            message: `Erro ao verificar lojas restantes: ${storesCountError.message}`
          }
        };
      }
      
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
    
    // 3. Excluir assinaturas do usuário
    console.log(`Excluindo assinaturas do usuário ${userId}...`);
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
      
    if (subscriptionError) {
      console.error('Erro ao excluir assinaturas:', subscriptionError);
      // Continuar mesmo com erro
    }
    
    // 4. Excluir configurações do usuário
    console.log(`Excluindo configurações do usuário ${userId}...`);
    const { error: settingsError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId);
      
    if (settingsError) {
      console.error('Erro ao excluir configurações do usuário:', settingsError);
      // Continuar mesmo com erro
    }
    
    // 5. Excluir configurações de reviews
    console.log(`Excluindo configurações de reviews do usuário ${userId}...`);
    const { error: reviewConfigError } = await supabase
      .from('review_configurations')
      .delete()
      .eq('user_id', userId);
      
    if (reviewConfigError) {
      console.error('Erro ao excluir configurações de reviews:', reviewConfigError);
      // Continuar mesmo com erro
    }
    
    // 6. Excluir o usuário da tabela users
    console.log(`Excluindo registro do usuário ${userId}...`);
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (deleteUserError) {
      console.error('Erro ao excluir usuário da tabela users:', deleteUserError);
      return {
        success: false,
        error: {
          message: `Erro ao excluir registro do usuário: ${deleteUserError.message}`
        }
      };
    }
    
    // 7. Excluir o usuário do auth
    console.log(`Tentando excluir usuário do auth para o email: ${userEmail}`);
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
      userId
    );
    
    if (authDeleteError) {
      console.error('Aviso: Erro ao excluir usuário do auth (mas o usuário foi removido do banco de dados):', authDeleteError);
      return {
        success: true,
        warning: {
          message: `Usuário removido do banco de dados, mas houve erro ao excluir da autenticação: ${authDeleteError.message}`
        }
      };
    }
    
    console.log(`Conta do usuário ${userEmail} excluída com sucesso!`);
    return {
      success: true
    };
  } catch (error) {
    console.error('Erro não tratado ao excluir conta de usuário:', error);
    return {
      success: false,
      error: {
        message: `Erro não tratado ao excluir conta: ${error.message}`
      }
    };
  }
}

/**
 * Método alternativo para exclusão de lojas caso o principal falhe
 */
async function executeStoreFallbackDelete(storeId) {
  console.log(`Executando método alternativo de exclusão para a loja ${storeId}...`);
  
  try {
    // Primeiro, recuperar todos os produtos da loja
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId);
      
    if (productsError) {
      console.error(`Erro ao buscar produtos da loja ${storeId}:`, productsError);
      return {
        success: false,
        error: `Erro ao buscar produtos: ${productsError.message}`
      };
    }
    
    console.log(`Encontrados ${products?.length || 0} produtos para exclusão manual`);
    
    // Se houver produtos, excluir suas dependências uma a uma
    if (products && products.length > 0) {
      for (const product of products) {
        // 1. Excluir reviews publicados
        console.log(`Excluindo published_reviews_json para produto ${product.id}...`);
        const { error: publishedReviewsDeleteError } = await supabase
          .from('published_reviews_json')
          .delete()
          .eq('product_id', product.id);
          
        if (publishedReviewsDeleteError) {
          console.warn(`Aviso ao excluir reviews publicados para produto ${product.id}:`, publishedReviewsDeleteError);
        }
        
        // 1.1. Excluir configurações de review
        console.log(`Excluindo review_configs para produto ${product.id}...`);
        const { error: reviewConfigsDeleteError } = await supabase
          .from('review_configs')
          .delete()
          .eq('product_id', product.id);
          
        if (reviewConfigsDeleteError) {
          console.warn(`Aviso ao excluir configurações de review para produto ${product.id}:`, reviewConfigsDeleteError);
        }
        
        // 2. Excluir reviews
        console.log(`Excluindo reviews para produto ${product.id}...`);
        const { error: reviewsDeleteError } = await supabase
          .from('reviews')
          .delete()
          .eq('product_id', product.id);
          
        if (reviewsDeleteError) {
          console.warn(`Aviso ao excluir reviews para produto ${product.id}:`, reviewsDeleteError);
        }
        
        // 3. Excluir publication_history
        console.log(`Excluindo publication_history para produto ${product.id}...`);
        const { error: pubHistoryDeleteError } = await supabase
          .from('publication_history')
          .delete()
          .eq('product_id', product.id);
          
        if (pubHistoryDeleteError) {
          console.warn(`Aviso ao excluir publication_history para produto ${product.id}:`, pubHistoryDeleteError);
        }
      }
    }
    
    // 4. Excluir publication_history da loja
    console.log(`Excluindo publication_history para loja ${storeId}...`);
    const { error: storePubHistoryDeleteError } = await supabase
      .from('publication_history')
      .delete()
      .eq('store_id', storeId);
      
    if (storePubHistoryDeleteError) {
      console.warn(`Aviso ao excluir publication_history da loja:`, storePubHistoryDeleteError);
    }
    
    // 5. Excluir produtos
    console.log(`Excluindo produtos da loja ${storeId}...`);
    const { error: productsDeleteError } = await supabase
      .from('products')
      .delete()
      .eq('store_id', storeId);
      
    if (productsDeleteError) {
      console.error(`Erro ao excluir produtos:`, productsDeleteError);
      return {
        success: false,
        error: `Erro ao excluir produtos: ${productsDeleteError.message}`
      };
    }
    
    // Verificar se produtos foram efetivamente excluídos
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);
      
    if (countError) {
      console.error(`Erro ao verificar produtos restantes:`, countError);
      return {
        success: false,
        error: `Erro ao verificar produtos restantes: ${countError.message}`
      };
    }
    
    if (count && count > 0) {
      console.error(`Ainda existem ${count} produtos para a loja ${storeId}`);
      return {
        success: false,
        error: `Não foi possível excluir todos os produtos da loja. Restam ${count} produtos.`
      };
    }
    
    // 6. Excluir a loja
    console.log(`Excluindo loja ${storeId}...`);
    const { error: storeDeleteError } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);
      
    if (storeDeleteError) {
      console.error(`Erro ao excluir loja:`, storeDeleteError);
      return {
        success: false,
        error: `Erro ao excluir loja: ${storeDeleteError.message}`
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Erro no método fallback:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função principal da Edge Function que processa as requisições HTTP
serve(async (req) => {
  try {
    console.log('Recebida nova requisição para handle-chargeback');
    
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
    let data;
    try {
      data = await req.json();
      console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Erro ao processar o corpo da requisição:', error);
      return new Response(JSON.stringify({
        error: 'Erro ao processar o corpo da requisição',
        message: 'O corpo da requisição deve ser um JSON válido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Extrair o email do usuário, podendo estar em userEmail ou name
    const userEmail = data.userEmail || data.name || data.email;
    
    // Verificar se temos um email
    if (!userEmail) {
      console.log('Dados incompletos:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({
        error: 'Dados incompletos',
        message: 'Email do usuário é obrigatório (userEmail, name ou email)'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Processar a exclusão da conta
    console.log(`Iniciando processo de exclusão de conta para ${userEmail}...`);
    const result = await deleteUserAccount(userEmail);
    
    // Verificar o resultado
    if (!result) {
      console.error('A função deleteUserAccount não retornou um resultado válido');
      return new Response(JSON.stringify({
        error: 'Erro interno do servidor',
        message: 'A função de exclusão de conta não retornou um resultado válido'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Verificar sucesso
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
        userEmail: userEmail,
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
    console.error('Erro na função handle-chargeback:', error);
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