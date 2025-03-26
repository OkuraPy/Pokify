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
import { Loader2, Languages, Check } from 'lucide-react';
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
        description: translatedDesc
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Languages className="h-5 w-5 text-blue-500" />
            Traduzir Produto
          </DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="py-4 space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
              <p>Traduza automaticamente o título e descrição do produto para o idioma desejado.</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Selecione o idioma de destino</label>
                <Select 
                  value={targetLanguage} 
                  onValueChange={setTargetLanguage}
                >
                  <SelectTrigger className="w-full">
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
        ) : (
          <div className="py-4 space-y-4">
            <div className="border-l-4 border-green-500 pl-3 py-1 bg-green-50 text-green-800 rounded-r-md">
              <p className="font-medium">Tradução concluída com sucesso</p>
              <p className="text-sm text-green-600">O produto foi atualizado para {getLanguageName(targetLanguage)}</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Título Traduzido</h3>
                <p className="p-3 bg-gray-50 rounded-md">{translatedData.title}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Descrição Traduzida</h3>
                <div 
                  className="p-3 bg-gray-50 rounded-md prose prose-sm max-w-none" 
                  dangerouslySetInnerHTML={{ __html: translatedData.description }}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!showPreview ? (
            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="w-full bg-blue-600 hover:bg-blue-700"
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
          ) : (
            <Button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-2 h-4 w-4" />
              Concluído
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
