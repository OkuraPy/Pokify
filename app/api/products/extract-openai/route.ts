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
      preco: openaiResult.data?.price,
      imagensEncontradas: {
        principais: openaiResult.data?.mainImages?.length || 0,
        descricao: openaiResult.data?.descriptionImages?.length || 0,
        total: (openaiResult.data?.mainImages?.length || 0) + (openaiResult.data?.descriptionImages?.length || 0)
      }
    });
    
    // Combinar as imagens do extrator direto com as imagens da OpenAI
    // Priorizando as imagens diretas que foram mais abrangentes
    if (openaiResult.data) {
      const directImages = linkfyResult.data?.images || [];
      const openaiImages = [...(openaiResult.data.mainImages || []), ...(openaiResult.data.descriptionImages || [])];
      
      logger.info(`📊 Comparação de extratores de imagens:`, {
        extracaoDireta: directImages.length,
        extracaoOpenAI: openaiImages.length
      });
      
      // Decidir quais imagens usar com base na quantidade (usar o que encontrou mais)
      let imagensFinais = directImages;
      
      if (openaiImages.length > directImages.length) {
        logger.info(`ℹ️ OpenAI encontrou mais imagens (${openaiImages.length}) que o extrator direto (${directImages.length})`);
        imagensFinais = openaiImages;
      } else {
        logger.info(`ℹ️ Usando ${directImages.length} imagens da extração direta (OpenAI encontrou apenas ${openaiImages.length})`);
      }
      
      // Atualizar o resultado com as imagens escolhidas
      openaiResult.data.mainImages = imagensFinais;
      openaiResult.data.images = imagensFinais;
      
      logger.info(`✅ Total final de imagens: ${imagensFinais.length}`);

      // Verificar se o título, preço e descrição estão presentes na resposta do OpenAI
      // Se não estiverem, tentar extraí-los do Linkfy
      if (!openaiResult.data.title && linkfyResult.data?.title) {
        logger.info(`⚠️ OpenAI não retornou título, usando o do extrator direto`);
        openaiResult.data.title = linkfyResult.data.title;
      }

      // Tentar extrair preço do markdown (já que o LinkfyResult não tem campo de preço direto)
      if (!openaiResult.data.price) {
        logger.info(`⚠️ OpenAI não retornou preço, tentando extrair do markdown`);
        
        // Tentar extrair preço do markdown com regex
        const markdown = linkfyResult.data?.markdown || '';
        for (const pattern of pricePatterns) {
          const match = markdown.match(pattern);
          if (match && match[1]) {
            const extractedPrice = match[1].replace(/\./g, '').replace(',', '.');
            openaiResult.data.price = extractedPrice;
            logger.info(`💰 Preço extraído do markdown: ${extractedPrice}`);
            break;
          }
        }
      }

      if (!openaiResult.data.description && linkfyResult.data?.markdown) {
        logger.info(`⚠️ OpenAI não retornou descrição, usando o do extrator direto`);
        openaiResult.data.description = linkfyResult.data.markdown;
      }

      // Verificar se a descrição está em formato de texto simples (sem tags HTML)
      // e converter para HTML com formatação adequada
      if (openaiResult.data.description && 
          !openaiResult.data.description.includes('<') && 
          !openaiResult.data.description.includes('>')) {
        
        logger.info(`⚠️ Descrição retornada em formato de texto simples, convertendo para HTML`);
        
        // Converter quebras de linha em tags <p> e preservar emojis
        const textLines = openaiResult.data.description.split('\n').filter(line => line.trim() !== '');
        let htmlDescription = '';
        
        textLines.forEach(line => {
          // Verificar se é um tópico com emoji de check
          if (line.includes('✅')) {
            htmlDescription += `<p class="feature-item">${line}</p>`;
          } else {
            htmlDescription += `<p>${line}</p>`;
          }
        });
        
        // Atualizar a descrição com o HTML formatado
        openaiResult.data.description = htmlDescription;
        logger.info(`✅ Descrição convertida para HTML com ${textLines.length} parágrafos`);
      }

      // Processamento para incluir as imagens da descrição no HTML
      if (openaiResult.data.description && openaiResult.data.descriptionImages && openaiResult.data.descriptionImages.length > 0) {
        logger.info(`🖼️ Inserindo ${openaiResult.data.descriptionImages.length} imagens na descrição HTML`);
        
        try {
          // Usar a função de utilidade para preservar imagens na descrição
          const enhancedDescription = preserveImagesInDescription(
            openaiResult.data.description,
            linkfyResult.data.markdown || '',  // Passando o markdown original
            url,  // URL base para resolver caminhos relativos
            openaiResult.data.descriptionImages  // Imagens da descrição identificadas pela OpenAI
          );
          
          // Verificar se o processo de enriquecimento modificou a descrição
          const descriptionChanged = enhancedDescription !== openaiResult.data.description;
          logger.info(`✅ Descrição enriquecida com imagens: ${descriptionChanged ? 'Sim' : 'Não'}`);
          
          // Atualizar a descrição com as imagens inseridas
          openaiResult.data.description = enhancedDescription;
        } catch (error: any) {
          logger.error(`❌ Erro ao processar imagens da descrição: ${error.message}`);
          // Continuar mesmo com erro, usando a descrição original
        }
      } else {
        logger.info(`ℹ️ Sem imagens de descrição para processar (encontradas: ${openaiResult.data.descriptionImages?.length || 0})`);
        
        // Se não tiver imagens de descrição, vamos criar artificialmente
        if (openaiResult.data.mainImages && openaiResult.data.mainImages.length > 0) {
          // Usar algumas das imagens principais como imagens de descrição
          const imagesToUse = openaiResult.data.mainImages.slice(0, 3); // Usar até 3 imagens principais
          
          logger.info(`🎨 Criando descrição enriquecida com ${imagesToUse.length} imagens do produto`);
          
          // Verificar se a descrição já está em HTML, caso contrário converter
          if (!openaiResult.data.description.includes('<')) {
            // Converter texto plano para HTML primeiro
            const textLines = openaiResult.data.description.split('\n').filter(line => line.trim());
            let htmlDescription = '';
            
            textLines.forEach(line => {
              htmlDescription += `<p>${line}</p>`;
            });
            
            openaiResult.data.description = htmlDescription;
          }
          
          // Adicionar as imagens ao final da descrição
          let enhancedDescription = openaiResult.data.description;
          
          // Adicionar galeria ao final da descrição
          enhancedDescription += '<div class="product-gallery">';
          imagesToUse.forEach(imgUrl => {
            enhancedDescription += `<p><img src="${imgUrl}" alt="Imagem do produto" class="product-detail-image"></p>`;
          });
          enhancedDescription += '</div>';
          
          // Atualizar descrição e array de imagens de descrição
          openaiResult.data.description = enhancedDescription;
          openaiResult.data.descriptionImages = imagesToUse;
          
          logger.info(`✅ Descrição enriquecida artificialmente com ${imagesToUse.length} imagens`);
        }
      }

      // Logging detalhado dos dados finais extraídos
      logger.info('📄 Dados extraídos finais:', {
        temTitulo: Boolean(openaiResult.data.title),
        temPreco: Boolean(openaiResult.data.price),
        temDescricao: Boolean(openaiResult.data.description),
        totalImagens: imagensFinais.length
      });
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
        descriptionImagesCount: openaiResult.data?.descriptionImages?.length || 0,
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