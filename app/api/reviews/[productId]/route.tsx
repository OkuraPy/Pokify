import { NextRequest, NextResponse } from 'next/server';
import supabase, { loadConfig } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { productId } = params;
    const searchParams = request.nextUrl.searchParams;
    const shopDomain = searchParams.get('shopDomain');
    const userId = searchParams.get('userId');
    
    if (!productId || !shopDomain || !userId) {
      return NextResponse.json(
        { error: 'Parâmetros necessários: productId, shopDomain, userId' },
        { status: 400 }
      );
    }

    // Buscar a configuração do review
    const config = await loadConfig(shopDomain, productId, userId);

    // Buscar os reviews para o produto
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar reviews: ' + error.message },
        { status: 500 }
      );
    }

    // Aplicar formatação com base no display_format configurado
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

    // Gerar HTML com os reviews
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avaliações de Clientes</title>
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
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
            gap: 20px;
          }
          
          .review-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            padding: 20px;
            position: relative;
            border: 1px solid var(--border-color);
            overflow: hidden;
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
            color: var(--primary-color);
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-size: 14px;
          }
          
          .reviewer-info {
            flex: 1;
          }
          
          .reviewer-name {
            font-weight: 600;
            color: var(--text-dark);
            margin: 0;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .verified-badge {
            display: inline-flex;
            align-items: center;
            background-color: var(--badge-bg);
            color: var(--success-color);
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 500;
          }
          
          .highlight-badge {
            display: inline-flex;
            align-items: center;
            background-color: var(--highlight-badge-bg);
            color: white;
            font-size: 12px;
            padding: 3px 10px;
            border-radius: 4px;
            font-weight: 500;
            position: absolute;
            top: 20px;
            right: 20px;
          }
          
          .review-date {
            color: var(--text-light);
            font-size: 14px;
            margin: 0;
          }
          
          .review-stars {
            color: var(--star-color);
            font-size: 16px;
            margin-bottom: 10px;
          }
          
          .review-content {
            color: var(--text-medium);
            margin-bottom: 15px;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .review-images {
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
          }
          
          .review-image {
            width: 60px;
            height: 60px;
            border-radius: 6px;
            object-fit: cover;
          }
          
          .product-info {
            display: flex;
            align-items: center;
            color: var(--primary-color);
            font-size: 14px;
            font-weight: 500;
          }
          
          .product-icon {
            margin-right: 8px;
            width: 16px;
            height: 16px;
          }
          
          .product-count {
            margin-left: auto;
            background-color: var(--primary-color);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
          }
          
          @media (max-width: 768px) {
            .reviews-container {
              grid-template-columns: 1fr;
            }
            
            body {
              padding: 10px;
            }
          }

          /* CSS Personalizado do usuário */
          ${config.css_selector || ''}

          /* Estilos específicos por formato */
          ${stylesByFormat[config.display_format as keyof typeof stylesByFormat] || ''}
        </style>
      </head>
      <body>
        <div class="reviews-container">
          ${reviews?.length ? reviews.map(review => {
            const initials = review.author.split(' ').slice(0, 2).map(name => name[0]).join('');
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const reviewDate = new Date(review.date || review.created_at).toLocaleDateString('pt-BR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            return `
              <div class="review-card">
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
                
                ${review.is_selected ? '<div class="highlight-badge">Em destaque</div>' : ''}
                
                <div class="review-stars">${stars}</div>
                
                <div class="review-content">
                  <p>${review.content}</p>
                </div>
                
                ${review.images && review.images.length ? `
                <div class="review-images">
                  ${review.images.map((img: string) => `
                    <img src="${img}" alt="Imagem da avaliação" class="review-image">
                  `).join('')}
                </div>
                ` : ''}
              </div>
            `;
          }).join('') : `
            <div class="review-card">
              <div class="review-content">
                <p>Não há avaliações para este produto ainda.</p>
              </div>
            </div>
          `}
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
