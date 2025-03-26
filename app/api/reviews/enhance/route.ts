import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getProduct } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    console.log('Recebida requisição para melhoria de reviews');
    
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
    
    const { reviews, productName: providedProductName } = body;
    
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      console.error('Reviews não fornecidos ou em formato inválido:', reviews);
      return NextResponse.json(
        { error: 'Reviews são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Obter o nome do produto a partir do ID do primeiro review se não foi fornecido
    let productName = providedProductName;
    if (!productName && reviews[0] && reviews[0].product_id) {
      try {
        const { data: productData } = await getProduct(reviews[0].product_id);
        if (productData) {
          productName = productData.title;
          console.log('Nome do produto obtido do banco de dados:', productName);
        }
      } catch (error) {
        console.error('Erro ao obter dados do produto:', error);
      }
    }

    console.log('Iniciando melhoria de reviews para produto:', productName);
    
    // Configuração dos prompts
    const systemPrompt = `Você é um copywriter especializado em produtos físicos e e-commerce, com vasta experiência em criar avaliações persuasivas.
Seu trabalho é melhorar reviews existentes para torná-los mais persuasivos, autênticos e eficazes em converter visitantes em compradores.`;
    
    // Processar cada review em lote
    const enhancementPromises = reviews.map(async (review: any) => {
      console.log(`Processando review ${review.id}`);
      
      const userPrompt = `Melhore a seguinte avaliação para o produto "${productName || 'este produto'}" para torná-la mais persuasiva e autêntica:

ID: ${review.id}
AUTOR: ${review.author}
AVALIAÇÃO ORIGINAL: ${review.content}

Diretrizes para melhoria:
1. Mantenha o tom natural, como se fosse um cliente real
2. Adicione detalhes pessoais para aumentar a credibilidade (ex: idade, experiência anterior, mudança sentida após usar o produto)
3. Mostre entusiasmo genuíno e satisfação com a compra
4. Utilize gatilhos mentais como prova social e reciprocidade
5. Aborde e quebre possíveis objeções ao produto
6. Mantenha o mesmo sentimento e opinião geral do review original (positivo/negativo)
7. Preserve qualquer menção específica a características do produto

Retorne apenas o texto melhorado da avaliação, sem explicações adicionais.`;

      try {
        console.log('Enviando prompt para OpenAI:', { systemPrompt, userPrompt });
        
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
          max_tokens: 1000
        });

        const enhancedContent = completion.choices[0]?.message?.content || '';
        
        if (!enhancedContent) {
          throw new Error('Falha ao gerar conteúdo melhorado');
        }
        
        console.log(`Review ${review.id} melhorado com sucesso`);
        
        return {
          id: review.id,
          enhancedContent: enhancedContent
        };
      } catch (error) {
        console.error(`Erro ao melhorar review ${review.id}:`, error);
        return {
          id: review.id,
          error: 'Falha na melhoria'
        };
      }
    });

    const enhancedReviews = await Promise.all(enhancementPromises);
    
    console.log('Melhorias concluídas:', enhancedReviews);
    
    return NextResponse.json({
      enhancements: enhancedReviews,
      success: true
    });
    
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a melhoria' },
      { status: 500 }
    );
  }
} 