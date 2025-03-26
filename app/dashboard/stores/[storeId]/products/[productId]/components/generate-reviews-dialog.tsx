import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Star } from 'lucide-react';

interface GenerateReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isImporting: boolean;
  reviewCount: number;
  setReviewCount: (count: number) => void;
  aiAverageRating: number;
  setAiAverageRating: (rating: number) => void;
  reviewLanguage: string;
  setReviewLanguage: (language: string) => void;
  onGenerate: () => Promise<void>;
}

export function GenerateReviewsDialog({
  open,
  onOpenChange,
  isImporting,
  reviewCount,
  setReviewCount,
  aiAverageRating,
  setAiAverageRating,
  reviewLanguage,
  setReviewLanguage,
  onGenerate
}: GenerateReviewsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerar Reviews com IA</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure as opções para gerar avaliações com IA para este produto.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid gap-2 mb-3">
            <Label htmlFor="reviewCount">Quantidade de Avaliações</Label>
            <div className="flex items-center">
              <span className="w-10 text-sm">1</span>
              <Slider
                id="reviewCount"
                className="flex-1 mx-3"
                value={[reviewCount]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => setReviewCount(value[0])}
              />
              <span className="w-10 text-sm text-right">{reviewCount}</span>
            </div>
          </div>
          
          <div className="grid gap-2 mb-3">
            <Label htmlFor="averageRating">Média de Avaliação</Label>
            <div className="flex items-center">
              <span className="w-10 text-sm">1.0</span>
              <Slider 
                id="averageRating"
                className="flex-1 mx-3"
                value={[aiAverageRating]} 
                min={1} 
                max={5} 
                step={0.1} 
                onValueChange={(value) => setAiAverageRating(value[0])} 
              />
              <span className="flex items-center gap-1 text-sm">
                {aiAverageRating.toFixed(1)}
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </span>
            </div>
          </div>
          
          <div className="grid gap-2 mb-3">
            <Label htmlFor="reviewLanguage">Idioma das Avaliações</Label>
            <Select 
              value={reviewLanguage} 
              onValueChange={setReviewLanguage}
            >
              <SelectTrigger id="reviewLanguage">
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portuguese">Português</SelectItem>
                <SelectItem value="english">Inglês</SelectItem>
                <SelectItem value="spanish">Espanhol</SelectItem>
                <SelectItem value="french">Francês</SelectItem>
                <SelectItem value="german">Alemão</SelectItem>
                <SelectItem value="italian">Italiano</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecione o idioma em que as avaliações serão geradas
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">Avaliações Persuasivas com IA</p>
            <p className="text-muted-foreground">
              Gera reviews realistas e persuasivos, utilizando dados específicos do produto.
              As avaliações seguem uma abordagem de copywriting que ressalta as qualidades do produto
              e aborda possíveis objeções de compra.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onGenerate} disabled={isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Reviews
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 