import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    console.log('Recebida requisição para melhoria de descrição');
    
    // Verificar se a chave API existe
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key não configurada');
      return NextResponse.json(
        { error: 'Serviço de IA não configurado' },
        { status: 503 }
      );
    }

    // Inicializar OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Parse do corpo da requisição
    let body;
    try {
      body = await request.json();
      console.log('Body da requisição:', body);
    } catch (e) {
      console.error('Erro ao parsear o corpo da requisição:', e);
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      );
    }
    
    // Extrair os dados relevantes do corpo da requisição (mesmo formato da tradução)
    const { productId, title, description } = body;
    
    if (!productId) {
      console.error('ID do produto não fornecido');
      return NextResponse.json({ 
        error: 'ID do produto é obrigatório' 
      }, { status: 400 });
    }

    if (!title || !description) {
      console.error('Título ou descrição não fornecidos');
      return NextResponse.json({ 
        error: 'Título e descrição são obrigatórios' 
      }, { status: 400 });
    }

    console.log('Processando melhoria para produto:', title);

    // Atualizar o prompt para o formato fornecido pelo usuário
    const systemPrompt = `Você é um copywriter especializado em produtos físicos.`;

    const userPrompt = `Você é um copywriter especializado em produtos físicos e quero criar uma copy de alta conversão para um ${title}.
Aqui está a descrição breve do produto: ${description}

Gere uma copy validada utilizando a estrutura AIDA (Atenção, Interesse, Desejo, Ação), com:

Um gancho forte na introdução para capturar a atenção.
Uma promessa persuasiva clara e impactante.
Benefícios destacados de forma emocional e lógica.
Provas sociais ou diferenciais que gerem desejo.
Uma chamada para ação direta e irresistível com urgência e escassez.
A copy deve ser persuasiva, direta e voltada para conversão, utilizando gatilhos mentais como autoridade, reciprocidade e prova social.

Agora, gere a copy!`;

    console.log('Enviando prompt para OpenAI');
    
    try {
      // Chamar a API da OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4", // Usando GPT-4 conforme solicitado
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

      const improvedDescription = completion.choices[0]?.message?.content || '';

      if (!improvedDescription) {
        console.error('OpenAI não retornou conteúdo válido');
        return NextResponse.json(
          { error: 'Falha ao gerar descrição melhorada' },
          { status: 500 }
        );
      }
      
      console.log('Descrição melhorada gerada com sucesso');

      // Atualizar o produto diretamente no banco
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          description: improvedDescription 
        })
        .eq('id', productId);
      
      if (updateError) {
        console.error('Erro ao atualizar descrição do produto:', updateError);
        return NextResponse.json({ 
          error: 'Erro ao salvar descrição melhorada: ' + updateError.message 
        }, { status: 500 });
      }
      
      console.log('Descrição atualizada com sucesso');
      
      // Retorna a descrição melhorada e confirmação de que foi salva
      return NextResponse.json({
        success: true,
        description: improvedDescription,
        message: 'Descrição melhorada com sucesso'
      });
    } catch (openaiError) {
      console.error('Erro na chamada OpenAI:', openaiError);
      return NextResponse.json(
        { error: 'Erro no serviço de IA: ' + (openaiError instanceof Error ? openaiError.message : String(openaiError)) },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar melhoria da descrição: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 