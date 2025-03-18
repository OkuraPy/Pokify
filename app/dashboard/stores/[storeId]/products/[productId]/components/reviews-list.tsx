'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare } from 'lucide-react';
import { getReviews } from '@/lib/supabase';

interface ReviewsListProps {
  productId: string;
  reviewsCount: number;
}

export function ReviewsList({ productId, reviewsCount }: ReviewsListProps) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadReviews() {
      try {
        setIsLoading(true);
        const { data } = await getReviews(productId);
        setReviews(data || []);
      } catch (error) {
        console.error('Erro ao carregar avaliações:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadReviews();
  }, [productId]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
          <Button variant="outline" size="sm">
            Selecionar Avaliações
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Renderizar a lista de avaliações aqui */}
        <pre className="text-xs">
          {JSON.stringify(reviews, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
} 