'use client';

import React, { useState, useEffect } from 'react';
import ReviewsDisplay from './components/reviews-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// ID do produto que vamos usar para buscar as avaliau00e7u00f5es
const productId = '2486825c-6e29-4793-9758-47d8b225ebe7';

// Componente de estrelas para reutilização
const Stars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex text-yellow-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="text-lg">
          {star <= rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
};

// Componente para as imagens das avaliações
const ReviewImages = ({ images }: { images: string[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="relative h-24 w-24 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setShowLightbox(true)}>
        <img
          src={images[activeIndex]}
          alt="Imagem da avaliação"
          className="object-cover h-full w-full"
        />
        {images.length > 1 && (
          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs rounded px-1 py-0.5">
            +{images.length - 1}
          </div>
        )}
      </div>

      {/* Modal de lightbox para exibição ampliada */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4" onClick={() => setShowLightbox(false)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition"
              onClick={() => setShowLightbox(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={images[activeIndex]}
              alt="Imagem ampliada"
              className="max-h-[80vh] mx-auto rounded-lg"
            />
            {images.length > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 ${activeIndex === idx ? 'border-white' : 'border-transparent'}`}
                    onClick={() => setActiveIndex(idx)}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Componente de header das avaliações
const ReviewsHeader = ({ rating, count }: { rating: number; count: number }) => {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-indigo-50 p-6 rounded-lg mb-8 shadow-sm">
      <h1 className="text-2xl font-bold text-center text-purple-800 mb-4">
        Depoimentos reais
      </h1>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center bg-white p-3 rounded-lg shadow-sm">
            <span className="text-3xl font-bold text-purple-800">{rating.toFixed(1)}</span>
            <Stars rating={rating} />
          </div>
          
          <div>
            <p className="font-medium text-gray-700">
              Baseado em <span className="font-bold text-purple-700">{new Intl.NumberFormat('pt-BR').format(count)}</span> avaliações
            </p>
            <p className="text-sm text-gray-500">97% dos clientes recomendam este produto</p>
          </div>
        </div>
        
        <div className="hidden md:block">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors shadow-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            Filtrar avaliações
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de avaliação individual
const ReviewCard = ({ review }: { review: any }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{review.author}</span>
            {review.verified && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Verificada
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">{review.date}</p>
          <div className="mt-1">
            <Stars rating={review.rating} />
          </div>
        </div>
        
        <ReviewImages images={review.images || []} />
      </div>
      
      <div className="mt-3">
        <p className="text-gray-700 leading-relaxed">{review.content}</p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center">
        <div className="h-10 w-10 bg-gray-100 rounded-md mr-3 flex items-center justify-center overflow-hidden">
          {review.productImage ? (
            <img 
              src={review.productImage} 
              alt={review.productName} 
              className="h-full w-full object-cover"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          )}
        </div>
        <p className="text-sm text-gray-600">{review.productName}</p>
      </div>
      
      <div className="mt-4 flex justify-between">
        <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905C11 5.06 10.06 6 9 6H7a2 2 0 00-2 2v8a2 2 0 002 2h2m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905C11 5.06 10.06 6 9 6H7a2 2 0 00-2 2v8a2 2 0 002 2h2" />
          </svg>
          Útil (3)
        </button>
        <button className="text-sm text-gray-500 hover:text-gray-700">
          Reportar
        </button>
      </div>
    </div>
  );
};

export default function ReviewsTestePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<any>(null);
  // Cores fixas para o iframe
  const primaryColor = '#7e3af2'; // Cor roxa padru00e3o
  const accentColor = '#c4b5fd'; // Lilu00e1s padru00e3o
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [sortBy, setSortBy] = useState('recent'); // Estado para controlar a ordenação

  // Buscar os dados do produto e avaliau00e7u00f5es
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reviews-json/${productId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dados de reviews recebidos:', data);
        setProductData({
          product: {
            title: data.product_name || 'Produto',
            image: data.product_image || '',
            averageRating: data.average_rating || 0,
            reviewsCount: data.review_count || 0
          },
          reviews: data.reviews || []
        });
        setError(null);
      } catch (err: any) {
        console.error('Erro ao buscar dados:', err);
        setError(err.message || 'Ocorreu um erro ao buscar os dados');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, []);

  // Formatar avaliações para o formato esperado pelo componente
  const formatReviews = (reviewsData: any[]) => {
    if (!reviewsData || !Array.isArray(reviewsData)) {
      console.warn('reviewsData não é um array ou está vazio:', reviewsData);
      return [];
    }
    
    console.log('Formatando reviews, total recebido:', reviewsData.length);
    
    const formattedReviews = reviewsData.map(review => {
      if (!review) {
        console.warn('Review vazio ou nulo encontrado');
        return null;
      }
      
      const reviewData = {
        id: review.id,
        author: review.author || 'Anônimo',
        date: review.date || review.created_at ? new Date(review.date || review.created_at).toLocaleDateString('pt-BR') : 'Data desconhecida',
        rating: review.rating || 5,
        content: review.content || 'Sem conteúdo',
        images: review.images || [],
        productName: productData?.product?.title || 'Produto',
        productImage: productData?.product?.image || '',
        verified: Boolean(review.is_published)
      };
      
      console.log('Review formatado com imagem:', reviewData.productName, reviewData.productImage);
      return reviewData;
    }).filter(Boolean);
    
    console.log('Total de reviews formatados:', formattedReviews.length);
    return formattedReviews;
  };
  
  // Filtrar avaliações por classificação (estrelas)
  const filterReviewsByRating = (reviews: any[], rating: number | null) => {
    if (rating === null) return reviews;
    return reviews.filter(review => review.rating === rating);
  };
  
  // Ordenar avaliações por data ou rating
  const sortReviews = (reviews: any[], sortType: string) => {
    if (!reviews || !Array.isArray(reviews)) return [];
    
    return [...reviews].sort((a, b) => {
      if (sortType === 'recent') {
        // Ordenar por data (mais recentes primeiro)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      } else if (sortType === 'highest') {
        // Ordenar por rating (maior primeiro)
        return b.rating - a.rating;
      } else if (sortType === 'lowest') {
        // Ordenar por rating (menor primeiro)
        return a.rating - b.rating;
      }
      return 0;
    });
  };
  
  // Paginar avaliau00e7u00f5es
  const paginateReviews = (reviews: any[], page: number, perPage: number) => {
    if (!reviews || !Array.isArray(reviews)) return [];
    const startIndex = (page - 1) * perPage;
    const paginatedReviews = reviews.slice(startIndex, startIndex + perPage);
    console.log(`Paginau00e7u00e3o: pu00e1gina ${page}, exibindo ${paginatedReviews.length} de ${reviews.length} reviews`);
    return paginatedReviews;
  };
  
  // Gerar cu00f3digo de incorporau00e7u00e3o para Shopify
  const generateShopifyCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const domain = window.location.hostname;
    return `<div id="pokify-reviews" data-product-id="${productId}" data-primary-color="${primaryColor}" data-accent-color="${accentColor}"></div>
<script async src="${baseUrl}/api/reviews-embed.js"></script>`;
  };

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-purple-600 mb-2"></div>
          <p>Carregando avaliações...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          <p className="font-medium">Erro ao carregar avaliações</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : productData ? (
        <>
          {/* Processamento dos dados para exibição */}
          {(() => {
            // Processamos todos os dados uma única vez para evitar cálculos duplicados
            const formattedReviews = formatReviews(productData.reviews);
            const filteredReviews = filterReviewsByRating(formattedReviews, filterRating);
            
            // Aplicamos a ordenação antes da paginação
            const sortedReviews = sortReviews(filteredReviews, sortBy);
            
            const totalPages = Math.max(1, Math.ceil(sortedReviews.length / itemsPerPage));
            
            // Garantimos que a página atual é válida
            if (currentPage > totalPages && totalPages > 0) {
              setCurrentPage(totalPages);
            }
            
            const paginatedReviews = paginateReviews(sortedReviews, currentPage, itemsPerPage);
            
            return (
              <>
                {/* Componente de exibição de avaliações */}
                <ReviewsDisplay
                  reviews={paginatedReviews}
                  totalCount={productData.totalCount || 0}
                  averageRating={productData.averageRating || 0}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
                
                {/* Paginação - sempre exibida quando há dados */}
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage <= 1}
                    >
                      Anterior
                    </Button>
                    
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage >= totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      ) : null}
    </div>
  );
}
