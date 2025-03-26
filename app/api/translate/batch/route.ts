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

    const systemPrompt = `Você é um especialista em marketing internacional e localização de produtos para e-commerce, com profundo conhecimento em adaptação cultural e comercial. Sua missão é não apenas traduzir, mas adaptar o conteúdo para ressoar com o público-alvo do idioma de destino.

Considere:
1. Terminologia específica do mercado local
2. Nomes alternativos ou mais populares do produto no país de destino
3. Aspectos culturais que podem afetar a percepção do produto
4. Palavras-chave relevantes para SEO no mercado local
5. Convenções de comunicação do e-commerce local

Mantenha:
- O tom persuasivo e comercial
- Os benefícios principais do produto
- A intenção de venda
- A clareza da comunicação

Se encontrar termos específicos que têm uma variante mais popular ou efetiva no mercado-alvo, inclua ambos (ex: "Produto X (também conhecido como Y)")`;

    const userPrompt = `Traduza e adapte o seguinte conteúdo de produto para ${targetLanguage}, otimizando-o para o mercado local:

TÍTULO DO PRODUTO:
${title}

DESCRIÇÃO DO PRODUTO:
${description}

Requisitos específicos:
1. Adapte termos técnicos para equivalentes locais mais conhecidos
2. Mantenha ou melhore o apelo comercial do texto
3. Use terminologia comum em e-commerce do mercado-alvo
4. Preserve palavras-chave importantes, adaptando-as para o mercado local
5. Se houver nomes alternativos populares para o produto, inclua-os estrategicamente

Retorne no formato:
{
  "title": "título traduzido e adaptado",
  "description": "descrição traduzida e adaptada",
  "marketingNotes": "notas sobre adaptações específicas feitas (opcional)"
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
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const translatedContent = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      // Formatar resposta incluindo as notas de marketing se disponíveis
      return NextResponse.json({
        translations: [
          { id: 'title', text: translatedContent.title },
          { id: 'description', text: translatedContent.description }
        ],
        marketingNotes: translatedContent.marketingNotes,
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