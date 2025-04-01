import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
    }
    
    console.log(`[Debug] Tentando acessar URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log(`[Debug] Status de resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `Falha ao acessar a URL: ${response.statusText}`,
        status: response.status
      }, { status: 500 });
    }
    
    const html = await response.text();
    
    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      htmlSize: html.length,
      htmlPreview: html.substring(0, 500) // Retornar apenas os primeiros 500 caracteres
    });
  } catch (error: any) {
    console.error(`[Debug] Erro ao acessar URL: ${error.message}`);
    return NextResponse.json({ 
      error: error.message || 'Erro desconhecido',
    }, { status: 500 });
  }
} 