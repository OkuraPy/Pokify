import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Importação para o serviço de email
import { Resend } from "https://esm.sh/resend";

// Configurar cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configurar cliente Resend
const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
const resend = new Resend(resendApiKey);

// Log de configuração para depuração
console.log('Iniciando edge function com as seguintes configurações:');
console.log(`Supabase URL: ${supabaseUrl ? 'Configurado' : 'NÃO CONFIGURADO'}`);
console.log(`Supabase Key: ${supabaseServiceKey ? 'Configurado' : 'NÃO CONFIGURADO'}`);
console.log(`Resend API Key: ${resendApiKey ? 'Configurado' : 'NÃO CONFIGURADO'}`);

// Função para gerar senha aleatória
function generateTemporaryPassword(length = 10) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Função para enviar email com credenciais
async function sendWelcomeEmail(email, password, userName) {
  try {
    console.log(`Tentando enviar email para: ${email}`);
    
    // Usar o nome se disponível, ou um cumprimento genérico
    const greeting = userName ? `Olá ${userName}` : 'Olá';

    // Verificar se o Resend está configurado
    if (!resendApiKey) {
      console.error('Chave da API do Resend não configurada!');
      return { 
        success: false, 
        error: 'Chave da API do Resend não configurada'
      };
    }
    
    const emailData = {
      from: 'Pokify <noreply@dropfyapp.com.br>',
      to: email,
      subject: 'Bem-vindo ao Pokify - Suas credenciais de acesso',
      html: `
        <h1>${greeting}, bem-vindo ao Pokify!</h1>
        <p>Uma conta foi criada para você após sua compra. Aqui estão suas credenciais de acesso:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Senha temporária:</strong> ${password}</p>
        <p>Recomendamos que você altere sua senha após o primeiro acesso.</p>
        <p>Acesse sua conta em: <a href="https://app.pokify.com.br/login">https://app.pokify.com.br/login</a></p>
        <p>Obrigado por escolher o Pokify!</p>
      `
    };

    console.log('Dados do email a ser enviado:', JSON.stringify(emailData, null, 2));
    
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Erro ao enviar email:', error);
      return { success: false, error };
    }
    
    console.log('Email enviado com sucesso. ID da mensagem:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Exceção ao enviar email:', error);
    return { success: false, error };
  }
}

