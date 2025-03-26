import { detectLanguage, supportedLanguages } from '../utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Texto é obrigatório' },
        { status: 400 }
      );
    }

    const language = detectLanguage(text);
    
    return NextResponse.json({
      language,
      languageName: supportedLanguages[language as keyof typeof supportedLanguages],
      success: true
    });
    
  } catch (error) {
    console.error('Erro na detecção de idioma:', error);
    return NextResponse.json(
      { error: 'Erro ao detectar idioma' },
      { status: 500 }
    );
  }
} 