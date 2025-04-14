import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verificar a sessão do usuário
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { userId, planId, paymentMethod, paymentData } = body;
    
    // Verificar se o ID do usuário na requisição corresponde ao da sessão
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'ID de usuário inválido' },
        { status: 403 }
      );
    }
    
    // Buscar detalhes do plano
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .eq('active', true)
      .single();
      
    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado ou inativo' },
        { status: 404 }
      );
    }
    
    // Simular processamento de pagamento
    // Em um ambiente real, aqui você integraria com um gateway de pagamento
    let paymentResult;
    
    if (paymentMethod === 'credit') {
      // Simulação de processamento de cartão de crédito
      paymentResult = {
        success: true,
        transactionId: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: 'approved'
      };
    } else if (paymentMethod === 'pix') {
      // Gerar código PIX (simulado)
      paymentResult = {
        success: true,
        pixCode: `PIX${Date.now()}${Math.floor(Math.random() * 10000)}`,
        expirationDate: new Date(Date.now() + 30 * 60000).toISOString() // 30 minutos
      };
    } else {
      return NextResponse.json(
        { error: 'Método de pagamento não suportado' },
        { status: 400 }
      );
    }
    
    // Criar nova assinatura no banco de dados
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: paymentMethod === 'credit' ? 'active' : 'pending',
        payment_method: paymentMethod,
        price_paid: plan.monthly_price,
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        payment_data: paymentResult
      })
      .select()
      .single();
    
    if (subscriptionError) {
      return NextResponse.json(
        { error: 'Erro ao criar assinatura: ' + subscriptionError.message },
        { status: 500 }
      );
    }
    
    // Retornar resposta com base no método de pagamento
    if (paymentMethod === 'pix') {
      return NextResponse.json({
        success: true,
        pixCode: paymentResult.pixCode,
        subscription
      });
    } else {
      return NextResponse.json({
        success: true,
        subscription
      });
    }
    
  } catch (error) {
    console.error('Erro ao processar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 