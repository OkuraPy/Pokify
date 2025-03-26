import { supabase } from './supabase';
import OpenAI from 'openai';

// Inicializar o cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
});

/**
 * Tipos de conteúdo para melhorias com IA
 */
export type ContentType = 'product_description' | 'review' | 'product_title';

/**
 * Interface para solicitações de melhoria de texto
 */
export interface EnhancementRequest {
  content: string;
  type: ContentType;
  targetLanguage?: string;
  contentStyle?: 'professional' | 'casual' | 'enthusiastic' | 'technical';
  productCategory?: string;
}

/**
 * Melhora texto usando IA (OpenAI)
 */
export async function enhanceWithAI(
  request: EnhancementRequest
): Promise<{ success: boolean; enhancedContent?: string; error?: string }> {
  try {
    const { content, type, targetLanguage, contentStyle = 'professional', productCategory } = request;
    
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
    }
    
    // Fazer a chamada para a API da OpenAI
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
      return {
        success: false,
        error: 'Não foi possível gerar o conteúdo melhorado.',
      };
    }
    
    return {
      success: true,
      enhancedContent,
    };
  } catch (error) {
    console.error('Erro na melhoria com IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na melhoria do conteúdo.',
    };
  }
}

/**
 * Traduz texto usando IA (OpenAI)
 */
export async function translateWithAI(
  content: string,
  targetLanguage: string = 'português'
): Promise<{ success: boolean; translatedContent?: string; error?: string }> {
  try {
    // Fazer a chamada para a API da OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: `Você é um tradutor profissional especializado em e-commerce. 
          Traduza o texto para ${targetLanguage} mantendo o tom, estilo e formatação.
          Se o texto já estiver em ${targetLanguage}, apenas corrija-o para torná-lo mais fluente e natural.`
        },
        { role: 'user', content: `Traduza o seguinte texto para ${targetLanguage}:\n\n${content}` }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });
    
    // Extrair o texto traduzido
    const translatedContent = completion.choices[0].message.content || '';
    
    if (!translatedContent) {
      return {
        success: false,
        error: 'Não foi possível gerar a tradução.',
      };
    }
    
    return {
      success: true,
      translatedContent,
    };
  } catch (error) {
    console.error('Erro na tradução com IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na tradução do conteúdo.',
    };
  }
}

/**
 * Gera avaliações fictícias para um produto usando IA
 */
export async function generateReviewsWithAI(
  productTitle: string,
  productDescription: string,
  count: number = 5,
  language: string = 'português',
  rating: { min: number, max: number } = { min: 3, max: 5 }
): Promise<{ success: boolean; reviews?: any[]; error?: string }> {
  try {
    // Preparar o prompt para a OpenAI
    const systemPrompt = `Você é um especialista em criar avaliações de produtos realistas e autênticas para e-commerce.
    Seu trabalho é gerar avaliações que pareçam escritas por clientes reais, em ${language}.`;
    
    const userPrompt = `Gere ${count} avaliações diferentes para o seguinte produto:
    
    Título: ${productTitle}
    Descrição: ${productDescription}
    
    Requisitos:
    1. Cada avaliação deve ter um rating entre ${rating.min} e ${rating.max} estrelas
    2. Cada avaliação deve ter um nome de autor realista
    3. Cada avaliação deve ter uma data nos últimos 6 meses
    4. Cada avaliação deve ter um texto de 2-5 frases, específico sobre o produto
    5. 30% das avaliações devem mencionar algum aspecto negativo menor
    6. Avaliações devem ser variadas em estilo, comprimento e foco
    
    Formate as avaliações em formato JSON como este array:
    [
      {
        "author": "Nome do Autor",
        "rating": 5,
        "date": "2023-04-15",
        "content": "Texto da avaliação..."
      }
    ]`;
    
    // Fazer a chamada para a API da OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });
    
    // Extrair o texto gerado e converter para objeto
    const generatedContent = completion.choices[0].message.content || '';
    
    if (!generatedContent) {
      return {
        success: false,
        error: 'Não foi possível gerar as avaliações.',
      };
    }
    
    // Parsear o JSON retornado
    try {
      // A resposta pode vir como um objeto com uma propriedade contendo o array,
      // ou diretamente como um array em string
      const parsedResponse = JSON.parse(generatedContent);
      const reviews = Array.isArray(parsedResponse) 
        ? parsedResponse 
        : (parsedResponse.reviews || []);
      
      return {
        success: true,
        reviews: reviews.map((review: any) => ({
          ...review,
          is_selected: true,
          is_published: false,
          images: []
        })),
      };
    } catch (parseError) {
      console.error('Erro ao parsear avaliações geradas:', parseError);
      return {
        success: false,
        error: 'Erro ao processar as avaliações geradas.',
      };
    }
  } catch (error) {
    console.error('Erro na geração de avaliações com IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na geração de avaliações.',
    };
  }
}

/**
 * Atualiza o conteúdo melhorado ou traduzido no banco de dados
 */
export async function updateEnhancedContent(
  type: 'product' | 'review',
  id: string,
  field: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const table = type === 'product' ? 'products' : 'reviews';
    
    const result: any = await supabase
      .from(table)
      .update({ [field]: content, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (result && result.error) {
      console.error(`Erro ao atualizar ${type}:`, result.error);
      return { success: false, error: (result.error as any).message || 'Erro ao atualizar conteúdo' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar conteúdo melhorado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao atualizar conteúdo.',
    };
  }
} 