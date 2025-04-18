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

    const { texts, targetLanguage, sourceLanguage = 'pt' } = await request.json();
    
    if (!texts || !targetLanguage) {
      return NextResponse.json(
        { error: 'Textos e idioma de destino são obrigatórios' },
        { status: 400 }
      );
    }

    // Extrair título e descrição
    const title = texts.find((t: any) => t.id === 'title')?.text || '';
    const description = texts.find((t: any) => t.id === 'description')?.text || '';

    // Mapear códigos de idioma para nomes completos para o prompt
    const languageNames: Record<string, string> = {
      'pt': 'português brasileiro',
      'en': 'inglês',
      'es': 'espanhol',
      'fr': 'francês',
      'de': 'alemão',
      'it': 'italiano'
    };

    const sourceLangName = languageNames[sourceLanguage] || 'português brasileiro';
    const targetLangName = languageNames[targetLanguage] || 'inglês';

    const systemPrompt = `Você é um especialista em marketing internacional e localização de produtos para e-commerce, com profundo conhecimento em adaptação cultural e comercial. Sua missão é não apenas traduzir, mas adaptar o conteúdo de ${sourceLangName} para ${targetLangName} para que ressoe com o público-alvo do idioma de destino.

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

    const userPrompt = `Traduza e adapte o seguinte conteúdo de produto de ${sourceLangName} para ${targetLangName}, otimizando-o para o mercado local:

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
        max_tokens: 2000
      });

      // Sanitize a resposta para remover caracteres de controle que podem causar erros no JSON.parse
      let contentText = completion.choices[0]?.message?.content || '{}';
      console.log('Resposta bruta da OpenAI:', contentText);

      // Remover caracteres de controle que podem afetar o parsing do JSON
      contentText = contentText.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

      // Tentar extrair o JSON, se estiver embutido em explicações de texto
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        contentText = jsonMatch[0];
        console.log('JSON extraído:', contentText);
      }

      let translatedContent;
      try {
        translatedContent = JSON.parse(contentText);
        console.log('Parsing JSON bem-sucedido');
      } catch (jsonError) {
        console.error('Erro ao fazer parse do JSON:', jsonError);
        console.error('JSON com problema:', contentText);
        
        // Fallback - criar um objeto manualmente
        // Extrair título e descrição de uma maneira mais tolerante a erros
        const titleMatch = contentText.match(/"title"\s*:\s*"([^"]*)"/);
        const descMatch = contentText.match(/"description"\s*:\s*"([^"]*)"/);
        
        translatedContent = {
          title: titleMatch ? titleMatch[1] : '',
          description: descMatch ? descMatch[1] : ''
        };
        
        console.log('Usando fallback manual para extrair conteúdo:', translatedContent);
      }

      // Log da resposta da OpenAI para debug
      console.log('API Translate/batch - Resposta OpenAI processada:', { 
        title: translatedContent.title?.substring(0, 30) + '...',
        description: translatedContent.description?.substring(0, 30) + '...'
      });
      
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