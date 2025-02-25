// Supabase Edge Function para melhorar textos usando IA
// Endpoint: /functions/v1/enhance-text

import { serve } from 'http/server.ts';
import { OpenAI } from 'openai';

// Inicializar o cliente OpenAI
// A chave da API será obtida das variáveis de ambiente do projeto Supabase
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY') || '',
});

interface EnhancementRequest {
  content: string;
  type: 'product_description' | 'review' | 'product_title';
  targetLanguage?: string;
  contentStyle?: 'professional' | 'casual' | 'enthusiastic' | 'technical';
  productCategory?: string;
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
    const request: EnhancementRequest = await req.json();
    const { content, type, targetLanguage, contentStyle = 'professional', productCategory } = request;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo é obrigatório' }),
        { headers, status: 400 }
      );
    }

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Tipo de conteúdo é obrigatório' }),
        { headers, status: 400 }
      );
    }

    // Construir um prompt adequado com base no tipo de conteúdo
    let systemPrompt = '';
    let userPrompt = '';
    
    switch (type) {
      case 'product_description':
        systemPrompt = `Você é um especialista em marketing de e-commerce com vasta experiência em escrever descrições de produtos persuasivas e atraentes. 
        ${targetLanguage ? `Você deve escrever em ${targetLanguage}.` : ''}
        Seu estilo de escrita é ${contentStyle}.`;
        
        userPrompt = `Melhore esta descrição de produto ${productCategory ? `na categoria ${productCategory}` : ''} 
        para torná-la mais profissional, livre de erros gramaticais, atraente para os clientes, e otimizada para SEO.
        Mantenha todas as informações importantes, mas apresente-as de forma mais atraente e persuasiva.
        Use linguagem persuasiva, apelo emocional, e destaque benefícios do produto.
        Inclua marcadores HTML quando apropriado (<b>, <ul>, <li>) para melhorar a legibilidade.
        
        Original:
        ${content}`;
        break;
        
      case 'review':
        systemPrompt = `Você é um especialista em gerenciamento de reputação online e criação de conteúdo autêntico.
        ${targetLanguage ? `Você deve escrever em ${targetLanguage}.` : ''}
        Seu estilo de escrita é ${contentStyle}.`;
        
        userPrompt = `Melhore esta avaliação de cliente para torná-la mais autêntica, legível e útil para outros compradores, mantendo o sentimento original e a avaliação.
        Corrija erros gramaticais e de ortografia, melhore a clareza, mas preserve a autenticidade da opinião original.
        Não altere fatos específicos mencionados na avaliação.
        
        Original:
        ${content}`;
        break;
        
      case 'product_title':
        systemPrompt = `Você é um especialista em SEO e marketing de e-commerce.
        ${targetLanguage ? `Você deve escrever em ${targetLanguage}.` : ''}
        Seu estilo de escrita é ${contentStyle}.`;
        
        userPrompt = `Melhore este título de produto ${productCategory ? `na categoria ${productCategory}` : ''} 
        para torná-lo mais atrativo, otimizado para SEO, e conciso.
        Mantenha as palavras-chave importantes, use linguagem persuasiva, e mantenha entre 5-15 palavras.
        
        Original:
        ${content}`;
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Tipo de conteúdo não suportado' }),
          { headers, status: 400 }
        );
    }
    
    // Fazer a chamada para a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    // Extrair o texto melhorado
    const enhancedContent = completion.choices[0].message.content || '';
    
    if (!enhancedContent) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível gerar o conteúdo melhorado' }),
        { headers, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({ enhancedContent }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error('Erro na melhoria com IA:', error);
    return new Response(
      JSON.stringify({ error: `Erro: ${error.message}` }),
      { headers, status: 500 }
    );
  }
}); 