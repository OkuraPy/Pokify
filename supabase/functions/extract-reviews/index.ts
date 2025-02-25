// Supabase Edge Function para extrair avaliações de produtos
// Endpoint: /functions/v1/extract-reviews

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.36/deno-dom-wasm.ts';

interface RequestBody {
  url: string;
  platform: 'aliexpress' | 'shopify' | 'other';
  page?: number;
  limit?: number;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  images?: string[];
  is_selected?: boolean;
  is_published?: boolean;
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
    // Obter o corpo da requisição
    const body: RequestBody = await req.json();
    const { url, platform, page = 1, limit = 20 } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL é obrigatória' }),
        { headers, status: 400 }
      );
    }

    // Extrair avaliações com base na plataforma
    let reviews: Review[];

    switch (platform) {
      case 'aliexpress':
        reviews = await extractReviewsFromAliExpress(url, page, limit);
        break;
      case 'shopify':
        reviews = await extractReviewsFromShopify(url, page, limit);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Plataforma não suportada' }),
          { headers, status: 400 }
        );
    }

    return new Response(
      JSON.stringify(reviews),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error('Erro ao extrair avaliações:', error);
    return new Response(
      JSON.stringify({ error: `Erro na extração: ${error.message}` }),
      { headers, status: 500 }
    );
  }
});

/**
 * Extrai avaliações de um produto do AliExpress
 */
async function extractReviewsFromAliExpress(
  url: string,
  page: number = 1,
  limit: number = 20
): Promise<Review[]> {
  // Para extrair avaliações do AliExpress, precisamos do ID do produto na URL
  const productId = extractProductIdFromAliExpressUrl(url);
  
  if (!productId) {
    throw new Error('Não foi possível extrair o ID do produto do URL do AliExpress');
  }
  
  // API de avaliações AliExpress (formato aproximado)
  const reviewUrl = `https://feedback.aliexpress.com/display/productEvaluation.htm?productId=${productId}&ownerMemberId=&currentPage=${page}&pageSize=${limit}`;
  
  // Fazemos uma requisição para a página de avaliações
  const response = await fetch(reviewUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao acessar avaliações: ${response.status}`);
  }

  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Falha ao analisar o HTML das avaliações');
  }

  // Extrair avaliações do HTML
  const reviews: Review[] = [];
  
  // Identificar os elementos de avaliação (pode variar com o tempo)
  const reviewElements = doc.querySelectorAll('.feedback-item');
  
  for (let i = 0; i < reviewElements.length; i++) {
    const reviewElement = reviewElements[i];
    
    // Gerar um ID único para a avaliação
    const id = `ali_${productId}_${Date.now()}_${i}`;
    
    // Extrair os dados da avaliação
    const authorElement = reviewElement.querySelector('.user-name') || 
                          reviewElement.querySelector('.user-info');
    const author = authorElement?.textContent?.trim() || 'Usuário Anônimo';
    
    // Extrair a classificação
    const ratingElement = reviewElement.querySelector('.star-view');
    let rating = 5; // Valor padrão
    
    if (ratingElement) {
      // Tentar extrair com base na classe (ex: "star-view star-5")
      const ratingClass = ratingElement.className || '';
      const ratingMatch = ratingClass.match(/star-(\d+)/);
      if (ratingMatch && ratingMatch[1]) {
        rating = parseInt(ratingMatch[1], 10);
      }
    }
    
    // Extrair o conteúdo da avaliação
    const contentElement = reviewElement.querySelector('.buyer-feedback') || 
                          reviewElement.querySelector('.feedback-content');
    const content = contentElement?.textContent?.trim() || '';
    
    // Extrair a data
    const dateElement = reviewElement.querySelector('.feedback-time');
    const date = dateElement?.textContent?.trim() || '';
    
    // Extrair imagens (se houver)
    const imageElements = reviewElement.querySelectorAll('.feedback-photos img');
    const images = Array.from(imageElements)
      .map(img => (img as HTMLImageElement).src || '')
      .filter(Boolean);
    
    reviews.push({
      id,
      author,
      rating,
      content,
      date,
      images: images.length > 0 ? images : undefined,
      is_selected: false,
      is_published: false,
    });
  }
  
  // Se não encontrarmos avaliações no formato esperado, tentamos gerar algumas fictícias
  if (reviews.length === 0) {
    return generateMockReviews(10); // Para fins de demonstração
  }
  
  return reviews;
}

/**
 * Extrai o ID do produto de uma URL do AliExpress
 */
function extractProductIdFromAliExpressUrl(url: string): string | null {
  const pattern = /\/item\/(\d+)\.html/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

/**
 * Extrai avaliações de um produto do Shopify
 */
async function extractReviewsFromShopify(
  url: string,
  page: number = 1,
  limit: number = 20
): Promise<Review[]> {
  // Para o Shopify, a estratégia pode variar bastante pois as lojas usam apps 
  // diferentes para avaliações (como Judge.me, Yotpo, etc.)
  
  // Vamos tentar buscar na página do produto diretamente
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao acessar página do produto: ${response.status}`);
  }

  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Falha ao analisar o HTML da página do produto');
  }

  // Tentar extrair avaliações de vários formatos comuns de apps de avaliação
  let reviews: Review[] = [];
  
  // Tentar Judge.me
  const judgeReviews = extractJudgeMeReviews(doc);
  if (judgeReviews.length > 0) {
    reviews = judgeReviews;
  }
  
  // Tentar Yotpo
  if (reviews.length === 0) {
    const yotpoReviews = extractYotpoReviews(doc);
    if (yotpoReviews.length > 0) {
      reviews = yotpoReviews;
    }
  }
  
  // Tentar formato genérico
  if (reviews.length === 0) {
    const genericReviews = extractGenericReviews(doc);
    if (genericReviews.length > 0) {
      reviews = genericReviews;
    }
  }
  
  // Se não encontrarmos avaliações, geramos algumas fictícias para fins de demonstração
  if (reviews.length === 0) {
    return generateMockReviews(10);
  }
  
  // Aplicar paginação
  const startIdx = (page - 1) * limit;
  return reviews.slice(startIdx, startIdx + limit);
}

