import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url, api_key } = await req.json();

    // Validação básica dos parâmetros
    if (!url || !api_key) {
      return NextResponse.json({ valid: false, message: 'URL e chave da API são obrigatórias.' }, { status: 400 });
    }

    // Tenta acessar o endpoint da loja Shopify usando a chave fornecida
    const shopUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const endpoint = `${shopUrl}/admin/api/2023-04/shop.json`;

    const response = await fetch(endpoint, {
      headers: {
        'X-Shopify-Access-Token': api_key,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const shopInfo = await response.json();
      return NextResponse.json({ valid: true, shopInfo });
    } else {
      let msg = 'Credenciais inválidas ou loja não encontrada.';
      try {
        const err = await response.json();
        if (err && err.errors) msg = typeof err.errors === 'string' ? err.errors : JSON.stringify(err.errors);
      } catch {}
      return NextResponse.json({ valid: false, message: msg }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ valid: false, message: error.message || 'Erro desconhecido' }, { status: 500 });
  }
}
