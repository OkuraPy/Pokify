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
import { Loader2, Languages, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

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
    marketingNotes?: string;
  }>({ title: '', description: '' });
  const [showPreview, setShowPreview] = useState(false);

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

      const translatedTitle = data.translations.find((t: any) => t.id === 'title')?.text || '';
      const translatedDesc = data.translations.find((t: any) => t.id === 'description')?.text || '';

      setTranslatedData({
        title: translatedTitle,
        description: translatedDesc,
        marketingNotes: data.marketingNotes
      });
      
      setShowPreview(true);
      
      // Salvar automaticamente
      await handleSave({
        title: translatedTitle,
        description: translatedDesc
      });
      
      toast.success(`Produto traduzido para ${getLanguageName(targetLanguage)}`);
    } catch (error) {
      console.error('Erro na tradução:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao traduzir o conteúdo');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async (data: { title: string; description: string }) => {
    try {
      await onSaveTranslation({
        title: data.title,
        description: data.description
      });
    } catch (error) {
      toast.error('Erro ao salvar a tradução');
      console.error('Erro ao salvar:', error);
    }
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || 'Desconhecido';
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Traduzir Produto</DialogTitle>
          <DialogDescription>
            Traduza o título e descrição do produto para outro idioma
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="language">Idioma de destino</Label>
            <Select
              value={targetLanguage}
              onValueChange={setTargetLanguage}
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

          {showPreview && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Título Traduzido</Label>
                <div className="p-2 bg-muted rounded-md">
                  {translatedData.title}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Descrição Traduzida</Label>
                <div className="p-2 bg-muted rounded-md whitespace-pre-wrap">
                  {translatedData.description}
                </div>
              </div>

              {translatedData.marketingNotes && (
                <div className="grid gap-2">
                  <Label>Notas de Adaptação</Label>
                  <div className="p-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                    {translatedData.marketingNotes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
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
                Traduzir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
