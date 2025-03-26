'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateReview } from '@/lib/supabase';

interface Review {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  content: string;
  date: string | null;
  images?: string[] | null;
  is_selected: boolean;
  is_published: boolean;
  created_at: string;
}

interface EnhanceReviewsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  productName: string;
  onReviewsUpdated: () => void;
  isSingleReview?: boolean;
}

export function EnhanceReviewsDialog({ 
  isOpen, 
  onClose, 
  reviews,
  productName,
  onReviewsUpdated,
  isSingleReview = false
}: EnhanceReviewsDialogProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (reviews.length === 0) {
      toast.error('Não há avaliações selecionadas para melhorar');
      return;
    }

    setIsEnhancing(true);

    try {
      console.log('Iniciando melhoria para reviews:', reviews);
      
      const reviewsToSubmit = reviews.map(review => ({
        id: review.id,
        author: review.author,
        content: review.content,
        product_id: review.product_id // Adicionando o product_id para identificação
      }));
      
      console.log('Enviando para API:', reviewsToSubmit);

      const response = await fetch('/api/reviews/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: reviewsToSubmit,
          productName
        })
      });

      console.log('Status da resposta:', response.status);
      const data = await response.json();
      console.log('Resposta da API:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Falha na melhoria');
      }

      if (!data.success || !data.enhancements) {
        throw new Error('Resposta inválida do servidor');
      }

      // Salvar cada review melhorado
      const updatePromises = data.enhancements.map(async (enhancement: any) => {
        if (enhancement.error) {
          console.error(`Erro ao melhorar review ${enhancement.id}: ${enhancement.error}`);
          return { success: false, id: enhancement.id };
        }
        
        console.log(`Atualizando review ${enhancement.id} com novo conteúdo`, enhancement.enhancedContent);
        return updateReview(enhancement.id, {
          content: enhancement.enhancedContent
        });
      });
      
      const results = await Promise.all(updatePromises);
      console.log('Resultados da atualização:', results);
      
      // Notificar o componente pai
      onReviewsUpdated();
      
      // Fechar o diálogo e mostrar mensagem de sucesso
      onClose();
      toast.success(
        reviews.length === 1 
          ? 'Avaliação melhorada com sucesso' 
          : `${reviews.length} avaliações melhoradas com sucesso`
      );
    } catch (error) {
      console.error('Erro na melhoria:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao melhorar o conteúdo');
    } finally {
      setIsEnhancing(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isSingleReview ? 'Melhorar Avaliação' : 'Melhorar Avaliações Selecionadas'}
          </DialogTitle>
          <DialogDescription>
            {isSingleReview 
              ? 'Melhore esta avaliação para torná-la mais persuasiva e autêntica' 
              : `Melhore ${reviews.length} avaliações selecionadas para torná-las mais persuasivas`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
            <p className="text-sm text-amber-800 mb-2 font-medium">O que esta ferramenta faz?</p>
            <ul className="space-y-1 text-sm text-amber-700">
              <li>• Torna as avaliações mais persuasivas e autênticas</li>
              <li>• Adiciona detalhes pessoais e histórias para aumentar credibilidade</li>
              <li>• Insere gatilhos de conversão sutis</li>
              <li>• Aborda possíveis objeções dos clientes</li>
              <li>• Mantém o tom natural e o sentimento original da avaliação</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleEnhance} 
            disabled={isEnhancing}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Melhorando...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Melhorar {isSingleReview ? 'Avaliação' : 'Avaliações'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 