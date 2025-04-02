import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Constante para definir o tamanho máximo do lote
const BATCH_SIZE = 20;

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
    
    console.log(`Iniciando tradução de ${reviews.length} reviews para ${targetLanguage}`);
    
    // Dividir em lotes se tivermos muitos reviews
    const totalReviews = reviews.length;
    const batches = Math.ceil(totalReviews / BATCH_SIZE);
    console.log(`Processando em ${batches} lotes de até ${BATCH_SIZE} reviews cada`);
    
    // Array para armazenar todos os resultados
    const allTranslations = [];

    // Configuração dos prompts
    const systemPrompt = `Você é um tradutor profissional especializado em avaliações de produtos. 
Sua tarefa é traduzir avaliações de clientes para ${targetLanguage} mantendo o tom, sentimento e estilo original.
Preserve qualquer menção específica a características do produto, experiência do cliente ou problemas relatados.`;

    // Processar reviews em lotes
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      console.log(`Processando lote ${batchIndex + 1} de ${batches}`);
      
      // Obter o lote atual
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, totalReviews);
      const currentBatch = reviews.slice(startIndex, endIndex);
      
      // Processar cada review no lote atual
      const batchPromises = currentBatch.map(async (review: any) => {
        console.log(`Traduzindo review ${review.id}`);
        
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
          console.log(`Review ${review.id} traduzido com sucesso`);
          return translatedContent;
        } catch (error) {
          console.error(`Erro ao traduzir review ${review.id}:`, error);
          return {
            id: review.id,
            error: 'Falha na tradução'
          };
        }
      });

      // Aguardar o processamento do lote atual
      const batchResults = await Promise.all(batchPromises);
      allTranslations.push(...batchResults);
      
      // Adicionar um pequeno atraso entre os lotes para evitar limitações de taxa da API
      if (batchIndex < batches - 1) {
        console.log('Aguardando 1 segundo antes do próximo lote...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Traduções concluídas: ${allTranslations.length} reviews processados`);
    
    return NextResponse.json({
      translations: allTranslations,
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