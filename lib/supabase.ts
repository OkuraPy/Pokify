// Implementação do cliente Supabase
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Cliente Supabase real com configuração de persistência de sessão
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      storageKey: 'pokify-auth-token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true
    }
  }
);

// Funções de Autenticação
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  return { data, error };
}

// Definição dos tipos
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  billing_status: string;
  stores_limit: number;
  products_limit: number;
}

export interface Store {
  id: string;
  name: string;
  user_id: string;
  platform: 'aliexpress' | 'shopify' | 'other';
  url?: string;
  api_key?: string;
  api_secret?: string;
  products_count: number;
  orders_count: number;
  last_sync?: string;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  original_url?: string;
  original_platform?: 'aliexpress' | 'shopify' | 'other';
  shopify_product_id?: string;
  shopify_product_url?: string;
  stock: number;
  status: 'imported' | 'editing' | 'ready' | 'published' | 'archived';
  reviews_count: number;
  average_rating?: number;
  tags?: string[];
  variants?: any;
  language?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  images?: string[];
  is_selected: boolean;
  is_published: boolean;
  created_at: string;
}

// Funções de Autenticação
export async function signIn(email: string, password: string) {
  try {
    // Tenta fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Erro ao fazer login:', error);
      return { data: null, error };
    }
    
    if (!data.user || !data.session) {
      console.error('Login bem-sucedido, mas sem dados de usuário ou sessão');
      return { 
        data: null, 
        error: { message: 'Falha ao obter dados do usuário.' } 
      };
    }
    
    console.log('Login bem-sucedido, sessão estabelecida:', data.session.access_token ? 'Com token' : 'Sem token');
    
    // Verifica se temos uma sessão estabelecida
    const { data: sessionCheck } = await supabase.auth.getSession();
    console.log('Verificação de sessão após login:', sessionCheck.session ? 'Ativa' : 'Inativa');
    
    return { data, error: null };
  } catch (err) {
    console.error('Exceção durante login:', err);
    return { 
      data: null, 
      error: { message: 'Erro durante o processo de login.' } 
    };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    // Verificar se temos uma sessão ativa
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Se não tivermos sessão, retornamos null
    if (!sessionData.session) {
      console.log('Sem sessão ativa.');
      return null;
    }
    
    // Com sessão ativa, buscamos o usuário
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('Usuário não encontrado na sessão.');
      return null;
    }
    
    console.log('Usuário encontrado na sessão:', user.id);
    
    // Buscar os dados completos do usuário no banco
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
    
    if (!data) {
      console.log('Dados do usuário não encontrados na tabela users.');
      return null;
    }
    
    console.log('Dados completos do usuário recuperados.');
    return data as User;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
}

// Função utilitária para fazer await com segurança
async function safeAwait<T>(promise: Promise<any>): Promise<T> {
  try {
    const result = await promise;
    return result;
  } catch (error) {
    console.error('Erro ao processar promise:', error);
    throw error;
  }
}

