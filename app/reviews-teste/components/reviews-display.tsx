'use client';

import React, { useState } from 'react';

// Tipos de dados para as avaliações
interface Review {
  id: string;
  author: string;
  date: string;
  rating: number;
  content: string;
  images?: string[];
  productName: string;
  verified?: boolean;
}

interface ReviewsDisplayProps {
  reviews: Review[];
  totalCount: number;
  averageRating: number;
  primaryColor?: string; // Cor primária para customização
  accentColor?: string;  // Cor secundária/destaque
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
}

// Componente de estrelas para reutilização
const Stars = ({ rating, color = '#FBBF24', size = 'md' }: { rating: number; color?: string; size?: 'sm' | 'md' | 'lg' }) => {
  // Calcular a largura de cada estrela preenchida (para estrelas parciais)
  const getStarWidth = (star: number) => {
    const remainder = rating - Math.floor(rating);
    if (star <= Math.floor(rating)) return '100%';
    if (star === Math.ceil(rating) && remainder > 0) return `${remainder * 100}%`;
    return '0%';
  };

  // Definir tamanho baseado no prop size
  const getSizeClass = () => {
    switch(size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="relative" style={{ color }}>
          {/* Estrela vazia de fundo */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
            className={`${getSizeClass()} text-gray-300`}
          >
            <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
          </svg>
          
          {/* Estrela preenchida (com largura dinâmica para estrelas parciais) */}
          <div 
            style={{ 
              width: getStarWidth(star),
              overflow: 'hidden',
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%'
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className={getSizeClass()}
            >
              <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
            </svg>
          </div>
        </div>
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

      {/* Modal de lightbox para exibiu00e7u00e3o ampliada */}
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

// Componente de header das avaliau00e7u00f5es
const ReviewsHeader = ({ rating, count, primaryColor = '#7e3af2', accentColor = '#c4b5fd' }: { rating: number; count: number; primaryColor?: string; accentColor?: string }) => {
  // Converter cores para estilos inline
  const headerStyle = {
    background: `linear-gradient(to right, ${accentColor}30, ${accentColor}15)`,
  };
  
  const ratingBoxStyle = {
    color: primaryColor,
  };
  
  const buttonStyle = {
    backgroundColor: primaryColor,
  };
  
  const textHighlightStyle = {
    color: primaryColor,
  };

  return (
    <div className="bg-purple-50 rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-3 md:mb-0">
          <div className="text-3xl font-semibold mr-3" style={{ color: primaryColor }}>{rating.toFixed(1)}</div>
          <div>
            <Stars rating={rating} size="md" color={primaryColor} />
            <div className="flex justify-between w-full max-w-[90px] mt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <div key={star} className="text-[10px] font-medium" style={{ color: primaryColor }}>
                  {star}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm mb-1">
            <span className="font-medium">{count}</span> avaliações
          </p>
          <p className="text-xs text-gray-500">
            97% dos clientes recomendam
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente de avaliação individual
const ReviewCard = ({ review, primaryColor = '#7e3af2' }: { review: Review; primaryColor?: string }) => {
  const verifiedBadgeStyle = {
    backgroundColor: `${primaryColor}20`,
    color: primaryColor,
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{review.author}</span>
            {review.verified && (
              <span className="text-xs px-2 py-0.5 rounded-full flex items-center" style={verifiedBadgeStyle}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Verificada
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">{review.date}</p>
          <div className="mt-1">
            <Stars rating={review.rating} size="md" />
          </div>
        </div>
        
        <ReviewImages images={review.images || []} />
      </div>
      
      <div className="mt-3">
        <p className="text-gray-700 leading-relaxed">{review.content}</p>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center">
        <div className="h-10 w-10 bg-gray-100 rounded-md mr-3 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">{review.productName}</p>
      </div>
      
      <div className="mt-4 flex justify-between">
        <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905C11 5.06 10.06 6 9 6H7a2 2 0 00-2 2v8a2 2 0 002 2h2m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905C11 5.06 10.06 6 9 6H7a2 2 0 00-2 2v8a2 2 0 002 2h2" />
          </svg>
          Útil
        </button>
        <button className="text-sm text-gray-500 hover:text-gray-700">
          Reportar
        </button>
      </div>
    </div>
  );
};

const ReviewsDisplay = ({
  reviews,
  totalCount,
  averageRating,
  primaryColor = '#7e3af2', // Roxo padrão
  accentColor = '#c4b5fd',  // Lilás padrão,
  sortBy = 'recent',
  onSortChange = () => {}
}: ReviewsDisplayProps) => {
  
  // Estilo para botu00f5es de ordenau00e7u00e3o selecionados
  const activeButtonStyle = {
    backgroundColor: `${primaryColor}20`,
    color: primaryColor,
  };
  
  // Estilo para destaque de paginação ativa
  const activePaginationStyle = {
    backgroundColor: `${primaryColor}10`,
    borderColor: primaryColor,
    color: primaryColor,
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <ReviewsHeader 
        rating={averageRating} 
        count={totalCount} 
        primaryColor={primaryColor}
        accentColor={accentColor}
      />
      
      {/* Opções de ordenação */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1">
          <button 
            className={`px-3 py-1.5 text-sm rounded-md ${sortBy === 'recent' ? '' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => onSortChange('recent')}
            style={sortBy === 'recent' ? activeButtonStyle : {}}
          >
            Mais recentes
          </button>
          <button 
            className={`px-3 py-1.5 text-sm rounded-md ${sortBy === 'highest' ? '' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => onSortChange('highest')}
            style={sortBy === 'highest' ? activeButtonStyle : {}}
          >
            Maior nota
          </button>
          <button 
            className={`px-3 py-1.5 text-sm rounded-md ${sortBy === 'lowest' ? '' : 'text-gray-600 hover:bg-gray-100'}`}
            onClick={() => onSortChange('lowest')}
            style={sortBy === 'lowest' ? activeButtonStyle : {}}
          >
            Menor nota
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          Exibindo {reviews.length} de {new Intl.NumberFormat('pt-BR').format(totalCount)} avaliações
        </div>
      </div>

      {/* Grid de avaliau00e7u00f5es */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} primaryColor={primaryColor} />
        ))}
      </div>
      
      {/* Removemos a paginau00e7u00e3o daqui para evitar duplicidade com a paginau00e7u00e3o na pu00e1gina principal */}
    </div>
  );
};

export default ReviewsDisplay;
