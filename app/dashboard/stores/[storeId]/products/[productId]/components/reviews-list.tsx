'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Star, Check, X, Image as ImageIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getReviews, updateReview } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  images?: string[];
  is_selected: boolean;
  is_published: boolean;
  created_at: string;
}

interface ReviewsListProps {
  productId: string;
  reviewsCount: number;
}

export function ReviewsList({ productId, reviewsCount }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadReviews() {
      try {
        setIsLoading(true);
        const { data, error } = await getReviews(productId);
        
        if (error) {
          console.error('Erro ao carregar avaliações:', error);
          toast.error('Erro ao carregar avaliações');
          return;
        }
        
        setReviews(data || []);
      } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
        toast.error('Erro ao carregar avaliações');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadReviews();
  }, [productId]);

  const toggleReviewSelection = async (reviewId: string, currentValue: boolean) => {
    try {
      setIsUpdating(reviewId);
      
      const { error } = await updateReview(reviewId, {
        is_selected: !currentValue
      });
      
      if (error) {
        console.error('Erro ao atualizar avaliação:', error);
        toast.error('Erro ao atualizar seleção');
        return;
      }
      
      // Atualiza o estado local
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, is_selected: !currentValue } 
          : review
      ));
      
      toast.success(
        currentValue 
          ? 'Avaliação removida da seleção' 
          : 'Avaliação adicionada à seleção'
      );
    } catch (error) {
      console.error('Erro ao atualizar seleção:', error);
      toast.error('Erro ao atualizar seleção');
    } finally {
      setIsUpdating(null);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
          <CardDescription>Carregando avaliações do produto...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
          <CardDescription>Este produto ainda não possui avaliações</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="p-4 bg-secondary/20 rounded-full mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">Nenhuma avaliação encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Quando o produto receber avaliações, elas aparecerão aqui.
          </p>
          <Button variant="outline">Gerar Avaliações de Exemplo</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Avaliações do Produto</CardTitle>
            <CardDescription>
              {reviewsCount} avaliações no total
            </CardDescription>
          </div>
          <div className="space-x-2">
            <Badge variant="outline">
              {reviews.filter(r => r.is_selected).length} selecionadas
            </Badge>
            <Button variant="outline" size="sm">
              Selecionar Tudo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className={`border ${review.is_selected ? 'border-primary' : 'border-border/60'}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{review.author}</h3>
                    <Badge variant="outline" className="text-xs">
                      {review.date || format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={16} 
                          className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {review.rating}/5
                    </span>
                  </div>
                  
                  <p className="text-sm">{review.content}</p>
                  
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {review.images.map((image, i) => (
                        <div key={i} className="relative h-16 w-16 rounded-md overflow-hidden border border-border/60">
                          <img src={image} alt={`Imagem ${i+1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button 
                  variant={review.is_selected ? "default" : "outline"} 
                  size="sm"
                  onClick={() => toggleReviewSelection(review.id, review.is_selected)}
                  disabled={isUpdating === review.id}
                >
                  {isUpdating === review.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : review.is_selected ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Selecionada
                    </>
                  ) : (
                    "Selecionar"
                  )}
                </Button>
              </div>
              
              {review.is_published && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Publicada na loja
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {reviewsCount > reviews.length && (
          <Button variant="outline" className="w-full">
            Carregar mais avaliações
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 