// Supabase Edge Function para gerar avaliações fictícias com IA
// Endpoint: /functions/v1/generate-reviews

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'https://esm.sh/openai@4.20.1';

// Inicializar o cliente OpenAI
// A chave da API será obtida das variáveis de ambiente do projeto Supabase
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY') || '',
});

interface ReviewGenerationRequest {
  productTitle: string;
  productDescription: string;
  count?: number;
  language?: string;
  rating?: { min: number; max: number };
  includeImages?: boolean;
}

interface GeneratedReview {
  author: string;
  rating: number;
  date: string;
  content: string;
  images?: string[];
  is_selected: boolean;
  is_published: boolean;
}

serve(async (req) => {
  // Configurações CORS
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  });

  // Responder a preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // Verificar se é um POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { headers, status: 405 }
    );
  }

  try {
    // Verificar se temos a chave da API
    if (!openai.apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chave da API OpenAI não configurada' }),
        { headers, status: 500 }
      );
    }

    // Obter o corpo da requisição
    const request: ReviewGenerationRequest = await req.json();
    const { 
      productTitle, 
      productDescription, 
      count = 5, 
      language = 'português',
      rating = { min: 3, max: 5 },
      includeImages = false
    } = request;

    if (!productTitle || !productDescription) {
      return new Response(
        JSON.stringify({ error: 'Título e descrição do produto são obrigatórios' }),
        { headers, status: 400 }
      );
    }

    // Limitar o número de avaliações
    const reviewCount = Math.min(Math.max(count, 1), 100); // Entre 1 e 100

    // Construir o prompt para a geração de avaliações
    const systemPrompt = `Você é um copywriter especializado em produtos físicos e deve criar reviews persuasivos de clientes satisfeitos para um produto de e-commerce.`;
    
    const userPrompt = `Gere ${reviewCount} reviews autênticos e persuasivos para o seguinte produto:
    
    Título: ${productTitle}
    Descrição: ${productDescription}
    
    Requisitos:
    1. Cada review deve ter um rating entre ${rating.min} e ${rating.max} estrelas
    2. Cada review deve ter um nome de autor realista
    3. Cada review deve ter uma data nos últimos 6 meses
    4. Use um tom natural, como se fosse um cliente real
    5. Inclua detalhes pessoais para aumentar a credibilidade (exemplo: idade, experiência anterior, mudança sentida após usar o produto)
    6. Mostre entusiasmo genuíno e satisfação com a compra
    7. Utilize gatilhos mentais como prova social e reciprocidade
    8. Reviews devem ser variados em estilo, comprimento e foco
    9. Alguns reviews podem abordar e quebrar objeções comuns sobre esse tipo de produto
    
    Formate as avaliações em formato JSON como este array:
    [
      {
        "author": "Nome do Autor",
        "rating": 5,
        "date": "2023-04-15",
        "content": "Texto da avaliação..."
      }
    ]
    
    Retorne APENAS o JSON válido, sem explicações adicionais.`;
    
    // Fazer a chamada para a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });
    
    // Extrair o JSON gerado
    const generatedContent = completion.choices[0].message.content || '';
    
    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível gerar as avaliações' }),
        { headers, status: 500 }
      );
    }
    
    // Parsear o JSON retornado
    try {
      // O modelo pode retornar o JSON em diferentes formatos, tentamos normalizar
      const parsedResponse = JSON.parse(generatedContent);
      
      // O modelo pode retornar um array diretamente ou um objeto com uma propriedade contendo o array
      let reviews: GeneratedReview[] = [];
      
      if (Array.isArray(parsedResponse)) {
        reviews = parsedResponse;
      } else if (parsedResponse.reviews && Array.isArray(parsedResponse.reviews)) {
        reviews = parsedResponse.reviews;
      } else {
        // Tentar encontrar a primeira propriedade que é um array
        for (const key in parsedResponse) {
          if (Array.isArray(parsedResponse[key])) {
            reviews = parsedResponse[key];
            break;
          }
        }
      }
      
      if (reviews.length === 0) {
        throw new Error('Formato de resposta inesperado');
      }
      
      // Adicionar imagens aleatórias se solicitado
      if (includeImages) {
        reviews = reviews.map((review, index) => {
          // 60% de chance de ter imagens
          const hasImages = Math.random() > 0.4; 
          
          if (hasImages) {
            const imageCount = Math.floor(Math.random() * 2) + 1; // 1 a 2 imagens
            const images = [];
            
            for (let i = 0; i < imageCount; i++) {
              // Usar placeholders para exemplos
              images.push(`https://picsum.photos/seed/${index}${i}/500/500`);
            }
            
            return {
              ...review,
              images,
              is_selected: true,
              is_published: false
            };
          }
          
          return {
            ...review,
            is_selected: true,
            is_published: false
          };
        });
      } else {
        // Adicionar flags padrão
        reviews = reviews.map(review => ({
          ...review,
          is_selected: true,
          is_published: false
        }));
      }
      
      return new Response(
        JSON.stringify({ reviews }),
        { headers, status: 200 }
      );
    } catch (parseError) {
      console.error('Erro ao parsear avaliações geradas:', parseError, generatedContent);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar as avaliações geradas',
          rawResponse: generatedContent 
        }),
        { headers, status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro na geração de avaliações com IA:', error);
    return new Response(
      JSON.stringify({ error: `Erro: ${error.message}` }),
      { headers, status: 500 }
    );
  }
}); 