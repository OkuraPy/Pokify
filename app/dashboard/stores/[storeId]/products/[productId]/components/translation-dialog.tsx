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
import { Loader2, ArrowRight, Languages, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Idiomas suportados
const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
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
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [translationStatus, setTranslationStatus] = useState<'idle' | 'translating' | 'success' | 'error'>('idle');

  const handleTranslate = async () => {
    if (!targetLanguage) {
      toast.error('Selecione um idioma');
      return;
    }

    setIsTranslating(true);
    setTranslationStatus('translating');

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
        setTranslationStatus('error');
        throw new Error(data.error || 'Falha na tradução');
      }

      if (!data.success || !data.translations) {
        setTranslationStatus('error');
        throw new Error('Resposta inválida do servidor');
      }

      const translatedTitle = data.translations.find((t: any) => t.id === 'title')?.text || '';
      const translatedDesc = data.translations.find((t: any) => t.id === 'description')?.text || '';

      setTranslatedData({
        title: translatedTitle,
        description: translatedDesc
      });
      
      setTranslationStatus('success');
      setActiveTab('preview');

      // Salvar automaticamente
      await handleSave({
        title: translatedTitle,
        description: translatedDesc
      });
      
      toast.success('Tradução concluída com sucesso!');
    } catch (error) {
      console.error('Erro na tradução:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao traduzir o conteúdo');
      setTranslationStatus('error');
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

  const getTargetLanguageName = () => {
    return languages.find(lang => lang.code === targetLanguage)?.name || 'Desconhecido';
  };

  const getTargetLanguageFlag = () => {
    return languages.find(lang => lang.code === targetLanguage)?.flag || '🌐';
  };

  const getTargetLanguageFullDisplay = () => {
    const lang = languages.find(lang => lang.code === targetLanguage);
    return lang ? `${lang.flag} ${lang.name}` : '🌐 Desconhecido';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        {/* Header gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Languages className="h-6 w-6" />
            <DialogTitle className="text-xl font-semibold">Tradução Automática</DialogTitle>
          </div>
          <DialogDescription className="text-blue-100 opacity-90">
            Traduza instantaneamente o título e descrição do seu produto utilizando IA
          </DialogDescription>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'config' | 'preview')} className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="config" className="rounded-md">Configurar</TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="rounded-md"
                disabled={translationStatus !== 'success'}
              >
                Prévia
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="config" className="p-6 pt-4 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1.5">Idioma original</p>
                  <div className="flex items-center gap-2 text-gray-800 font-medium">
                    <span className="text-lg">🇧🇷</span> Português
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 mb-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1.5">Traduzir para</p>
                  <Select 
                    value={targetLanguage} 
                    onValueChange={setTargetLanguage}
                  >
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span> {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Conteúdo a ser traduzido</h3>
              <div className="border rounded-lg divide-y">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Título do produto</p>
                    <p className="text-sm text-gray-500 truncate">{product.title}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                    Incluído
                  </Badge>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Descrição</p>
                    <p className="text-sm text-gray-500 truncate">{product.description || "Sem descrição"}</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                    Incluído
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traduzindo para {getTargetLanguageName()}...
                  </>
                ) : translationStatus === 'success' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Tradução concluída
                  </>
                ) : translationStatus === 'error' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar novamente
                  </>
                ) : (
                  <>
                    <Languages className="mr-2 h-4 w-4" />
                    Traduzir para {getTargetLanguageName()}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="p-6 pt-4 space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-800">Prévia da tradução para {getTargetLanguageFullDisplay()}</h3>
              </div>
              <p className="text-sm text-blue-600">Veja abaixo como ficará seu produto após a tradução.</p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Título</h4>
                <p className="text-base font-medium border-l-2 border-blue-500 pl-3 py-1">{translatedData.title}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Descrição</h4>
                <div 
                  className="prose prose-sm max-w-none border-l-2 border-blue-500 pl-3 py-1" 
                  dangerouslySetInnerHTML={{ __html: translatedData.description }}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveTab('config')}
                className="border-gray-200"
              >
                Voltar para configuração
              </Button>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
