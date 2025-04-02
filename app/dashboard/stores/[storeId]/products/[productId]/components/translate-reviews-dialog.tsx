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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Languages, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { updateReview } from '@/lib/supabase';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Idiomas suportados
const languages = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' }
];

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

interface TranslateReviewsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: Review[];
  onReviewsUpdated: () => void;
  isSingleReview?: boolean;
}

export function TranslateReviewsDialog({ 
  isOpen, 
  onClose, 
  reviews,
  onReviewsUpdated,
  isSingleReview = false
}: TranslateReviewsDialogProps) {
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [translationStats, setTranslationStats] = useState<{
    success: number;
    errors: number;
    total: number;
  } | null>(null);
  
  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error('Selecione um idioma');
      return;
    }

    if (reviews.length === 0) {
      toast.error('Não há avaliações selecionadas para traduzir');
      return;
    }

    setIsTranslating(true);
    setProgressMessage('Iniciando o processo de tradução...');
    setProgressValue(0);
    setTranslationStats(null);

    try {
      // Estimar tempo com base no número de reviews (15 segundos por lote de 10 reviews)
      const estimatedTime = Math.ceil(reviews.length / 10) * 15;
      setProgressMessage(`Traduzindo ${reviews.length} avaliações para ${getLanguageName(targetLanguage)} (estimado: ~${estimatedTime}s)...`);
      setProgressValue(10);

      const response = await fetch('/api/translate/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: reviews.map(review => ({
            id: review.id,
            author: review.author,
            content: review.content
          })),
          targetLanguage
        })
      });

      const data = await response.json();
      
      setProgressValue(50);
      setProgressMessage(`Tradução concluída, processando resultados...`);

      if (!response.ok) {
        throw new Error(data.error || 'Falha na tradução');
      }

      if (!data.success || !data.translations) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Guardar as estatísticas
      if (data.stats) {
        setTranslationStats(data.stats);
      } else {
        // Calcular estatísticas manualmente se não fornecidas pelo servidor
        const successCount = data.translations.filter((t: any) => !t.error).length;
        const errorCount = data.translations.filter((t: any) => t.error).length;
        setTranslationStats({
          success: successCount,
          errors: errorCount,
          total: data.translations.length
        });
      }
      
      // Filtrar apenas as traduções bem-sucedidas
      const successfulTranslations = data.translations.filter((t: any) => !t.error);
      
      setProgressMessage(`Salvando ${successfulTranslations.length} avaliações traduzidas...`);
      setProgressValue(75);
      
      if (successfulTranslations.length === 0) {
        throw new Error('Nenhuma tradução foi concluída com sucesso');
      }
      
      // Salvar automaticamente as traduções sem mostrar preview
      await handleSave(successfulTranslations);
      
      setProgressValue(100);
      setProgressMessage(`Tradução concluída com ${successfulTranslations.length} de ${data.translations.length} avaliações`);
      
      // Se todas as traduções forem bem-sucedidas, fechar o diálogo automaticamente
      if (successfulTranslations.length === data.translations.length) {
        // Pequeno atraso para o usuário ver que foi concluído
        setTimeout(() => {
          // Fechar o diálogo e mostrar mensagem de sucesso
          onClose();
          toast.success(`${data.translations.length} avaliações traduzidas para ${getLanguageName(targetLanguage)}`);
        }, 1000);
      } else {
        // Se houver erros, deixar o diálogo aberto para o usuário ver as estatísticas
        toast.success(`${successfulTranslations.length} de ${data.translations.length} avaliações traduzidas com sucesso`);
      }
    } catch (error) {
      console.error('Erro na tradução:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao traduzir o conteúdo');
      setProgressMessage(`Erro: ${error instanceof Error ? error.message : 'Falha na tradução'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async (translations: Array<{id: string; translatedContent: string}>) => {
    try {
      // Atualizar cada review com o conteúdo traduzido
      const updatePromises = translations.map(async (translation, index) => {
        // Atualizar o progresso à medida que salvamos
        const saveProgress = 75 + Math.round((index / translations.length) * 25);
        setProgressValue(saveProgress);
        
        return updateReview(translation.id, {
          content: translation.translatedContent
        });
      });
      
      await Promise.all(updatePromises);
      
      // Notificar o componente pai para recarregar os reviews
      onReviewsUpdated();
    } catch (error) {
      console.error('Erro ao salvar traduções:', error);
      toast.error('Erro ao salvar as traduções');
    }
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || 'Desconhecido';
  };

  const handleCloseDialog = () => {
    // Limpar o estado antes de fechar
    setTranslationStats(null);
    setProgressValue(0);
    setProgressMessage('');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={isTranslating ? undefined : handleCloseDialog}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isSingleReview ? 'Traduzir Avaliação' : 'Traduzir Avaliações Selecionadas'}
          </DialogTitle>
          <DialogDescription>
            {isSingleReview 
              ? 'Traduza esta avaliação para outro idioma' 
              : `Traduza ${reviews.length} avaliações selecionadas para outro idioma`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="language">Idioma de destino</Label>
            <Select
              value={targetLanguage}
              onValueChange={setTargetLanguage}
              disabled={isTranslating}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isTranslating && (
            <div className="space-y-2 mt-4">
              <Progress value={progressValue} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">{progressMessage}</p>
              <p className="text-xs text-center text-muted-foreground">
                {reviews.length > 10 ? 'Processando em lotes para maior eficiência' : 'Processamento em andamento'}
              </p>
            </div>
          )}
          
          {translationStats && translationStats.errors > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                {translationStats.errors === 1 ? (
                  'Uma avaliação não pôde ser traduzida.'
                ) : (
                  `${translationStats.errors} avaliações não puderam ser traduzidas.`
                )}
                <p className="text-sm mt-2">
                  As demais {translationStats.success} avaliações foram traduzidas e salvas com sucesso.
                </p>
                <p className="text-xs mt-1">
                  Tente novamente com as avaliações restantes ou reduza o número de avaliações selecionadas.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDialog} disabled={isTranslating}>
            {translationStats ? 'Fechar' : 'Cancelar'}
          </Button>
          <Button 
            onClick={handleTranslate} 
            disabled={isTranslating}
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traduzindo...
              </>
            ) : (
              <>
                <Languages className="mr-2 h-4 w-4" />
                Traduzir para {getLanguageName(targetLanguage)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 