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
    const { subscriptionId } = body;
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID da assinatura é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar a assinatura
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', session.user.id)
      .single();
    
    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      );
    }
    
    if (subscription.status !== 'pending') {
      return NextResponse.json(
        { status: subscription.status },
        { status: 200 }
      );
    }
    
    // Em um ambiente real, aqui você verificaria com o gateway de pagamento
    // se o PIX foi realmente pago. Para esta demonstração, simularemos
    // uma verificação com 50% de chance de sucesso para fins de teste.
    const isPaid = Math.random() > 0.5;
    
    if (isPaid) {
      // Atualizar o status da assinatura para 'active'
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', subscriptionId);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Erro ao atualizar assinatura: ' + updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { status: 'active', success: true },
        { status: 200 }
      );
    } else {
      // PIX ainda não foi pago
      return NextResponse.json(
        { status: 'pending', success: false },
        { status: 200 }
      );
    }
    
  } catch (error) {
    console.error('Erro ao verificar pagamento PIX:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 