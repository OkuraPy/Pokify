'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, MessageSquare, Star, Check, X, FileUp, Link, Sparkles, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getReviews, updateReview, importReviewsFromUrl, generateAIReviews } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  product_id: string;
  author: string;
  rating: number;
  content: string | null;
  date: string | null;
  images?: string[] | null;
  is_selected: boolean;
  is_published: boolean;
  created_at: string;
}

interface ReviewsListProps {
  productId: string;
  reviewsCount: number;
}

export function ReviewsList({ productId, reviewsCount }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<'csv' | 'url' | 'ai'>('ai');
  const [isImporting, setIsImporting] = useState(false);
  
  // Estados para importação via URL
  const [productUrl, setProductUrl] = useState('');
  const [platform, setPlatform] = useState<string>('aliexpress');
  
  // Estados para geração com IA
  const [reviewCount, setReviewCount] = useState(5);
  const [averageRating, setAverageRating] = useState(4.5);
  
  // Referência para input de arquivo CSV
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    loadReviews();
  }, [productId]);
  
  async function loadReviews() {
    try {
      setIsLoading(true);
      const { data, error } = await getReviews(productId);
      
      if (error) {
        console.error('Erro ao carregar avaliações:', error);
        toast.error('Erro ao carregar avaliações');
        return;
      }
      
      setReviews(data || []);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      toast.error('Erro ao carregar avaliações');
    } finally {
      setIsLoading(false);
    }
  }

  const toggleReviewSelection = async (reviewId: string, currentValue: boolean) => {
    try {
      setIsUpdating(reviewId);
      
      const { error } = await updateReview(reviewId, {
        is_selected: !currentValue
      });
      
      if (error) {
        console.error('Erro ao atualizar avaliação:', error);
        toast.error('Erro ao atualizar seleção');
        return;
      }
      
      // Atualiza o estado local
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, is_selected: !currentValue } 
          : review
      ));
      
      toast.success(
        currentValue 
          ? 'Avaliação removida da seleção' 
          : 'Avaliação adicionada à seleção'
      );
    } catch (error) {
      console.error('Erro ao atualizar seleção:', error);
      toast.error('Erro ao atualizar seleção');
    } finally {
      setIsUpdating(null);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Verificar se é um arquivo CSV
    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV válido');
      return;
    }
    
    // Lógica para processar o arquivo CSV...
    handleImportCSV(file);
  };
  
  const handleImportCSV = async (file: File) => {
    try {
      setIsImporting(true);
      
      // Aqui você implementaria a lógica para fazer upload do CSV
      // e processar as avaliações
      
      toast.success('Avaliações importadas com sucesso!');
      setImportDialogOpen(false);
      loadReviews(); // Recarregar avaliações
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      toast.error('Erro ao importar avaliações do CSV');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleImportFromUrl = async () => {
    if (!productUrl) {
      toast.error('Por favor, insira a URL do produto');
      return;
    }
    
    try {
      setIsImporting(true);
      
      // Chamar a função de importação
      const { success, count, error } = await importReviewsFromUrl(
        productId,
        productUrl,
        platform
      );
      
      if (!success || error) {
        toast.error(`Erro ao importar avaliações: ${error}`);
        return;
      }
      
      toast.success(`${count} avaliações importadas com sucesso!`);
      setImportDialogOpen(false);
      loadReviews(); // Recarregar avaliações
    } catch (error) {
      console.error('Erro ao importar da URL:', error);
      toast.error('Erro ao importar avaliações');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleGenerateAIReviews = async () => {
    try {
      setIsImporting(true);
      
      // Chamar a função de geração de avaliações com IA
      const { success, count, error } = await generateAIReviews(
        productId,
        reviewCount,
        averageRating
      );
      
      if (!success || error) {
        toast.error(`Erro ao gerar avaliações: ${error}`);
        return;
      }
      
      toast.success(`${count} avaliações geradas com sucesso!`);
      setImportDialogOpen(false);
      loadReviews(); // Recarregar avaliações
    } catch (error) {
      console.error('Erro ao gerar avaliações:', error);
      toast.error('Erro ao gerar avaliações com IA');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleImport = () => {
    if (importMethod === 'csv') {
      fileInputRef.current?.click();
    } else if (importMethod === 'url') {
      handleImportFromUrl();
    } else if (importMethod === 'ai') {
      handleGenerateAIReviews();
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
          <CardDescription>Carregando avaliações do produto...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
          <CardDescription>Este produto ainda não possui avaliações</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="p-4 bg-secondary/20 rounded-full mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2">Nenhuma avaliação encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Importe avaliações para este produto ou gere avaliações de exemplo.
          </p>
          <Button onClick={() => setImportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Importar Avaliações
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Avaliações do Produto</CardTitle>
              <CardDescription>
                {reviewsCount} avaliações no total
              </CardDescription>
            </div>
            <div className="space-x-2">
              <Badge variant="outline">
                {reviews.filter(r => r.is_selected).length} selecionadas
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className={`border ${review.is_selected ? 'border-primary' : 'border-border/60'}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{review.author}</h3>
                      <Badge variant="outline" className="text-xs">
                        {review.date || format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={16} 
                            className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {review.rating}/5
                      </span>
                    </div>
                    
                    <p className="text-sm">{review.content}</p>
                    
                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {review.images.map((image, i) => (
                          <div key={i} className="relative h-16 w-16 rounded-md overflow-hidden border border-border/60">
                            <img src={image} alt={`Imagem ${i+1}`} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant={review.is_selected ? "default" : "outline"} 
                    size="sm"
                    onClick={() => toggleReviewSelection(review.id, review.is_selected)}
                    disabled={isUpdating === review.id}
                  >
                    {isUpdating === review.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : review.is_selected ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Selecionada
                      </>
                    ) : (
                      "Selecionar"
                    )}
                  </Button>
                </div>
                
                {review.is_published && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Publicada na loja
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {reviewsCount > reviews.length && (
            <Button variant="outline" className="w-full">
              Carregar mais avaliações
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Modal de Importação */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar Avaliações</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Escolha uma opção para importar avaliações para este produto.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="ai" value={importMethod} onValueChange={(value) => setImportMethod(value as 'url' | 'csv' | 'ai')}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="url" className="flex items-center gap-1">
                <Link className="h-4 w-4" />
                <span>URL</span>
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex items-center gap-1">
                <FileUp className="h-4 w-4" />
                <span>CSV</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span>IA</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Produto</Label>
                <Input 
                  placeholder="https://www.aliexpress.com/item/..." 
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Insira a URL do produto para importar suas avaliações
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aliexpress">AliExpress</SelectItem>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="shopee">Shopee</SelectItem>
                    <SelectItem value="amazon">Amazon</SelectItem>
                    <SelectItem value="other">Outra</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione a plataforma de onde o produto é originário
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-2">
                <Label>Arquivo CSV</Label>
                <div 
                  className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept=".csv" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Clique para selecionar um arquivo CSV ou arraste e solte aqui
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    O arquivo deve conter colunas: autor, avaliação, conteúdo, data, imagens (opcional)
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="space-y-4">
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
                    value={[averageRating]} 
                    min={1} 
                    max={5} 
                    step={0.1} 
                    onValueChange={(value) => setAverageRating(value[0])} 
                  />
                  <span className="flex items-center gap-1 text-sm">
                    {averageRating.toFixed(1)}
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </span>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium">Avaliações Persuasivas com IA</p>
                <p className="text-muted-foreground">
                  Gera reviews realistas e persuasivos, utilizando dados específicos do produto.
                  As avaliações seguem uma abordagem de copywriting que ressalta as qualidades do produto
                  e aborda possíveis objeções de compra.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Importar Avaliações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 