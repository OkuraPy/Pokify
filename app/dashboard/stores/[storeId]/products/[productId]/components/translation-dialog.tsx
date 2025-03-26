'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Loader2, Save, RotateCw, History, Globe, Check, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Import the languages from the API route
import { languages } from '@/app/api/translate/route';

interface TranslationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    description: string | null;
  };
  onSaveTranslation: (data: { title?: string; description?: string }) => Promise<void>;
}

interface TranslationHistoryItem {
  timestamp: Date;
  language: string;
  title?: string;
  description?: string;
}

export function TranslationDialog({ 
  isOpen, 
  onClose, 
  product,
  onSaveTranslation
}: TranslationDialogProps) {
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [translateTitle, setTranslateTitle] = useState(true);
  const [translateDescription, setTranslateDescription] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedDescription, setTranslatedDescription] = useState('');
  const [hasTranslated, setHasTranslated] = useState(false);
  const [autoSave, setAutoSave] = useState(false); // Default to manual save
  
  // Novo estado para histórico de traduções
  const [translationHistory, setTranslationHistory] = useState<TranslationHistoryItem[]>([]);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened, resetting state');
      setTargetLanguage('en');
      setTranslateTitle(true);
      setTranslateDescription(true);
      setTranslatedTitle('');
      setTranslatedDescription('');
      setHasTranslated(false);
      setAutoSave(false);
      
      // Carregar histórico do localStorage
      const savedHistory = localStorage.getItem(`translation_history_${product.id}`);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          // Converter strings de data para objetos Date
          const historyWithDates = parsedHistory.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setTranslationHistory(historyWithDates);
        } catch (e) {
          console.error('Erro ao carregar histórico de traduções:', e);
          setTranslationHistory([]);
        }
      }
    }
  }, [isOpen, product.id]);

  // Log when language changes
  useEffect(() => {
    if (targetLanguage && isOpen) {
      console.log('Language changed to:', targetLanguage);
    }
  }, [targetLanguage, isOpen]);

  // Auto-save effect - when translation is complete, save automatically
  useEffect(() => {
    const autoSaveTranslation = async () => {
      if (hasTranslated && autoSave) {
        console.log('Auto-saving translation...');
        await handleSave();
      }
    };

    if (hasTranslated && autoSave) {
      autoSaveTranslation();
    }
  }, [hasTranslated, autoSave]);

  const handleTranslate = async () => {
    if (!translateTitle && !translateDescription) {
      toast.error('Selecione pelo menos um campo para traduzir');
      return;
    }

    setIsTranslating(true);
    console.log('Starting translation process');
    console.log('Translation settings:', { 
      targetLanguage, 
      translateTitle, 
      translateDescription 
    });

    try {
      // Translate title if selected
      if (translateTitle && product.title) {
        console.log('Translating title:', product.title);
        const titleResponse = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: product.title,
            targetLanguage,
          }),
        });

        if (titleResponse.ok) {
          const data = await titleResponse.json();
          console.log('Title translation response:', data);
          
          // Log the translated title in console
          console.log('Translated title:');
          console.log('---START TRANSLATED TITLE---');
          console.log(data.translatedText);
          console.log('---END TRANSLATED TITLE---');
          
          setTranslatedTitle(data.translatedText);
        } else {
          const errorData = await titleResponse.json();
          console.error('Title translation error:', errorData);
          throw new Error('Falha ao traduzir o título');
        }
      }

      // Translate description if selected
      if (translateDescription && product.description) {
        console.log('Translating description (first 50 chars):', product.description?.substring(0, 50) + '...');
        const descResponse = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: product.description,
            targetLanguage,
          }),
        });

        if (descResponse.ok) {
          const data = await descResponse.json();
          console.log('Description translation response received, length:', data.translatedText?.length);
          
          // Log the translated description with line breaks preserved in console
          console.log('Translated description:');
          console.log('---START TRANSLATED DESCRIPTION---');
          console.log(data.translatedText);
          console.log('---END TRANSLATED DESCRIPTION---');
          
          // Log each line separately for better readability
          const lines = data.translatedText.split('\n');
          console.log(`Description has ${lines.length} lines:`);
          lines.forEach((line: string, index: number) => {
            console.log(`Line ${index + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
          });
          
          setTranslatedDescription(data.translatedText);
        } else {
          const errorData = await descResponse.json();
          console.error('Description translation error:', errorData);
          throw new Error('Falha ao traduzir a descrição');
        }
      }

      setHasTranslated(true);
      console.log('Translation completed successfully');
    } catch (error) {
      console.error('Error in translation process:', error);
      toast.error('Erro ao traduzir o texto');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!hasTranslated) {
      toast.error('Traduza o conteúdo antes de salvar');
      return;
    }

    setIsSaving(true);
    console.log('Saving translation');
    try {
      const updateData: { title?: string; description?: string } = {};
      
      if (translateTitle && translatedTitle) {
        updateData.title = translatedTitle;
        console.log('Saving translated title:', translatedTitle);
      }
      
      if (translateDescription && translatedDescription) {
        console.log('Saving translated description (length):', translatedDescription.length);
        updateData.description = translatedDescription;
      }
      
      await onSaveTranslation(updateData);
      
      // Adicionar ao histórico
      const historyItem: TranslationHistoryItem = {
        timestamp: new Date(),
        language: targetLanguage,
        ...(translateTitle && translatedTitle ? { title: translatedTitle } : {}),
        ...(translateDescription && translatedDescription ? { description: translatedDescription } : {})
      };
      
      const updatedHistory = [historyItem, ...translationHistory].slice(0, 10); // Manter apenas as 10 traduções mais recentes
      setTranslationHistory(updatedHistory);
      
      // Salvar histórico no localStorage
      localStorage.setItem(
        `translation_history_${product.id}`, 
        JSON.stringify(updatedHistory)
      );
      
      toast.success('Tradução salva com sucesso');
      onClose();
    } catch (error) {
      console.error('Error saving translation:', error);
      toast.error('Erro ao salvar a tradução');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTranslateTitle = async () => {
    if (!product.title) {
      toast.error('Não há título para traduzir');
      return;
    }

    setIsTranslating(true);
    console.log('Traduzindo apenas o título');

    try {
      const titleResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: product.title,
          targetLanguage,
        }),
      });

      if (titleResponse.ok) {
        const data = await titleResponse.json();
        console.log('Title translation response:', data);
        
        setTranslatedTitle(data.translatedText);
        setHasTranslated(true);
        toast.success('Título traduzido com sucesso');
      } else {
        const errorData = await titleResponse.json();
        console.error('Title translation error:', errorData);
        throw new Error('Falha ao traduzir o título');
      }
    } catch (error) {
      console.error('Error in title translation:', error);
      toast.error('Erro ao traduzir o título');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateDescription = async () => {
    if (!product.description) {
      toast.error('Não há descrição para traduzir');
      return;
    }

    setIsTranslating(true);
    console.log('Traduzindo apenas a descrição');

    try {
      const descResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: product.description,
          targetLanguage,
        }),
      });

      if (descResponse.ok) {
        const data = await descResponse.json();
        console.log('Description translation response received, length:', data.translatedText?.length);
        
        setTranslatedDescription(data.translatedText);
        setHasTranslated(true);
        toast.success('Descrição traduzida com sucesso');
      } else {
        const errorData = await descResponse.json();
        console.error('Description translation error:', errorData);
        throw new Error('Falha ao traduzir a descrição');
      }
    } catch (error) {
      console.error('Error in description translation:', error);
      toast.error('Erro ao traduzir a descrição');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tradução de Produto</DialogTitle>
          <DialogDescription>
            Traduza o título e descrição do produto para outros idiomas
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-6 py-4">
          {/* Seleção de idioma */}
          <div className="flex items-center space-x-4 pb-2 border-b">
            <Label htmlFor="targetLanguage" className="min-w-[120px]">Idioma de Destino</Label>
            <Select 
              value={targetLanguage} 
              onValueChange={setTargetLanguage}
            >
              <SelectTrigger id="targetLanguage" className="w-[200px]">
                <SelectValue placeholder="Selecione um idioma" />
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
          
          {/* Título */}
          <div className="space-y-2 pb-4 border-b">
            <div className="flex items-center justify-between">
              <Label htmlFor="originalTitle" className="text-base font-medium">Título</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTranslateTitle}
                disabled={isTranslating}
              >
                {isTranslating && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Traduzir Título
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Original</div>
                <Textarea 
                  id="originalTitle" 
                  value={product.title} 
                  readOnly 
                  className="h-20 resize-none bg-muted"
                />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Traduzido ({languages.find(l => l.code === targetLanguage)?.name})
                </div>
                <Textarea 
                  id="translatedTitle" 
                  value={translatedTitle} 
                  onChange={(e) => setTranslatedTitle(e.target.value)}
                  placeholder={isTranslating ? "Traduzindo..." : "Título traduzido"}
                  className="h-20 resize-none"
                  disabled={isTranslating}
                />
              </div>
            </div>
          </div>
          
          {/* Descrição */}
          {product.description && (
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="originalDescription" className="text-base font-medium">Descrição</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleTranslateDescription}
                  disabled={isTranslating}
                >
                  {isTranslating && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Traduzir Descrição
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 h-[300px]">
                <div className="flex flex-col h-full">
                  <div className="text-sm text-muted-foreground mb-1">Original</div>
                  <ScrollArea className="flex-1 border rounded-md bg-muted p-4">
                    <div 
                      className="prose prose-sm dark:prose-invert" 
                      dangerouslySetInnerHTML={{ __html: product.description }} 
                    />
                  </ScrollArea>
                </div>
                <div className="flex flex-col h-full">
                  <div className="text-sm text-muted-foreground mb-1">
                    Traduzido ({languages.find(l => l.code === targetLanguage)?.name})
                  </div>
                  <Textarea 
                    id="translatedDescription" 
                    value={translatedDescription} 
                    onChange={(e) => setTranslatedDescription(e.target.value)}
                    placeholder={isTranslating ? "Traduzindo..." : "Descrição traduzida"}
                    className="flex-1 min-h-0 resize-none"
                    disabled={isTranslating}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <div className="flex justify-between w-full">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTranslate}
                disabled={isTranslating}
              >
                {isTranslating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Traduzir Tudo
              </Button>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button 
                onClick={handleSave}
                disabled={!hasTranslated || isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
