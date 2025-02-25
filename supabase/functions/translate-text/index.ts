// Supabase Edge Function para traduzir textos usando IA
// Endpoint: /functions/v1/translate-text

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'https://esm.sh/openai@4.20.1';

// Inicializar o cliente OpenAI
// A chave da API será obtida das variáveis de ambiente do projeto Supabase
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY') || '',
});

interface TranslationRequest {
  content: string;
  targetLanguage: string;
  preserveFormatting?: boolean;
  context?: string;
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
    const request: TranslationRequest = await req.json();
    const { content, targetLanguage, preserveFormatting = true, context } = request;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo é obrigatório' }),
        { headers, status: 400 }
      );
    }

    if (!targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Idioma de destino é obrigatório' }),
        { headers, status: 400 }
      );
    }

    // Construir o prompt para a tradução
    const systemPrompt = `Você é um tradutor profissional especializado em traduções precisas e naturais. 
    ${preserveFormatting ? 'Mantenha toda a formatação original, incluindo marcações HTML, parágrafos, listas, etc.' : ''}
    ${context ? `O contexto para esta tradução é: ${context}` : ''}`;
    
    const userPrompt = `Traduza o seguinte texto para ${targetLanguage}:

    ${content}
    
    Se o texto já estiver no idioma de destino, apenas corrija-o para melhorar a fluência e naturalidade.`;
    
    // Fazer a chamada para a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Temperatura mais baixa para tradução precisa
      max_tokens: 1500,
    });
    
    // Extrair o texto traduzido
    const translatedContent = completion.choices[0].message.content || '';
    
    if (!translatedContent) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível gerar a tradução' }),
        { headers, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({ translatedContent }),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error('Erro na tradução com IA:', error);
    return new Response(
      JSON.stringify({ error: `Erro: ${error.message}` }),
      { headers, status: 500 }
    );
  }
}); 