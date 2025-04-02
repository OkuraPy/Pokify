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
import { Loader2, Sparkles, Wand2, CheckCircle2, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ImproveDescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    description: string | null;
  };
  onImproveDescription: (description: string) => Promise<void>;
}

type ImproveMode = 'standard' | 'pro_copy';

export function ImproveDescriptionDialog({ 
  isOpen, 
  onClose, 
  product,
  onImproveDescription
}: ImproveDescriptionDialogProps) {
  const [isImproving, setIsImproving] = useState(false);
  const [improveMode, setImproveMode] = useState<ImproveMode>('standard');
  const [improvementProgress, setImprovementProgress] = useState(0);
  const [improvementStatus, setImprovementStatus] = useState<'idle' | 'preparing' | 'improving' | 'saving' | 'completed' | 'error'>('idle');

  const handleImproveDescription = async () => {
    setIsImproving(true);
    setImprovementStatus('preparing');
    setImprovementProgress(10);

    // Atualizar o progresso gradualmente para dar feedback visual
    const progressInterval = setInterval(() => {
      setImprovementProgress(prev => {
        if (prev >= 90) {
          return 90; // Manter em 90% até a conclusão
        }
        return prev + Math.floor(Math.random() * 3) + 1;
      });
    }, 800);

    try {
      console.log('Iniciando requisição de melhoria da descrição, produto ID:', product.id);
      console.log('Modo selecionado:', improveMode);
      
      setImprovementStatus('improving');
      
      // Adicionar o modo à URL se for pro_copy
      const url = improveMode === 'pro_copy' 
        ? '/api/improve-description?mode=pro_copy' 
        : '/api/improve-description';
      
      console.log('URL da requisição:', url);
      
      const requestData = {
        productId: product.id,
        title: product?.title || '',
        description: product?.description || '',
        mode: improveMode // Enviar o modo também no corpo
      };
      console.log('Dados enviados:', requestData);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('Status da resposta:', response.status);
      
      // Tentar ler o corpo da resposta
      let responseText;
      try {
        responseText = await response.text();
        console.log('Resposta (texto):', responseText);
      } catch (textError) {
        console.error('Erro ao ler corpo da resposta como texto:', textError);
        throw new Error('Erro ao ler resposta do servidor');
      }
      
      // Se a resposta não for OK, lançar erro
      if (!response.ok) {
        console.error('Erro na resposta:', responseText);
        throw new Error('Falha ao melhorar descrição: ' + responseText);
      }
      
      // Tentar parsear o JSON da resposta
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Dados recebidos (parsed):', data);
      } catch (jsonError) {
        console.error('Erro ao parsear JSON:', jsonError);
        throw new Error('Resposta inválida do servidor: ' + responseText);
      }
      
      if (data.success && data.description) {
        setImprovementStatus('saving');
        setImprovementProgress(95);
        console.log('Resposta de sucesso recebida, atualizando UI');
        
        // Chamar o callback com a nova descrição
        await onImproveDescription(data.description);
        
        clearInterval(progressInterval);
        setImprovementProgress(100);
        setImprovementStatus('completed');
        
        toast.success(data.message || 'Descrição melhorada com sucesso');
        
        // Pequeno atraso para o usuário ver o progresso concluído
        setTimeout(() => {
          // Fechar o diálogo após salvar
          onClose();
        }, 800);
      } else {
        clearInterval(progressInterval);
        setImprovementStatus('error');
        setImprovementProgress(0);
        console.error('Resposta sem dados esperados:', data);
        throw new Error('Resposta inválida do servidor: ' + (data.error || 'Formato inesperado'));
      }
    } catch (error) {
      clearInterval(progressInterval);
      setImprovementStatus('error');
      setImprovementProgress(0);
      console.error('Erro completo ao melhorar descrição:', error);
      toast.error('Erro ao melhorar descrição com IA: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      clearInterval(progressInterval);
      setIsImproving(false);
    }
  };

  // Função para obter a mensagem de status baseada no estado atual
  const getStatusMessage = () => {
    switch (improvementStatus) {
      case 'preparing':
        return 'Preparando melhoria...';
      case 'improving':
        return 'Melhorando conteúdo...';
      case 'saving':
        return 'Salvando descrição...';
      case 'completed':
        return 'Descrição melhorada!';
      case 'error':
        return 'Erro na melhoria';
      default:
        return '';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gradient-to-b from-background to-muted/20 shadow-lg border-muted">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-start space-x-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Melhorar Descrição com IA</DialogTitle>
          </div>
          <DialogDescription className="text-base opacity-90">
            Gere uma descrição otimizada para conversão usando Inteligência Artificial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seleção de modo */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none">Selecione o modo de melhoria:</h3>
            
            <RadioGroup 
              defaultValue="standard" 
              value={improveMode}
              onValueChange={(value) => setImproveMode(value as ImproveMode)}
              className="grid grid-cols-2 gap-4"
              disabled={isImproving}
            >
              <Label
                htmlFor="standard"
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                  improveMode === "standard" ? "border-primary" : ""
                )}
              >
                <RadioGroupItem value="standard" id="standard" className="sr-only" />
                <div className="flex flex-col items-center gap-1.5">
                  <Wand2 className="mb-2 h-6 w-6 text-primary" />
                  <span className="font-medium">Padrão</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">Gratuito</Badge>
                </div>
                <div className="mt-2 text-xs text-center text-muted-foreground px-2">
                  Melhoria básica da descrição com estrutura AIDA simplificada
                </div>
              </Label>
              
              <Label
                htmlFor="pro_copy"
                className={cn(
                  "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                  improveMode === "pro_copy" ? "border-primary" : ""
                )}
              >
                <RadioGroupItem value="pro_copy" id="pro_copy" className="sr-only" />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <Sparkles className="mb-2 h-6 w-6 text-purple-500" />
                    <div className="absolute -top-1 -right-1">
                      <Gift className="h-3 w-3 text-purple-600" />
                    </div>
                  </div>
                  <span className="font-medium">Profissional</span>
                  <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-none">Recomendado</Badge>
                </div>
                <div className="mt-2 text-xs text-center text-muted-foreground px-2">
                  Copy AIDA profissional extensa (800+ palavras) com gatilhos de conversão avançados
                </div>
              </Label>
            </RadioGroup>
          </div>
          
          {/* Informações sobre o modo selecionado */}
          <div className={cn(
            "bg-blue-50 border border-blue-100 rounded-md p-4 text-blue-800",
            improveMode === "pro_copy" ? "bg-purple-50 border-purple-100 text-purple-800" : ""
          )}>
            {improveMode === 'standard' && (
              <>
                <p className="text-sm">
                  <strong>Importante:</strong> A descrição atual do produto será substituída por uma versão otimizada 
                  gerada por IA, seguindo a estrutura AIDA (Atenção, Interesse, Desejo, Ação).
                </p>
                <p className="text-sm mt-2">
                  A nova descrição incluirá:
                </p>
                <ul className="text-sm mt-1 ml-5 list-disc">
                  <li>Um gancho forte para capturar a atenção</li>
                  <li>Benefícios apresentados de forma emocional e lógica</li>
                  <li>Provas sociais para gerar credibilidade</li>
                  <li>Chamada para ação persuasiva</li>
                </ul>
              </>
            )}
            
            {improveMode === 'pro_copy' && (
              <>
                <p className="text-sm">
                  <strong>Modo Profissional:</strong> Sua descrição será completamente reescrita por um sistema de 
                  IA avançado que imita o trabalho de um copywriter profissional especializado em e-commerce.
                </p>
                <p className="text-sm mt-2">
                  O texto gerado será:
                </p>
                <ul className="text-sm mt-1 ml-5 list-disc">
                  <li>Extremamente detalhado (800+ palavras)</li>
                  <li>Estruturado com HTML semântico (h2, h3, listas, etc.)</li>
                  <li>Organizado com a estrutura AIDA profissional</li>
                  <li>Enriquecido com gatilhos de persuasão avançados</li>
                  <li>Otimizado para melhorar a taxa de conversão</li>
                  <li>Com chamada à ação poderosa no final</li>
                </ul>
                <p className="text-sm mt-2 italic">
                  Este processo pode levar um pouco mais de tempo devido à geração de conteúdo mais elaborado.
                </p>
              </>
            )}
          </div>

          {/* Barra de progresso da melhoria */}
          {improvementProgress > 0 && (
            <div className="space-y-3 py-2 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {improvementStatus === 'preparing' || improvementStatus === 'improving' || improvementStatus === 'saving' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : improvementStatus === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {getStatusMessage()}
                  </span>
                </div>
                <span className={cn(
                  "font-medium text-sm",
                  improvementStatus === 'completed' ? "text-green-500" : 
                  improvementStatus === 'error' ? "text-destructive" : 
                  "text-primary"
                )}>
                  {improvementProgress}%
                </span>
              </div>
              <div className="relative h-2 w-full bg-muted overflow-hidden rounded-full">
                <div 
                  className={cn(
                    "absolute h-full transition-all duration-300 ease-out rounded-full",
                    improvementStatus === 'completed' ? "bg-green-500" : 
                    improvementStatus === 'error' ? "bg-destructive" : 
                    "bg-primary"
                  )}
                  style={{ width: `${improvementProgress}%` }}
                >
                  {/* Efeito de gradiente animado para dar sensação de movimento */}
                  {isImproving && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImproving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImproveDescription} 
            disabled={isImproving}
            className={cn(
              "relative overflow-hidden",
              improveMode === "pro_copy" ? "bg-purple-600 hover:bg-purple-700" : "bg-primary",
              improvementStatus === 'completed' ? "bg-green-600 hover:bg-green-700" : ""
            )}
          >
            {isImproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {improveMode === 'pro_copy' ? 'Gerando copy profissional...' : 'Melhorando descrição...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {improveMode === 'pro_copy' ? 'Gerar Copy Profissional' : 'Melhorar com IA'}
              </>
            )}
            
            {/* Efeito de gradiente animado no botão durante o processamento */}
            {isImproving && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 