import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getProduct } from '@/lib/supabase';

// Constante para definir o tamanho máximo do lote
const BATCH_SIZE = 20;

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

    console.log(`Iniciando melhoria de ${reviews.length} reviews para produto: ${productName}`);
    
    // Dividir em lotes se tivermos muitos reviews
    const totalReviews = reviews.length;
    const batches = Math.ceil(totalReviews / BATCH_SIZE);
    console.log(`Processando em ${batches} lotes de até ${BATCH_SIZE} reviews cada`);
    
    // Array para armazenar todos os resultados
    const allEnhancements = [];

    // Configuração dos prompts
    const systemPrompt = `Você é um copywriter especializado em avaliações curtas e persuasivas para e-commerce.

Seu trabalho é melhorar reviews existentes para serem mais persuasivos, autênticos e concisos (em torno de 50 palavras).
Mantenha apenas o texto da avaliação, sem incluir metadados como ID ou AUTOR.
Retorne exclusivamente o texto melhorado, sem introduções ou prefixos.`;
    
    // Processar reviews em lotes
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      console.log(`Processando lote ${batchIndex + 1} de ${batches}`);
      
      // Obter o lote atual
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, totalReviews);
      const currentBatch = reviews.slice(startIndex, endIndex);
      
      // Processar cada review no lote atual
      const batchPromises = currentBatch.map(async (review: any) => {
        console.log(`Processando review ${review.id}`);
        
        const userPrompt = `Melhore a seguinte avaliação para o produto "${productName || 'este produto'}" para torná-la mais persuasiva e autêntica:

ID: ${review.id}
AUTOR: ${review.author}
AVALIAÇÃO ORIGINAL: ${review.content}

Diretrizes para melhoria:
1. IMPORTANTE: Retorne APENAS o texto melhorado, sem incluir ID, autor ou qualquer prefixo
2. Mantenha o tom natural, como se fosse um cliente real
3. Use aproximadamente 50 palavras (2-3 frases curtas)
4. Adicione detalhes pessoais para aumentar a credibilidade
5. Mantenha o mesmo sentimento e opinião geral do review original
6. Preserve qualquer menção específica a características do produto
7. Seja persuasivo, mas conciso

RETORNE APENAS O TEXTO DA AVALIAÇÃO MELHORADA. NÃO inclua "ID:", "AUTOR:", ou "AVALIAÇÃO MELHORADA:" no início.`;

        try {
          console.log(`Enviando prompt para OpenAI para review ${review.id}`);
          
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

      // Aguardar o processamento do lote atual
      const batchResults = await Promise.all(batchPromises);
      allEnhancements.push(...batchResults);
      
      // Adicionar um pequeno atraso entre os lotes para evitar limitações de taxa da API
      if (batchIndex < batches - 1) {
        console.log('Aguardando 1 segundo antes do próximo lote...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Melhorias concluídas: ${allEnhancements.length} reviews processados`);
    
    return NextResponse.json({
      enhancements: allEnhancements,
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