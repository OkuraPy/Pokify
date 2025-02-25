'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Edit, 
  PencilRuler, 
  Save, 
  MessageSquareText, 
  Camera, 
  Image, 
  Wand2, 
  Languages,
  DownloadCloud,
  Link as LinkIcon,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { RichTextEditor } from '@/app/components/rich-text-editor';

interface ImportProductEditorProps {
  storeId: string;
  importUrl: string;
  productId: string;
}

interface ProductData {
  title: string;
  price: number;
  description: string;
  images: string[];
  reviews: {
    id: string;
    rating: number;
    author: string;
    content: string;
    date: string;
    images?: string[];
    selected?: boolean;
  }[];
}

// Lista de idiomas disponíveis para tradução
const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'Inglês', flag: '🇺🇸' },
  { code: 'es', name: 'Espanhol', flag: '🇪🇸' },
  { code: 'fr', name: 'Francês', flag: '🇫🇷' },
  { code: 'de', name: 'Alemão', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japonês', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinês', flag: '🇨🇳' },
  { code: 'ru', name: 'Russo', flag: '🇷🇺' },
  { code: 'ar', name: 'Árabe', flag: '🇸🇦' }
];

export function ImportProductEditor({ storeId, importUrl, productId }: ImportProductEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('product');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [mode, setMode] = useState<'import' | 'edit'>(productId ? 'edit' : 'import');
  const [importReviewsUrl, setImportReviewsUrl] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isGenerateAIDialogOpen, setIsGenerateAIDialogOpen] = useState(false);
  const [reviewsToGenerate, setReviewsToGenerate] = useState<number>(3);
  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);
  const [isTranslateIndividualDialogOpen, setIsTranslateIndividualDialogOpen] = useState(false);
  const [isImproveConfirmDialogOpen, setIsImproveConfirmDialogOpen] = useState(false);
  const [isImproveIndividualConfirmDialogOpen, setIsImproveIndividualConfirmDialogOpen] = useState(false);
  const [isImproveDescriptionDialogOpen, setIsImproveDescriptionDialogOpen] = useState(false);
  const [isTranslateDescriptionDialogOpen, setIsTranslateDescriptionDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [allReviewsSelected, setAllReviewsSelected] = useState(false);
  const [currentReviewId, setCurrentReviewId] = useState<string | null>(null);

  // Extrair dados da URL ou carregar produto existente
  useEffect(() => {
    const loadProductData = async () => {
      setIsLoading(true);
      
      // Se temos productId, carregamos o produto existente para edição
      if (productId) {
        try {
          // Aqui seria uma chamada à API para buscar os dados do produto
          // Por enquanto, vamos simular com dados mockados
          setTimeout(() => {
            setProductData({
              title: 'Camiseta Pokémon Pikachu [Editando]',
              price: 99.90,
              description: '<p>Camiseta com estampa do Pikachu, perfeita para fãs da franquia. Material de alta qualidade, 100% algodão. Disponível em vários tamanhos e cores.</p><p><img src="https://via.placeholder.com/600x400" alt="Exemplo de camiseta"></p><p>Características:</p><ul><li>Material: 100% algodão</li><li>Estampa de alta qualidade</li><li>Disponível em vários tamanhos</li></ul>',
              images: [
                'https://via.placeholder.com/800x800',
                'https://via.placeholder.com/800x800',
                'https://via.placeholder.com/800x800',
                'https://via.placeholder.com/800x800',
              ],
              reviews: [
                {
                  id: '1',
                  rating: 5,
                  author: 'João Silva',
                  content: 'Produto excelente, chegou rápido e a qualidade é ótima!',
                  date: '2023-11-10',
                  images: ['https://via.placeholder.com/200x200'],
                  selected: false
                },
                {
                  id: '2',
                  rating: 4,
                  author: 'Maria Santos',
                  content: 'Gostei bastante, mas achei um pouco grande para o tamanho M.',
                  date: '2023-10-25',
                  selected: false
                },
                {
                  id: '3',
                  rating: 5,
                  author: 'Pedro Oliveira',
                  content: 'Melhor camiseta que já comprei! Estampa de ótima qualidade.',
                  date: '2023-12-05',
                  images: ['https://via.placeholder.com/200x200', 'https://via.placeholder.com/200x200'],
                  selected: false
                }
              ]
            });
            setIsLoading(false);
          }, 1000);
        } catch (error) {
          toast.error('Erro ao carregar dados do produto');
          setIsLoading(false);
        }
        return;
      }

      // Se temos importUrl, extraímos os dados da URL
      if (importUrl) {
        try {
          // Aqui seria o código para extrair os dados da URL
          // Por enquanto, vamos simular com dados mockados
          setTimeout(() => {
            setProductData({
              title: 'Camiseta Pokémon Pikachu [Importado]',
              price: 89.90,
              description: '<p>Camiseta com estampa do Pikachu. Material: 100% algodão. Disponível em vários tamanhos.</p><p><img src="https://via.placeholder.com/600x400" alt="Imagem do produto"></p>',
              images: [
                'https://via.placeholder.com/800x800',
                'https://via.placeholder.com/800x800',
                'https://via.placeholder.com/800x800',
              ],
              reviews: [
                {
                  id: '1',
                  rating: 5,
                  author: 'João Silva',
                  content: 'Produto excelente, chegou rápido e a qualidade é ótima!',
                  date: '2023-11-10',
                  images: ['https://via.placeholder.com/200x200'],
                  selected: false
                },
                {
                  id: '2',
                  rating: 4,
                  author: 'Maria Santos',
                  content: 'Gostei bastante, mas achei um pouco grande para o tamanho M.',
                  date: '2023-10-25',
                  selected: false
                }
              ]
            });
            setIsLoading(false);
          }, 1500);
        } catch (error) {
          toast.error('Erro ao extrair dados do produto');
          setIsLoading(false);
        }
        return;
      }

      // Se não temos nem URL nem ID, mostramos página vazia
      setIsLoading(false);
    };

    loadProductData();
  }, [importUrl, productId]);

  // Função para importar avaliações de outro site
  const importReviews = async () => {
    if (!importReviewsUrl) return;

    setIsProcessing(true);
    try {
      // Simulação de importação de avaliações
      setTimeout(() => {
        // Novas avaliações importadas (simulação)
        const newReviews = [
          {
            id: 'imported-1',
            rating: 5,
            author: 'Carlos Mendes',
            content: 'Comprei para meu filho e ele adorou! A entrega foi rápida.',
            date: '2023-12-15',
            selected: false
          },
          {
            id: 'imported-2',
            rating: 4,
            author: 'Ana Luiza',
            content: 'Good quality product, I recommend it. The sizing is perfect and the fabric is soft.',
            date: '2023-12-10',
            images: ['https://via.placeholder.com/200x200'],
            selected: false
          },
          {
            id: 'imported-3',
            rating: 5,
            author: 'Felipe Costa',
            content: 'Excelente producto, me encantó. La calidad es muy buena.',
            date: '2023-12-05',
            selected: false
          }
        ];

        // Adiciona as novas avaliações ao produto
        setProductData(prev => 
          prev ? {
            ...prev,
            reviews: [...prev.reviews, ...newReviews]
          } : null
        );

        setImportReviewsUrl('');
        setIsImportDialogOpen(false);
        toast.success('Avaliações importadas com sucesso!');
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      toast.error('Erro ao importar avaliações');
      setIsProcessing(false);
    }
  };

  // Função para gerar avaliações usando IA
  const generateAIReviews = async () => {
    if (!productData) return;
    
    setIsProcessing(true);
    try {
      // Simulação de geração de avaliações com IA
      setTimeout(() => {
        // Gera avaliações baseadas no número solicitado
        const newReviews = Array.from({ length: reviewsToGenerate }).map((_, index) => {
          // Gera uma avaliação aleatória com 4 ou 5 estrelas
          const rating = Math.random() > 0.3 ? 5 : 4;
          
          // Lista de nomes fictícios para autores
          const authors = [
            'Ana Costa', 'Bruno Ferreira', 'Carla Sousa', 'Daniel Oliveira', 
            'Eduardo Santos', 'Fernanda Lima', 'Gabriel Martins', 'Heloísa Silva',
            'Igor Pereira', 'Juliana Almeida', 'Lucas Rodrigues', 'Mariana Gomes'
          ];
          
          // Conteúdos de avaliação gerados pela "IA"
          const contents = [
            'Este produto superou todas as minhas expectativas! A qualidade é excelente e chegou antes do prazo previsto. Recomendo fortemente.',
            'Produto maravilhoso, exatamente como descrito. Material de ótima qualidade e o design é incrível. Já estou pensando em comprar outro.',
            'Fiquei muito satisfeito com a compra. O produto tem um acabamento perfeito e o tamanho é ideal. Certamente comprarei novamente.',
            'Ótimo custo-benefício! O produto é durável, bonito e funcional. Atendeu perfeitamente às minhas necessidades.',
            'Comprei como presente e a pessoa adorou! A qualidade é incrível e o design é muito bonito. Recomendo para todos os fãs de Pokémon!'
          ];
          
          // Gera uma data recente aleatória
          const today = new Date();
          const randomDaysAgo = Math.floor(Math.random() * 30) + 1;
          const date = new Date(today);
          date.setDate(today.getDate() - randomDaysAgo);
          
          return {
            id: `ai-generated-${Date.now()}-${index}`,
            rating,
            author: authors[Math.floor(Math.random() * authors.length)],
            content: contents[Math.floor(Math.random() * contents.length)],
            date: date.toISOString().split('T')[0],
            selected: false,
            // Adiciona imagens em algumas avaliações
            ...(Math.random() > 0.7 ? { 
              images: ['https://via.placeholder.com/200x200'] 
            } : {})
          };
        });

        // Adiciona as novas avaliações ao produto
        setProductData(prev => 
          prev ? {
            ...prev,
            reviews: [...prev.reviews, ...newReviews]
          } : null
        );

        setIsGenerateAIDialogOpen(false);
        toast.success(`${reviewsToGenerate} avaliações geradas com sucesso!`);
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      toast.error('Erro ao gerar avaliações');
      setIsProcessing(false);
    }
  };

  // Função para melhorar todas as avaliações selecionadas com IA
  const improveSelectedReviews = async () => {
    if (!productData) return;
    
    const hasSelectedReviews = productData.reviews.some(review => review.selected);
    if (!hasSelectedReviews) {
      toast.error('Selecione pelo menos uma avaliação para melhorar');
      return;
    }

    // Abre o diálogo de confirmação em vez de processar imediatamente
    setIsImproveConfirmDialogOpen(true);
  };

  // Função para confirmar e executar a melhoria de avaliações em massa
  const confirmAndImproveSelectedReviews = async () => {
    if (!productData) return;
    
    setIsProcessing(true);
    setIsImproveConfirmDialogOpen(false);
    
    try {
      // Simulação de processamento com IA
      setTimeout(() => {
        setProductData(prev => {
          if (!prev) return null;
          
          const updatedReviews = prev.reviews.map(review => {
            if (review.selected) {
              // Simula uma melhoria do texto
              return {
                ...review,
                content: `${review.content} [MELHORADO COM IA] Este é um excelente produto que atendeu todas as minhas expectativas. Recomendo fortemente!`
              };
            }
            return review;
          });
          
          return {
            ...prev,
            reviews: updatedReviews
          };
        });
        
        toast.success('Avaliações melhoradas com sucesso!');
        setIsProcessing(false);
      }, 3000);
    } catch (error) {
      toast.error('Erro ao melhorar avaliações');
      setIsProcessing(false);
    }
  };

  // Função para abrir diálogo de melhoria individual
  const openImproveIndividualDialog = (reviewId: string) => {
    setCurrentReviewId(reviewId);
    setIsImproveIndividualConfirmDialogOpen(true);
  };

  // Função para confirmar e melhorar avaliação individual
  const confirmAndImproveIndividualReview = async () => {
    if (!productData || !currentReviewId) return;
    
    setIsProcessing(true);
    setIsImproveIndividualConfirmDialogOpen(false);
    
    try {
      // Simulação de processamento com IA
      setTimeout(() => {
        setProductData(prev => {
          if (!prev) return null;
          
          const updatedReviews = prev.reviews.map(review => {
            if (review.id === currentReviewId) {
              // Simula uma melhoria do texto
              return {
                ...review,
                content: `${review.content} [MELHORADO COM IA] Este é um excelente produto que atendeu todas as minhas expectativas. Recomendo fortemente!`
              };
            }
            return review;
          });
          
          return {
            ...prev,
            reviews: updatedReviews
          };
        });
        
        toast.success('Avaliação melhorada com sucesso!');
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      toast.error('Erro ao melhorar avaliação');
      setIsProcessing(false);
    }
  };

  // Função para traduzir avaliações selecionadas
  const translateSelectedReviews = async () => {
    if (!productData) return;
    
    const hasSelectedReviews = productData.reviews.some(review => review.selected);
    if (!hasSelectedReviews) {
      toast.error('Selecione pelo menos uma avaliação para traduzir');
      return;
    }

    setIsProcessing(true);
    try {
      // Pega o idioma selecionado
      const targetLanguage = languages.find(lang => lang.code === selectedLanguage);
      
      // Simulação de tradução
      setTimeout(() => {
        setProductData(prev => {
          if (!prev) return null;
          
          const updatedReviews = prev.reviews.map(review => {
            if (review.selected) {
              // Simula uma tradução
              return {
                ...review,
                content: `${review.content} [TRADUZIDO PARA ${targetLanguage?.name.toUpperCase()}] Este produto é excelente e recomendo para todos.`
              };
            }
            return review;
          });
          
          return {
            ...prev,
            reviews: updatedReviews
          };
        });
        
        setIsTranslateDialogOpen(false);
        toast.success(`Avaliações traduzidas para ${targetLanguage?.name}`);
        setIsProcessing(false);
      }, 2500);
    } catch (error) {
      toast.error('Erro ao traduzir avaliações');
      setIsProcessing(false);
    }
  };

  // Toggle de seleção de uma avaliação específica
  const toggleReviewSelection = (reviewId: string) => {
    setProductData(prev => {
      if (!prev) return null;
      
      const updatedReviews = prev.reviews.map(review => {
        if (review.id === reviewId) {
          return { ...review, selected: !review.selected };
        }
        return review;
      });
      
      return {
        ...prev,
        reviews: updatedReviews
      };
    });
  };

  // Toggle de seleção de todas as avaliações
  const toggleAllReviews = () => {
    const newSelectionState = !allReviewsSelected;
    setAllReviewsSelected(newSelectionState);
    
    setProductData(prev => {
      if (!prev) return null;
      
      const updatedReviews = prev.reviews.map(review => ({
        ...review,
        selected: newSelectionState
      }));
      
      return {
        ...prev,
        reviews: updatedReviews
      };
    });
  };

  // Atualiza o estado de "todos selecionados" quando as seleções individuais mudam
  useEffect(() => {
    if (productData) {
      const allSelected = productData.reviews.length > 0 && 
                         productData.reviews.every(review => review.selected);
      setAllReviewsSelected(allSelected);
    }
  }, [productData?.reviews]);

  const improveWithAI = async (text: string, type: 'description' | 'review') => {
    // Se for descrição, apenas abre o diálogo em vez de processar imediatamente
    if (type === 'description') {
      setIsImproveDescriptionDialogOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Aqui seria a integração com a API de IA
      // Por enquanto, vamos simular
      setTimeout(() => {
        setProductData(prev => 
          prev ? {
            ...prev,
            description: `${prev.description}<p>[MELHORADO COM IA] Esta camiseta exclusiva do Pikachu é perfeita para fãs de Pokémon! Confeccionada em algodão premium, garante conforto durante todo o dia. A estampa vibrante e durável não desbota com o tempo, mantendo a qualidade mesmo após várias lavagens.</p>`
          } : null
        );
        toast.success('Texto melhorado com IA!');
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      toast.error('Erro ao processar com IA');
      setIsProcessing(false);
    }
  };

  // Função para confirmar e melhorar a descrição
  const confirmAndImproveDescription = async () => {
    if (!productData) return;
    
    setIsProcessing(true);
    setIsImproveDescriptionDialogOpen(false);
    
    try {
      // Simulação de processamento com IA
      setTimeout(() => {
        setProductData(prev => 
          prev ? {
            ...prev,
            description: `${prev.description}<p>[MELHORADO COM IA] Esta camiseta exclusiva do Pikachu é perfeita para fãs de Pokémon! Confeccionada em algodão premium, garante conforto durante todo o dia. A estampa vibrante e durável não desbota com o tempo, mantendo a qualidade mesmo após várias lavagens.</p>`
          } : null
        );
        
        toast.success('Descrição melhorada com sucesso!');
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      toast.error('Erro ao melhorar descrição');
      setIsProcessing(false);
    }
  };

  const translateText = async (text: string, type: 'description' | 'review') => {
    // Se for descrição, apenas abre o diálogo em vez de processar imediatamente
    if (type === 'description') {
      setIsTranslateDescriptionDialogOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      // Simulação de tradução
      setTimeout(() => {
        setProductData(prev => 
          prev ? {
            ...prev,
            description: `${prev.description}<p>[TRADUZIDO] Esta camiseta com estampa do Pikachu é feita com 100% algodão de alta qualidade. Disponível em vários tamanhos para atender todas as necessidades.</p>`
          } : null
        );
        toast.success('Texto traduzido com sucesso!');
        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      toast.error('Erro ao traduzir o texto');
      setIsProcessing(false);
    }
  };

  // Função para confirmar e traduzir a descrição
  const confirmAndTranslateDescription = async () => {
    if (!productData) return;
    
    setIsProcessing(true);
    setIsTranslateDescriptionDialogOpen(false);
    
    try {
      // Pega o idioma selecionado
      const targetLanguage = languages.find(lang => lang.code === selectedLanguage);
      
      // Simulação de tradução
      setTimeout(() => {
        setProductData(prev => 
          prev ? {
            ...prev,
            description: `${prev.description}<p>[TRADUZIDO PARA ${targetLanguage?.name.toUpperCase()}] Esta camiseta com estampa do Pikachu é feita com 100% algodão de alta qualidade. Disponível em vários tamanhos para atender todas as necessidades.</p>`
          } : null
        );
        
        toast.success(`Descrição traduzida para ${targetLanguage?.name}`);
        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      toast.error('Erro ao traduzir a descrição');
      setIsProcessing(false);
    }
  };

  const saveProduct = async () => {
    setIsProcessing(true);
    try {
      // Simulação de salvamento
      setTimeout(() => {
        const successMessage = mode === 'import' ? 'Produto importado com sucesso!' : 'Produto atualizado com sucesso!';
        toast.success(successMessage);
        setIsProcessing(false);
        // Redirecionar para a página da loja
        window.location.href = `/dashboard/stores/${storeId}`;
      }, 1500);
    } catch (error) {
      toast.error('Erro ao salvar o produto');
      setIsProcessing(false);
    }
  };

  // Atualizar o título da página e mensagens conforme o modo
  const pageTitle = mode === 'import' ? 'Importar e Personalizar Produto' : 'Editar Produto';
  const actionButtonText = mode === 'import' ? 'Importar Produto' : 'Salvar Alterações';
  const loadingText = mode === 'import' ? 'Extraindo dados do produto...' : 'Carregando produto...';
  const successMessage = mode === 'import' ? 'Produto importado com sucesso!' : 'Produto atualizado com sucesso!';

  // Função para abrir diálogo de tradução individual
  const openTranslateIndividualDialog = (reviewId: string) => {
    setCurrentReviewId(reviewId);
    setIsTranslateIndividualDialogOpen(true);
  };

  // Função para confirmar e traduzir avaliação individual
  const confirmAndTranslateIndividualReview = async () => {
    if (!productData || !currentReviewId) return;
    
    setIsProcessing(true);
    setIsTranslateIndividualDialogOpen(false);
    
    try {
      // Pega o idioma selecionado
      const targetLanguage = languages.find(lang => lang.code === selectedLanguage);
      
      // Simulação de tradução
      setTimeout(() => {
        setProductData(prev => {
          if (!prev) return null;
          
          const updatedReviews = prev.reviews.map(review => {
            if (review.id === currentReviewId) {
              // Simula uma tradução
              return {
                ...review,
                content: `${review.content} [TRADUZIDO PARA ${targetLanguage?.name.toUpperCase()}] Este produto é excelente e recomendo para todos.`
              };
            }
            return review;
          });
          
          return {
            ...prev,
            reviews: updatedReviews
          };
        });
        
        toast.success(`Avaliação traduzida para ${targetLanguage?.name}`);
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      toast.error('Erro ao traduzir avaliação');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-sm text-muted-foreground">{loadingText}</p>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Não foi possível extrair os dados do produto.</p>
        <Button asChild className="mt-4">
          <Link href={`/dashboard/stores/${storeId}`}>Voltar para a loja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb e cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/dashboard/stores/${storeId}`}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Produtos
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = `/dashboard/stores/${storeId}`}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button 
            onClick={saveProduct}
            disabled={isProcessing}
          >
            {isProcessing ? 'Salvando...' : actionButtonText}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">{pageTitle}</h1>
      <p className="text-sm text-muted-foreground">
        {mode === 'import' 
          ? 'Edite e melhore os detalhes do produto importado antes de publicá-lo' 
          : 'Edite as informações, imagens e avaliações do produto'}
      </p>

      {/* Tabs para navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="product" className="flex items-center gap-2">
            <PencilRuler className="h-4 w-4" />
            Produto
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Imagens
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4" />
            Avaliações
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo da tab de produto */}
        <TabsContent value="product" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Produto</CardTitle>
              <CardDescription>
                Edite os detalhes básicos do produto importado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Produto</Label>
                <Input 
                  id="title" 
                  value={productData.title}
                  onChange={(e) => setProductData({...productData, title: e.target.value})}
                  className="border-border/60"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01"
                  value={productData.price}
                  onChange={(e) => setProductData({...productData, price: parseFloat(e.target.value)})}
                  className="border-border/60"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Descrição</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => improveWithAI(productData.description, 'description')}
                      disabled={isProcessing}
                    >
                      <Wand2 className="h-3.5 w-3.5 mr-1" />
                      Melhorar com IA
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => translateText(productData.description, 'description')}
                      disabled={isProcessing}
                    >
                      <Languages className="h-3.5 w-3.5 mr-1" />
                      Traduzir
                    </Button>
                  </div>
                </div>
                <RichTextEditor 
                  content={productData.description}
                  onChange={(value) => setProductData({...productData, description: value})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da tab de imagens */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imagens do Produto</CardTitle>
              <CardDescription>
                Gerencie as imagens importadas do produto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {productData.images.map((image, index) => (
                  <div 
                    key={index}
                    className="relative aspect-square rounded-md overflow-hidden border border-border/60 group"
                  >
                    <img 
                      src={image} 
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-white">
                        <Image className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-center aspect-square rounded-md border border-dashed border-border/60 p-4 cursor-pointer hover:bg-secondary/5 transition-colors">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Image className="h-8 w-8" />
                    <span className="text-xs">Adicionar imagem</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conteúdo da tab de avaliações */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Avaliações do Produto</CardTitle>
                  <CardDescription>
                    Edite ou remova as avaliações importadas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setIsGenerateAIDialogOpen(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Gerar Avaliações
                  </Button>
                  <Button 
                    onClick={() => setIsImportDialogOpen(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <DownloadCloud className="h-4 w-4" />
                    Importar Avaliações
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ações em massa para avaliações */}
              <div className="flex items-center justify-between bg-secondary/5 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all" 
                    checked={allReviewsSelected}
                    onCheckedChange={toggleAllReviews}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Selecionar todas as avaliações
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={improveSelectedReviews}
                    disabled={isProcessing || !productData.reviews.some(r => r.selected)}
                  >
                    <Wand2 className="h-3.5 w-3.5 mr-1" />
                    Melhorar selecionadas
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsTranslateDialogOpen(true)}
                    disabled={isProcessing || !productData.reviews.some(r => r.selected)}
                  >
                    <Languages className="h-3.5 w-3.5 mr-1" />
                    Traduzir selecionadas
                  </Button>
                </div>
              </div>

              {/* Lista de avaliações */}
              {productData.reviews.map((review, index) => (
                <Card key={index} className="border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <Checkbox 
                          id={`review-${review.id}`} 
                          checked={review.selected}
                          onCheckedChange={() => toggleReviewSelection(review.id)}
                          className="mr-1"
                        />
                        <CardTitle className="text-base">{review.author}</CardTitle>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`review-content-${index}`}>Comentário</Label>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openImproveIndividualDialog(review.id)}
                            disabled={isProcessing}
                          >
                            <Wand2 className="h-3.5 w-3.5 mr-1" />
                            Melhorar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openTranslateIndividualDialog(review.id)}
                            disabled={isProcessing}
                          >
                            <Languages className="h-3.5 w-3.5 mr-1" />
                            Traduzir
                          </Button>
                        </div>
                      </div>
                      <Textarea 
                        id={`review-content-${index}`}
                        value={review.content}
                        onChange={(e) => {
                          const updatedReviews = [...productData.reviews];
                          updatedReviews[index].content = e.target.value;
                          setProductData({...productData, reviews: updatedReviews});
                        }}
                        rows={3}
                        className="resize-none border-border/60"
                      />
                    </div>
                    
                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {review.images.map((img, imgIndex) => (
                          <div 
                            key={imgIndex}
                            className="relative w-16 h-16 rounded-md overflow-hidden border border-border/60"
                          >
                            <img 
                              src={img} 
                              alt={`Review image ${imgIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Switch 
                        id={`include-review-${index}`}
                        defaultChecked={true}
                      />
                      <Label htmlFor={`include-review-${index}`}>Incluir esta avaliação</Label>
                    </div>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      Remover
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para importar avaliações */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Avaliações</DialogTitle>
            <DialogDescription>
              Cole a URL do produto para importar avaliações de outros sites
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-url">URL do Produto</Label>
              <Input 
                id="import-url" 
                type="url" 
                placeholder="https://exemplo.com/produto"
                value={importReviewsUrl}
                onChange={(e) => setImportReviewsUrl(e.target.value)}
                className="border-border/60"
              />
              <p className="text-xs text-muted-foreground">
                Importamos avaliações de sites populares como Amazon, AliExpress, Shopee e outros
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={importReviews} disabled={isProcessing || !importReviewsUrl}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Importando...
                </>
              ) : (
                <>
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Importar Avaliações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmação de melhoria em massa */}
      <Dialog open={isImproveConfirmDialogOpen} onOpenChange={setIsImproveConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Melhorar Avaliações</DialogTitle>
            <DialogDescription>
              Confirme que deseja melhorar {productData?.reviews.filter(r => r.selected).length} avaliações selecionadas usando IA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              A IA irá aprimorar o conteúdo das avaliações, tornando-as mais descritivas e detalhadas.
              Este processo pode levar alguns segundos.
            </p>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsImproveConfirmDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={confirmAndImproveSelectedReviews} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Confirmar Melhoria
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmação de melhoria individual */}
      <Dialog open={isImproveIndividualConfirmDialogOpen} onOpenChange={setIsImproveIndividualConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Melhorar Avaliação</DialogTitle>
            <DialogDescription>
              Confirme que deseja melhorar esta avaliação usando IA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              A IA irá aprimorar o conteúdo da avaliação, tornando-a mais descritiva e detalhada.
              Este processo pode levar alguns segundos.
            </p>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsImproveIndividualConfirmDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={confirmAndImproveIndividualReview} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Confirmar Melhoria
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para seleção de idioma para tradução individual */}
      <Dialog open={isTranslateIndividualDialogOpen} onOpenChange={setIsTranslateIndividualDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Traduzir Avaliação</DialogTitle>
            <DialogDescription>
              Selecione o idioma para traduzir esta avaliação
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {languages.map((language) => (
              <Button
                key={language.code}
                variant={selectedLanguage === language.code ? "default" : "outline"}
                className={`justify-start h-auto py-3 ${
                  selectedLanguage === language.code ? "border-primary" : "border-border/60"
                }`}
                onClick={() => setSelectedLanguage(language.code)}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{language.flag}</span>
                  <span>{language.name}</span>
                  {selectedLanguage === language.code && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsTranslateIndividualDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={confirmAndTranslateIndividualReview} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
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

      {/* Diálogo para gerar avaliações com IA */}
      <Dialog open={isGenerateAIDialogOpen} onOpenChange={setIsGenerateAIDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Avaliações com IA</DialogTitle>
            <DialogDescription>
              Escolha quantas avaliações deseja gerar usando Inteligência Artificial
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reviews-count">Quantidade de Avaliações</Label>
              <div className="flex items-center gap-3">
                <Input 
                  id="reviews-count" 
                  type="number" 
                  min="1"
                  max="100"
                  value={reviewsToGenerate}
                  onChange={(e) => setReviewsToGenerate(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="border-border/60"
                />
                <div className="grid grid-cols-5 gap-1">
                  {[5, 10, 20, 50, 100].map(num => (
                    <Button 
                      key={num} 
                      type="button" 
                      variant={reviewsToGenerate === num ? "default" : "outline"}
                      className="h-8 px-3"
                      onClick={() => setReviewsToGenerate(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                A IA gerará até 100 avaliações positivas baseadas nas características do produto
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsGenerateAIDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={generateAIReviews} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar Avaliações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmação de melhoria da descrição */}
      <Dialog open={isImproveDescriptionDialogOpen} onOpenChange={setIsImproveDescriptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Melhorar Descrição</DialogTitle>
            <DialogDescription>
              Confirme que deseja melhorar a descrição do produto usando IA.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              A IA irá aprimorar o conteúdo da descrição, tornando-a mais detalhada e persuasiva.
              Novas características e benefícios do produto serão adicionados automaticamente.
              Este processo pode levar alguns segundos.
            </p>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsImproveDescriptionDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={confirmAndImproveDescription} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Confirmar Melhoria
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para seleção de idioma para tradução da descrição */}
      <Dialog open={isTranslateDescriptionDialogOpen} onOpenChange={setIsTranslateDescriptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Traduzir Descrição</DialogTitle>
            <DialogDescription>
              Selecione o idioma para traduzir a descrição do produto
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {languages.map((language) => (
              <Button
                key={language.code}
                variant={selectedLanguage === language.code ? "default" : "outline"}
                className={`justify-start h-auto py-3 ${
                  selectedLanguage === language.code ? "border-primary" : "border-border/60"
                }`}
                onClick={() => setSelectedLanguage(language.code)}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{language.flag}</span>
                  <span>{language.name}</span>
                  {selectedLanguage === language.code && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsTranslateDescriptionDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={confirmAndTranslateDescription} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
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
    </div>
  );
} 