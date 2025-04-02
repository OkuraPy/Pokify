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
import { Loader2, Wand2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { updateReview } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [enhancementStats, setEnhancementStats] = useState<{
    success: number;
    errors: number;
    total: number;
  } | null>(null);

  const handleCloseDialog = () => {
    // Limpar o estado antes de fechar
    setEnhancementStats(null);
    setProgressValue(0);
    setProgressMessage('');
    onClose();
  };

  const handleEnhance = async () => {
    if (reviews.length === 0) {
      toast.error('Não há avaliações selecionadas para melhorar');
      return;
    }

    setIsEnhancing(true);
    setProgressMessage('Iniciando o processo de melhoria...');
    setProgressValue(0);
    setEnhancementStats(null);

    try {
      console.log('Iniciando melhoria para reviews:', reviews);
      
      const reviewsToSubmit = reviews.map(review => ({
        id: review.id,
        author: review.author,
        content: review.content,
        product_id: review.product_id // Adicionando o product_id para identificação
      }));
      
      console.log('Enviando para API:', reviewsToSubmit);
      
      // Estimar tempo com base no número de reviews (15 segundos por lote de 10 reviews)
      const estimatedTime = Math.ceil(reviews.length / 10) * 15;
      setProgressMessage(`Melhorando ${reviews.length} avaliações (estimado: ~${estimatedTime}s)...`);
      setProgressValue(10);

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
      
      setProgressValue(50);
      setProgressMessage(`Processando resultados...`);

      if (!response.ok) {
        throw new Error(data.error || 'Falha na melhoria');
      }

      if (!data.success || !data.enhancements) {
        throw new Error('Resposta inválida do servidor');
      }

      // Armazenar estatísticas se fornecidas
      if (data.stats) {
        setEnhancementStats(data.stats);
      } else {
        // Calcular estatísticas manualmente se não fornecidas pelo servidor
        const successCount = data.enhancements.filter((e: any) => !e.error && e.success).length;
        const errorCount = data.enhancements.filter((e: any) => e.error || !e.success).length;
        setEnhancementStats({
          success: successCount,
          errors: errorCount,
          total: data.enhancements.length
        });
      }

      // Filtrar apenas os reviews melhorados com sucesso
      const successfulEnhancements = data.enhancements.filter((e: any) => !e.error && e.success);
      setProgressMessage(`Salvando ${successfulEnhancements.length} avaliações melhoradas...`);
      setProgressValue(75);
      
      if (successfulEnhancements.length === 0) {
        throw new Error('Nenhuma melhoria foi concluída com sucesso');
      }

      // Salvar cada review melhorado
      const updatePromises = successfulEnhancements.map(async (enhancement: any, index: number) => {
        // Atualizar o progresso à medida que salvamos
        const saveProgress = 75 + Math.round((index / successfulEnhancements.length) * 25);
        setProgressValue(saveProgress);
        
        console.log(`Atualizando review ${enhancement.id} com novo conteúdo`, enhancement.enhancedContent);
        return updateReview(enhancement.id, {
          content: enhancement.enhancedContent
        });
      });
      
      const results = await Promise.all(updatePromises);
      console.log('Resultados da atualização:', results);
      
      setProgressValue(100);
      setProgressMessage('Melhorias concluídas com sucesso!');
      
      // Notificar o componente pai
      onReviewsUpdated();
      
      // Se todas as melhorias foram bem-sucedidas, fechar o diálogo automaticamente
      if (!enhancementStats || enhancementStats.errors === 0) {
        // Pequeno atraso para o usuário ver que foi concluído
        setTimeout(() => {
          // Fechar o diálogo e mostrar mensagem de sucesso
          handleCloseDialog();
          toast.success(
            reviews.length === 1 
              ? 'Avaliação melhorada com sucesso' 
              : `${successfulEnhancements.length} avaliações melhoradas com sucesso`
          );
        }, 1000);
      } else {
        // Se houver erros, deixar o diálogo aberto para o usuário ver as estatísticas
        toast.success(`${successfulEnhancements.length} de ${data.enhancements.length} avaliações melhoradas com sucesso`);
      }
    } catch (error) {
      console.error('Erro na melhoria:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao melhorar o conteúdo');
      setProgressMessage(`Erro: ${error instanceof Error ? error.message : 'Falha na melhoria'}`);
    } finally {
      setIsEnhancing(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={isEnhancing ? undefined : handleCloseDialog}>
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
                {reviews.length > 10 ? 'Processando em lotes para maior eficiência' : 'Processamento em andamento'}
              </p>
            </div>
          )}
          
          {enhancementStats && enhancementStats.errors > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                {enhancementStats.errors === 1 ? (
                  'Uma avaliação não pôde ser melhorada.'
                ) : (
                  `${enhancementStats.errors} avaliações não puderam ser melhoradas.`
                )}
                <p className="text-sm mt-2">
                  As demais {enhancementStats.success} avaliações foram melhoradas e salvas com sucesso.
                </p>
                <p className="text-xs mt-1">
                  Tente novamente com as avaliações restantes ou reduza o número de avaliações selecionadas.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog} disabled={isEnhancing}>
            {enhancementStats ? 'Fechar' : 'Cancelar'}
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