// Funções de Gerenciamento de Lojas
export async function getStores() {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });
    
    return {
      data,
      error
    };
  } catch (error) {
    console.error('Erro ao obter lojas:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function getStore(id: string) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();
    
    return { 
      data, 
      error 
    };
  } catch (error) {
    console.error('Erro ao obter loja:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function createStore(store: Partial<Store> & { name: string; user_id: string; platform: 'aliexpress' | 'shopify' | 'other' }) {
  try {
    const query = supabase.from('stores').insert(store);
    const selectQuery = query.select();
    const singleQuery = selectQuery.single();
    
    // Executar diretamente a query
    const result = await singleQuery;
    
    return { 
      data: result.data, 
      error: result.error 
    };
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function updateStore(id: string, store: Partial<Store>) {
  try {
    const query = supabase
      .from('stores')
      .update(store)
      .eq('id', id);
    
    const selectQuery = query.select();
    const filteredQuery = selectQuery.single();
    
    // Executar diretamente a query
    const result = await filteredQuery;
    
    return { 
      data: result.data, 
      error: result.error 
    };
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function deleteStore(id: string) {
  try {
    const query = supabase
      .from('stores')
      .delete()
      .eq('id', id);
    
    const selectQuery = query.select();
    const filteredQuery = selectQuery.single();
    
    // Executar diretamente a query
    const result = await filteredQuery;
    
    return { 
      data: result.data, 
      error: result.error 
    };
  } catch (error) {
    console.error('Erro ao excluir loja:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function verifyShopifyCredentials(
  shopUrl: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('shopify-publish', {
      body: {
        action: 'verify',
        credentials: {
          shop: shopUrl,
          accessToken: accessToken
        }
      }
    });
    
    if (error) {
      return { success: false, error: (error as any).message };
    }
    
    return { success: (data as any)?.success || false };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar credenciais.'
    };
  }
}

// Funções de Gerenciamento de Produtos
export async function getProducts(storeId?: string, status?: 'imported' | 'editing' | 'ready' | 'published' | 'archived') {
  try {
    console.log(`Buscando produtos ${storeId ? `da loja ${storeId}` : "de todas as lojas"}${status ? ` com status ${status}` : ""}`);
    
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Executar diretamente a query
    const productsResult = await query;
    
    // Verificar se o resultado é válido
    if (productsResult.error) {
      console.error('Erro ao buscar produtos:', productsResult.error);
      return { 
        data: [], 
        error: productsResult.error 
      };
    }
    
    // Garantir que o resultado seja sempre um array, mesmo que vazio
    const products = productsResult.data || [];
    
    // Log para depuração
    console.log(`Encontrados ${products.length} produtos${storeId ? ` para a loja ${storeId}` : ""}`);
    
    // Se houver um storeId e produtos foram encontrados, atualizar a contagem na tabela de lojas
    if (storeId && !status) {
      try {
        // Atualizar o contador de produtos da loja diretamente na tabela
        await supabase
          .from('stores')
          .update({ 
            products_count: products.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', storeId);
          
        console.log(`Atualizada contagem de produtos da loja ${storeId} para ${products.length}`);
      } catch (updateError) {
        console.error(`Erro ao atualizar contagem de produtos da loja ${storeId}:`, updateError);
      }
    }
    
    return { 
      data: products, 
      error: null 
    };
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function getProduct(id: string) {
  try {
    console.log('Buscando produto ID:', id);
    const productResult = await supabase
      .from('products')
      .select(`
        *,
        reviews(*)
      `)
      .eq('id', id)
      .single();
    
    console.log('Resultado da busca:', productResult);
    
    return { 
      data: productResult.data, 
      error: productResult.error 
    };
  } catch (error) {
    console.error('Erro na função getProduct:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function createProduct(product: Partial<Product> & { store_id: string; title: string; price: number; images: string[] }) {
  try {
    // Certifique-se de que o status é um dos valores permitidos pelo enum product_status
    if (product.status && !['imported', 'editing', 'ready', 'published', 'archived'].includes(product.status)) {
      return {
        data: null,
        error: new Error('Status do produto inválido')
      };
    }
    
    // Certifique-se de que original_platform (se fornecido) é um dos valores permitidos pelo enum platform_type
    if (product.original_platform && 
        !['aliexpress', 'shopify', 'other'].includes(product.original_platform as string)) {
      return {
        data: null,
        error: new Error('Plataforma de origem inválida')
      };
    }
    
    // Defina as datas de criação e atualização
    const now = new Date().toISOString();
    const productWithDates = {
      ...product,
      created_at: now,
      updated_at: now
    };
    
    // Inserir o produto no banco de dados
    const productResult = await supabase
      .from('products')
      .insert(productWithDates)
      .select()
      .single();
    
    // Se a inserção for bem-sucedida, incrementar o contador de produtos da loja
    if (productResult.data && !productResult.error) {
      // Primeiro, buscar o valor atual de products_count
      const { data: storeData } = await supabase
        .from('stores')
        .select('products_count')
        .eq('id', product.store_id)
        .single();
      
      // Incrementar o contador de produtos
      const currentCount = storeData?.products_count || 0;
      const newCount = currentCount + 1;
      
      const { error: updateError } = await supabase
        .from('stores')
        .update({ 
          products_count: newCount,
          updated_at: now
        })
        .eq('id', product.store_id);
      
      if (updateError) {
        console.error('Erro ao atualizar contador de produtos da loja:', updateError);
      }
    }
    
    return { 
      data: productResult.data, 
      error: productResult.error 
    };
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido ao criar produto')
    };
  }
}

/**
 * Atualiza um produto existente
 */
export async function updateProduct(productId: string, product: Partial<Product>) {
  try {
    const query = supabase
      .from('products')
      .update(product)
      .eq('id', productId);
    
    const selectQuery = query.select();
    const filteredQuery = selectQuery.single();
    
    // Executar diretamente a query
    const productResult = await filteredQuery;
    
    return { 
      data: productResult.data, 
      error: productResult.error 
    };
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function deleteProduct(id: string) {
  try {
    const query = supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    // Executar diretamente a query
    const productResult = await query;
    
    return { 
      data: productResult.data,
      error: productResult.error 
    };
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

// Funções para trabalhar com avaliações
export async function getReviews(productId: string) {
  try {
    const query = supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId);
    
    const orderedQuery = query.order('is_selected', { ascending: false });
    
    // Executar diretamente a query
    const reviewsResult = await orderedQuery;
    
    return { 
      data: reviewsResult.data || [], 
      error: reviewsResult.error 
    };
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

/**
 * Atualiza uma avaliação específica
 */
export async function updateReview(reviewId: string, updates: Partial<any>) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function deleteReview(id: string) {
  try {
    const query = supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    
    const selectQuery = query.select();
    const filteredQuery = selectQuery.single();
    
    // Executar diretamente a query
    const reviewResult = await filteredQuery;
    
    return { 
      data: reviewResult.data, 
      error: reviewResult.error 
    };
  } catch (error) {
    console.error('Erro ao excluir avaliação:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

// Funções de extração de produtos
export async function extractProductFromUrl(url: string) {
  try {
    // Obter plataforma com base na URL
    const platform = url.includes('aliexpress.com') 
      ? 'aliexpress' 
      : url.includes('myshopify.com') || url.includes('/products/') 
        ? 'shopify' 
        : 'other';
        
    if (platform === 'other') {
      return {
        success: false,
        error: 'URL não suportada. Por favor, forneça uma URL do AliExpress ou Shopify.'
      };
    }
    
    // Chamar a Edge Function para extrair dados
    const { data, error } = await supabase.functions.invoke('extract-product', {
      body: { url, platform }
    });
    
    if (error) {
      console.error('Erro ao extrair dados:', error);
      return {
        success: false,
        error: error.message || 'Erro na extração do produto.'
      };
    }
    
    return {
      success: true,
      data: {
        ...data,
        original_url: url,
        original_platform: platform
      }
    };
  } catch (error) {
    console.error('Erro ao extrair produto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na extração do produto.'
    };
  }
}

export async function extractProductReviews(
  url: string,
  page: number = 1,
  limit: number = 20
) {
  try {
    // Obter plataforma com base na URL
    const platform = url.includes('aliexpress.com') 
      ? 'aliexpress' 
      : url.includes('myshopify.com') || url.includes('/products/') 
        ? 'shopify' 
        : 'other';
        
    if (platform === 'other') {
      return {
        success: false,
        error: 'URL não suportada para extração de avaliações.'
      };
    }
    
    // Chamar a Edge Function para extrair avaliações
    const { data, error } = await supabase.functions.invoke('extract-reviews', {
      body: { url, platform, page, limit }
    });
    
    if (error) {
      console.error('Erro ao extrair avaliações:', error);
      return {
        success: false,
        error: error.message || 'Erro na extração das avaliações.'
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Erro ao extrair avaliações:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na extração das avaliações.'
    };
  }
}

// Funções para melhoria de texto com IA
import OpenAI from 'openai';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Necessário para uso no frontend
});

export async function enhanceWithAI(
  content: string,
  type: 'product_description' | 'review' | 'product_title',
  options?: {
    targetLanguage?: string;
    contentStyle?: 'professional' | 'casual' | 'enthusiastic' | 'technical';
    productCategory?: string;
  }
) {
  try {
    // Chamar a Edge Function para melhorar texto
    const { data, error } = await supabase.functions.invoke('enhance-text', {
      body: {
        content,
        type,
        ...options
      }
    });
    
    if (error) {
      console.error('Erro ao melhorar texto:', error);
      return {
        success: false,
        error: error.message || 'Erro na melhoria do texto.'
      };
    }
    
    return {
      success: true,
      enhancedContent: data?.enhancedContent
    };
  } catch (error) {
    console.error('Erro na melhoria com IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na melhoria do conteúdo.'
    };
  }
}

export async function translateWithAI(
  content: string,
  targetLanguage: string = 'português',
  preserveFormatting: boolean = true
) {
  try {
    // Chamar a Edge Function para traduzir texto
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: {
        content,
        targetLanguage,
        preserveFormatting
      }
    });
    
    if (error) {
      console.error('Erro ao traduzir texto:', error);
      return {
        success: false,
        error: error.message || 'Erro na tradução do texto.'
      };
    }
    
    return {
      success: true,
      translatedContent: data?.translatedContent
    };
  } catch (error) {
    console.error('Erro na tradução com IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na tradução do conteúdo.'
    };
  }
}

export async function generateReviewsWithAI(
  productTitle: string,
  productDescription: string,
  count: number = 5,
  options?: {
    language?: string;
    rating?: { min: number; max: number };
    includeImages?: boolean;
  }
) {
  try {
    // Chamar a Edge Function para gerar avaliações
    const { data, error } = await supabase.functions.invoke('generate-reviews', {
      body: {
        productTitle,
        productDescription,
        count,
        ...options
      }
    });
    
    if (error) {
      console.error('Erro ao gerar avaliações:', error);
      return {
        success: false,
        error: error.message || 'Erro na geração de avaliações.'
      };
    }
    
    return {
      success: true,
      reviews: data?.reviews
    };
  } catch (error) {
    console.error('Erro na geração de avaliações com IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na geração de avaliações.'
    };
  }
}

/**
 * Gera avaliações usando IA para um produto
 */
export async function generateAIReviews(
  productId: string,
  count: number,
  averageRating: number,
  language: string = 'portuguese'
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Primeiro, obtemos os dados do produto
    const { data: product, error: productError } = await getProduct(productId);
    
    if (productError || !product) {
      return {
        success: false,
        count: 0,
        error: productError?.message || 'Produto não encontrado.'
      };
    }

    // Verificar se a API Key está configurada
    if (!openai.apiKey || openai.apiKey === 'sua-chave-api-openai') {
      return {
        success: false,
        count: 0,
        error: 'Chave da API OpenAI não configurada. Verifique o arquivo .env.'
      };
    }
    
    // Limitar o número de avaliações (segurança)
    const totalReviewCount = Math.min(Math.max(count, 1), 100);
    
    // Dividir em lotes se a quantidade for grande
    // Isso evita erros na API quando solicitamos muitos reviews de uma vez
    const BATCH_SIZE = 20;
    const batches = Math.ceil(totalReviewCount / BATCH_SIZE);
    let totalGeneratedReviews = 0;
    let allReviewsToInsert: any[] = [];
    
    console.log(`Gerando ${totalReviewCount} reviews em ${batches} lotes de até ${BATCH_SIZE}`);
    
    // Mapear idiomas para configurações específicas
    const languageConfig: Record<string, { 
      language: string, 
      dateFormat: string, 
      namesType: string,
      instructions: string
    }> = {
      portuguese: {
        language: "português",
        dateFormat: "dd/MM/yyyy",
        namesType: "brasileiros",
        instructions: "Os nomes de clientes devem ser brasileiros. As datas devem seguir o formato brasileiro."
      },
      english: {
        language: "inglês",
        dateFormat: "MM/dd/yyyy",
        namesType: "americanos ou internacionais",
        instructions: "Os nomes de clientes devem ser internacionais. As datas devem seguir o formato americano."
      },
      spanish: {
        language: "espanhol",
        dateFormat: "dd/MM/yyyy",
        namesType: "hispânicos",
        instructions: "Os nomes de clientes devem ser hispânicos. As datas devem seguir o formato espanhol."
      },
      french: {
        language: "francês",
        dateFormat: "dd/MM/yyyy",
        namesType: "franceses",
        instructions: "Os nomes de clientes devem ser franceses. As datas devem seguir o formato francês."
      },
      german: {
        language: "alemão",
        dateFormat: "dd.MM.yyyy",
        namesType: "alemães",
        instructions: "Os nomes de clientes devem ser alemães. As datas devem seguir o formato alemão."
      },
      italian: {
        language: "italiano",
        dateFormat: "dd/MM/yyyy",
        namesType: "italianos",
        instructions: "Os nomes de clientes devem ser italianos. As datas devem seguir o formato italiano."
      }
    };
    
    // Usar a configuração do idioma selecionado ou português como padrão
    const config = languageConfig[language] || languageConfig.portuguese;
    
    // Construir o prompt para a geração de avaliações
    const systemPrompt = `Você é um assistente especializado em gerar reviews de clientes autênticos e persuasivos para produtos de e-commerce. 
    Você deve gerar cada review como se fosse escrito por um cliente real, com personalidade, histórias e detalhes pessoais.
    
    REGRAS IMPORTANTES:
    - Gere exatamente o número de reviews solicitado
    - Cada review deve ter um nome de autor, conteúdo detalhado, data (dos últimos 30 dias), e uma classificação em estrelas aleatória que se aproxime da média solicitada
    - Use linguagem natural, como se fosse realmente escrita por clientes diferentes
    - Evite frases genéricas como "altamente recomendado" e "excelente produto" em todos os reviews
    - Inclua detalhes específicos sobre como o produto foi usado ou afetou a vida do cliente
    - Inclua pelo menos 10% de reviews com pequenas críticas construtivas, mas ainda positivos no geral
    - Incorpore diferentes personalidades e estilos de escrita
    - Inclua alguns casos convincentes de desconfiança inicial seguida por satisfação com o produto
    - Mencione benefícios específicos e experiências reais com o produto
    - Cada review deve ter no mínimo 240 caracteres para ser rico em detalhes
    - Evite repetir as mesmas experiências ou razões para gostar do produto
    - ${config.instructions}
    - Os emails podem ser de qualquer provedor comum (gmail, hotmail, outlook, etc)
    - Mantenha um tom natural, não exagere em adjetivos positivos
    
    Por fim, retorne os dados no formato JSON EXATO a seguir:
    {
      "reviews": [
        {
          "author": "Nome Completo",
          "content": "Conteúdo do review",
          "rating": 5,
          "date": "2023-03-15T14:48:00.000Z"
        },
        ... mais reviews
      ]
    }
    
    Mantenha sua resposta apenas neste formato JSON, sem introdução ou conclusão.`;
    
    // Processar cada lote
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      // Calcular a quantidade para este lote
      const remaining = totalReviewCount - totalGeneratedReviews;
      const batchCount = Math.min(remaining, BATCH_SIZE);
      
      // Se já geramos o suficiente, interromper
      if (batchCount <= 0) break;
      
      console.log(`Gerando lote ${batchIndex + 1}/${batches} com ${batchCount} reviews...`);
      
      const userPrompt = `Gere ${batchCount} reviews persuasivos em ${config.language} para o seguinte produto:
      
      Título: ${product.title}
      Descrição: ${product.description}
      
      A média geral das avaliações deve ser aproximadamente ${averageRating.toFixed(1)}/5.0. Lembre-se de criar reviews com detalhes específicos que mostrem como o produto beneficia os usuários e supera possíveis objeções.
      
      ATENÇÃO: Retorne APENAS JSON válido, nenhum texto adicional ou formatação.`;
      
      try {
        // Fazer a chamada para a OpenAI
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo-1106',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8
        });
        
        // Extrair o JSON gerado
        const generatedContent = completion.choices[0].message.content || '';
        
        if (!generatedContent) {
          console.error(`Lote ${batchIndex + 1}: Sem conteúdo gerado`);
          continue;
        }
        
        // Tentar extrair o JSON da resposta
        let jsonContent = generatedContent;
        
        // Se o conteúdo tiver blocos de código markdown, extrair apenas o JSON
        if (generatedContent.includes("```json")) {
          const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch && jsonMatch[1]) {
            jsonContent = jsonMatch[1];
          }
        } else if (generatedContent.includes("```")) {
          const codeMatch = generatedContent.match(/```\n([\s\S]*?)\n```/);
          if (codeMatch && codeMatch[1]) {
            jsonContent = codeMatch[1];
          }
        }
        
        // O modelo pode retornar o JSON em diferentes formatos, tentamos normalizar
        const parsedResponse = JSON.parse(jsonContent);
        
        // O modelo pode retornar um array diretamente ou um objeto com uma propriedade contendo o array
        let batchReviews: any[] = [];
        
        if (Array.isArray(parsedResponse)) {
          batchReviews = parsedResponse;
        } else if (parsedResponse.reviews && Array.isArray(parsedResponse.reviews)) {
          batchReviews = parsedResponse.reviews;
        } else {
          // Tentar encontrar qualquer array no objeto retornado
          const possibleArrays = Object.values(parsedResponse).filter(value => Array.isArray(value));
          if (possibleArrays.length > 0) {
            // Usar o primeiro array encontrado
            batchReviews = possibleArrays[0] as any[];
          }
        }
        
        if (batchReviews.length === 0) {
          console.error(`Lote ${batchIndex + 1}: Formato de resposta inválido`);
          continue;
        }
        
        // Processar e normalizar os reviews
        const processedDate = new Date().toISOString();
        const processReview = (review: any) => {
          return {
            product_id: productId,
            author: review.author || 'Cliente Anônimo',
            rating: parseInt(review.rating) || 5,
            content: review.content || '',
            date: typeof review.date === 'string' 
              ? review.date 
              : (review.date instanceof Date 
                ? review.date.toISOString() 
                : new Date().toISOString()),
            images: [],
            is_selected: true,
            is_published: true,
            created_at: new Date().toISOString()
          };
        };
        
        const normalizedReviews = batchReviews.map(processReview);
        allReviewsToInsert = [...allReviewsToInsert, ...normalizedReviews];
        totalGeneratedReviews += normalizedReviews.length;
        
        console.log(`Lote ${batchIndex + 1}: Gerados ${normalizedReviews.length} reviews com sucesso`);
        
        // Adicionar um pequeno atraso para evitar rate limiting
        if (batchIndex < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (batchError) {
        console.error(`Erro no lote ${batchIndex + 1}:`, batchError);
        // Continuar para o próximo lote
      }
    }
    
    // Se não conseguimos gerar nenhum review
    if (allReviewsToInsert.length === 0) {
      return {
        success: false,
        count: 0,
        error: 'Não foi possível gerar nenhuma avaliação após tentativas em lotes'
      };
    }
    
    // Inserir todas as avaliações no banco de dados
    const { error: insertError } = await supabase
      .from('reviews')
      .insert(allReviewsToInsert);
      
    if (insertError) {
      console.error('Erro ao inserir avaliações:', insertError);
      return { 
        success: false, 
        count: 0,
        error: insertError.message
      };
    }
    
    // Atualizar o contador de avaliações do produto
    await updateProduct(productId, {
      reviews_count: (product.reviews_count || 0) + allReviewsToInsert.length,
      average_rating: averageRating
    });
    
    return { 
      success: true, 
      count: allReviewsToInsert.length 
    };
    
  } catch (error) {
    console.error('Erro ao gerar avaliações:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função para publicar produto no Shopify
export async function publishProductToShopify(
  storeId: string,
  productId: string,
  includeSelectedReviews: boolean = true
) {
  try {
    // Primeiro, obtemos os dados da loja
    const { data: store, error: storeError } = await getStore(storeId);
    
    if (storeError || !store) {
      return {
        success: false,
        error: storeError?.message || 'Loja não encontrada.'
      };
    }
    
    // Verificar se a loja tem credenciais do Shopify
    if (!store.api_key || !store.url) {
      return {
        success: false,
        error: 'A loja não possui as credenciais necessárias do Shopify.'
      };
    }
    
    // Obter os dados do produto
    const { data: product, error: productError } = await getProduct(productId);
    
    if (productError || !product) {
      return {
        success: false,
        error: productError?.message || 'Produto não encontrado.'
      };
    }
    
    // Obter as avaliações selecionadas, se necessário
    let reviews: any[] = [];
    if (includeSelectedReviews && product.reviews_count > 0) {
      const { data: reviewsData } = await getReviews(productId);
      reviews = reviewsData?.filter(review => review.is_selected) || [];
    }
    
    // Chamar a Edge Function para publicar no Shopify
    const { data, error } = await supabase.functions.invoke('shopify-publish', {
      body: {
        credentials: {
          shop: store.url,
          accessToken: store.api_key
        },
        product,
        reviews
      }
    });
    
    if (error) {
      console.error('Erro ao publicar no Shopify:', error);
      return {
        success: false,
        error: error.message || 'Erro na publicação do produto.'
      };
    }
    
    // Atualizar o produto com as informações do Shopify
    if (data?.shopifyProductId) {
      await updateProduct(productId, {
        shopify_product_id: data.shopifyProductId,
        shopify_product_url: data.productUrl,
        status: 'published'
      });
      
      // Registrar no histórico de publicações
      await supabase.from('publication_history').insert({
        product_id: productId,
        store_id: storeId,
        status: 'success',
        shopify_response: data
      });
    }
    
    return {
      success: true,
      shopifyProductId: data?.shopifyProductId,
      productUrl: data?.productUrl
    };
  } catch (error) {
    console.error('Erro ao publicar produto no Shopify:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na publicação do produto.'
    };
  }
}

/**
 * Importa avaliações de um produto de uma URL externa
 */
export async function importReviewsFromUrl(
  productId: string,
  url: string,
  platform: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Chamar uma função Supabase Edge Function para fazer o scraping
    const { data, error } = await supabase.functions.invoke('extract-reviews', {
      body: {
        product_id: productId,
        url,
        platform
      }
    });
    
    if (error) {
      console.error('Erro ao importar avaliações:', error);
      return { success: false, count: 0, error: error.message };
    }
    
    return { 
      success: true, 
      count: data?.reviewsCount || 0 
    };
  } catch (error) {
    console.error('Erro ao importar avaliações:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Obtém todas as lojas do usuário atual
 */
export async function getUserStores() {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user) {
      return { data: [], error: new Error('Usuário não autenticado') };
    }
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });
    
    return { data, error };
  } catch (error) {
    console.error('Erro ao obter lojas do usuário:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Erro desconhecido') 
    };
  }
}

/**
 * Obtém estatísticas gerais de uma loja
 */
export async function getStoreStats(storeId: string) {
  try {
    // Obter produtos da loja
    const { data: products, error: productsError } = await getProducts(storeId);
    
    if (productsError) {
      throw productsError;
    }
    
    // Calcular estatísticas
    let totalReviews = 0;
    let totalViews = 0;
    let totalSales = 0;
    let totalRevenue = 0;
    
    // Se temos produtos, calcular totais
    if (products && products.length > 0) {
      totalReviews = products.reduce((sum, product) => sum + (product.reviews_count || 0), 0);
      
      // Aqui você poderia fazer outras chamadas para obter mais estatísticas
      // como vendas e visualizações, se disponíveis no seu sistema
    }
    
    // Valores fictícios para demonstração
    totalSales = Math.floor(Math.random() * 100);
    totalRevenue = totalSales * 100 + Math.floor(Math.random() * 1000);
    
    return {
      totalProducts: products?.length || 0,
      totalReviews,
      totalViews,
      totalSales,
      totalRevenue
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas da loja:', error);
    throw error;
  }
}

/**
 * Obtém o perfil do usuário atual
 */
export async function getUserProfile() {
  try {
    // Obter o usuário autenticado atual
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData?.user) {
      return { data: null, error: authError || new Error('Usuário não autenticado') };
    }
    
    // Buscar dados do perfil na tabela users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return { data: null, error };
    }
    
    // Combinar dados do auth e do perfil
    return { 
      data: {
        ...data,
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Erro desconhecido') 
    };
  }
}

/**
 * Atualiza o perfil do usuário atual
 */
export async function updateUserProfile(updates: Partial<{
  full_name: string;
  avatar_url: string;
  company: string;
  billing_status?: string;
  stores_limit?: number;
  products_limit?: number;
}>) {
  try {
    // Obter o usuário autenticado atual
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData?.user) {
      return { data: null, error: authError || new Error('Usuário não autenticado') };
    }
    
    // Atualizar dados no auth se estiver atualizando nome ou avatar
    if (updates.full_name || updates.avatar_url) {
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          avatar_url: updates.avatar_url
        }
      });
      
      if (updateAuthError) {
        console.error('Erro ao atualizar dados de autenticação:', updateAuthError);
      }
    }
    
    // Atualizar dados na tabela users
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Erro desconhecido') 
    };
  }
}