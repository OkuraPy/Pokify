import { NextRequest, NextResponse } from 'next/server';
import { supabase, loadConfig } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { productId } = params;
    const searchParams = request.nextUrl.searchParams;
    const shopDomain = searchParams.get('shopDomain');
    const userId = searchParams.get('userId');
    
    if (!productId || !shopDomain || !userId) {
      return NextResponse.json(
        { error: 'Paru00e2metros necessu00e1rios: productId, shopDomain, userId' },
        { status: 400 }
      );
    }

    // Buscar a configurau00e7u00e3o do review
    const config = await loadConfig(shopDomain, productId, userId);

    // Aplicar formatau00e7u00e3o com base no display_format configurado
    const stylesByFormat = {
      default: '',
      stars: `
        .review-stars {
          font-size: 24px;
          margin-bottom: 15px;
        }
      `,
      compact: `
        .review-card {
          padding: 15px;
          font-size: 0.9em;
        }
        .review-content {
          max-height: 100px;
          overflow: hidden;
        }
        .review-images {
          flex-wrap: wrap;
        }
      `,
      detailed: `
        .review-card {
          padding: 25px;
        }
        .review-content {
          font-size: 16px;
        }
        .review-images {
          margin-bottom: 20px;
        }
        .review-image {
          width: 100px;
          height: 100px;
        }
      `,
      minimal: `
        .review-card {
          box-shadow: none;
          border: 1px solid var(--border-color);
        }
        .avatar {
          display: none;
        }
        .review-date {
          font-size: 12px;
        }
      `
    };

    // Gerar o código JavaScript para o iframe
    const cssSelector = config.css_selector || '';
    const formatStyle = stylesByFormat[config.display_format as keyof typeof stylesByFormat] || '';
    
    const jsCode = `
      (function() {
        // Função para carregar os reviews
        async function loadReviews() {
          try {
            // Buscar os reviews para este produto
            const response = await fetch('/api/reviews/${productId}/data?shopDomain=${encodeURIComponent(shopDomain)}&userId=${encodeURIComponent(userId)}');
            const reviews = await response.json();
            
            if (!reviews || reviews.error) {
              throw new Error(reviews.error || 'Erro ao carregar reviews');
            }
            
            renderReviews(reviews);
          } catch (error) {
            console.error('Erro ao carregar reviews:', error);
            renderError(error.message);
          }
        }
        
        // Função para renderizar os reviews na página
        function renderReviews(reviews) {
          const container = document.getElementById('reviews-container');
          
          if (!reviews || reviews.length === 0) {
            container.innerHTML = "\n              <div class=\"review-card\"\n                <div class=\"review-content\"\n                  <p>Não há avaliações para este produto ainda.</p>\n                </div>\n              </div>\n            ";
            return;
          }
          
          const reviewsHTML = reviews.map(review => {
            const initials = review.author ? review.author.split(' ').slice(0, 2).map(name => name[0]).join('') : '';
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const reviewDate = new Date(review.date || review.created_at).toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            return "\n              <div class=\"review-card\"\n                <div class=\"review-header\"\n                  <div class=\"avatar\">"+initials+"</div>\n                  <div class=\"reviewer-info\"\n                    <p class=\"reviewer-name\"\n                      "+review.author+"\n                      <span class=\"verified-badge\">Compra verificada</span>\n                    </p>\n                    <p class=\"review-date\">"+reviewDate+"</p>\n                  </div>\n                </div>\n                \n                "+(review.is_selected ? '<div class=\"highlight-badge\">Em destaque</div>' : '')+"\n                \n                <div class=\"review-stars\">"+stars+"</div>\n                \n                <div class=\"review-content\"\n                  <p>"+review.content+"</p>\n                </div>\n                \n                "+(review.images && review.images.length ? "\n                <div class=\"review-images\"\n                  "+review.images.map(img => "\n                    <img src=\""+img+"\" alt=\"Imagem da avaliação\" class=\"review-image\">\n                  ").join('')+"\n                </div>\n                " : '')+"\n              </div>\n            ";
          }).join('');
          
          container.innerHTML = reviewsHTML;
        }
        
        // Função para renderizar erro
        function renderError(message) {
          const container = document.getElementById('reviews-container');
          container.innerHTML = "\n            <div class=\"review-card\"\n              <div class=\"review-content\"\n                <p>Erro ao carregar avaliações: "+message+"</p>\n              </div>\n            </div>\n          ";
        }
        
        // Inserir o CSS base e o container no documento
        function setupLayout() {
          // Adicionar o estilo base
          const style = document.createElement('style');
          style.textContent = "\n            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');\n            \n            :root {\n              --primary-color: #8B5CF6;\n              --primary-light: #F3F0FF;\n              --primary-dark: #6D28D9;\n              --text-dark: #18181B;\n              --text-medium: #52525B;\n              --text-light: #A1A1AA;\n              --success-color: #10B981;\n              --highlight-color: #10B981;\n              --star-color: #fbbf24;\n              --border-color: #E4E4E7;\n              --badge-bg: #F1FFFA;\n              --highlight-badge-bg: #10B981;\n            }\n            \n            body {\n              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n              line-height: 1.5;\n              color: var(--text-dark);\n              background-color: #ffffff;\n              margin: 0;\n              padding: 20px;\n            }\n            \n            #reviews-container {\n              max-width: 1200px;\n              margin: 0 auto;\n              display: grid;\n              grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));\n              gap: 20px;\n            }\n            \n            .review-card {\n              background: white;\n              border-radius: 10px;\n              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);\n              padding: 20px;\n              position: relative;\n              border: 1px solid var(--border-color);\n              overflow: hidden;\n            }\n            \n            .review-header {\n              display: flex;\n              align-items: center;\n              margin-bottom: 12px;\n            }\n            \n            .avatar {\n              width: 40px;\n              height: 40px;\n              border-radius: 50%;\n              background-color: var(--primary-light);\n              color: var(--primary-color);\n              font-weight: 600;\n              display: flex;\n              align-items: center;\n              justify-content: center;\n              margin-right: 12px;\n              font-size: 14px;\n            }\n            \n            .reviewer-info {\n              flex: 1;\n            }\n            \n            .reviewer-name {\n              font-weight: 600;\n              color: var(--text-dark);\n              margin: 0;\n              font-size: 16px;\n              display: flex;\n              align-items: center;\n              gap: 8px;\n            }\n            \n            .verified-badge {\n              display: inline-flex;\n              align-items: center;\n              background-color: var(--badge-bg);\n              color: var(--success-color);\n              font-size: 12px;\n              padding: 2px 8px;\n              border-radius: 4px;\n              font-weight: 500;\n            }\n            \n            .highlight-badge {\n              display: inline-flex;\n              align-items: center;\n              background-color: var(--highlight-badge-bg);\n              color: white;\n              font-size: 12px;\n              padding: 3px 10px;\n              border-radius: 4px;\n              font-weight: 500;\n              position: absolute;\n              top: 20px;\n              right: 20px;\n            }\n            \n            .review-date {\n              color: var(--text-light);\n              font-size: 14px;\n              margin: 0;\n            }\n            \n            .review-stars {\n              color: var(--star-color);\n              font-size: 16px;\n              margin-bottom: 10px;\n            }\n            \n            .review-content {\n              color: var(--text-medium);\n              margin-bottom: 15px;\n              font-size: 14px;\n              line-height: 1.6;\n            }\n            \n            .review-images {\n              display: flex;\n              gap: 8px;\n              margin-bottom: 15px;\n            }\n            \n            .review-image {\n              width: 60px;\n              height: 60px;\n              border-radius: 6px;\n              object-fit: cover;\n            }\n            \n            .product-info {\n              display: flex;\n              align-items: center;\n              color: var(--primary-color);\n              font-size: 14px;\n              font-weight: 500;\n            }\n            \n            .product-icon {\n              margin-right: 8px;\n              width: 16px;\n              height: 16px;\n            }\n            \n            .product-count {\n              margin-left: auto;\n              background-color: var(--primary-color);\n              color: white;\n              padding: 2px 8px;\n              border-radius: 4px;\n              font-size: 12px;\n              font-weight: 600;\n            }\n            \n            @media (max-width: 768px) {\n              #reviews-container {\n                grid-template-columns: 1fr;\n              }\n              \n              body {\n                padding: 10px;\n              }\n            }\n\n            /* CSS Personalizado */\n            ${cssSelector}\n\n            /* Estilos específicos por formato */\n            ${formatStyle}\n          ";
          document.head.appendChild(style);
          
          // Criar o container para os reviews
          const container = document.createElement('div');
          container.id = 'reviews-container';
          document.body.appendChild(container);
        }
        
        // Iniciar o carregamento dos reviews
        document.addEventListener('DOMContentLoaded', function() {
          setupLayout();
          loadReviews();
        });
      })();
    `;

    return new NextResponse(jsCode, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar script de reviews:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar script de reviews: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
