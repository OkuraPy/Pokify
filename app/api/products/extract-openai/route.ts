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
    
    // Verificar se o modo pro_copy está ativado
    const mode = request.nextUrl.searchParams.get('mode');
    const isProCopyMode = mode === 'pro_copy';
    
    if (isProCopyMode) {
      logger.info('🚀 Iniciando extração Pro com Copy AIDA');
    } else {
      logger.info('🚀 Iniciando extração padrão do produto');
    }
    
    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }
    
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
    
    // Extrair dados usando OpenAI - com modo específico se for Pro Copy
    const openaiResult = await extractProductDataWithOpenAI(
      url, 
      linkfyResult.data.markdown, 
      undefined, // screenshot não usado
      isProCopyMode ? 'pro_copy' : undefined // passar o modo
    );
    
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
      if (openaiResult.data && 
          openaiResult.data.description && 
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
        logger.info(`🖼️ Tentando processar ${openaiResult.data.descriptionImages.length} possíveis imagens de descrição`);
        
        try {
          // Verificar e ajustar URLs das imagens da descrição com validação rigorosa
          const validatedImages = openaiResult.data.descriptionImages
            .map(imgUrl => {
              if (!imgUrl || typeof imgUrl !== 'string') return null;
              
              // Verificar se a URL tem extensão de imagem válida
              const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
              const invalidExtensions = ['.js', '.css', '.php', '.aspx', '.jsp'];
              
              // Padrões comuns em URLs de imagens
              const validImagePatterns = [
                'image', 'img', 'photo', 'picture', 'produto', 'product',
                '/uploads/', '/images/', '/produtos/', '/gallery/'
              ];
              
              // Verificar se é uma URL de arquivo JavaScript ou CSS (rejeitar)
              const hasInvalidExtension = invalidExtensions.some(ext => 
                imgUrl.toLowerCase().includes(ext)
              );
              
              // Verificar se a URL parece ser uma imagem (pela extensão ou por padrões comuns)
              const hasValidExtension = validExtensions.some(ext => 
                imgUrl.toLowerCase().endsWith(ext) || imgUrl.toLowerCase().includes(`${ext}?`)
              );
              
              const containsImagePattern = validImagePatterns.some(pattern => 
                imgUrl.toLowerCase().includes(pattern)
              );
              
              // Rejeitar URLs que não parecem imagens ou são arquivos inválidos
              if (hasInvalidExtension || (!hasValidExtension && !containsImagePattern)) {
                logger.warn(`⚠️ URL ignorada (não parece ser imagem): ${imgUrl}`);
                return null;
              }
              
              try {
                // Validar se a URL é absoluta e válida
                let fullUrl = imgUrl;
                if (!imgUrl.startsWith('http')) {
                  // Tentar consertar URLs relativas
                  if (imgUrl.startsWith('//')) {
                    fullUrl = `https:${imgUrl}`;
                  } else if (imgUrl.startsWith('/')) {
                    // Extrair o domínio da URL original do produto
                    try {
                      const urlObj = new URL(url);
                      fullUrl = `${urlObj.origin}${imgUrl}`;
                    } catch (e: any) {
                      logger.error(`❌ URL inválida: ${imgUrl}`);
                      return null; // Pular esta imagem
                    }
                  } else {
                    // URL relativa sem barra inicial
                    try {
                      const urlObj = new URL(url);
                      const basePathMatch = urlObj.pathname.match(/(.*\/)/);
                      const basePath = basePathMatch ? basePathMatch[1] : '/';
                      fullUrl = `${urlObj.origin}${basePath}${imgUrl}`;
                    } catch (e: any) {
                      logger.error(`❌ URL inválida: ${imgUrl}`);
                      return null; // Pular esta imagem
                    }
                  }
                }
                
                // Verificar se a URL é válida
                new URL(fullUrl);
                
                // Verificação adicional para evitar que scripts sejam tratados como imagens
                if (invalidExtensions.some(ext => fullUrl.toLowerCase().includes(ext))) {
                  logger.warn(`⚠️ URL de script/recurso rejeitada após correção: ${fullUrl}`);
                  return null;
                }
                
                // Verificação positiva - deve ter extensão válida ou padrão reconhecível de imagem
                const hasValidExt = validExtensions.some(ext => 
                  fullUrl.toLowerCase().endsWith(ext) || fullUrl.toLowerCase().includes(`${ext}?`)
                );
                
                const hasImagePattern = validImagePatterns.some(pattern => 
                  fullUrl.toLowerCase().includes(pattern)
                );
                
                if (!hasValidExt && !hasImagePattern) {
                  logger.warn(`⚠️ URL rejeitada (não identificada como imagem): ${fullUrl}`);
                  return null;
                }
                
                logger.info(`✅ Imagem considerada válida: ${fullUrl}`);
                return fullUrl;
              } catch (e: any) {
                logger.error(`❌ Erro ao processar URL da imagem: ${e.message}`);
                return null;
              }
            })
            .filter(Boolean) as string[];
          
          logger.info(`✅ Encontradas ${validatedImages.length} imagens válidas de ${openaiResult.data.descriptionImages.length} possíveis`);
          
          // Atualizar o array de imagens com URLs validadas
          openaiResult.data.descriptionImages = validatedImages;
          
          // Usar a função de utilidade para preservar imagens na descrição
          if (validatedImages.length > 0) {
            const enhancedDescription = preserveImagesInDescription(
              openaiResult.data.description,
              linkfyResult.data.markdown || '',  // Passando o markdown original
              url,  // URL base para resolver caminhos relativos
              validatedImages  // Imagens da descrição validadas
            );
            
            // Verificar se o processo de enriquecimento modificou a descrição
            const descriptionChanged = enhancedDescription !== openaiResult.data.description;
            logger.info(`✅ Descrição enriquecida com imagens: ${descriptionChanged ? 'Sim' : 'Não'}`);
            
            // Atualizar a descrição com as imagens inseridas
            openaiResult.data.description = enhancedDescription;
          } else {
            logger.warn('⚠️ Nenhuma imagem válida encontrada para enriquecer a descrição');
          }
        } catch (error: any) {
          logger.error(`❌ Erro ao processar imagens da descrição: ${error.message}`);
          // Continuar mesmo com erro, usando a descrição original
        }
      } else {
        logger.info(`ℹ️ Sem imagens de descrição para processar (encontradas: ${openaiResult.data.descriptionImages?.length || 0})`);
        
        // Se não tiver imagens de descrição, vamos criar artificialmente
        if (openaiResult.data.mainImages && openaiResult.data.mainImages.length > 0) {
          // Usar algumas das imagens principais como imagens de descrição
          // Selecionar no máximo 4 imagens, se houver muitas imagens
          let imagesToUse = [];
          if (openaiResult.data.mainImages.length > 6) {
            // Se há muitas imagens, selecionar algumas estrategicamente
            imagesToUse = [
              openaiResult.data.mainImages[0], // Primeira imagem (principal)
              openaiResult.data.mainImages[Math.floor(openaiResult.data.mainImages.length * 0.33)], // 1/3 do caminho
              openaiResult.data.mainImages[Math.floor(openaiResult.data.mainImages.length * 0.66)], // 2/3 do caminho
              openaiResult.data.mainImages[openaiResult.data.mainImages.length - 1] // Última imagem
            ];
          } else if (openaiResult.data.mainImages.length > 1) {
            // Selecionar primeira, meio e última se houver ao menos 3 imagens
            imagesToUse = [
              openaiResult.data.mainImages[0],
              ...(openaiResult.data.mainImages.length >= 3 ? 
                [openaiResult.data.mainImages[Math.floor(openaiResult.data.mainImages.length / 2)]] : []),
              openaiResult.data.mainImages[openaiResult.data.mainImages.length - 1]
            ];
          } else {
            // Usar a única imagem disponível
            imagesToUse = openaiResult.data.mainImages;
          }
          
          logger.info(`🎨 Criando descrição enriquecida com ${imagesToUse.length} imagens do produto (de ${openaiResult.data.mainImages.length} disponíveis)`);
          
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
          
          // Solução simplificada e mais robusta para adicionar imagens
          // Este é um método mais direto e menos propenso a erros
          const validImages: string[] = [];
          
          // Validar e processar cada URL de imagem
          for (const imgUrl of imagesToUse) {
            try {
              // Verificar se é uma URL válida (deve ser absoluta)
              if (!imgUrl || typeof imgUrl !== 'string') continue;
              
              // Verificar se é um script ou recurso indesejado
              const invalidExtensions = ['.js', '.css', '.php', '.aspx', '.jsp'];
              if (invalidExtensions.some(ext => imgUrl.toLowerCase().includes(ext))) {
                logger.warn(`⚠️ URL de script rejeitada: ${imgUrl}`);
                continue;
              }
              
              // Verificar se tem características de uma URL de imagem
              const validImageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
              const validImagePatterns = ['image', 'img', 'photo', 'product', 'produto'];
              
              const hasValidExtension = validImageExtensions.some(ext => 
                imgUrl.toLowerCase().endsWith(ext) || imgUrl.toLowerCase().includes(`${ext}?`)
              );
              
              const hasImagePattern = validImagePatterns.some(pattern => 
                imgUrl.toLowerCase().includes(pattern)
              );
              
              if (!hasValidExtension && !hasImagePattern) {
                logger.warn(`⚠️ URL sem padrão de imagem: ${imgUrl}`);
                continue;
              }
              
              // Garantir que a URL seja absoluta
              let validUrl = imgUrl;
              if (!imgUrl.startsWith('http')) {
                if (imgUrl.startsWith('//')) {
                  validUrl = `https:${imgUrl}`;
                } else {
                  // Pular URLs relativas - muito problemáticas
                  logger.warn(`⚠️ Pulando URL relativa: ${imgUrl}`);
                  continue;
                }
              }
              
              // Verificar se a URL é válida
              new URL(validUrl);
              
              // Adicionar à lista de imagens válidas
              validImages.push(validUrl);
              logger.info(`✅ Imagem válida para descrição: ${validUrl}`);
            } catch (e: any) {
              logger.error(`❌ URL de imagem inválida: ${imgUrl} - ${e.message}`);
            }
          }
          
          // Adicionar imagens diretamente na descrição
          if (validImages.length > 0) {
            // Construir HTML com imagens diretas - mais proeminente e visualmente atraente
            let imgHtml = `
              <div class="product-image-gallery">
                <h3>Galeria do Produto</h3>
                <div class="image-grid">
            `;
            
            for (const imgSrc of validImages) {
              imgHtml += `
                <div class="image-card">
                  <div class="image-container">
                    <img 
                      src="${imgSrc}" 
                      alt="Imagem do produto" 
                      loading="lazy"
                      onerror="this.parentNode.parentNode.style.display='none'" 
                    />
                  </div>
                </div>
              `;
            }
            
            imgHtml += `
                </div>
              </div>
            `;
            
            // Atualizar a descrição adicionando as imagens
            openaiResult.data.description = `${openaiResult.data.description}${imgHtml}`;
            
            // Definir também as imagens artificiais como description_images para exibição no componente separado
            openaiResult.data.descriptionImages = validImages;
            
            logger.info(`✅ Descrição enriquecida com ${validImages.length} imagens válidas (HTML direto)`);
          } else {
            logger.warn('⚠️ Nenhuma imagem válida foi encontrada para a descrição');
          }
        }
      }

      // Garantir que o preço sempre use ponto decimal (nunca vírgula)
      if (openaiResult.data && openaiResult.data.price) {
        // Converter sempre para string para manipulação
        const priceStr = openaiResult.data.price.toString();
        
        // Se contém vírgula, converter para ponto
        if (priceStr.includes(',')) {
          const originalPrice = priceStr;
          openaiResult.data.price = priceStr.replace(',', '.');
          logger.info(`💰 Convertido preço de ${originalPrice} para ${openaiResult.data.price}`);
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
      description_images: openaiResult.data?.descriptionImages || [],
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