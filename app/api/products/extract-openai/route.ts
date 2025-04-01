import { NextRequest, NextResponse } from 'next/server';
import { extractMarkdownFromUrl, extractDirectlyFromPage } from '@/lib/linkfy-service';
import { extractProductDataWithOpenAI } from '@/lib/openai-extractor';
import { preserveImagesInDescription } from '@/lib/markdown-utils';
import { createLogger } from '@/lib/logger';
import { DirectExtractor, OpenAIExtractor } from '@/lib/extractor-service';

// Criar instância de logger dedicada para esta API
const logger = createLogger('OpenAI Extractor API');

// Padrões para encontrar preços no HTML
const pricePatterns = [
  /R\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/,
  /(\d+(?:\.\d{3})*(?:,\d{2})?)\s*reais/i,
  /preço:\s*R\$\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/i
];

// Configuração de CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Extrair dados do corpo da requisição
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }
    
    logger.info('🚀 Iniciando extração do produto');
    logger.info(`🔗 URL do produto: ${url}`);
    
    // ----- FASE 1: EXTRAÇÃO DO MARKDOWN -----
    const markdown_start = Date.now();
    logger.info('📝 Fase 1: Extraindo markdown com a API Linkfy');
    
    let linkfyResult = await extractMarkdownFromUrl(url);
    
    // Se a Linkfy falhar, tentar extração direta
    if (!linkfyResult.success) {
      logger.warn(`⚠️ API Linkfy falhou: ${linkfyResult.error}`);
      logger.info('🔄 Tentando extração direta como fallback');
      
      const directExtractStart = Date.now();
      linkfyResult = await extractDirectlyFromPage(url);
      
      if (!linkfyResult.success) {
        logger.error(`❌ Extração direta também falhou: ${linkfyResult.error}`);
        return NextResponse.json({ error: 'Falha ao extrair conteúdo da página' }, { status: 500 });
      }
      
      logger.info(`✅ Extração direta bem-sucedida em ${Date.now() - directExtractStart}ms`, {
        tamanhoMarkdown: `${Math.round((linkfyResult.data?.markdown?.length || 0) / 1024)} KB`,
        imagensEncontradas: linkfyResult.data?.images?.length || 0
      });
    } else {
      logger.info(`✅ Extração Linkfy bem-sucedida em ${Date.now() - markdown_start}ms`, {
        tamanhoMarkdown: `${Math.round((linkfyResult.data?.markdown?.length || 0) / 1024)} KB`,
        imagensEncontradas: linkfyResult.data?.images?.length || 0
      });
    }
    
    // ----- FASE 2: EXTRAÇÃO COM OPENAI -----
    const openai_start = Date.now();
    logger.info('🧠 Fase 2: Extraindo dados estruturados com OpenAI');
    
    if (!linkfyResult.data?.markdown) {
      logger.error('❌ Markdown não disponível para processamento');
      return NextResponse.json({ error: 'Falha ao extrair markdown da página' }, { status: 500 });
    }
    
    logger.info(`📊 Enviando para OpenAI: ${Math.round(linkfyResult.data.markdown.length / 1024)} KB de markdown`);
    
    // Extrair dados usando OpenAI
    const openaiResult = await extractProductDataWithOpenAI(url, linkfyResult.data.markdown);
    
    if (!openaiResult.success) {
      console.error('[OpenAI Extractor API] ❌ Falha na extração OpenAI:', openaiResult.error);
      return NextResponse.json({ error: 'Falha ao extrair dados do produto' }, { status: 500 });
    }
    
    logger.info(`✅ Extração OpenAI bem-sucedida em ${Date.now() - openai_start}ms`, {
      titulo: openaiResult.data?.title,
      preco: openaiResult.data?.price
    });
    
    // Usar as imagens do extrator direto em vez das imagens da OpenAI
    if (openaiResult.data && linkfyResult.data?.images) {
      const images = linkfyResult.data.images || [];
      openaiResult.data.mainImages = images;
      openaiResult.data.images = images;
      openaiResult.data.descriptionImages = [];
      
      console.log('[OpenAI Extractor API] ℹ️ ✅ Usando', images.length, 'imagens da extração direta');
    }

    // Construir objeto de produto final
    const productDetails = {
      ...openaiResult.data,
      description: openaiResult.data?.description || '',
      mainImages: openaiResult.data?.mainImages || [],
      images: openaiResult.data?.images || [],
      _source: 'openai',
      _processingTime: Date.now() - startTime,
      _extractionStats: {
        mainImagesCount: openaiResult.data?.mainImages?.length || 0,
        totalImagesCount: openaiResult.data?.images?.length || 0,
        processingTimeMs: Date.now() - startTime
      }
    };
    
    // Calcular tempo total de processamento
    const processingTime = Date.now() - startTime;
    
    console.log('[OpenAI Extractor API] ℹ️ 🎉 Extração finalizada com sucesso', {
      tempo: `${processingTime}ms`,
      imagens: {
        mainImagesCount: openaiResult.data?.mainImages?.length || 0,
        totalImagesCount: openaiResult.data?.images?.length || 0,
        processingTimeMs: processingTime
      }
    });
    
    return NextResponse.json(productDetails, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    logger.error(`❌ Erro não tratado: ${error.message}`, {
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro interno do servidor',
        _processingTime: totalTime 
      }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
} 