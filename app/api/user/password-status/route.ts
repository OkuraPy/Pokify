import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Importante para APIs de rota no Next.js

export async function GET(request: Request) {
  try {
    // Usar as cookies para autenticação
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Tentar obter o token do cabeçalho de autorização
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.split('Bearer ')[1];
    
    console.log('Token recebido no cabeçalho:', token ? 'Presente' : 'Ausente');
    
    // Verificar autenticação do usuário - tentar usar o token se disponível
    let user;
    
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error) {
        user = data.user;
        console.log('Usuário autenticado via token:', user.id);
      } else {
        console.log('Erro na autenticação via token:', error.message);
      }
    }
    
    // Se não conseguiu autenticar com o token, tenta com cookies
    if (!user) {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Erro na autenticação via cookies:', error.message);
        return NextResponse.json(
          { error: 'Usuário não autenticado' },
          { status: 401 }
        );
      }
      user = data.user;
      console.log('Usuário autenticado via cookies:', user.id);
    }
    
    // Logs para depuração
    console.log('Verificando usuário no endpoint password-status');

    if (!user) {
      console.error('Usuário não autenticado após todas as tentativas');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    console.log('Usuário autenticado com sucesso:', user.id);

    // Buscar os dados do usuário, incluindo o status da senha
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('password_changed, email')
      .eq('id', user.id)
      .single();
      
    console.log('Dados do usuário encontrados:', userData);

    if (dbError) {
      console.error('Erro ao buscar dados do usuário:', dbError);
      return NextResponse.json(
        { error: 'Erro ao consultar dados do usuário' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: userData });
  } catch (error) {
    console.error('Erro no endpoint password-status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
