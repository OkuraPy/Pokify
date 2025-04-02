'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Languages, Check, Globe, ArrowRight, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

// Idiomas suportados com códigos de bandeira
const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷', region: 'Brasil' },
  { code: 'en', name: 'English', flag: '🇺🇸', region: 'United States' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'España' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', region: 'France' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', region: 'Deutschland' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', region: 'Italia' }
];

// Palavras comuns em cada idioma para detecção
const commonWords: Record<string, string[]> = {
  en: [
    'the', 'of', 'and', 'with', 'for', 'your', 'this', 'that', 'body', 'from', 'our', 'you', 'will', 'to', 'is', 'in',
    'it', 'on', 'at', 'by', 'we', 'as', 'an', 'all', 'new', 'more', 'about', 'when', 'product', 'quality', 'features',
    'can', 'make', 'use', 'high', 'color', 'size', 'are', 'provides', 'design', 'perfect', 'material', 'shipping'
  ],
  pt: [
    'de', 'para', 'com', 'seu', 'sua', 'você', 'este', 'esta', 'nosso', 'nossa', 'e', 'ou', 'em', 'um', 'uma', 'na', 'no',
    'do', 'da', 'dos', 'das', 'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'são', 'está', 'produto', 'qualidade', 'cor',
    'tamanho', 'frete', 'envio', 'entre', 'pode', 'podem', 'possui', 'foram', 'será', 'temos', 'novo', 'nova', 'entrega'
  ],
  es: [
    'el', 'la', 'los', 'las', 'de', 'para', 'con', 'tu', 'su', 'este', 'esta', 'nuestro', 'nuestra', 'y', 'o', 'en', 'un', 'una',
    'del', 'al', 'por', 'como', 'pero', 'más', 'todo', 'que', 'cuando', 'producto', 'calidad', 'color',
    'tamaño', 'envío', 'entre', 'puede', 'nuevo', 'nueva', 'tiene', 'tienen', 'muy', 'bien', 'mejor'
  ],
  fr: [
    'le', 'la', 'les', 'des', 'avec', 'pour', 'votre', 'ce', 'cette', 'notre', 'nos', 'et', 'ou', 'en', 'un', 'une',
    'du', 'au', 'aux', 'par', 'sur', 'dans', 'qui', 'que', 'quand', 'produit', 'qualité', 'couleur',
    'taille', 'livraison', 'entre', 'peut', 'nouveau', 'nouvelle', 'ont', 'sont', 'est', 'plus'
  ],
  de: [
    'der', 'die', 'das', 'mit', 'für', 'dein', 'deine', 'dieser', 'diese', 'unser', 'unsere', 'und', 'oder', 'ein', 'eine',
    'von', 'zu', 'zur', 'bei', 'aus', 'auf', 'wenn', 'produkt', 'qualität', 'farbe',
    'größe', 'versand', 'zwischen', 'kann', 'können', 'neue', 'neuer', 'hat', 'haben'
  ],
  it: [
    'il', 'la', 'i', 'le', 'di', 'per', 'con', 'tuo', 'tua', 'questo', 'questa', 'nostro', 'nostra', 'e', 'o', 'un', 'una',
    'del', 'della', 'dello', 'degli', 'al', 'alla', 'allo', 'agli', 'da', 'prodotto', 'qualità', 'colore',
    'dimensione', 'spedizione', 'tra', 'può', 'possono', 'nuovo', 'nuova', 'ha', 'hanno'
  ]
};

interface TranslationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    description: string | null;
    language?: string; // Idioma atual do produto, se disponível
  };
  onSaveTranslation: (data: { title?: string; description?: string; language?: string }) => Promise<void>;
}

