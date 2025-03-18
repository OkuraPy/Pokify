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
  last_sync?: Date;
  created_at: Date;
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
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
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
    const query = supabase.from('stores').select('*');
    const orderedQuery = query.order('created_at', { ascending: false });
    
    // Use a função safeAwait para evitar o erro de TypeScript com 'await'
    const stores = await safeAwait<any>(orderedQuery);
    
    return {
      data: stores.data,
      error: stores.error
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
    const query = supabase.from('stores').select('*');
    const filteredQuery = query.eq('id', id);
    const singleQuery = filteredQuery.single();
    
    // Use a função safeAwait para evitar o erro de TypeScript com 'await'
    const store = await safeAwait<any>(singleQuery);
    
    return { 
      data: store.data, 
      error: store.error 
    };
  } catch (error) {
    console.error('Erro ao obter loja:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

export async function createStore(store: Partial<Store>) {
  try {
    const query = supabase.from('stores').insert(store);
    const selectQuery = query.select();
    const singleQuery = selectQuery.single();
    
    // Use a função safeAwait para evitar o erro de TypeScript com 'await'
    const result = await safeAwait<any>(singleQuery);
    
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
    const query = supabase.from('stores').update(store);
    const filteredQuery = query.eq('id', id);
    const selectQuery = filteredQuery.select();
    const singleQuery = selectQuery.single();
    
    // Use a função safeAwait para evitar o erro de TypeScript com 'await'
    const result = await safeAwait<any>(singleQuery);
    
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
    const query = supabase.from('stores').delete();
    const filteredQuery = query.eq('id', id);
    
    // Use a função safeAwait para evitar o erro de TypeScript com 'await'
    const result = await safeAwait<any>(filteredQuery);
    
    return { error: result.error };
  } catch (error) {
    console.error('Erro ao excluir loja:', error);
    return {
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
export async function getProducts(storeId?: string, status?: string) {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (storeId) {
      query = (query as any).eq('store_id', storeId);
    }
    
    if (status) {
      query = (query as any).eq('status', status);
    }
    
    // Use a função safeAwait para evitar o erro de TypeScript com 'await'
    const productsResult = await safeAwait<any>(query);
    
    return { 
      data: productsResult.data, 
      error: productsResult.error 
    };
  } catch (error) {
    console.error('Erro ao obter produtos:', error);
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

export async function createProduct(product: Partial<Product>) {
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
      const { error: updateError } = await supabase
        .from('stores')
        .update({ 
          products_count: supabase.rpc('increment', { x: 1 }),
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
    // Certifique-se de que o status é um dos valores permitidos pelo enum product_status
    if (product.status && !['imported', 'editing', 'ready', 'published', 'archived'].includes(product.status)) {
      return {
        data: null,
        error: new Error('Status do produto inválido')
      };
    }
    
    // Atualizar o produto no banco de dados
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', productId)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar produto:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erro desconhecido ao atualizar produto')
    };
  }
}

export async function deleteProduct(id: string) {
  try {
    const query = supabase.from('products').delete();
    const filteredQuery = query.eq('id', id);
    
    // Use a função safeAwait para evitar o erro de TypeScript com 'await'
    const productResult = await safeAwait<any>(filteredQuery);
    
    return { error: productResult.error };
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return {
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

// Funções para trabalhar com avaliações
export async function getReviews(productId: string) {
  try {
    const query = supabase.from('reviews').select('*');
    const filteredQuery = (query as any).eq('product_id', productId);
    const orderedQuery = (filteredQuery as any).order('created_at', { ascending: false });
    
    // Use a função safeAwait para evitar o erro de TypeScript com 'await'
    const reviewsResult = await safeAwait<any>(orderedQuery);
    
    return { 
      data: reviewsResult.data, 
      error: reviewsResult.error 
    };
  } catch (error) {
    console.error('Erro ao obter avaliações:', error);
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
    const query = supabase.from('reviews').delete();
    const filteredQuery = (query as any).eq('id', id);
    
    // Use a função safeAwait para evitar o erro de TypeScript com 'await'
    const reviewResult = await safeAwait<any>(filteredQuery);
    
    return { error: reviewResult.error };
  } catch (error) {
    console.error('Erro ao excluir avaliação:', error);
    return {
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
    let reviews = [];
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
 * Gera avaliações usando IA para um produto
 */
export async function generateAIReviews(
  productId: string,
  count: number,
  averageRating: number
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
    
    // Chamar a função Edge do Supabase para gerar avaliações
    const { data, error } = await supabase.functions.invoke('generate-reviews', {
      body: {
        product_id: productId,
        product_title: product.title,
        product_description: product.description,
        count,
        average_rating: averageRating
      }
    });
    
    if (error) {
      console.error('Erro ao gerar avaliações:', error);
      return { success: false, count: 0, error: error.message };
    }
    
    // Atualizar o contador de avaliações do produto
    await updateProduct(productId, {
      reviews_count: (product.reviews_count || 0) + (data?.reviewsCount || 0),
      average_rating: data?.newAverageRating || product.average_rating
    });
    
    return { 
      success: true, 
      count: data?.reviewsCount || 0 
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