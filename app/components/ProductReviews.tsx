import React, { useState } from 'react';
import { publishProductReviews } from '@/lib/supabase';

interface Review {
  id: string;
  author: string;
  content: string;
  rating: number;
  date: string;
  images: string[];
  created_at: string;
}

interface PublishedReviewsData {
  product_id: string;
  product_name: string;
  product_image: string | null;
  average_rating: number;
  review_count: number;
  reviews: Review[];
  updated_at: string;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewsData, setReviewsData] = useState<PublishedReviewsData | null>(null);
  
  // Função para exibir iframe
  const renderIframe = () => {
    if (typeof window === 'undefined') return null;
    
    const origin = window.location.origin;
    // Valores padrão para loja demo e usuário
    const shopDomain = 'loja-demo';
    const userId = '10c1173a-02a3-493d-b782-0c6cba9274b2';
    
    return (
      <iframe 
        src={`${origin}/api/reviews/${productId}/iframe?shopDomain=${shopDomain}&userId=${userId}`} 
        style={{width:"100%", border:"none", height:"1300px", overflow:"hidden"}} 
        title="Avaliações do Produto"
        scrolling="no"
        frameBorder="0"
      />
    );
  };

  const handlePublishReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await publishProductReviews(productId);
      if (result.success) {
        setReviewsData(result.data as PublishedReviewsData);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro ao publicar avaliações: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Avaliações do Produto</h2>
      
      <div className="mb-4">
        <button
          onClick={handlePublishReviews}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Publicando...' : 'Publicar Avaliações'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {reviewsData && (
        <div className="mt-4">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">{reviewsData.product_name}</h3>
            <p>Média: {reviewsData.average_rating.toFixed(1)} ⭐️</p>
            <p>Total de avaliações: {reviewsData.review_count}</p>
          </div>

          <div className="space-y-4">
            {reviewsData.reviews.map((review) => (
              <div key={review.id} className="border p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold">{review.author}</span>
                  <span>{review.rating} ⭐️</span>
                  <span className="text-gray-500">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
                <p>{review.content}</p>
                {review.images.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exibir iframe com altura fixa de 1300px */}
      {renderIframe()}
    </div>
  );
} 