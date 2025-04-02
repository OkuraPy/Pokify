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
          
          // Adicionar estilos inline para garantir a exibição correta
          $img.attr('style', 'max-width: 100%; height: auto; display: block; margin: 10px auto; border-radius: 8px;');
          
          // Adicionar atributos de carregamento e erro
          $img.attr('loading', 'lazy');
          $img.attr('onerror', "this.style.display='none'");
          
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
    
    // Não adicionar imagens da descrição automaticamente, apenas usar as especificadas
    // descriptionImages deve conter APENAS imagens encontradas na descrição original
    if (imageCount === 0 && descriptionImages && descriptionImages.length > 0) {
      // Adicionar um contêiner para as imagens especificadas
      const $gallery = $('<div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;"></div>');
      
      // Adicionar cada imagem ao contêiner
      descriptionImages.forEach(imgSrc => {
        if (imgSrc && !imgSrc.includes('placeholder')) {
          try {
            // Verificar se a URL é válida
            new URL(imgSrc);
            
            // Adicionar a imagem à descrição
            const $container = $('<div style="margin: 10px 0;"></div>');
            const $img = $('<img>')
              .attr('src', imgSrc)
              .attr('alt', 'Imagem do produto')
              .attr('style', 'max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px;')
              .attr('loading', 'lazy')
              .attr('onerror', "this.style.display='none'");
            
            $container.append($img);
            $gallery.append($container);
          } catch (e) {
            console.error('[markdown-utils] URL inválida:', imgSrc);
          }
        }
      });
      
      // Adicionar a galeria à descrição
      $('div').append($gallery);
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