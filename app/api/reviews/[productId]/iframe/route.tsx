import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Garantir que a rota seja sempre dinu00e2mica
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Nu00e3o utilizar cache

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const { productId } = params;
    const searchParams = request.nextUrl.searchParams;
    const shopDomain = searchParams.get('shopDomain');
    const userId = searchParams.get('userId');
    
    // Apenas o productId é obrigatório
    if (!productId) {
      return NextResponse.json(
        { error: 'Parâmetro necessário: productId' },
        { status: 400 }
      );
    }
    
    // Valores padrão para parâmetros opcionais
    const safeShopDomain = shopDomain || 'default';
    const safeUserId = userId || 'anonymous';

    // Buscar a configuração do review
    // Usar configuração padrão
    const config = {
      css_selector: '',
      display_format: 'default'
    };

    // Buscar reviews da tabela published_reviews_json
    // Esta tabela contém os reviews já formatados em JSON
    const { data, error } = await (supabase as any)
      .from('published_reviews_json')
      .select('reviews_data, average_rating, reviews_count, product_name')
      .eq('product_id', productId)
      .maybeSingle();
    
    // Extrair reviews do objeto retornado
    const reviewsData = data?.reviews_data || { reviews: [] };
    console.log('Dados brutos recebidos:', JSON.stringify(reviewsData).substring(0, 200) + '...');
    
    // Se reviewsData for uma string JSON, precisamos fazer parse
    let reviews = [];
    try {
      if (typeof reviewsData === 'string') {
        const parsedData = JSON.parse(reviewsData);
        reviews = parsedData.reviews || [];
      } else if (reviewsData.reviews) {
        reviews = reviewsData.reviews;
      } else if (Array.isArray(reviewsData)) {
        reviews = reviewsData;
      }
    } catch (e) {
      console.error('Erro ao processar dados JSON:', e);
    }
    
    const averageRating = data?.average_rating || 5;
    const reviewCount = data?.reviews_count || reviews.length;
    const productName = data?.product_name || 'Produto';

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

    // Aplicar formatação com base no display_format configurado
    const stylesByFormat = {
      default: '',
      stars: `
        .review-product-info {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .product-tag {
          display: flex;
          align-items: center;
        }

        .product-thumbnail {
          width: 36px;
          height: 36px;
          object-fit: cover;
          border-radius: 4px;
          margin-right: 12px;
        }

        .product-details {
          display: flex;
          flex-direction: column;
        }

        .product-tag-name {
          font-weight: 500;
          font-size: 14px;
          margin: 0;
          color: #333;
        }

        .product-tag-offer {
          font-size: 12px;
          color: #4299e1;
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
    };

    // Processar os reviews para HTML
    let reviewsHtml = '';
    if (reviews && reviews.length > 0) {
      try {
        reviewsHtml = paginatedReviews.map((review: any, index: number) => {
          // Extrair iniciais do nome para avatar (se necessário)
          let initials = '';
          if (review.author) {
            const nameParts = review.author.split(' ');
            initials = nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : '');
            initials = initials.toUpperCase();
          }
          
          // Usar data fixa para corresponder à imagem
          const reviewDate = review.date ? new Date(review.date).toLocaleDateString('pt-BR') : '11/04/2025';

          // Opcionalmente mostrar imagens anexadas ao review
          // Sempre exibir imagem de exemplo
          const hasImages = true;
          const imageClass = '';

          // Calcular estrelas
          let stars = '';
          for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= review.rating ? 'filled' : 'empty'}">${i <= review.rating ? '★' : '☆'}</span>`;
          }

          // Conteúdo do review
          const contentPreview = review.content || 'Ótimo produto!';

          // Extrair URL da imagem do produto
          // Verificar nos logs a estrutura do produto e extrair a imagem
          const parsedReviewData = typeof reviewsData === 'string' ? JSON.parse(reviewsData) : reviewsData;
          const productImageFromData = parsedReviewData?.product?.image || '';
          
          // URLs para testes, com fallbacks em ordem de preferência
          const productImage = productImageFromData || 
                              "https://cdn.shopify.com/s/files/1/0704/6378/2947/files/bodys.jpg" || 
                              "https://cdn.shopify.com/s/files/1/0704/6378/2947/files/produto-body.jpg" ||
                              "https://midastime.com.br/cdn/shop/files/2_bodys_shaper-compre_1_leve_2.jpg" ||
                              "https://via.placeholder.com/80x80.png?text=Produto";

          return `
            <div class="review-card ${review.highlight ? 'highlighted' : ''}">
              <div class="review-header">
                <div class="reviewer-info">
                  <div class="reviewer-date">${reviewDate}</div>
                  <div class="reviewer-name">${review.author || 'Cliente'}</div>
                </div>
                <div class="review-stars">${stars}</div>
              </div>
              
              <div class="review-content">
                <p>${contentPreview}</p>
              </div>
              
              ${hasImages ? `
                <div class="review-image-container ${imageClass}">
                  <img 
                    src="${productImage}" 
                    alt="Produto" 
                    onerror="this.onerror=null; this.src='https://midastime.com.br/cdn/shop/files/2_bodys_shaper-compre_1_leve_2.jpg'; if(!this.src.includes('placeholder')) this.onerror=function(){this.src='https://via.placeholder.com/80x80.png?text=Produto';}" 
                  />
                </div>
              ` : `
                <div class="review-image-container">
                  <img src="https://via.placeholder.com/800x450" alt="Foto do review" class="review-main-image" />
                </div>
              `}
            </div>
          `;
        }).join('');
      } catch (e) {
        console.error('Erro ao processar reviews para HTML:', e);
        reviewsHtml = `
          <div class="review-card">
            <div class="review-content">
              <p>Erro ao processar avaliações: ${e instanceof Error ? e.message : 'Erro desconhecido'}</p>
              <p class="text-xs text-gray-500 mt-1">Detalhes: Encontradas ${reviews.length} avaliações, mas houve um erro ao processá-las.</p>
            </div>
          </div>
        `;
      }
    }

    // Gerar HTML com os reviews
    const paginationHtml = totalPages > 1 ? `
      <div class="pagination">
        ${hasPrevPage ? `<a href="?shopDomain=${encodeURIComponent(safeShopDomain)}&userId=${encodeURIComponent(safeUserId)}&page=${page - 1}&perPage=${perPage}" class="page-btn prev">Anterior</a>` : ''}
        ${hasNextPage ? `<a href="?shopDomain=${encodeURIComponent(safeShopDomain)}&userId=${encodeURIComponent(safeUserId)}&page=${page + 1}&perPage=${perPage}" class="page-btn next">Próximo</a>` : ''}
      </div>
    ` : '';

    // Calcular estrelas para rating médio
    let avgStars = '';
    const avgRatingRounded = Math.round(averageRating);
    for (let i = 1; i <= 5; i++) {
      avgStars += `<span class="star ${i <= avgRatingRounded ? 'filled' : 'empty'}">${i <= avgRatingRounded ? '★' : '☆'}</span>`;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Avaliações de Clientes</title>
        <script>
          // Script para verificar altura necessária e comunicar com a página pai se necessário
          document.addEventListener('DOMContentLoaded', function() {
            // Se a altura do conteúdo for maior que o iframe, podemos notificar a página pai
            // Se prefere uma altura fixa de 1300px, este script é opcional
            const contentHeight = document.body.scrollHeight;
            // Apenas para debug
            console.log("Altura do conteúdo: " + contentHeight + "px");
          });
        </script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          html, body {
            width: 100%;
            height: 100%;
            overflow-x: hidden;
          }

          body {
            font-family: 'Montserrat', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #fff;
            color: #333;
            font-size: 14px;
            line-height: 1.4;
          }

          .reviews-container {
            width: 100%;
            padding: 0 20px;
            max-width: 1300px;
            margin: 0 auto;
          }

          .reviews-header {
            padding: 30px 0;
            position: relative;
            border-bottom: 1px solid #eaeaea;
            margin-bottom: 25px;
          }

          .reviews-title {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #000;
            margin-bottom: 40px;
            text-align: center;
            letter-spacing: -0.5px;
          }

          .menu-icon {
            position: absolute;
            top: 32px;
            right: 0;
            width: 24px;
            height: 24px;
            cursor: pointer;
            color: #333;
          }

          .summary-container {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            gap: 60px;
          }

          .average-rating-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .big-rating {
            font-family: 'Playfair Display', serif;
            font-size: 80px;
            font-weight: 700;
            color: #212121;
            line-height: 0.9;
            margin-bottom: 10px;
          }

          .rating-stars {
            display: flex;
            margin-bottom: 12px;
          }

          .rating-star {
            color: #FFB800;
            font-size: 24px;
            margin-right: 2px;
          }

          .total-reviews {
            text-align: center;
            font-size: 15px;
            color: #555;
            font-weight: 500;
          }

          .rating-distribution {
            width: 350px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding-top: 10px;
          }

          .rating-bar-row {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
          }

          .rating-label {
            width: 10px;
            text-align: center;
            color: #555;
            font-weight: 600;
          }

          .rating-bar-container {
            flex-grow: 1;
            height: 8px;
            background-color: #f0f0f0;
            border-radius: 4px;
            overflow: hidden;
          }

          .rating-bar-fill {
            height: 100%;
            background-color: #FFB800;
            border-radius: 4px;
          }

          .rating-count {
            width: 20px;
            text-align: right;
            color: #555;
            font-weight: 500;
          }

          .review-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 25px;
            margin-bottom: 40px;
            width: 100%;
          }

          .review-card {
            border: 1px solid #f0f0f0;
            border-radius: 12px;
            padding: 24px;
            background: #fff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
            transition: all 0.25s ease;
            min-height: 240px;
            display: flex;
            flex-direction: column;
          }

          .review-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.08);
          }

          .reviewer-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 14px;
          }

          .reviewer-info {
            display: flex;
            flex-direction: column;
          }

          .reviewer-name {
            font-weight: 600;
            font-size: 16px;
            color: #222;
            margin-bottom: 3px;
          }

          .reviewer-date {
            font-size: 12px;
            color: #777;
          }

          .review-stars {
            display: flex;
          }

          .star {
            font-size: 16px;
            color: #FFB800;
            margin-right: 1px;
          }

          .star.empty {
            color: #e0e0e0;
          }

          .review-content {
            line-height: 1.6;
            margin-bottom: 18px;
            padding-bottom: 12px;
            border-bottom: 1px solid #f0f0f0;
            flex-grow: 1;
          }

          .review-content p {
            margin: 0;
            color: #333;
            font-size: 14px;
            font-weight: 400;
          }

          .review-product {
            display: flex;
            align-items: center;
            padding: 10px;
            background-color: #fafafa;
            border-radius: 8px;
          }

          .review-product img {
            width: 42px;
            height: 42px;
            object-fit: cover;
            margin-right: 12px;
            border-radius: 6px;
            border: 1px solid #eee;
          }

          .review-product-name {
            font-size: 13px;
            font-weight: 600;
            color: #333;
            line-height: 1.4;
          }

          .pagination {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 10px;
            margin-bottom: 40px;
          }

          .page-btn {
            padding: 10px 25px;
            background-color: #222;
            color: white;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 13px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
            border: none;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          
          .page-btn:hover {
            background-color: #000;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          }

          /* Responsividade para dispositivos móveis */
          @media (max-width: 768px) {
            .reviews-container {
              padding: 0 15px;
            }
            
            .summary-container {
              flex-direction: column;
              align-items: center;
              gap: 30px;
            }
            
            .rating-distribution {
              width: 100%;
            }
            
            .review-grid {
              grid-template-columns: 1fr;
            }

            .reviews-title {
              font-size: 28px;
              margin-bottom: 30px;
            }

            .big-rating {
              font-size: 64px;
            }
            
            .menu-icon {
              top: 30px;
              width: 20px;
              height: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="reviews-container">
          <div class="reviews-header">
            <h1 class="reviews-title">Depoimentos reais</h1>
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            
            <div class="summary-container">
              <div class="average-rating-container">
                <div class="big-rating">${averageRating.toFixed(1)}</div>
                <div class="rating-stars">
                  ${Array(5).fill(0).map(() => `<span class="rating-star">★</span>`).join('')}
                </div>
                <div class="total-reviews">${reviewCount} avaliações</div>
              </div>
              
              <div class="rating-distribution">
                <div class="rating-bar-row">
                  <span class="rating-label">5</span>
                  <div class="rating-bar-container">
                    <div class="rating-bar-fill" style="width: ${(reviews.filter((r: any) => r.rating === 5).length / Math.max(reviews.length, 1)) * 100}%"></div>
                  </div>
                  <span class="rating-count">${reviews.filter((r: any) => r.rating === 5).length}</span>
                </div>
                <div class="rating-bar-row">
                  <span class="rating-label">4</span>
                  <div class="rating-bar-container">
                    <div class="rating-bar-fill" style="width: ${(reviews.filter((r: any) => r.rating === 4).length / Math.max(reviews.length, 1)) * 100}%"></div>
                  </div>
                  <span class="rating-count">${reviews.filter((r: any) => r.rating === 4).length}</span>
                </div>
                <div class="rating-bar-row">
                  <span class="rating-label">3</span>
                  <div class="rating-bar-container">
                    <div class="rating-bar-fill" style="width: ${(reviews.filter((r: any) => r.rating === 3).length / Math.max(reviews.length, 1)) * 100}%"></div>
                  </div>
                  <span class="rating-count">${reviews.filter((r: any) => r.rating === 3).length}</span>
                </div>
                <div class="rating-bar-row">
                  <span class="rating-label">2</span>
                  <div class="rating-bar-container">
                    <div class="rating-bar-fill" style="width: ${(reviews.filter((r: any) => r.rating === 2).length / Math.max(reviews.length, 1)) * 100}%"></div>
                  </div>
                  <span class="rating-count">${reviews.filter((r: any) => r.rating === 2).length}</span>
                </div>
                <div class="rating-bar-row">
                  <span class="rating-label">1</span>
                  <div class="rating-bar-container">
                    <div class="rating-bar-fill" style="width: ${(reviews.filter((r: any) => r.rating === 1).length / Math.max(reviews.length, 1)) * 100}%"></div>
                  </div>
                  <span class="rating-count">${reviews.filter((r: any) => r.rating === 1).length}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="review-grid">
            ${paginatedReviews.map((review: any) => {
              // Calcular estrelas
              let stars = '';
              for (let i = 1; i <= 5; i++) {
                stars += `<span class="star ${i <= review.rating ? 'filled' : 'empty'}">${i <= review.rating ? '★' : '☆'}</span>`;
              }
              
              // Formatar data
              const reviewDate = review.date ? new Date(review.date).toLocaleDateString('pt-BR') : '10/04/2023';
              
              // Extrair URL da imagem do produto
              // Verificar nos logs a estrutura do produto e extrair a imagem
              const parsedReviewData = typeof reviewsData === 'string' ? JSON.parse(reviewsData) : reviewsData;
              const productImageFromData = parsedReviewData?.product?.image || '';
              
              // URLs para testes, com fallbacks em ordem de preferência
              const productImage = productImageFromData || 
                                  "https://cdn.shopify.com/s/files/1/0704/6378/2947/files/bodys.jpg" || 
                                  "https://cdn.shopify.com/s/files/1/0704/6378/2947/files/produto-body.jpg" ||
                                  "https://midastime.com.br/cdn/shop/files/2_bodys_shaper-compre_1_leve_2.jpg" ||
                                  "https://via.placeholder.com/80x80.png?text=Produto";
              
              return `
                <div class="review-card">
                  <div class="reviewer-header">
                    <div class="reviewer-info">
                      <div class="reviewer-name">${review.author || 'Cliente'}</div>
                      <div class="reviewer-date">${reviewDate}</div>
                    </div>
                    <div class="review-stars">${stars}</div>
                  </div>
                  
                  <div class="review-content">
                    <p>${review.content || 'Ótimo produto!'}</p>
                  </div>
                  
                  <div class="review-product">
                    <img 
                      src="${productImage}" 
                      alt="Produto" 
                      onerror="this.onerror=null; this.src='https://midastime.com.br/cdn/shop/files/2_bodys_shaper-compre_1_leve_2.jpg'; if(!this.src.includes('placeholder')) this.onerror=function(){this.src='https://via.placeholder.com/80x80.png?text=Produto';}" 
                    />
                    <div class="review-product-name">2 Bodys Shaper Canelado - Compre 1 Leve 2</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          ${paginationHtml}
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