// Função para criar um novo usuário
async function createNewUser(email, userName) {
  try {
    console.log(`Criando novo usuário: ${email}, Nome: ${userName || 'Não fornecido'}`);
    const temporaryPassword = generateTemporaryPassword();
    
    // Criar usuário na autenticação do Supabase
    console.log('Tentando criar usuário na autenticação do Supabase...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.error('Erro ao criar usuário na autenticação:', authError);
      return { success: false, error: authError };
    }
    
    console.log('Usuário criado na autenticação. Detalhes:', authData);
    const userId = authData.user.id;
    
    // Criar registro na tabela users
    console.log(`Tentando inserir usuário ${userId} na tabela users...`);
    const userData = {
      id: userId,
      email: email.toLowerCase(),
      full_name: userName || null,
      billing_status: 'inactive',
      stores_limit: 0,
      products_limit: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Dados a serem inseridos:', JSON.stringify(userData, null, 2));
    
    const { error: userError } = await supabase.from('users').insert(userData);
    
    if (userError) {
      console.error('Erro ao criar registro do usuário:', userError);
      return { success: false, error: userError };
    }
    
    console.log(`Usuário ${userId} inserido com sucesso na tabela users`);
    
    // Enviar email com credenciais
    console.log('Tentando enviar email de boas-vindas...');
    const emailResult = await sendWelcomeEmail(email, temporaryPassword, userName);
    if (!emailResult.success) {
      console.warn('Email de boas-vindas não pôde ser enviado, mas o usuário foi criado.');
      console.warn('Detalhes do erro:', emailResult.error);
    }
    
    // Registrar a senha temporária nos logs para depuração (remover em produção)
    console.log(`DEPURAÇÃO - Usuário: ${email}, Senha temporária: ${temporaryPassword}`);
    
    return { success: true, userId };
  } catch (error) {
    console.error('Erro ao criar novo usuário:', error);
    return { success: false, error };
  }
}

async function createNewSubscription(userEmail, planType, userName) {
  try {
    console.log(`Iniciando criação de assinatura para ${userEmail}, Plano: ${planType}, Nome: ${userName || 'N/A'}`);
    
    // Buscar o usuário pelo email
    console.log(`Verificando se usuário ${userEmail} já existe...`);
    const { data: userData, error: userError } = await supabase.from('users').select('id').eq('email', userEmail.toLowerCase()).single();
    
    let userId;
    // Se o usuário não existir, criar um novo
    if (userError || !userData) {
      console.log('Usuário não encontrado. Criando novo usuário para:', userEmail);
      
      // Verificar se o nome foi fornecido para novos usuários
      if (!userName) {
        console.error('Nome de usuário é obrigatório para novos usuários');
        throw new Error('Nome de usuário é obrigatório para novos usuários');
      }
      
      const createResult = await createNewUser(userEmail, userName);
      
      if (!createResult.success) {
        console.error('Falha ao criar novo usuário:', createResult.error);
        return null;
      }
      
      userId = createResult.userId;
      console.log(`Novo usuário criado com ID: ${userId} para email: ${userEmail}`);
    } else {
      userId = userData.id;
      console.log(`Usuário encontrado: ${userId} para email: ${userEmail}`);
    }

    // Determinar informações do plano
    console.log(`Processando informações para plano tipo: ${planType}`);
    let planCycle;
    let nextDate;
    let isLifetime = false;
    // Buscar informações do plano
    let planName;
    if (planType === '1' || planType.toUpperCase() === 'STARTER') {
      planName = 'STARTER';
      planCycle = 'monthly';
      nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (planType === '2' || planType.toUpperCase() === 'GROWTH') {
      planName = 'GROWTH';
      planCycle = 'semi_annual';
      nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 6);
    } else if (planType === '3' || planType.toUpperCase() === 'PRO') {
      planName = 'PRO';
      planCycle = 'lifetime';
      nextDate = null; // Plano vitalício
      isLifetime = true;
    } else {
      throw new Error(`Tipo de plano não reconhecido: ${planType}`);
    }
    
    // Buscar o ID do plano
    console.log(`Buscando informações do plano ${planName}...`);
    const { data: planData, error: planError } = await supabase.from('plans').select('id, stores_limit, products_limit').eq('name', planName).single();
    if (planError || !planData) {
      console.error('Plano não encontrado:', planError);
      throw new Error(`Plano ${planName} não encontrado`);
    }
    
    const planId = planData.id;
    console.log(`Plano encontrado: ${planId}, Limites: ${planData.stores_limit} lojas, ${planData.products_limit} produtos`);
    
    // Desativar assinaturas anteriores
    console.log(`Desativando assinaturas anteriores para usuário ${userId}...`);
    await supabase.from('subscriptions').update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    }).eq('user_id', userId).in('status', [
      'active',
      'pending'
    ]);
    
    // Criar nova assinatura
    console.log('Criando nova assinatura...');
    const newSubscriptionId = crypto.randomUUID();
    const subscriptionData = {
      id: newSubscriptionId,
      user_id: userId,
      plan_id: planId,
      asaas_customer_id: 'customer_webhook',
      asaas_subscription_id: 'subscription_webhook',
      status: 'active',
      cycle: planCycle,
      next_payment_date: nextDate?.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Dados da assinatura:', JSON.stringify(subscriptionData, null, 2));
    
    const { error: insertError } = await supabase.from('subscriptions').insert(subscriptionData);
    if (insertError) {
      console.error('Erro ao inserir assinatura:', insertError);
      throw new Error(`Falha ao criar assinatura: ${insertError.message}`);
    }
    
    console.log(`Assinatura ${newSubscriptionId} criada com sucesso`);
    
    // Atualizar tabela de usuários
    console.log(`Atualizando usuário ${userId} com novos limites do plano...`);
    const { error: updateError } = await supabase.from('users').update({
      billing_status: 'active',
      stores_limit: planData.stores_limit,
      products_limit: planData.products_limit || -1,
      updated_at: new Date().toISOString()
    }).eq('id', userId);
    
    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError);
      throw new Error(`Falha ao atualizar usuário: ${updateError.message}`);
    }
    
    console.log(`Usuário ${userId} atualizado com sucesso com os limites do plano`);
    
    // Registrar evento (opcional)
    try {
      console.log('Registrando evento de nova assinatura...');
      await supabase.from('subscription_events').insert({
        user_id: userId,
        subscription_id: newSubscriptionId,
        event_type: 'new_subscription',
        details: {
          plan_type: planType,
          plan_id: planId,
          user_email: userEmail,
          user_name: userName
        },
        created_at: new Date().toISOString()
      });
      console.log('Evento registrado com sucesso');
    } catch (eventError) {
      console.error('Erro ao registrar evento (não crítico):', eventError);
    }
    
    console.log('Processo de assinatura concluído com sucesso');
    return {
      subscriptionId: newSubscriptionId,
      userId
    };
  } catch (error) {
    console.error('Erro ao processar assinatura:', error);
    throw error;
  }
}

