import cheerio from 'cheerio';

/**
 * Preserva tags de imagem na descrição, corrige URLs relativas, e melhora a estrutura HTML
 * @param description - Descrição do produto que pode conter HTML
 * @param markdown - Markdown original para extrair imagens, se necessário
 * @param baseUrl - URL base opcional para resolver URLs relativas
 * @param descriptionImages - Lista opcional de URLs de imagens que pertencem à descrição
 */
export function preserveImagesInDescription(
  description: string, 
  markdown: string, 
  baseUrl?: string,
  descriptionImages?: string[]
): string {
  if (!description) return '';
  
  try {
    // Verificar se já é HTML, caso contrário converter
    const isHtml = description.includes('<') && description.includes('>');
    const htmlContent = isHtml ? description : `<div>${description}</div>`;
    
    // Utiliza Cheerio para analisar o HTML
    const $ = cheerio.load(htmlContent);
    
    // Se temos uma URL base, vamos resolver as URLs relativas
    if (baseUrl) {
      try {
        const urlObj = new URL(baseUrl);
        const domain = urlObj.origin;
        const urlPath = urlObj.pathname;
        const basePath = urlPath.substring(0, urlPath.lastIndexOf('/'));
        
        // Certifica que todas as imagens têm atributos necessários
        $('img').each((_, img) => {
          const $img = $(img);
          
          // Obter o atributo src da imagem
          let src = $img.attr('src') || '';
          
          // Pular se a imagem não tiver src
          if (!src || src.trim() === '') {
            $img.remove();
            return;
          }
          
          // Converter URLs relativas para absolutas
          if (src.startsWith('//')) {
            src = `https:${src}`;
          } else if (src.startsWith('./')) {
            src = `${domain}${basePath}/${src.substring(2)}`;
          } else if (src.startsWith('/')) {
            src = `${domain}${src}`;
          } else if (!src.startsWith('http')) {
            src = `${domain}${basePath}/${src}`;
          }
          
          // Atualizar o atributo src
          $img.attr('src', src);
          
          // Remover atributos de largura e altura fixos para permitir responsividade
          $img.removeAttr('width');
          $img.removeAttr('height');
          $img.removeAttr('style');
          
          // Adicionar classe para estilização
          $img.addClass('desc-image');
          
          // Garantir que a tag <img> tenha atributo alt
          if (!$img.attr('alt')) {
            $img.attr('alt', 'Imagem do produto');
          }
        });
      } catch (e) {
        console.error('[markdown-utils] Erro ao analisar URL base:', e);
      }
    }
    
    // Se não há imagens no HTML e temos descriptionImages, adicionar essas imagens
    const imageCount = $('img').length;
    
    if (imageCount === 0) {
      if (descriptionImages && descriptionImages.length > 0) {
        // Se temos uma lista específica de imagens da descrição, usar apenas essas
        console.log(`[markdown-utils] Adicionando ${descriptionImages.length} imagens específicas da descrição`);
        
        descriptionImages.forEach(imgSrc => {
          if (imgSrc && !imgSrc.includes('placeholder')) {
            let src = imgSrc;
            
            // Resolver URLs relativas se temos um baseUrl
            if (baseUrl && (src.startsWith('//') || src.startsWith('/'))) {
              try {
                const urlObj = new URL(baseUrl);
                const domain = urlObj.origin;
                
                if (src.startsWith('//')) {
                  src = `https:${src}`;
                } else if (src.startsWith('/')) {
                  src = `${domain}${src}`;
                }
              } catch (e) {
                console.error('[markdown-utils] Erro ao resolver URL relativa:', e);
              }
            }
            
            // Adicionar a imagem à descrição
            $('div').append(`<img src="${src}" alt="Imagem do produto" class="desc-image extracted" />`);
          }
        });
      } else if (markdown) {
        // Se não temos imagens específicas, tentar extrair apenas do markdown,
        // mas com uma heurística para identificar imagens que parecem ser da descrição
        console.log('[markdown-utils] Tentando identificar imagens da descrição no markdown');
        
        // Extrair imagens do markdown com regex
        const imagePattern = /!\[.*?\]\((.*?)\)|<img.*?src=["'](.*?)["']/g;
        let match;
        const allImages = [];
        
        while ((match = imagePattern.exec(markdown)) !== null) {
          const imgSrc = match[1] || match[2];
          if (imgSrc && !imgSrc.includes('placeholder')) {
            allImages.push(imgSrc);
          }
        }
        
        // Heurística: se temos muitas imagens (mais de 10), as primeiras geralmente são do carrossel
        // e as do meio/final são da descrição
        let descImages = allImages;
        if (allImages.length > 10) {
          // Pegar imagens da metade para o final, assumindo que as primeiras são do carrossel
          const startIndex = Math.floor(allImages.length / 2);
          // Limitar a 5 imagens para não sobrecarregar a descrição
          descImages = allImages.slice(startIndex).slice(0, 5);
          console.log(`[markdown-utils] Usando heurística - de ${allImages.length} imagens, escolheu ${descImages.length} para a descrição`);
        } else {
          // Se temos poucas imagens, usar no máximo 1-2 para a descrição
          descImages = allImages.slice(0, Math.min(2, allImages.length));
          console.log(`[markdown-utils] Poucas imagens - usando apenas ${descImages.length} para a descrição`);
        }
        
        // Adicionar apenas as imagens identificadas como pertencentes à descrição
        descImages.forEach(imgSrc => {
          let src = imgSrc;
          
          // Resolver URLs relativas se temos um baseUrl
          if (baseUrl) {
            try {
              const urlObj = new URL(baseUrl);
              const domain = urlObj.origin;
              
              if (src.startsWith('//')) {
                src = `https:${src}`;
              } else if (src.startsWith('/')) {
                src = `${domain}${src}`;
              } else if (!src.startsWith('http')) {
                src = `${domain}/${src}`;
              }
            } catch (e) {
              console.error('[markdown-utils] Erro ao resolver URL relativa:', e);
            }
          }
          
          // Adicionar a imagem à descrição
          $('div').append(`<img src="${src}" alt="Imagem do produto" class="desc-image extracted" />`);
        });
      }
    }

    const processedHtml = $.html();
    
    // Debug: verificar se há tags de imagem no resultado
    const finalImageCount = (processedHtml.match(/<img/g) || []).length;
    console.log(`[markdown-utils] Processamento concluído. Encontradas ${finalImageCount} imagens na descrição final.`);
    
    return processedHtml;
  } catch (error) {
    console.error('[markdown-utils] Erro ao processar descrição:', error);
    return description; // Retorna a descrição original em caso de erro
  }
} 