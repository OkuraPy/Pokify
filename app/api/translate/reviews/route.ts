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

    const { reviews, targetLanguage } = await request.json();
    
    if (!reviews || !targetLanguage || !Array.isArray(reviews)) {
      return NextResponse.json(
        { error: 'Reviews e idioma de destino são obrigatórios' },
        { status: 400 }
      );
    }

    // Configuração dos prompts
    const systemPrompt = `Você é um tradutor profissional especializado em avaliações de produtos. 
Sua tarefa é traduzir avaliações de clientes para ${targetLanguage} mantendo o tom, sentimento e estilo original.
Preserve qualquer menção específica a características do produto, experiência do cliente ou problemas relatados.`;

    // Processar cada review em lote
    const translationPromises = reviews.map(async (review: any) => {
      const userPrompt = `Traduza a seguinte avaliação de produto para ${targetLanguage}:

ID: ${review.id}
AUTOR: ${review.author}
CONTEÚDO: ${review.content}

Mantenha o mesmo tom e sentimento da avaliação original. Se a avaliação já estiver em ${targetLanguage}, apenas melhore a fluência e naturalidade do texto.

Retorne no formato:
{
  "id": "${review.id}",
  "translatedContent": "texto da avaliação traduzida"
}`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });

        const translatedContent = JSON.parse(completion.choices[0]?.message?.content || '{}');
        return translatedContent;
      } catch (error) {
        console.error(`Erro ao traduzir review ${review.id}:`, error);
        return {
          id: review.id,
          error: 'Falha na tradução'
        };
      }
    });

    const translatedReviews = await Promise.all(translationPromises);
    
    return NextResponse.json({
      translations: translatedReviews,
      success: true
    });
    
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a tradução' },
      { status: 500 }
    );
  }
} 