// Função simplificada para testar apenas o fluxo básico
serve(async (req) => {
  try {
    console.log('Nova requisição recebida');
    
    // Só aceita POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse do corpo
    const data = await req.json();
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    
    // Verificar campos obrigatórios
    if (!data.userEmail) {
      return new Response(JSON.stringify({ error: 'userEmail é obrigatório' }), {
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar se o usuário existe
    console.log(`Verificando se o usuário ${data.userEmail} existe...`);
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', data.userEmail.toLowerCase())
      .single();
      
    if (existingUser) {
      console.log('Usuário encontrado:', existingUser);
      
      // Se existir, retorna sucesso com informações do usuário existente
      return new Response(JSON.stringify({
        success: true, 
        message: 'Usuário encontrado', 
        data: existingUser
      }), {
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Se chegou aqui, o usuário não existe, então vamos criar
    
    // Verificar nome
    if (!data.userName) {
      return new Response(JSON.stringify({ 
        error: 'userName é obrigatório para criar novo usuário' 
      }), {
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Criando novo usuário com email: ${data.userEmail}, nome: ${data.userName}`);
    
    // Gerar senha
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    console.log(`Senha temporária gerada: ${password}`);
    
    // Criar usuário na autenticação
    console.log('Criando usuário na autenticação...');
    let newUserId;
    
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.userEmail,
        password: password,
        email_confirm: true
      });
      
      if (authError) {
        console.error('Erro ao criar usuário na autenticação:', authError);
        throw authError;
      }
      
      console.log('Usuário criado na autenticação:', authData);
      newUserId = authData.user.id;
      
      // Criar perfil de usuário
      console.log(`Criando perfil para usuário ${newUserId}...`);
      const { error: profileError } = await supabase.from('users').insert({
        id: newUserId,
        email: data.userEmail.toLowerCase(),
        full_name: data.userName,
        billing_status: 'inactive',
        stores_limit: 0,
        products_limit: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (profileError) {
        console.error('Erro ao criar perfil de usuário:', profileError);
        throw profileError;
      }
      
      console.log('Perfil de usuário criado com sucesso');
      
      // Tentar enviar email
      console.log('Tentando enviar email com credenciais...');
      
      try {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Pokify <noreply@dropfyapp.com.br>',
          to: data.userEmail,
          subject: 'Suas credenciais de acesso ao Pokify',
          html: `
            <h1>Olá ${data.userName}, bem-vindo ao Pokify!</h1>
            <p>Sua conta foi criada com sucesso. Aqui estão suas credenciais:</p>
            <p><strong>Email:</strong> ${data.userEmail}</p>
            <p><strong>Senha temporária:</strong> ${password}</p>
            <p>Acesse sua conta em: <a href="https://app.pokify.com.br/login">https://app.pokify.com.br/login</a></p>
          `
        });
        
        if (emailError) {
          console.error('Erro ao enviar email:', emailError);
        } else {
          console.log('Email enviado com sucesso:', emailData);
        }
      } catch (emailException) {
        console.error('Exceção ao enviar email:', emailException);
      }
      
      // Retornar resultado
      return new Response(JSON.stringify({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          userId: newUserId,
          email: data.userEmail,
          name: data.userName,
          // Incluir a senha é apenas para depuração e NÃO deve ser feito em produção!
          temporaryPassword: password
        }
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Erro no processo de criação de usuário:', error);
      
      return new Response(JSON.stringify({
        error: 'Erro ao criar usuário',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Erro geral na função:', error);
    
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}); 