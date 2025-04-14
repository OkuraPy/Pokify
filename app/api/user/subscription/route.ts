import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
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
    
    const userId = session.user.id;
    
    // Buscar planos ativos
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .order('monthly_price', { ascending: true })
      .eq('active', true);
      
    if (plansError) {
      return NextResponse.json(
        { error: 'Falha ao carregar planos: ' + plansError.message },
        { status: 500 }
      );
    }
    
    // Buscar assinatura atual do usuário
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (subscriptionsError) {
      return NextResponse.json(
        { error: 'Falha ao carregar assinatura: ' + subscriptionsError.message },
        { status: 500 }
      );
    }
    
    // Preparar resposta
    const currentPlan = subscriptions && subscriptions.length > 0 
      ? {
          ...subscriptions[0],
          planDetails: subscriptions[0].plan
        }
      : null;
      
    return NextResponse.json({
      plans: plans || [],
      currentPlan
    });
    
  } catch (error) {
    console.error('Erro na API de assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 