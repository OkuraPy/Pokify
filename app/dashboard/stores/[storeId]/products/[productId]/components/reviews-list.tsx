'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, MessageSquare, Star, Check, X, FileUp, Link, Sparkles, Download, Wand2, Languages, Edit, Save, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getReviews, updateReview, importReviewsFromUrl, generateAIReviews } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { GenerateReviewsDialog } from './generate-reviews-dialog';
import { FC } from 'react';
import { TranslateReviewsDialog } from './translate-reviews-dialog';
import { EnhanceReviewsDialog } from './enhance-reviews-dialog';
import ReviewConfig from './review-config';

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

interface ReviewsListProps {
  productId: string;
  reviewsCount: number;
}

export const ReviewsList: FC<ReviewsListProps> = ({ productId, reviewsCount }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<'csv' | 'url' | 'ai'>('ai');
  const [isImporting, setIsImporting] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Referência para o componente ReviewConfig
  const reviewConfigRef = useRef<HTMLDivElement>(null);
  
  // Estados para importação via URL
  const [productUrl, setProductUrl] = useState('');
  const [platform, setPlatform] = useState<string>('aliexpress');
  
  // Estados para geração com IA
  const [reviewCount, setReviewCount] = useState(5);
  const [aiAverageRating, setAiAverageRating] = useState(4.5);
  const [reviewLanguage, setReviewLanguage] = useState<string>('portuguese');
  
  // Referência para input de arquivo CSV
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para tradução de reviews
  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);
  const [selectedReviewForTranslation, setSelectedReviewForTranslation] = useState<Review | null>(null);
  
  // Estado para edição de review
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedReviewForEdit, setSelectedReviewForEdit] = useState<Review | null>(null);
  
  // Estados para melhoria de reviews
  const [isEnhanceDialogOpen, setIsEnhanceDialogOpen] = useState(false);
  const [selectedReviewForEnhancement, setSelectedReviewForEnhancement] = useState<Review | null>(null);
  
  useEffect(() => {
    loadReviews();
  }, [productId]);

  useEffect(() => {
    // Calcula a média das avaliações
    if (reviews.length > 0) {
      const total = reviews.reduce((acc, review) => acc + review.rating, 0);
      setAverageRating(total / reviews.length);
    }
  }, [reviews]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    
    // Atualiza todas as avaliações
    const updatedReviews = reviews.map(review => ({
      ...review,
      is_selected: checked
    }));
    
    // Atualiza o estado local
    setReviews(updatedReviews);
    
    // Atualiza no banco de dados
    Promise.all(
      updatedReviews.map(review =>
        updateReview(review.id, { is_selected: checked })
      )
    ).catch(error => {
      console.error('Erro ao atualizar seleções:', error);
      toast.error('Erro ao atualizar seleções');
    });
  };
  
  async function loadReviews() {
    try {
      setIsLoading(true);
      const { data, error } = await getReviews(productId);
      
      if (error) {
        console.error('Erro ao carregar avaliações:', error);
        toast.error('Erro ao carregar avaliações');
        return;
      }
      
      setReviews(data?.map(review => ({
        ...review,
        content: review.content || '',
        date: review.date || null,
        images: review.images || null
      })) || []);
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
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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
  
  const handleImportCSV = async (file: File): Promise<void> => {
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
  
  const handleImportFromUrl = async (): Promise<void> => {
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
      toast.error('Erro ao importar avaliações da URL');
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
        aiAverageRating,
        reviewLanguage
      );
      
      if (!success || error) {
        toast.error(`Erro ao gerar avaliações: ${error}`);
        return;
      }
      
      // Recarrega as avaliações após gerar novas
      await loadReviews();
      
      toast.success(`${count} avaliações geradas com sucesso!`);
      setImportDialogOpen(false);
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
  
  // Funções para tradução de reviews
  const handleTranslateSelected = () => {
    const selectedReviews = reviews.filter(review => review.is_selected);
    if (selectedReviews.length === 0) {
      toast.error('Selecione pelo menos uma avaliação para traduzir');
      return;
    }
    
    setSelectedReviewForTranslation(null); // Modo de tradução em lote
    setIsTranslateDialogOpen(true);
  };
  
  const handleTranslateSingle = (review: Review) => {
    setSelectedReviewForTranslation(review);
    setIsTranslateDialogOpen(true);
  };
  
  // Funções para melhoria de reviews
  const handleEnhanceSelected = async () => {
    const selectedReviews = reviews.filter(review => review.is_selected);
    if (selectedReviews.length === 0) {
      toast.error('Selecione pelo menos uma avaliação para melhorar');
      return;
    }
    
    setSelectedReviewForEnhancement(null); // Modo de melhoria em lote
    setIsEnhanceDialogOpen(true);
  };
  
  const handleEnhanceSingle = (review: Review) => {
    setSelectedReviewForEnhancement(review);
    setIsEnhanceDialogOpen(true);
  };
  
  // Adicionar função para edição de review
  const handleEditReview = (review: Review) => {
    setSelectedReviewForEdit(review);
    setIsEditDialogOpen(true);
  };
  
  // Função para abrir o diálogo de publicação
  const openPublishDialog = () => {
    // Encontra o botão e clica nele
    const publishButton = document.querySelector('button[data-publish-reviews="true"]');
    if (publishButton) {
      (publishButton as HTMLButtonElement).click();
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
      <>
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
              Gere avaliações de exemplo para este produto usando IA.
          </p>
          <Button 
              onClick={() => setImportDialogOpen(true)}
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Reviews com IA
                </Button>
        </CardContent>
      </Card>

        <GenerateReviewsDialog 
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          isImporting={isImporting}
          reviewCount={reviewCount}
          setReviewCount={setReviewCount}
          aiAverageRating={aiAverageRating}
          setAiAverageRating={setAiAverageRating}
          reviewLanguage={reviewLanguage}
          setReviewLanguage={setReviewLanguage}
          onGenerate={handleGenerateAIReviews}
        />
      </>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* ReviewConfig escondido (display none) */}
      <div className="hidden" ref={reviewConfigRef}>
        <ReviewConfig 
          productId={productId} 
          userId="10c1173a-02a3-493d-b782-0c6cba9274b2" 
          shopDomain="loja-demo" 
        />
      </div>

      {/* Header com estatísticas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-gray-50/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Avaliações do Produto</CardTitle>
              <CardDescription className="mt-1">
                Gerencie as avaliações e feedback dos clientes
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md shadow-sm"
                onClick={openPublishDialog}
              >
                <span className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Publicar Reviews
                </span>
              </Button>
              <Button variant="default" onClick={() => setImportDialogOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Reviews com IA
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Card de Estatísticas */}
            <Card className="col-span-1 md:col-span-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Total de Avaliações</h3>
                    <p className="text-2xl font-bold">{reviews.length}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Média Geral</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Avaliações Selecionadas</h3>
                    <p className="text-2xl font-bold">{reviews.filter(r => r.is_selected).length}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Avaliações com Fotos</h3>
                    <p className="text-2xl font-bold">{reviews.filter(r => r.images && r.images.length > 0).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Avaliações */}
            <div className="col-span-1 md:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm">
                    Selecionar todas as avaliações
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnhanceSelected}
                    disabled={reviews.filter(r => r.is_selected).length === 0}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Melhorar Selecionadas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTranslateSelected}
                    disabled={reviews.filter(r => r.is_selected).length === 0}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    Traduzir Selecionadas
                  </Button>
                </div>
              </div>

          {reviews.map((review) => (
                <Card key={review.id} className={`group transition-all duration-200 hover:shadow-md ${review.is_selected ? 'ring-2 ring-primary ring-offset-2' : 'border-border/60'}`}>
              <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={review.is_selected}
                        onCheckedChange={() => toggleReviewSelection(review.id, review.is_selected)}
                        disabled={isUpdating === review.id}
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{review.author}</h3>
                              <Badge variant="outline" className="text-xs font-normal">
                        {review.date || format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </Badge>
                    </div>
                            <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                                    size={14} 
                            className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {review.rating}/5
                      </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditReview(review);
                              }}
                              className="text-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEnhanceSingle(review)}
                              className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                            >
                              <Wand2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTranslateSingle(review)}
                              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Languages className="h-4 w-4" />
                            </Button>
                          </div>
                    </div>
                    
                        <p className="text-sm leading-relaxed">{review.content}</p>
                    
                    {review.images && review.images.length > 0 && (
                          <div className="mt-4">
                            <label className="text-sm font-medium mb-2 block text-muted-foreground">Fotos do Cliente</label>
                            <div className="flex flex-wrap gap-2">
                        {review.images.map((image, i) => (
                                <div key={i} className="group/image relative h-20 w-20 rounded-md overflow-hidden border border-border/60">
                            <img src={image} alt={`Imagem ${i+1}`} className="h-full w-full object-cover" />
                                  <button
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity"
                                    onClick={() => {/* Função para remover imagem */}}
                                  >
                                    <X className="h-4 w-4 text-white" />
                                  </button>
                                </div>
                              ))}
                              <button 
                                className="h-20 w-20 rounded-md border-2 border-dashed border-border/60 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                onClick={() => {/* Função para adicionar imagem */}}
                              >
                                <FileUp className="h-5 w-5 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sidebar com Filtros e Ações */}
            <div className="col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Classificação</label>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <button
                            key={rating}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-1.5">
                              <Star size={14} className="fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{rating}</span>
                            </div>
                            <Badge variant="secondary" className="font-normal">
                              {reviews.filter(r => r.rating === rating).length}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Status</label>
                      <div className="space-y-2">
                        <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors">
                          <span className="text-sm">Com fotos</span>
                          <Badge variant="secondary" className="font-normal">
                            {reviews.filter(r => r.images && r.images.length > 0).length}
                          </Badge>
                        </button>
                        <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors">
                          <span className="text-sm">Selecionadas</span>
                          <Badge variant="secondary" className="font-normal">
                            {reviews.filter(r => r.is_selected).length}
                          </Badge>
                        </button>
                  </div>
                </div>
                  </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <GenerateReviewsDialog 
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        isImporting={isImporting}
        reviewCount={reviewCount}
        setReviewCount={setReviewCount}
        aiAverageRating={aiAverageRating}
        setAiAverageRating={setAiAverageRating}
        reviewLanguage={reviewLanguage}
        setReviewLanguage={setReviewLanguage}
        onGenerate={handleGenerateAIReviews}
      />

      <TranslateReviewsDialog
        isOpen={isTranslateDialogOpen}
        onClose={() => setIsTranslateDialogOpen(false)}
        reviews={selectedReviewForTranslation ? [selectedReviewForTranslation] : reviews.filter(r => r.is_selected)}
        onReviewsUpdated={loadReviews}
        isSingleReview={!!selectedReviewForTranslation}
      />

      <EnhanceReviewsDialog
        isOpen={isEnhanceDialogOpen}
        onClose={() => setIsEnhanceDialogOpen(false)}
        reviews={selectedReviewForEnhancement ? [selectedReviewForEnhancement] : reviews.filter(r => r.is_selected)}
        productName=""
        onReviewsUpdated={loadReviews}
        isSingleReview={!!selectedReviewForEnhancement}
      />
      
      {/* Diálogo de edição de review */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false);
          setSelectedReviewForEdit(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Avaliação</DialogTitle>
            <DialogDescription>
              Edite os detalhes da avaliação
            </DialogDescription>
          </DialogHeader>
          {selectedReviewForEdit && (
            <EditReviewForm 
              review={selectedReviewForEdit} 
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedReviewForEdit(null);
                loadReviews();
                toast.success('Avaliação atualizada com sucesso!');
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para o formulário de edição de review
interface EditReviewFormProps {
  review: Review;
  onSuccess: () => void;
}

function EditReviewForm({ review, onSuccess }: EditReviewFormProps) {
  const [author, setAuthor] = useState(review.author);
  const [content, setContent] = useState(review.content);
  const [rating, setRating] = useState(review.rating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!author.trim()) {
      toast.error('O nome do autor é obrigatório');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { error } = await updateReview(review.id, {
        author,
        content,
        rating
      });
      
      if (error) {
        toast.error('Erro ao atualizar avaliação');
        console.error('Erro ao atualizar avaliação:', error);
        return;
      }
      
      onSuccess();
    } catch (error) {
      toast.error('Erro ao atualizar avaliação');
      console.error('Erro ao atualizar avaliação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="author">Nome do Autor</Label>
        <Input
          id="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Nome do cliente"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="rating">Avaliação</Label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Slider
              id="rating"
              value={[rating]}
              min={1}
              max={5}
              step={1}
              onValueChange={(value) => setRating(value[0])}
            />
          </div>
          <div className="flex items-center gap-1 w-16">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={16} 
                className={star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}
                style={{ cursor: 'pointer' }}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Texto da Avaliação</Label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite o texto da avaliação"
          className="w-full min-h-[120px] p-2 rounded-md border border-input"
          rows={4}
        />
      </div>
      
      <DialogFooter>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
} 