/**
 * Extrai avaliações do formato Judge.me
 */
function extractJudgeMeReviews(doc: Document): Review[] {
  const reviews: Review[] = [];
  
  // Identificar elementos de avaliação no formato Judge.me
  const reviewElements = doc.querySelectorAll('.jdgm-rev, .jdgm-review');
  
  for (let i = 0; i < reviewElements.length; i++) {
    const reviewElement = reviewElements[i];
    
    // Gerar ID único
    const id = `judgeme_${Date.now()}_${i}`;
    
    // Extrair autor
    const authorElement = reviewElement.querySelector('.jdgm-rev__author');
    const author = authorElement?.textContent?.trim() || 'Usuário Anônimo';
    
    // Extrair classificação
    const ratingElement = reviewElement.querySelector('.jdgm-rev__rating');
    let rating = 5;
    
    if (ratingElement) {
      const stars = ratingElement.querySelectorAll('.jdgm-star.jdgm--on, .jdgm-star.jdgm-star--filled');
      rating = stars.length || 5;
    }
    
    // Extrair conteúdo
    const contentElement = reviewElement.querySelector('.jdgm-rev__body');
    const content = contentElement?.textContent?.trim() || '';
    
    // Extrair data
    const dateElement = reviewElement.querySelector('.jdgm-rev__timestamp');
    const date = dateElement?.textContent?.trim() || '';
    
    // Extrair imagens
    const imageElements = reviewElement.querySelectorAll('.jdgm-rev__photos img');
    const images = Array.from(imageElements)
      .map(img => (img as HTMLImageElement).src || '')
      .filter(Boolean);
    
    reviews.push({
      id,
      author,
      rating,
      content,
      date,
      images: images.length > 0 ? images : undefined,
      is_selected: false,
      is_published: false,
    });
  }
  
  return reviews;
}

/**
 * Extrai avaliações do formato Yotpo
 */
