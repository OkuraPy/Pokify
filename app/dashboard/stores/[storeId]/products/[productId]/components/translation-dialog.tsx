'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// Idiomas suportados
const languages = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' }
];

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

export function TranslationDialog({ 
  isOpen, 
  onClose, 
  product,
  onSaveTranslation
}: TranslationDialogProps) {
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState<{
    title: string;
    description: string;
  }>({ title: '', description: '' });

  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error('Selecione um idioma');
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/translate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: [
            { id: 'title', text: product.title },
            { id: 'description', text: product.description || '' }
          ],
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

      setTranslatedData({
        title: data.translations.find((t: any) => t.id === 'title')?.text || '',
        description: data.translations.find((t: any) => t.id === 'description')?.text || ''
      });

      // Salvar automaticamente
      await handleSave(data.translations);
      
      toast.success('Tradução concluída com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro na tradução:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao traduzir o conteúdo');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async (translations: any[]) => {
    try {
      await onSaveTranslation({
        title: translations.find((t: any) => t.id === 'title')?.text,
        description: translations.find((t: any) => t.id === 'description')?.text
      });
    } catch (error) {
      toast.error('Erro ao salvar a tradução');
      console.error('Erro ao salvar:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Traduzir Produto</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          <div className="flex-1 flex items-center gap-2 text-sm">
            <div className="min-w-[100px] text-muted-foreground">
              De: Português
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Select 
                value={targetLanguage} 
                onValueChange={setTargetLanguage}
              >
                <SelectTrigger>
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
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="w-full"
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traduzindo...
              </>
            ) : (
              'Traduzir e Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
