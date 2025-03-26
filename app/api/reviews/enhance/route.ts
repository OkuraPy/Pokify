import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getProduct } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
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

    const { reviews, productName: providedProductName } = await request.json();
    
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
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
        }
      } catch (error) {
        console.error('Erro ao obter dados do produto:', error);
      }
    }

    // Configuração dos prompts
    const systemPrompt = `Você é um copywriter especializado em produtos físicos e e-commerce, com vasta experiência em criar avaliações persuasivas.
Seu trabalho é melhorar reviews existentes para torná-los mais persuasivos, autênticos e eficazes em converter visitantes em compradores.`;
    
    // Processar cada review em lote
    const enhancementPromises = reviews.map(async (review: any) => {
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