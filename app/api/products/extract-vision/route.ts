import { NextRequest, NextResponse } from 'next/server';
import { extractMarkdownFromUrl, extractDirectlyFromPage } from '@/lib/linkfy-service';
import { extractProductDataWithOpenAI } from '@/lib/openai-extractor';
import { preserveImagesInDescription } from '@/lib/markdown-utils';
import { ProductExtractorService } from '@/src/services/product-extractor.service';
import { ConfigService } from '@/src/services/config.service';

/**
 * Função para logar de forma padronizada
 */
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [VISION API] [${level.toUpperCase()}]`;
  
  if (data) {
    console[level](`${prefix} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console[level](`${prefix} ${message}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  log('info', '🚀 Iniciando extração com visão computacional');
  
  try {
    const body = await request.json();
    const { url, screenshot } = body;
    
    if (!url) {
      log('error', '❌ URL não fornecida');
      return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
    }
    
    if (!screenshot) {
      log('error', '❌ Screenshot não fornecido');
      return NextResponse.json({ error: 'Screenshot não fornecido' }, { status: 400 });
    }
    
    log('info', `🔗 Extraindo produto da URL: ${url}`);
    log('info', `📊 Tamanho do screenshot: ${Math.round(screenshot.length / 1024)} KB`);
    
    // Verificar se o sistema dual está ativado
    const useNewExtractor = ConfigService.useNewExtractor();
    
    // ----- FASE 1: EXTRAÇÃO DO MARKDOWN -----
    const markdown_start = Date.now();
    
    let markdown = '';
    let directImages: string[] = [];
    
    // Decidir qual extrator usar com base na configuração do sistema
    if (useNewExtractor) {
      log('info', '📝 Fase 1: Extraindo dados usando o FireCrawl (novo extrator)');
      
      try {
        // Usar o serviço de extração dual com FireCrawl
        const productData = await ProductExtractorService.extractProductData(url);
        
        // Formatar o resultado do FireCrawl para o formato esperado pelo processamento OpenAI
        markdown = productData.description;
        directImages = productData.allImages || [productData.imageUrl].filter(Boolean);
        
        // Adicionar informações de preço explicitamente no markdown para detecção
        markdown += `\n\nPreço: R$ ${productData.price}\n`;
        if (productData.originalPrice) {
          markdown += `Preço Original: R$ ${productData.originalPrice}\n`;
        }
        if (productData.discountPercentage) {
          markdown += `Desconto: ${productData.discountPercentage}%\n`;
        }
        
        log('info', `✅ Extração FireCrawl bem-sucedida em ${Date.now() - markdown_start}ms`, {
          tamanhoMarkdown: `${Math.round((markdown.length || 0) / 1024)} KB`,
          imagensEncontradas: directImages.length || 0
        });
      } catch (error) {
        log('error', `❌ Erro na extração com FireCrawl: ${error instanceof Error ? error.message : String(error)}`);
        log('info', '🔄 Voltando para extração com Linkfy como fallback');
        
        // Se o FireCrawl falhar, usar o Linkfy como fallback
        const linkfyResult = await extractMarkdownFromUrl(url);
        
        if (!linkfyResult.success) {
          markdown = '';
          directImages = [];
        } else {
          markdown = linkfyResult.data?.markdown || '';
          directImages = linkfyResult.data?.images || [];
        }
      }
    } else {
      // Usar o extrator original (Linkfy)
      log('info', '📝 Fase 1: Extraindo markdown com a API Linkfy (extrator original)');
      const linkfyResult = await extractMarkdownFromUrl(url);
      
      if (!linkfyResult.success) {
        log('warn', `⚠️ API Linkfy falhou: ${linkfyResult.error}`);
        log('info', '🔄 Tentando extração direta como fallback');
        
        const directExtractStart = Date.now();
        const directResult = await extractDirectlyFromPage(url);
        
        if (!directResult.success) {
          log('error', `❌ Extração direta falhou: ${directResult.error}`);
          return NextResponse.json({ error: 'Falha ao extrair informações da página' }, { status: 500 });
        }
        
        markdown = directResult.data?.markdown || '';
        directImages = directResult.data?.images || [];
        log('info', `✅ Extração direta bem-sucedida em ${Date.now() - directExtractStart}ms`, {
          tamanhoMarkdown: `${Math.round(markdown.length / 1024)} KB`
        });
      } else {
        markdown = linkfyResult.data?.markdown || '';
        directImages = linkfyResult.data?.images || [];
        log('info', `✅ Extração Linkfy bem-sucedida em ${Date.now() - markdown_start}ms`, {
          tamanhoMarkdown: `${Math.round(markdown.length / 1024)} KB`
        });
      }
    }
    
    // ----- FASE 2: EXTRAÇÃO COM OPENAI VISION -----
    const openai_start = Date.now();
    log('info', '🧠 Fase 2: Extraindo dados com OpenAI Vision');
    log('info', `📊 Enviando para OpenAI: ${Math.round(markdown.length / 1024)} KB de markdown + ${Math.round(screenshot.length / 1024)} KB de imagem`);
    
    const openaiResult = await extractProductDataWithOpenAI(url, markdown, screenshot);
    
    if (!openaiResult.success) {
      log('error', `❌ Erro na extração com OpenAI: ${openaiResult.error}`);
      log('info', '🔄 Tentando fallback para dados básicos extraídos');
      
      return NextResponse.json(
        { 
          url,
          error: openaiResult.error,
          _source: 'fallback',
          _processingTime: Date.now() - startTime
        }, 
        { status: 200 }
      );
    }
    
    log('info', `✅ Extração OpenAI Vision bem-sucedida em ${Date.now() - openai_start}ms`, {
      titulo: openaiResult.data?.title,
      preco: openaiResult.data?.price,
      imagensPrincipais: openaiResult.data?.mainImages?.length || 0,
      imagensDescricao: openaiResult.data?.descriptionImages?.length || 0
    });
    
    // Se temos imagens diretas do extrator, considerá-las para a resposta final
    if (directImages.length > 0) {
      log('info', `📊 Integrando ${directImages.length} imagens encontradas pelo extrator direto`);
      
      // Se o OpenAI não retornou imagens ou retornou menos que o extrator direto
      if (openaiResult.data && (!openaiResult.data.mainImages || openaiResult.data.mainImages.length < directImages.length)) {
        openaiResult.data.mainImages = directImages;
        openaiResult.data.images = directImages;
        log('info', `✅ Substituindo imagens da IA por ${directImages.length} imagens do extrator direto`);
      }
    }
    
    // ----- FASE 3: PROCESSAMENTO DE IMAGENS NA DESCRIÇÃO -----
    const desc_start = Date.now();
    log('info', '🖼️ Fase 3: Preservando imagens na descrição do produto');
    const description = openaiResult.data?.description || '';
    
    // Usar imagens específicas da descrição para garantir que apenas essas sejam incluídas
    const descriptionImages = openaiResult.data?.descriptionImages || [];
    log('info', `📊 Usando ${descriptionImages.length} imagens específicas para a descrição`);
    
    const enhancedDescription = preserveImagesInDescription(
      description, 
      markdown, 
      url,
      descriptionImages
    );
    
    log('info', `✅ Processamento de descrição concluído em ${Date.now() - desc_start}ms`, {
      tamanhoDescricao: `${Math.round(enhancedDescription.length / 1024)} KB`,
      contemHtml: enhancedDescription.includes('<')
    });
    
    // Construir objeto de produto final
    const productDetails = {
      ...openaiResult.data,
      description: enhancedDescription
    };
    
    // ----- ESTATÍSTICAS FINAIS -----
    const totalTime = Date.now() - startTime;
    log('info', `🏁 Extração concluída com sucesso em ${totalTime}ms`, {
      titulo: productDetails.title,
      preco: productDetails.price,
      imagensPrincipais: productDetails.mainImages?.length || 0,
      imagensDescricao: productDetails.descriptionImages?.length || 0,
      totalImagens: productDetails.images?.length || 0
    });
    
    // Exemplos de imagens para debug
    if (productDetails.mainImages && productDetails.mainImages.length > 0) {
      log('info', '📸 Exemplos de imagens principais:', {
        exemplos: productDetails.mainImages.slice(0, 3).map(url => url.substring(0, 60) + '...')
      });
    }
    
    if (productDetails.descriptionImages && productDetails.descriptionImages.length > 0) {
      log('info', '📸 Exemplos de imagens de descrição:', {
        exemplos: productDetails.descriptionImages.slice(0, 2).map(url => url.substring(0, 60) + '...')
      });
    }
    
    log('info', '=== 🎉 PROCESSAMENTO FINALIZADO COM SUCESSO ===');

    return NextResponse.json({
      ...productDetails,
      _source: useNewExtractor ? 'vision_firecrawl' : 'vision_linkfy',
      _processingTime: totalTime,
      _extractionStats: {
        mainImagesCount: productDetails.mainImages?.length || 0,
        descImagesCount: productDetails.descriptionImages?.length || 0,
        totalImagesCount: productDetails.images?.length || 0,
        mainImageSamples: (productDetails.mainImages || []).slice(0, 3),
        descImageSamples: (productDetails.descriptionImages || []).slice(0, 2),
        processingTimeMs: totalTime,
        extractor: useNewExtractor ? 'FireCrawl' : 'Linkfy'
      }
    });
  } catch (error: any) {
    log('error', `❌ Erro não tratado: ${error.message}`, {
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro interno do servidor',
        _processingTime: Date.now() - startTime
      }, 
      { status: 500 }
    );
  }
} 