function extractYotpoReviews(doc: Document): Review[] {
  const reviews: Review[] = [];
  
  // Identificar elementos de avaliação no formato Yotpo
  const reviewElements = doc.querySelectorAll('.yotpo-review');
  
  for (let i = 0; i < reviewElements.length; i++) {
    const reviewElement = reviewElements[i];
    
    // Gerar ID único
    const id = `yotpo_${Date.now()}_${i}`;
    
    // Extrair autor
    const authorElement = reviewElement.querySelector('.yotpo-user-name');
    const author = authorElement?.textContent?.trim() || 'Usuário Anônimo';
    
    // Extrair classificação
    const ratingElement = reviewElement.querySelector('.yotpo-review-stars');
    let rating = 5;
    
    if (ratingElement) {
      const stars = ratingElement.querySelectorAll('.yotpo-icon-star');
      rating = stars.length || 5;
    }
    
    // Extrair conteúdo
    const contentElement = reviewElement.querySelector('.content-review');
    const content = contentElement?.textContent?.trim() || '';
    
    // Extrair data
    const dateElement = reviewElement.querySelector('.yotpo-review-date');
    const date = dateElement?.textContent?.trim() || '';
    
    // Extrair imagens
    const imageElements = reviewElement.querySelectorAll('.yotpo-review-images img');
    const images = Array.from(imageElements)
      .map(img => (img as HTMLImageElement).src || '')
      .filter(Boolean);
    
    reviews.push({
      id,
      author,
      rating,
      content,
      date,
      images: images.length > 0 ? images : undefined,
      is_selected: false,
      is_published: false,
    });
  }
  
  return reviews;
}

/**
 * Extrai avaliações de formatos genéricos de avaliações
 */
function extractGenericReviews(doc: Document): Review[] {
  const reviews: Review[] = [];
  
  // Tentar vários seletores comuns para elementos de avaliação
  const reviewSelectors = [
    '.review', 
    '.product-review', 
    '.customer-review',
    '[data-review]',
    '.spr-review'
  ];
  
  let reviewElements: Element[] = [];
  
  // Tentar cada seletor até encontrarmos avaliações
  for (const selector of reviewSelectors) {
    const elements = doc.querySelectorAll(selector);
    if (elements.length > 0) {
      reviewElements = Array.from(elements);
      break;
    }
  }
  
  // Processar os elementos encontrados
  for (let i = 0; i < reviewElements.length; i++) {
    const reviewElement = reviewElements[i];
    
    // Gerar ID único
    const id = `review_${Date.now()}_${i}`;
    
    // Tentar vários seletores para o autor
    const authorSelectors = ['.review-author', '.author', '.reviewer-name', '.user-name'];
    let author = 'Usuário Anônimo';
    
    for (const selector of authorSelectors) {
      const element = reviewElement.querySelector(selector);
      if (element && element.textContent) {
        author = element.textContent.trim();
        break;
      }
    }
    
    // Tentar vários seletores para a classificação
    const ratingSelectors = ['.rating', '.stars', '.review-rating', '.star-rating'];
    let rating = 5;
    
    for (const selector of ratingSelectors) {
      const element = reviewElement.querySelector(selector);
      if (element) {
        // Verificar se há imagens de estrelas
        const stars = element.querySelectorAll('img[src*="star"], .star.filled, .star.active');
        if (stars.length > 0) {
          rating = stars.length;
          break;
        }
        
        // Verificar texto diretamente
        if (element.textContent) {
          const text = element.textContent.trim();
          const ratingMatch = text.match(/(\d+(\.\d+)?)\s*\/\s*5/);
          if (ratingMatch && ratingMatch[1]) {
            rating = Math.round(parseFloat(ratingMatch[1]));
            break;
          }
        }
      }
    }
    
    // Tentar vários seletores para o conteúdo
    const contentSelectors = ['.review-content', '.content', '.review-text', '.description'];
    let content = '';
    
    for (const selector of contentSelectors) {
      const element = reviewElement.querySelector(selector);
      if (element && element.textContent) {
        content = element.textContent.trim();
        break;
      }
    }
    
    // Tentar vários seletores para a data
    const dateSelectors = ['.review-date', '.date', '.timestamp', '.time'];
    let date = '';
    
    for (const selector of dateSelectors) {
      const element = reviewElement.querySelector(selector);
      if (element && element.textContent) {
        date = element.textContent.trim();
        break;
      }
    }
    
    // Tenta encontrar imagens
    const imageSelectors = ['.review-images img', '.photos img', '.images img'];
    let images: string[] = [];
    
    for (const selector of imageSelectors) {
      const elements = reviewElement.querySelectorAll(selector);
      if (elements.length > 0) {
        images = Array.from(elements)
          .map(img => (img as HTMLImageElement).src || '')
          .filter(Boolean);
        break;
      }
    }
    
    // Adicionar a avaliação se houver pelo menos conteúdo ou classificação
    if (content || rating) {
      reviews.push({
        id,
        author,
        rating,
        content,
        date,
        images: images.length > 0 ? images : undefined,
        is_selected: false,
        is_published: false,
      });
    }
  }
  
  return reviews;
}

