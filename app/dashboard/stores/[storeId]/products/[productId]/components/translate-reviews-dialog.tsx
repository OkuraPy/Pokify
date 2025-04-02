'use client';

import { useState, useEffect, useRef } from 'react';
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

// Constante para definir limites de segurança
const MAX_REVIEWS_PER_BATCH = 10; // Máximo de reviews para enviar por vez
const SAFE_BATCH_WARNING = 20; // Limite para mostrar alerta de possível lentidão

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
  // Referência para o estado original do diálogo
  const originalIsOpen = useRef(isOpen);
  const closeRequestedRef = useRef(false);

  // Estados internos do diálogo
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);
  const [canClose, setCanClose] = useState(true);
  
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  const [translationStats, setTranslationStats] = useState<{
    success: number;
    errors: number;
    total: number;
  } | null>(null);
  const [batchProcessing, setBatchProcessing] = useState<{
    currentBatch: number;
    totalBatches: number;
    processedReviews: number;
    pendingReviews: Review[];
  } | null>(null);
  
  // Armazenar as traduções salvas para atualizar tudo de uma vez no final
  const [savedTranslationIds, setSavedTranslationIds] = useState<string[]>([]);
  
  // Sincronizar o estado interno com o estado externo do diálogo
  useEffect(() => {
    console.log("isOpen changed:", isOpen);
    
    // Quando o diálogo é aberto externamente
    if (isOpen && !originalIsOpen.current) {
      setInternalIsOpen(true);
      setCanClose(true);
      resetStates();
      closeRequestedRef.current = false;
    }
    
    // Quando o diálogo tenta ser fechado externamente
    if (!isOpen && originalIsOpen.current) {
      // Se estiver processando, impedir o fechamento
      if (isTranslating && !closeRequestedRef.current) {
        console.log("Blocking auto-close during translation");
        // Sinaliza que houve uma tentativa de fechar
        closeRequestedRef.current = true;
        
        // Bloqueamos o fechamento aqui e mantemos o diálogo aberto
        setInternalIsOpen(true);
        
        // Notificar o usuário
        toast.warning("Aguarde o término do processamento");
      } else {
        // Se não estiver processando ou já finalizou, permitir o fechamento
        setInternalIsOpen(false);
      }
    }
    
    // Atualizar a referência
    originalIsOpen.current = isOpen;
  }, [isOpen, isTranslating]);
  
  // Função para limpar todos os estados relevantes
  const resetStates = () => {
    console.log("Resetting all states");
    setIsTranslating(false);
    setProgressValue(0);
    setProgressMessage('');
    setTranslationStats(null);
    setBatchProcessing(null);
    setCanClose(true);
    closeRequestedRef.current = false;
  };

  // Função para processar reviews em lotes, chamada recursivamente
  const processReviewsBatch = async (pendingReviews: Review[]) => {
    console.log("Processing batch with pending reviews:", pendingReviews.length);
    
    // Se não há mais reviews para processar, finalizar
    if (pendingReviews.length === 0) {
      console.log("All batches completed successfully");
      setProgressValue(100);
      setProgressMessage(`Tradução concluída!`);
      setCanClose(true);
      setIsTranslating(false);
      
      // Garantir que a UI seja atualizada antes de fechar
      if (savedTranslationIds.length > 0) {
        await triggerReviewsUpdate();
      }
      
      // Mostrar feedback de sucesso e fechar após alguns segundos
      toast.success("Traduções concluídas com sucesso!");
      
      // Aumentar o tempo para garantir que a atualização ocorra
      setTimeout(() => {
        // Forçar uma atualização final antes de fechar
        onReviewsUpdated();
        setInternalIsOpen(false);
        onClose();
      }, 3000);
      return;
    }
    
    // Pegar um lote de reviews para processar
    const currentBatch = pendingReviews.slice(0, MAX_REVIEWS_PER_BATCH);
    const remainingReviews = pendingReviews.slice(MAX_REVIEWS_PER_BATCH);
    const totalBatches = Math.ceil(reviews.length / MAX_REVIEWS_PER_BATCH);
    const currentBatchNumber = 1 + Math.floor((reviews.length - pendingReviews.length) / MAX_REVIEWS_PER_BATCH);
    
    console.log(`Processing batch ${currentBatchNumber} of ${totalBatches}, ${currentBatch.length} reviews`);
    
    setBatchProcessing({
      currentBatch: currentBatchNumber,
      totalBatches,
      processedReviews: reviews.length - pendingReviews.length,
      pendingReviews: remainingReviews
    });
    
    // Atualizar a mensagem de progresso para o lote atual
    setProgressMessage(`Traduzindo lote ${currentBatchNumber} de ${totalBatches} (${currentBatch.length} avaliações)...`);
    
    try {
      const response = await fetch('/api/translate/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: currentBatch.map(review => ({
            id: review.id,
            author: review.author,
            content: review.content
          })),
          targetLanguage
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha na tradução');
      }

      if (!data.success || !data.translations) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Calcular estatísticas para este lote
      const batchStats = data.stats || {
        success: data.translations.filter((t: any) => !t.error && t.success).length,
        errors: data.translations.filter((t: any) => t.error || !t.success).length,
        total: data.translations.length
      };
      
      console.log("Batch stats:", batchStats);
      
      // Atualizar estatísticas combinadas se já existirem
      if (translationStats) {
        setTranslationStats({
          success: translationStats.success + batchStats.success,
          errors: translationStats.errors + batchStats.errors,
          total: translationStats.total + batchStats.total
        });
      } else {
        setTranslationStats(batchStats);
      }
      
      // Filtrar traduções bem-sucedidas e salvar
      const successfulTranslations = data.translations.filter((t: any) => !t.error && t.success);
      
      if (successfulTranslations.length > 0) {
        // Salvar localmente sem atualizar a UI até o final
        await saveTranslationsWithoutUpdate(successfulTranslations);
        
        // Mostrar resultado parcial se houver mais para processar
        if (remainingReviews.length > 0) {
          toast.success(`${successfulTranslations.length} avaliações traduzidas com sucesso neste lote.`);
        }
      }
      
      // Calcular o progresso geral de forma precisa
      const processedCount = reviews.length - remainingReviews.length;
      const newProgress = Math.min(95, Math.round((processedCount / reviews.length) * 100));
      setProgressValue(newProgress);
      
      // Se existem mais reviews, continuar processando após uma pequena pausa
      if (remainingReviews.length > 0) {
        setProgressMessage(`Preparando próximo lote de ${Math.min(remainingReviews.length, MAX_REVIEWS_PER_BATCH)} avaliações...`);
        
        console.log("Will process next batch after pause");
        
        // Pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Processar o próximo lote
        await processReviewsBatch(remainingReviews);
      } else {
        // Finalizar quando todos os lotes estiverem concluídos
        console.log("All batches completed, finalizing");
        setProgressValue(100);
        setProgressMessage(`Tradução concluída com ${translationStats ? translationStats.success + batchStats.success : batchStats.success} avaliações!`);
        setBatchProcessing(null);
        setCanClose(true);
        setIsTranslating(false);
        
        // Agora que todos os lotes foram processados, atualizar a UI
        if (savedTranslationIds.length > 0) {
          await triggerReviewsUpdate();
        }
        
        // Se houve pelo menos um sucesso, mostrar mensagem final
        const totalSuccesses = translationStats ? 
          translationStats.success + batchStats.success : 
          batchStats.success;
          
        if (totalSuccesses > 0) {
          toast.success(`${totalSuccesses} avaliações traduzidas para ${getLanguageName(targetLanguage)}`);
          // Aumentar o tempo para garantir que a atualização ocorra
          setTimeout(() => {
            // Forçar uma atualização final antes de fechar
            onReviewsUpdated();
            setInternalIsOpen(false);
            onClose();
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Erro na tradução do lote:', error);
      
      // Se existem mais reviews, tente continuar mesmo com erro
      if (remainingReviews.length > 0) {
        toast.error(`Erro no lote atual: ${error instanceof Error ? error.message : 'Falha na tradução'}`);
        
        // Pausa antes de continuar
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Continuar com os próximos lotes
        await processReviewsBatch(remainingReviews);
      } else {
        // Se foi o último lote, mostrar erro
        toast.error(`Erro: ${error instanceof Error ? error.message : 'Falha na tradução'}`);
        setProgressMessage(`Erro: ${error instanceof Error ? error.message : 'Falha na tradução'}`);
        setBatchProcessing(null);
        setCanClose(true);
        setIsTranslating(false);
        
        // Mesmo com erro, atualizar a UI com o que foi processado até agora
        if (savedTranslationIds.length > 0) {
          await triggerReviewsUpdate();
        }
      }
    }
  };
  
  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error('Selecione um idioma');
      return;
    }

    if (reviews.length === 0) {
      toast.error('Não há avaliações selecionadas para traduzir');
      return;
    }

    console.log("Starting translation process for", reviews.length, "reviews");
    
    // Bloqueamos o fechamento do diálogo durante o processamento
    setCanClose(false);
    setIsTranslating(true);
    setProgressMessage('Iniciando o processo de tradução...');
    setProgressValue(0);
    setTranslationStats(null);
    setBatchProcessing(null);

    try {
      // Para grandes quantidades, usar o processamento em lotes
      if (reviews.length > MAX_REVIEWS_PER_BATCH) {
        console.log("Using batch processing for", reviews.length, "reviews");
        setProgressMessage(`Preparando para traduzir ${reviews.length} avaliações em lotes...`);
        await processReviewsBatch([...reviews]);
        return;
      }
      
      // Para quantidades menores, usar o fluxo original
      const estimatedTime = Math.ceil(reviews.length / 5) * 15; // 5 por lote, aprox. 15s por lote
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
        const successCount = data.translations.filter((t: any) => !t.error && t.success).length;
        const errorCount = data.translations.filter((t: any) => t.error || !t.success).length;
        setTranslationStats({
          success: successCount,
          errors: errorCount,
          total: data.translations.length
        });
      }
      
      // Filtrar apenas as traduções bem-sucedidas
      const successfulTranslations = data.translations.filter((t: any) => !t.error && t.success);
      
      setProgressMessage(`Salvando ${successfulTranslations.length} avaliações traduzidas...`);
      setProgressValue(75);
      
      if (successfulTranslations.length === 0) {
        throw new Error('Nenhuma tradução foi concluída com sucesso');
      }
      
      // Salvar automaticamente as traduções sem mostrar preview
      await handleSave(successfulTranslations);
      
      setProgressValue(100);
      setProgressMessage(`Tradução concluída com ${successfulTranslations.length} de ${data.translations.length} avaliações`);
      
      // Permitir o fechamento do diálogo
      setCanClose(true);
      
      // Mostrar feedback e fechar após um tempo adequado
      toast.success(`${successfulTranslations.length} de ${data.translations.length} avaliações traduzidas com sucesso`);
      setTimeout(() => {
        // Forçar uma atualização final antes de fechar
        onReviewsUpdated();
        setInternalIsOpen(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Erro na tradução:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao traduzir o conteúdo');
      setProgressMessage(`Erro: ${error instanceof Error ? error.message : 'Falha na tradução'}`);
      setCanClose(true);
    } finally {
      // No caso do fluxo simples, podemos definir isTranslating como false
      if (reviews.length <= MAX_REVIEWS_PER_BATCH) {
        setIsTranslating(false);
      }
    }
  };

  // Função para salvar sem atualizar a UI
  const saveTranslationsWithoutUpdate = async (translations: Array<{id: string; translatedContent: string}>) => {
    try {
      // Atualizar cada review com o conteúdo traduzido
      const updatePromises = translations.map(async (translation) => {
        await updateReview(translation.id, {
          content: translation.translatedContent
        });
        
        // Armazenar IDs das traduções bem-sucedidas
        return translation.id;
      });
      
      const updatedIds = await Promise.all(updatePromises);
      
      // Adicionar aos IDs já salvos
      setSavedTranslationIds(prev => [...prev, ...updatedIds]);
    } catch (error) {
      console.error('Erro ao salvar traduções:', error);
      toast.error('Erro ao salvar algumas traduções');
    }
  };
  
  // Função para acionar a atualização da UI apenas uma vez no final
  const triggerReviewsUpdate = async () => {
    try {
      console.log("Triggering reviews update with IDs:", savedTranslationIds.length);
      // Limpar os IDs salvos 
      const idsToUpdate = [...savedTranslationIds];
      setSavedTranslationIds([]);
      
      // Garantir que a atualização ocorra
      onReviewsUpdated();
      
      // Aguardar um momento para a atualização ter efeito
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return idsToUpdate;
    } catch (error) {
      console.error('Erro ao atualizar a lista de avaliações:', error);
      return [];
    }
  };
  
  // Função original mantida para o fluxo não-batch
  const handleSave = async (translations: Array<{id: string; translatedContent: string}>) => {
    try {
      // Para o fluxo não-batch, usamos o método original
      const updatePromises = translations.map(async (translation) => {
        return updateReview(translation.id, {
          content: translation.translatedContent
        });
      });
      
      await Promise.all(updatePromises);
      
      // Notificar o componente pai para recarregar os reviews
      // Isso é seguro aqui porque não estamos no modo de lotes
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
    console.log("handleCloseDialog called, canClose:", canClose);
    
    // Impedir o fechamento durante o processamento
    if (!canClose && isTranslating) {
      toast.warning('Aguarde a conclusão do processamento antes de fechar');
      return;
    }
    
    try {
      // Sempre forçar uma atualização ao fechar
      onReviewsUpdated();
      
      // Limpar ID's salvos
      if (savedTranslationIds.length > 0) {
        setSavedTranslationIds([]);
      }
      
      // Limpar o estado antes de fechar
      console.log("Manual close requested");
      resetStates();
      setInternalIsOpen(false);
      onClose();
    } catch (error) {
      console.error("Erro ao fechar diálogo:", error);
      // Em caso de erro, tentar fechar mesmo assim
      resetStates();
      setInternalIsOpen(false);
      onClose();
    }
  };

  const handleFinishProcess = () => {
    console.log("handleFinishProcess called");
    
    if (!canClose) {
      toast.warning('Aguarde a conclusão de todos os lotes antes de finalizar');
      return;
    }
    
    setIsTranslating(false);
    // Deixamos o diálogo aberto para o usuário ver os resultados
    // e fechar manualmente quando desejar
  };
  
  return (
    <Dialog 
      open={internalIsOpen} 
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange:", open);
        if (!open) {
          // Garantir que ocorra uma última atualização ao fechar o diálogo
          if (savedTranslationIds.length > 0) {
            triggerReviewsUpdate().then(() => handleCloseDialog());
          } else {
            handleCloseDialog();
          }
        }
      }}
    >
      <DialogContent className="max-w-3xl bg-white border border-slate-200 shadow-xl rounded-xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <DialogTitle className="flex items-center text-xl font-semibold text-slate-800">
            {isSingleReview ? 'Traduzir Avaliação' : 'Traduzir Avaliações'}
            {progressValue === 100 && <div className="ml-2 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center"><Check className="h-4 w-4 text-green-600" /></div>}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isSingleReview 
              ? 'Traduza esta avaliação para outro idioma' 
              : `Traduza ${reviews.length} ${reviews.length === 1 ? 'avaliação selecionada' : 'avaliações selecionadas'}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!isTranslating && (
            <div className="bg-white p-3">
              <Label htmlFor="language" className="text-base font-medium text-slate-800 mb-2 block">Idioma de destino</Label>
              <Select
                value={targetLanguage}
                onValueChange={setTargetLanguage}
                disabled={isTranslating}
              >
                <SelectTrigger id="language" className="h-10 bg-white border-slate-200 text-slate-800">
                  <SelectValue placeholder="Selecione o idioma para tradução" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="text-slate-700">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Processamento em lotes - UI Simplificada e Elegante */}
          {isTranslating && batchProcessing && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-10%,rgba(120,119,198,0.1),transparent)]"></div>
              <div className="relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-medium text-blue-800">Processando traduções</h3>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 rounded-full text-blue-800 text-sm font-medium">
                    Lote {batchProcessing.currentBatch} de {batchProcessing.totalBatches}
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="w-full bg-blue-100 rounded-full h-2.5 dark:bg-blue-100">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progressValue}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-blue-700 mt-2">
                  <span className="text-xs">{batchProcessing.processedReviews} de {reviews.length} avaliações</span>
                  <span className="text-xs">{progressValue}% concluído</span>
                </div>
                
                <div className="mt-4 text-center text-sm font-medium text-blue-800">
                  {progressMessage}
                </div>
              </div>
            </div>
          )}
          
          {/* Progresso para processamento simples */}
          {isTranslating && !batchProcessing && (
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-5 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-10%,rgba(56,189,248,0.1),transparent)]"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-medium text-slate-800">Processando tradução</h3>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 dark:bg-slate-100">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
                        progressValue === 100 
                          ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                          : "bg-gradient-to-r from-blue-500 to-indigo-600"
                      }`}
                      style={{ width: `${progressValue}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-4">
                  <div className="text-center text-sm font-medium text-slate-800">{progressMessage}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Mensagens de alerta e status */}
          {translationStats && translationStats.success > 0 && translationStats.success === translationStats.total && progressValue === 100 && (
            <div className="flex items-center mt-4 p-4 bg-green-50 rounded-xl border border-green-100 text-sm text-green-800">
              <Check className="h-5 w-5 text-green-600 mr-3" />
              <span className="font-medium">Todas as {translationStats.total} avaliações foram traduzidas com sucesso!</span>
            </div>
          )}
          
          {translationStats && translationStats.errors > 0 && translationStats.success === 0 && (
            <div className="flex items-center mt-4 p-4 bg-red-50 rounded-xl border border-red-100 text-sm text-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <span className="font-medium">Nenhuma avaliação pôde ser traduzida.</span>
                <p className="mt-1">Tente novamente com menos avaliações ou verifique o conteúdo.</p>
              </div>
            </div>
          )}
          
          {translationStats && translationStats.success > 0 && translationStats.errors > 0 && (
            <div className="flex items-center mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-3" />
              <div>
                <span className="font-medium">{translationStats.success} de {translationStats.total} avaliações foram traduzidas.</span>
                <p className="mt-1">{translationStats.errors} avaliações não puderam ser traduzidas.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-slate-100 flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={handleCloseDialog} 
            disabled={isTranslating && !canClose}
            className="border-slate-200 text-slate-700 hover:bg-slate-100 h-10"
          >
            {progressValue === 100 ? 'Fechar' : 'Cancelar'}
          </Button>
          
          <Button 
            onClick={handleTranslate} 
            disabled={isTranslating}
            className={!isTranslating 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white h-10 px-5" 
              : "h-10"
            }
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {batchProcessing 
                  ? `Processando lote ${batchProcessing.currentBatch}/${batchProcessing.totalBatches}` 
                  : 'Traduzindo...'}
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