// Supabase Edge Function para extrair dados de produtos
// Endpoint: /functions/v1/extract-product

import { serve } from 'http/server.ts';
import { DOMParser } from 'deno-dom';

interface RequestBody {
  url: string;
  platform: 'aliexpress' | 'shopify' | 'other';
}

interface ProductData {
  title: string;
  description: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  variants?: any[];
  reviews?: any[];
  stock?: number;
  category?: string;
  tags?: string[];
  average_rating?: number;
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
    const { url, platform } = body;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL é obrigatória' }),
        { headers, status: 400 }
      );
    }

    // Extrair dados com base na plataforma
    let productData: ProductData;

    switch (platform) {
      case 'aliexpress':
        productData = await extractFromAliExpress(url);
        break;
      case 'shopify':
        productData = await extractFromShopify(url);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Plataforma não suportada' }),
          { headers, status: 400 }
        );
    }

    return new Response(
      JSON.stringify(productData),
      { headers, status: 200 }
    );
  } catch (error) {
    console.error('Erro ao extrair produto:', error);
    return new Response(
      JSON.stringify({ error: `Erro na extração: ${error.message}` }),
      { headers, status: 500 }
    );
  }
});

/**
 * Extrai dados de um produto do AliExpress
 */
async function extractFromAliExpress(url: string): Promise<ProductData> {
  // Fazemos uma requisição para o site
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao acessar URL: ${response.status}`);
  }

  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Falha ao analisar o HTML da página');
  }

  // Extrair dados do produto do HTML
  // Nota: Os seletores reais podem variar com o tempo à medida que o AliExpress atualiza seu site
  
  // Buscar o script que contém os dados do produto (formato JSON)
  const scripts = doc.querySelectorAll('script');
  let productInfo = null;

  for (const script of Array.from(scripts)) {
    const content = script.textContent || '';
    if (content.includes('window.runParams = {')) {
      try {
        const jsonStr = content.split('window.runParams = ')[1].split('};')[0] + '}';
        productInfo = JSON.parse(jsonStr);
        break;
      } catch (e) {
        console.error('Erro ao extrair JSON do script:', e);
      }
    }
  }

  if (!productInfo) {
    // Tentativa alternativa - muitas vezes os dados estão em um objeto data
    for (const script of Array.from(scripts)) {
      const content = script.textContent || '';
      if (content.includes('data: {')) {
        try {
          const jsonStr = '{' + content.split('data: {')[1].split('},')[0] + '}';
          productInfo = JSON.parse(jsonStr);
          break;
        } catch (e) {
          console.error('Erro ao extrair JSON alternativo:', e);
        }
      }
    }
  }

  // Fallback para extração direta dos elementos HTML se o JSON não for encontrado
  if (!productInfo) {
    const title = doc.querySelector('.product-title')?.textContent?.trim() || 
                  doc.querySelector('h1')?.textContent?.trim() || 
                  'Produto sem título';
    
    const priceText = doc.querySelector('.product-price-value')?.textContent?.trim() ||
                      doc.querySelector('.uniform-banner-box-price')?.textContent?.trim() || 
                      '0.00';
    
    // Limpar o texto do preço e converter para número
    const price = parseFloat(priceText.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
    
    // Buscar imagens
    const imageElements = doc.querySelectorAll('.images-view-item img');
    const images = Array.from(imageElements).map(img => (img as HTMLImageElement).src || '').filter(Boolean);
    
    // Descrição
    const description = doc.querySelector('.product-description')?.innerHTML || 'Sem descrição disponível.';

    return {
      title,
      description,
      price,
      images: images.length > 0 ? images : ['https://via.placeholder.com/500x500.png?text=Imagem+não+disponível'],
      stock: 100, // Valor padrão
      average_rating: 4.0, // Valor padrão
    };
  }

  // Extrair dados do JSON encontrado
  // Nota: Estrutura pode variar, esta é uma aproximação
  try {
    const data = productInfo.data || productInfo;
    
    const title = data.title || data.subject || data.productTitle || 'Produto sem título';
    
    const priceInfo = data.priceModule || data.price || {};
    const price = parseFloat(priceInfo.formatedActivityPrice || priceInfo.formatedPrice || '0').replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
    
    const images = (data.imageModule?.imagePathList || 
                   data.images || 
                   []).map((img: string) => img.startsWith('//') ? `https:${img}` : img);
    
    const description = data.description || data.productDescription || 'Sem descrição disponível.';
    
    const stock = data.quantityModule?.totalAvailQuantity || 100;
    
    const rating = data.reviewModule?.averageStar || 4.0;

    return {
      title,
      description,
      price,
      images: images.length > 0 ? images : ['https://via.placeholder.com/500x500.png?text=Imagem+não+disponível'],
      stock,
      average_rating: rating,
    };
  } catch (error) {
    console.error('Erro ao extrair dados do JSON:', error);
    throw new Error('Falha ao extrair dados do produto');
  }
}

/**
 * Extrai dados de um produto do Shopify
 */
async function extractFromShopify(url: string): Promise<ProductData> {
  // Fazemos uma requisição para o site
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao acessar URL: ${response.status}`);
  }

  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (!doc) {
    throw new Error('Falha ao analisar o HTML da página');
  }

  // Buscar dados do JSON-LD (formato estruturado que a maioria das lojas Shopify usa)
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let productInfo = null;

  for (const script of Array.from(jsonLdScripts)) {
    try {
      const data = JSON.parse(script.textContent || '{}');
      if (data['@type'] === 'Product') {
        productInfo = data;
        break;
      }
    } catch (e) {
      console.error('Erro ao analisar JSON-LD:', e);
    }
  }

  // Se não encontramos dados estruturados, tentamos extrair diretamente do HTML
  if (!productInfo) {
    // Buscar script com dados do produto
    const scripts = doc.querySelectorAll('script');
    for (const script of Array.from(scripts)) {
      const content = script.textContent || '';
      if (content.includes('var meta =')) {
        try {
          const jsonStr = content.split('var meta =')[1].split('};')[0] + '}';
          const meta = JSON.parse(jsonStr);
          if (meta.product) {
            productInfo = meta.product;
            break;
          }
        } catch (e) {
          console.error('Erro ao extrair meta do script:', e);
        }
      }
    }
  }

  // Fallback para extração direta dos elementos HTML
  if (!productInfo) {
    const title = doc.querySelector('.product-title')?.textContent?.trim() ||
                  doc.querySelector('h1')?.textContent?.trim() ||
                  'Produto sem título';
    
    const priceText = doc.querySelector('.product__price')?.textContent?.trim() ||
                      doc.querySelector('.price')?.textContent?.trim() ||
                      '0.00';
    
    // Limpar o texto do preço e converter para número
    const price = parseFloat(priceText.replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
    
    // Buscar imagens
    const imageElements = doc.querySelectorAll('.product__image, .product-image');
    const images = Array.from(imageElements)
      .map(img => (img as HTMLImageElement).src || (img as Element).getAttribute('data-src') || '')
      .filter(Boolean);
    
    // Descrição
    const description = doc.querySelector('.product-description')?.innerHTML || 
                        doc.querySelector('.description')?.innerHTML || 
                        'Sem descrição disponível.';

    return {
      title,
      description,
      price,
      images: images.length > 0 ? images : ['https://via.placeholder.com/500x500.png?text=Imagem+não+disponível'],
      stock: 100, // Valor padrão
      average_rating: 4.5, // Valor padrão
    };
  }

  // Extrair dados do JSON encontrado
  try {
    let title, price, comparePrice, images, description, variants, stock;

    if (productInfo['@type'] === 'Product') {
      // Dados do JSON-LD
      title = productInfo.name || 'Produto sem título';
      description = productInfo.description || 'Sem descrição disponível.';
      
      const offer = productInfo.offers?.price ? productInfo.offers : 
                    Array.isArray(productInfo.offers) ? productInfo.offers[0] : null;
                    
      price = offer?.price || 0;
      comparePrice = null; // Não costuma estar disponível no JSON-LD
      
      images = Array.isArray(productInfo.image) ? 
               productInfo.image : 
               [productInfo.image].filter(Boolean);
      
      stock = offer?.availability === 'http://schema.org/InStock' ? 100 : 0;
      variants = null; // Geralmente não disponível no JSON-LD
    } else {
      // Dados do objeto meta.product
      title = productInfo.title || 'Produto sem título';
      description = productInfo.description || 'Sem descrição disponível.';
      
      const firstVariant = productInfo.variants?.[0] || {};
      price = parseFloat(firstVariant.price || 0) / 100; // Shopify armazena preços em centavos
      comparePrice = firstVariant.compare_at_price ? parseFloat(firstVariant.compare_at_price) / 100 : null;
      
      // Formatar URLs das imagens
      images = (productInfo.images || []).map((img: string) => {
        if (typeof img === 'object' && img.src) return img.src;
        return img;
      });
      
      stock = firstVariant.available ? firstVariant.inventory_quantity || 100 : 0;
      variants = productInfo.variants || [];
    }

    return {
      title,
      description,
      price,
      compare_at_price: comparePrice,
      images: images.length > 0 ? images : ['https://via.placeholder.com/500x500.png?text=Imagem+não+disponível'],
      stock,
      variants,
      average_rating: 4.5, // Valor padrão, raramente disponível nos dados
      tags: productInfo.tags || [],
    };
  } catch (error) {
    console.error('Erro ao extrair dados do produto Shopify:', error);
    throw new Error('Falha ao extrair dados do produto Shopify');
  }
} 