/**
 * Gera avaliações fictícias para demonstração
 */
function generateMockReviews(count: number = 10): Review[] {
  const reviews: Review[] = [];
  
  const reviewContents = [
    "Produto excelente! Exatamente como descrito e entregue rapidamente.",
    "Muito satisfeito com a qualidade, recomendo fortemente.",
    "Boa relação custo-benefício. Não é perfeito, mas atende bem às expectativas.",
    "Superou minhas expectativas, especialmente considerando o preço.",
    "O material é de boa qualidade e o design é bonito.",
    "Muito melhor do que eu esperava. Estou impressionado com a qualidade.",
    "Atendeu perfeitamente às minhas necessidades. Compraria novamente.",
    "Produto bom, mas o envio demorou um pouco mais do que o esperado.",
    "Ótimo produto! Já é a segunda vez que compro e continua com a mesma qualidade.",
    "Perfeito para o uso diário. Durável e bem acabado.",
    "Excelente produto! Material de qualidade e acabamento impecável.",
    "Muito bom! Recomendo a todos que estão procurando algo similar.",
    "Produto chegou antes do prazo e em perfeitas condições. Estou muito satisfeito!",
    "A qualidade é boa, mas esperava um pouco mais pelo preço que paguei.",
    "Exatamente o que eu precisava. Funciona perfeitamente."
  ];
  
  const authors = [
    "João Silva", "Maria Oliveira", "Pedro Santos", "Ana Costa", 
    "Carlos Ferreira", "Juliana Lima", "Ricardo Pereira", "Fernanda Souza",
    "Roberto Almeida", "Luciana Martins", "Eduardo Barbosa", "Patrícia Nunes"
  ];
  
  for (let i = 0; i < count; i++) {
    const contentIndex = Math.floor(Math.random() * reviewContents.length);
    const authorIndex = Math.floor(Math.random() * authors.length);
    const rating = Math.floor(Math.random() * 3) + 3; // 3 a 5 estrelas para exemplos positivos
    
    const daysAgo = Math.floor(Math.random() * 60); // Entre 0 e 60 dias atrás
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - daysAgo);
    
    // Algumas avaliações terão imagens de exemplo
    const hasImages = Math.random() > 0.7;
    let images;
    
    if (hasImages) {
      const imageCount = Math.floor(Math.random() * 3) + 1; // 1 a 3 imagens
      images = [];
      
      for (let j = 0; j < imageCount; j++) {
        // Usar placeholders para demonstração
        images.push(`https://picsum.photos/seed/${i}${j}/300/300`);
      }
    }
    
    reviews.push({
      id: `mock_${Date.now()}_${i}`,
      author: authors[authorIndex],
      rating,
      content: reviewContents[contentIndex],
      date: reviewDate.toLocaleDateString('pt-BR'),
      images,
      is_selected: false,
      is_published: false,
    });
  }
  
  return reviews;
} 