export function TranslationDialog({ 
  isOpen, 
  onClose, 
  product,
  onSaveTranslation
}: TranslationDialogProps) {
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<string>('pt');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translationStatus, setTranslationStatus] = useState<'idle' | 'preparing' | 'translating' | 'saving' | 'completed' | 'error'>('idle');

  // Detecta o idioma do texto baseado nas palavras comuns
  const detectLanguage = (text: string): string => {
    if (!text) return 'pt'; // Padrão se não houver texto
    
    const lowercaseText = text.toLowerCase();
    const scores: Record<string, number> = {};
    
    // Inicializa pontuações para todos os idiomas
    Object.keys(commonWords).forEach(lang => {
      scores[lang] = 0;
    });
    
    // Calcula pontuação para cada idioma
    Object.entries(commonWords).forEach(([lang, words]) => {
      words.forEach(word => {
        // Conta ocorrências de cada palavra com limites de palavra
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowercaseText.match(regex);
        if (matches) {
          // Damos mais peso a palavras que são determinantes para o idioma
          let weight = 1;
          // Palavras mais curtas podem aparecer em vários idiomas, damos menos peso
          if (word.length <= 2) weight = 0.5;
          // Palavras mais longas são mais específicas de um idioma
          if (word.length >= 5) weight = 1.5;
          
          scores[lang] += matches.length * weight;
        }
      });
    });
    
    // Imprime as pontuações para depuração
    console.log('Pontuações de detecção de idioma:', scores);
    
    // Encontra idioma com maior pontuação
    let detectedLang = 'pt';
    let maxScore = 0;
    
    Object.entries(scores).forEach(([lang, score]) => {
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    });
    
    // Se a pontuação máxima for muito baixa (menor que 2), retorne o padrão
    if (maxScore < 2) {
      console.log('Pontuação muito baixa, usando idioma padrão (pt)');
      return 'pt';
    }
    
    console.log(`Idioma detectado: ${detectedLang} com pontuação: ${maxScore}`);
    return detectedLang;
  };

  // Detecta o idioma quando o diálogo é aberto
  useEffect(() => {
    if (isOpen && product) {
      console.log('Dialog aberto, produto:', { 
        title: product.title?.substring(0, 30),
        description: product.description?.substring(0, 30),
        language: product.language
      });
      
      // Usar setTimeout para garantir que a detecção aconteça após a renderização
      setTimeout(() => {
        try {
          // Se o produto já tem um idioma definido, use-o
          if (product.language) {
            console.log('Usando idioma já definido:', product.language);
            setDetectedSourceLanguage(product.language);
          } else {
            // Caso contrário, detecte o idioma a partir do título e descrição
            const title = product.title || '';
            const description = product.description || '';
            
            console.log('Detectando idioma a partir de:', {
              titleLength: title.length,
              descriptionLength: description?.length || 0,
              titleSample: title.substring(0, 50),
              descriptionSample: description?.substring(0, 50)
            });
            
            // Se temos título e descrição muito curtos, dificulta a detecção
            if (title.length < 5 && (!description || description.length < 10)) {
              console.log('Texto muito curto para detecção confiável, usando padrão (pt)');
              setDetectedSourceLanguage('pt');
              return;
            }
            
            // Combina título e descrição para melhor amostra
            // Removemos caracteres especiais e números para focar no texto
            const combinedText = `${title} ${description}`.replace(/[0-9.,$%*\-_+()[\]{}:;!?\/\\|~^]/g, ' ');
            
            // Verifica se temos texto suficiente após limpeza
            if (combinedText.trim().length < 15) {
              console.log('Texto insuficiente após limpeza, usando padrão (pt)');
              setDetectedSourceLanguage('pt');
              return;
            }
            
            const detectedLang = detectLanguage(combinedText);
            console.log('Idioma detectado final:', detectedLang);
            setDetectedSourceLanguage(detectedLang);
          }
        } catch (error) {
          console.error('Erro na detecção de idioma:', error);
          // Em caso de erro, use o padrão
          setDetectedSourceLanguage('pt');
        }
      }, 0);
    }
  }, [isOpen, product]);

  // Configura o idioma de destino com base no idioma de origem detectado
  useEffect(() => {
    if (detectedSourceLanguage) {
      console.log('Configurando idioma de destino baseado em:', detectedSourceLanguage);
      // Define o idioma de destino como algo diferente do idioma de origem
      if (detectedSourceLanguage === 'pt') {
        setTargetLanguage('en'); 
      } else if (detectedSourceLanguage === 'en') {
        setTargetLanguage('pt');
      } else {
        // Para outros idiomas, defina inglês ou português como padrão
        setTargetLanguage(detectedSourceLanguage === 'en' ? 'pt' : 'en');
      }
    }
  }, [detectedSourceLanguage]);

  // Resetar o progresso quando o diálogo é fechado
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setTranslationProgress(0);
        setTranslationStatus('idle');
      }, 300);
    }
  }, [isOpen]);

  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error('Selecione um idioma');
      return;
    }

    setIsTranslating(true);
    setTranslationStatus('preparing');
    setTranslationProgress(10);

    // Atualizar o progresso gradualmente para dar feedback visual
    const progressInterval = setInterval(() => {
      setTranslationProgress(prev => {
        if (prev >= 90) {
          return 90; // Manter em 90% até a conclusão
        }
        return prev + Math.floor(Math.random() * 3) + 1;
      });
    }, 600);

    try {
      setTranslationStatus('translating');
      
      console.log('Enviando requisição de tradução:', {
        textos: { 
          title: product.title.substring(0, 30) + '...',
          description: (product.description || '').substring(0, 30) + '...'
        },
        idioma_destino: targetLanguage,
        idioma_origem: detectedSourceLanguage
      });
      
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: [
            { id: 'title', text: product.title },
            { id: 'description', text: product.description || '' }
          ],
          targetLanguage,
          sourceLanguage: detectedSourceLanguage // Enviar o idioma detectado para a API
        })
      });

      const data = await response.json();
      
      console.log('Resposta da API de tradução:', {
        status: response.status,
        success: data.success,
        translations: data.translations ? 'Traduções presentes' : 'Sem traduções',
        tradução_título: data.translations && data.translations.length > 0 ? 
          data.translations.find((t: any) => t.id === 'title')?.text?.substring(0, 30) + '...' : 'Nenhuma'
      });

      if (!response.ok) {
        throw new Error(data.error || 'Falha na tradução');
      }

      if (!data.success || !data.translations) {
        throw new Error('Resposta inválida do servidor');
      }

      setTranslationStatus('saving');
      setTranslationProgress(95);

      const translatedTitle = data.translations.find((t: any) => t.id === 'title')?.text || '';
      const translatedDesc = data.translations.find((t: any) => t.id === 'description')?.text || '';
      
      // Salvar automaticamente sem mostrar prévia
      await handleSave({
        title: translatedTitle,
        description: translatedDesc
        // Removendo language para garantir compatibilidade com o banco
      });
      
      clearInterval(progressInterval);
      setTranslationProgress(100);
      setTranslationStatus('completed');
      
      toast.success(`Produto traduzido para ${getLanguageName(targetLanguage)}`);
      
      // Pequeno atraso para o usuário ver o progresso concluído
      setTimeout(() => {
        // Fechar o diálogo automaticamente após salvar
        onClose();
      }, 800);
    } catch (error) {
      clearInterval(progressInterval);
      setTranslationStatus('error');
      setTranslationProgress(0);
      console.error('Erro na tradução:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao traduzir o conteúdo');
    } finally {
      clearInterval(progressInterval);
      setIsTranslating(false);
    }
  };

  const handleSave = async (data: { title: string; description: string; language?: string }) => {
    try {
      console.log('TranslationDialog: Tentando salvar dados traduzidos:', data);
      
      // Verificar se os dados de tradução não estão vazios
      if (!data.title.trim() || !data.description.trim()) {
        console.error('TranslationDialog: Dados de tradução inválidos ou vazios');
        throw new Error('Os dados de tradução parecem estar vazios ou inválidos');
      }

      // Garantir que o idioma de destino seja incluído nos dados salvos
      const saveData = {
        title: data.title,
        description: data.description,
        language: targetLanguage // Incluir o idioma de destino explicitamente
      };
      
      console.log('TranslationDialog: Dados finais a serem salvos:', saveData);
      
      // Chamar a função de callback para salvar a tradução
      await onSaveTranslation(saveData);
      
      // Verificar se a função foi concluída com sucesso
      console.log('TranslationDialog: Dados salvos com sucesso');
      
      // Forçar a atualização da página após um pequeno delay para garantir que o banco de dados foi atualizado
      setTimeout(() => {
        // Fechar o diálogo imediatamente
        onClose();
        
        // Mostrar mensagem de sucesso
        toast.success(`Tradução para ${getLanguageName(targetLanguage)} aplicada com sucesso`);
        
        // Recarregar a página para garantir que todos os dados estejam atualizados
        window.location.reload();
      }, 800);
      
      return Promise.resolve();
    } catch (error) {
      console.error('TranslationDialog: Erro ao salvar a tradução:', error);
      toast.error('Erro ao salvar a tradução. Por favor, tente novamente.');
      return Promise.reject(error);
    }
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || 'Desconhecido';
  };

  const getLanguageInfo = (code: string) => {
    return languages.find(lang => lang.code === code);
  };

  // Função para obter a mensagem de status baseada no estado atual
  const getStatusMessage = () => {
    switch (translationStatus) {
      case 'preparing':
        return 'Preparando tradução...';
      case 'translating':
        return 'Traduzindo conteúdo...';
      case 'saving':
        return 'Salvando tradução...';
      case 'completed':
        return 'Tradução concluída!';
      case 'error':
        return 'Erro na tradução';
      default:
        return '';
    }
  };

  // Função para obter o ícone de status
  const getStatusIcon = () => {
    switch (translationStatus) {
      case 'preparing':
      case 'translating':
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };
  
  const selectedLanguage = getLanguageInfo(targetLanguage);
  const sourceLanguage = getLanguageInfo(detectedSourceLanguage);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gradient-to-b from-background to-muted/20 shadow-lg border-muted">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-start space-x-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Languages className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">Traduzir Produto</DialogTitle>
          </div>
          <DialogDescription className="text-base opacity-90">
            Traduza o título e descrição do produto para outro idioma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Visual source to target language */}
          <div className="flex items-center justify-center gap-3 pt-2 pb-3">
            <div className="flex flex-col items-center">
              {sourceLanguage && (
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 border-primary/20 bg-primary/5">
                  <span className="text-lg">{sourceLanguage.flag}</span>
                  <span className="font-medium">{sourceLanguage.name}</span>
                </Badge>
              )}
              <span className="text-xs text-muted-foreground mt-1">Idioma detectado</span>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground mx-2" />
            
            <div className="flex flex-col items-center">
              {selectedLanguage && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5",
                    isTranslating ? "border-primary/40 bg-primary/10" : "border-primary/20 bg-primary/5",
                    translationStatus === 'completed' ? "border-green-500/30 bg-green-500/10" : ""
                  )}
                >
                  <span className="text-lg">{selectedLanguage.flag}</span>
                  <span className="font-medium">{selectedLanguage.name}</span>
                </Badge>
              )}
              <span className="text-xs text-muted-foreground mt-1">Idioma de destino</span>
            </div>
          </div>

          {/* Nota sobre idioma detectado */}
          {sourceLanguage && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Idioma detectado automaticamente</p>
                  <p className="mt-1">
                    Detectamos que seu produto está em <strong>{sourceLanguage.name}</strong>. Se esta informação estiver incorreta, 
                    por favor edite seu produto manualmente e defina o idioma correto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seletor de idioma */}
          <div className="grid gap-2">
            <Label htmlFor="language" className="text-sm font-medium">
              Selecione o idioma de destino:
            </Label>
            <Select
              value={targetLanguage}
              onValueChange={setTargetLanguage}
              disabled={isTranslating}
            >
              <SelectTrigger id="language" className="h-11 bg-background border-muted-foreground/20">
                <SelectValue placeholder="Selecione o idioma">
                  {selectedLanguage && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedLanguage.flag}</span>
                      <span>{selectedLanguage.name}</span>
                      <span className="text-xs text-muted-foreground">({selectedLanguage.region})</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {languages
                  .filter(lang => lang.code !== detectedSourceLanguage) // Filtra o idioma de origem
                  .map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                        <span className="text-xs text-muted-foreground">({lang.region})</span>
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Card de informações sobre qualidade da tradução */}
          <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 rounded-md p-3.5 text-sm">
            <div className="flex gap-2">
              <Globe className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sky-900 dark:text-sky-300 font-medium">Tradução de alta qualidade</p>
                <p className="text-sky-700 dark:text-sky-400 mt-1 text-xs leading-relaxed">
                  Nosso sistema utiliza IA avançada para traduzir o conteúdo, mantendo o tom e as
                  características de marketing específicas do seu produto para o mercado de destino.
                </p>
              </div>
            </div>
          </div>

          {/* Barra de progresso da tradução com design melhorado */}
          {translationProgress > 0 && (
            <div className="space-y-3 py-2 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">
                    {getStatusMessage()}
                  </span>
                </div>
                <span className={cn(
                  "font-medium text-sm",
                  translationStatus === 'completed' ? "text-green-500" : 
                  translationStatus === 'error' ? "text-destructive" : 
                  "text-primary"
                )}>
                  {translationProgress}%
                </span>
              </div>
              <div className="relative h-2 w-full bg-muted overflow-hidden rounded-full">
                <div 
                  className={cn(
                    "absolute h-full transition-all duration-300 ease-out rounded-full",
                    translationStatus === 'completed' ? "bg-green-500" : 
                    translationStatus === 'error' ? "bg-destructive" : 
                    "bg-primary"
                  )}
                  style={{ width: `${translationProgress}%` }}
                >
                  {/* Efeito de gradiente animado para dar sensação de movimento */}
                  {isTranslating && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isTranslating}
            className="border-muted-foreground/20"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleTranslate} 
            disabled={isTranslating || targetLanguage === detectedSourceLanguage}
            className={cn(
              "relative overflow-hidden",
              translationStatus === 'completed' ? "bg-green-600 hover:bg-green-700" : "",
              targetLanguage === detectedSourceLanguage ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : translationStatus === 'completed' ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Concluído
              </>
            ) : (
              <>
                <Languages className="mr-2 h-4 w-4" />
                Traduzir para {selectedLanguage?.name || ''}
              </>
            )}
            
            {/* Efeito de gradiente animado no botão durante o processamento */}
            {isTranslating && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Adicione ao seu CSS global ou crie um novo arquivo CSS para isso
const globalStyles = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;
