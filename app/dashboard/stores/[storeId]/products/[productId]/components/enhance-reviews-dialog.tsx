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
import { Progress } from '@/components/ui/progress';

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
  const [progressMessage, setProgressMessage] = useState('');
  const [progressValue, setProgressValue] = useState(0);

  const handleEnhance = async () => {
    if (reviews.length === 0) {
      toast.error('Não há avaliações selecionadas para melhorar');
      return;
    }

    setIsEnhancing(true);
    setProgressMessage('Iniciando o processo de melhoria...');
    setProgressValue(0);

    try {
      console.log('Iniciando melhoria para reviews:', reviews);
      
      const reviewsToSubmit = reviews.map(review => ({
        id: review.id,
        author: review.author,
        content: review.content,
        product_id: review.product_id // Adicionando o product_id para identificação
      }));
      
      console.log('Enviando para API:', reviewsToSubmit);
      
      // Estimar tempo com base no número de reviews (20 segundos por lote de 20 reviews)
      const estimatedTime = Math.ceil(reviews.length / 20) * 20;
      setProgressMessage(`Melhorando ${reviews.length} avaliações (estimado: ~${estimatedTime}s)...`);

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

      // Calcular quantos reviews foram melhorados com sucesso
      const successfulEnhancements = data.enhancements.filter((e: any) => !e.error).length;
      setProgressMessage(`Salvando ${successfulEnhancements} avaliações melhoradas...`);
      setProgressValue(75);

      // Salvar cada review melhorado
      const updatePromises = data.enhancements.map(async (enhancement: any, index: number) => {
        if (enhancement.error) {
          console.error(`Erro ao melhorar review ${enhancement.id}: ${enhancement.error}`);
          return { success: false, id: enhancement.id };
        }
        
        // Atualizar o progresso à medida que salvamos
        const saveProgress = 75 + Math.round((index / data.enhancements.length) * 25);
        setProgressValue(saveProgress);
        
        console.log(`Atualizando review ${enhancement.id} com novo conteúdo`, enhancement.enhancedContent);
        return updateReview(enhancement.id, {
          content: enhancement.enhancedContent
        });
      });
      
      const results = await Promise.all(updatePromises);
      console.log('Resultados da atualização:', results);
      
      setProgressValue(100);
      setProgressMessage('Melhoria concluída com sucesso!');
      
      // Notificar o componente pai
      onReviewsUpdated();
      
      // Pequeno atraso para o usuário ver que foi concluído
      setTimeout(() => {
        // Fechar o diálogo e mostrar mensagem de sucesso
        onClose();
        toast.success(
          reviews.length === 1 
            ? 'Avaliação melhorada com sucesso' 
            : `${data.enhancements.length} avaliações melhoradas com sucesso`
        );
      }, 500);
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
          
          {isEnhancing && (
            <div className="space-y-2">
              <Progress value={progressValue} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">{progressMessage}</p>
              <p className="text-xs text-center text-muted-foreground">
                {reviews.length > 20 ? 'Processando em lotes para maior eficiência' : 'Processamento em andamento'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isEnhancing}>
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