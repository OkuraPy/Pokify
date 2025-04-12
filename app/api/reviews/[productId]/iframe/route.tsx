import { NextRequest, NextResponse } from 'next/server';
import { supabase, loadConfig } from '@/lib/supabase';

// Garantir que a rota seja sempre dinu00e2mica
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Nu00e3o utilizar cache

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { productId } = params;
    const searchParams = request.nextUrl.searchParams;
    const shopDomain = searchParams.get('shopDomain');
    const userId = searchParams.get('userId');
    
    // Apenas o productId u00e9 obrigatu00f3rio
    if (!productId) {
      return NextResponse.json(
        { error: 'Paru00e2metro necessário: productId' },
        { status: 400 }
      );
    }
    
    // Valores padrão para parâmetros opcionais
    const safeShopDomain = shopDomain || 'default';
    const safeUserId = userId || 'anonymous';

    // Buscar a configurau00e7u00e3o do review
    const config = await loadConfig(safeShopDomain, productId, safeUserId);

    // Buscar reviews da tabela published_reviews_json
    // Esta tabela contém os reviews já formatados em JSON
    const { data, error } = await supabase
      .from('published_reviews_json')
      .select('reviews_data, average_rating, reviews_count')
      .eq('product_id', productId)
      .maybeSingle();
    
    // Extrair reviews do objeto retornado
    const reviewsData = data?.reviews_data || { reviews: [] };
    const reviews = reviewsData.reviews || [];
    const averageRating = data?.average_rating || 5;
    const reviewCount = data?.reviews_count || reviews.length;

    console.log('Reviews encontradas:', reviews?.length || 0, 'para o produto:', productId);
    console.log('Média:', averageRating, 'Total:', reviewCount);

    // Cálculos para paginação
    const perPage = 4; // Número de reviews por página
    const page = parseInt(searchParams.get('page') || '1');
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedReviews = reviews?.slice(startIndex, endIndex) || [];
    const totalReviews = reviews?.length || 0;
    const totalPages = Math.ceil(totalReviews / perPage);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    if (error) {
      console.error('Erro na consulta de reviews:', error);
      // Não retornar erro 500, apenas usar dados vazios
    }

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

    // Processar os reviews para HTML
    let reviewsHtml = '';
    if (reviews && reviews.length > 0) {
      try {
        reviewsHtml = reviews.map((review: any) => {
          // Formatar data
          const reviewDate = new Date(review.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          // Mostrar estrelas
          const rating = review.rating || 0;
          let stars = '';
          for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? 'filled' : 'empty'}">${i <= rating ? 'u2605' : 'u2606'}</span>`;
          }
          
          // Iniciais do autor para avatar
          let initials = '??';
          if (review.author) {
            const nameParts = review.author.trim().split(' ');
            if (nameParts.length >= 2) {
              initials = `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;
            } else if (nameParts.length === 1 && nameParts[0].length > 0) {
              initials = nameParts[0][0];
            }
          }
          
          // Processar imagens, se houver
          let imagesHtml = '';
          if (review.images && review.images.length) {
            imagesHtml = `
              <div class="review-images">
                ${review.images.map((img: string) => `
                  <img src="${img}" alt="Imagem da avaliau00e7u00e3o" class="review-image">
                `).join('')}
              </div>
            `;
          }
          
          const highlightBadge = review.is_selected ? '<div class="highlight-badge">Em destaque</div>' : '';
          
          return `
            <div class="review-card">
              ${highlightBadge}
              <div class="review-header">
                <div class="avatar">${initials}</div>
                <div class="reviewer-info">
                  <p class="reviewer-name">
                    ${review.author}
                    <span class="verified-badge">Compra verificada</span>
                  </p>
                  <p class="review-date">${reviewDate}</p>
                </div>
              </div>
              
              <div class="review-stars">${stars}</div>
              
              <div class="review-content">
                <p>${review.content}</p>
              </div>
              
              ${imagesHtml}
            </div>
          `;
        }).join('');
      } catch (e) {
        console.error('Erro ao processar reviews para HTML:', e);
        reviewsHtml = `
          <div class="review-card">
            <div class="review-content">
              <p>Erro ao processar avaliau00e7u00f5es: ${e instanceof Error ? e.message : 'Erro desconhecido'}</p>
              <p class="text-xs text-gray-500 mt-1">Detalhes: Encontradas ${reviews.length} avaliau00e7u00f5es, mas houve um erro ao processu00e1-las.</p>
            </div>
          </div>
        `;
      }
    }

    // Gerar HTML com os reviews
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avaliau00e7u00f5es de Clientes</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          :root {
            --primary-color: #8B5CF6;
            --primary-light: #F3F0FF;
            --primary-dark: #6D28D9;
            --text-dark: #18181B;
            --text-medium: #52525B;
            --text-light: #A1A1AA;
            --success-color: #10B981;
            --highlight-color: #10B981;
            --star-color: #fbbf24;
            --border-color: #E4E4E7;
            --badge-bg: #F1FFFA;
            --highlight-badge-bg: #10B981;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: var(--text-dark);
            background-color: #ffffff;
            margin: 0;
            padding: 20px;
          }
          
          .reviews-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            width: 100%;
          }
          
          .review-card {
            border-radius: 8px;
            background-color: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 20px;
            position: relative;
            overflow: hidden;
          }
          
          .highlight-badge {
            position: absolute;
            top: 0;
            right: 0;
            background-color: var(--highlight-badge-bg);
            color: white;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 0 0 0 8px;
          }
          
          .review-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          }
          
          .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: var(--primary-light);
            color: var(--primary-dark);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 16px;
            margin-right: 12px;
          }
          
          .reviewer-info {
            flex: 1;
          }
          
          .reviewer-name {
            margin: 0;
            font-weight: 600;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .verified-badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 500;
            padding: 2px 6px;
            border-radius: 4px;
            background-color: var(--badge-bg);
            color: var(--success-color);
          }
          
          .review-date {
            margin: 0;
            font-size: 14px;
            color: var(--text-light);
          }
          
          .review-stars {
            margin-bottom: 12px;
            color: var(--star-color);
            font-size: 18px;
            letter-spacing: 2px;
          }
          
          .star {
            display: inline-block;
          }
          
          .star.filled {
            color: var(--star-color);
          }
          
          .star.empty {
            color: #E5E7EB;
          }
          
          .review-content {
            margin-bottom: 16px;
          }
          
          .review-content p {
            margin: 0;
            color: var(--text-dark);
          }
          
          .review-images {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 8px;
          }
          
          .review-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 4px;
            cursor: pointer;
          }
          
          @media (max-width: 768px) {
            .reviews-container {
              grid-template-columns: 1fr;
            }
            
            body {
              padding: 10px;
            }
          }

          /* CSS Personalizado do usuu00e1rio */
          ${config.css_selector || ''}

          /* Estilos especu00edficos por formato */
          ${stylesByFormat[config.display_format as keyof typeof stylesByFormat] || ''}
        </style>
      </head>
      <body>
        <div class="reviews-container">
          ${reviewsHtml}
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar HTML dos reviews:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar HTML dos reviews: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
