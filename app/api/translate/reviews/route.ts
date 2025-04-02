import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Constante para definir o tamanho máximo do lote
const BATCH_SIZE = 5;
const MAX_RETRIES = 2;
const MAX_REVIEWS_TOTAL = 300;

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
    
    // Limitar o número máximo de reviews que serão processados
    const reviewsToProcess = reviews.slice(0, MAX_REVIEWS_TOTAL);
    
    console.log(`Iniciando tradução de ${reviewsToProcess.length} reviews para ${targetLanguage} (limitados de ${reviews.length} originais)`);
    
    // Dividir em lotes se tivermos muitos reviews
    const totalReviews = reviewsToProcess.length;
    const batches = Math.ceil(totalReviews / BATCH_SIZE);
    console.log(`Processando em ${batches} lotes de até ${BATCH_SIZE} reviews cada`);
    
    // Array para armazenar todos os resultados
    const allTranslations = [];
    // Array para rastrear estatísticas
    const statsPerBatch = [];

    // Configuração dos prompts
    const systemPrompt = `Você é um tradutor profissional especializado em avaliações de produtos. 
Sua tarefa é traduzir avaliações de clientes para ${targetLanguage} mantendo o tom, sentimento e estilo original.
Preserve qualquer menção específica a características do produto, experiência do cliente ou problemas relatados.

IMPORTANTE: Responda SEMPRE com um objeto JSON válido no formato exato especificado, sem texto adicional.`;

    // Função para tentar traduzir um review com retries
    const translateReviewWithRetry = async (review: any, batchIndex: number, reviewIndex: number) => {
      const reviewInfo = `[Lote ${batchIndex + 1}/${batches}, Review ${reviewIndex + 1}/${reviewsToProcess.length}] ID: ${review.id}`;
      console.log(`Iniciando tradução para ${reviewInfo}`);
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Após a primeira tentativa, adicionar instruções específicas para o retry
          const retryPrompt = attempt > 0 ? 
            `\nEsta é uma nova tentativa de tradução. Por favor, certifique-se de retornar APENAS o objeto JSON válido com os campos 'id' e 'translatedContent'.` : '';
            
          const userPrompt = `Traduza a seguinte avaliação de produto para ${targetLanguage}:

ID: ${review.id}
AUTOR: ${review.author}
CONTEÚDO: ${review.content}

Mantenha o mesmo tom e sentimento da avaliação original. Se a avaliação já estiver em ${targetLanguage}, apenas melhore a fluência e naturalidade do texto.

Retorne APENAS um objeto JSON válido no formato:
{
  "id": "${review.id}",
  "translatedContent": "texto da avaliação traduzida completa"
}

NÃO inclua nenhum texto explicativo, comentários, ou aspas triplas. Retorne APENAS o objeto JSON.${retryPrompt}`;

          console.log(`${reviewInfo}: Tentativa ${attempt + 1} de ${MAX_RETRIES}`);
          
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 1500,
            response_format: { type: "json_object" }
          });

          const responseContent = completion.choices[0]?.message?.content || '{}';
          
          try {
            const jsonMatch = responseContent.match(/(\{[\s\S]*\})/);
            const jsonContent = jsonMatch ? jsonMatch[0] : responseContent;
            
            const translatedContent = JSON.parse(jsonContent);
            
            if (!translatedContent.id || !translatedContent.translatedContent) {
              console.error(`${reviewInfo}: Formato de resposta inválido na tentativa ${attempt + 1}`, responseContent);
              
              if (attempt < MAX_RETRIES - 1) continue;
              
              throw new Error('Formato de resposta inválido');
            }
            
            console.log(`${reviewInfo}: Tradução bem-sucedida na tentativa ${attempt + 1}`);
            return {
              id: review.id,
              translatedContent: translatedContent.translatedContent,
              success: true
            };
          } catch (parseError) {
            console.error(`${reviewInfo}: Erro ao parsear resposta na tentativa ${attempt + 1}:`, parseError, responseContent.substring(0, 100));
            
            if (attempt < MAX_RETRIES - 1) continue;
            
            return {
              id: review.id,
              error: 'Falha ao processar tradução',
              rawResponse: responseContent.substring(0, 100),
              success: false
            };
          }
        } catch (apiError) {
          console.error(`${reviewInfo}: Erro na API na tentativa ${attempt + 1}:`, apiError);
          
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          return {
            id: review.id,
            error: 'Falha na tradução após múltiplas tentativas',
            success: false
          };
        }
      }
      
      return {
        id: review.id,
        error: 'Falha em todas as tentativas de tradução',
        success: false
      };
    };

    // Processar reviews em lotes
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      console.log(`Processando lote ${batchIndex + 1} de ${batches}`);
      
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, totalReviews);
      const currentBatch = reviewsToProcess.slice(startIndex, endIndex);
      
      try {
        const batchPromises = currentBatch.map((review, reviewIndex) => 
          translateReviewWithRetry(review, batchIndex, startIndex + reviewIndex)
        );

        const batchResults = await Promise.all(batchPromises);
        
        const successCount = batchResults.filter(r => r.success).length;
        const errorCount = batchResults.filter(r => !r.success).length;
        
        console.log(`Lote ${batchIndex + 1}: ${successCount} traduções bem-sucedidas, ${errorCount} falhas`);
        statsPerBatch.push({ success: successCount, error: errorCount });
        
        allTranslations.push(...batchResults);
      } catch (batchError) {
        console.error(`Erro ao processar lote ${batchIndex + 1}:`, batchError);
        statsPerBatch.push({ success: 0, error: currentBatch.length });
        
        allTranslations.push(...currentBatch.map(review => ({
          id: review.id,
          error: 'Falha no processamento do lote',
          success: false
        })));
      }
      
      if (batchIndex < batches - 1) {
        const delayMs = 2000;
        console.log(`Aguardando ${delayMs/1000} segundos antes do próximo lote...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    const successCount = allTranslations.filter(t => t.success).length;
    const errorCount = allTranslations.filter(t => !t.success).length;
    
    console.log(`Traduções concluídas: ${successCount} com sucesso, ${errorCount} com erros de ${allTranslations.length} total`);
    
    if (successCount === 0) {
      return NextResponse.json({
        error: 'Nenhuma tradução foi concluída com sucesso',
        translations: allTranslations,
        success: false,
        stats: {
          total: totalReviews,
          success: successCount,
          errors: errorCount
        }
      }, { status: 422 });
    }
    
    return NextResponse.json({
      translations: allTranslations,
      success: true,
      stats: {
        total: totalReviews,
        success: successCount,
        errors: errorCount,
        batchStats: statsPerBatch
      }
    });
    
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a tradução' },
      { status: 500 }
    );
  }
} 