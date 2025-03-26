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
import { updateReview } from '@/lib/supabase';

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

    try {
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

      if (!response.ok) {
        throw new Error(data.error || 'Falha na tradução');
      }

      if (!data.success || !data.translations) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Salvar automaticamente as traduções sem mostrar preview
      await handleSave(data.translations);
      
      toast.success(`${reviews.length === 1 ? 'Avaliação traduzida' : 'Avaliações traduzidas'} para ${getLanguageName(targetLanguage)}`);
      
      // Fechar o diálogo automaticamente após salvar
      onClose();
    } catch (error) {
      console.error('Erro na tradução:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao traduzir o conteúdo');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async (translations: Array<{id: string; translatedContent: string}>) => {
    try {
      // Atualizar cada review com o conteúdo traduzido
      const updatePromises = translations.map(async (translation) => {
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
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