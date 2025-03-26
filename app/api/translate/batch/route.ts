import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    // Verificar se a chave API existe
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key não configurada');
      return NextResponse.json(
        { error: 'Serviço de tradução não configurado' },
        { status: 503 }
      );
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const { texts, targetLanguage } = await request.json();
    
    if (!texts || !targetLanguage) {
      return NextResponse.json(
        { error: 'Textos e idioma de destino são obrigatórios' },
        { status: 400 }
      );
    }

    // Extrair título e descrição
    const title = texts.find((t: any) => t.id === 'title')?.text || '';
    const description = texts.find((t: any) => t.id === 'description')?.text || '';

    const prompt = `Traduza para ${targetLanguage}:
    
    TÍTULO: ${title}
    DESCRIÇÃO: ${description}
    
    Retorne apenas o JSON no formato:
    {
      "title": "título traduzido",
      "description": "descrição traduzida"
    }`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Você é um tradutor. Responda apenas com o JSON solicitado, sem explicações adicionais."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      const translatedContent = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      // Formatar resposta no formato esperado pelo componente
      return NextResponse.json({
        translations: [
          { id: 'title', text: translatedContent.title },
          { id: 'description', text: translatedContent.description }
        ],
        success: true
      });
      
    } catch (openaiError) {
      console.error('Erro na chamada OpenAI:', openaiError);
      return NextResponse.json(
        { error: 'Erro no serviço de tradução' },
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a tradução' },
      { status: 500 }
    );
  }
} 