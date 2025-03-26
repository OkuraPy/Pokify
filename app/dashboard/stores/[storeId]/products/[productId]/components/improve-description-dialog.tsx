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
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ImproveDescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    description: string | null;
  };
  onImproveDescription: (description: string) => Promise<void>;
}

export function ImproveDescriptionDialog({ 
  isOpen, 
  onClose, 
  product,
  onImproveDescription
}: ImproveDescriptionDialogProps) {
  const [isImproving, setIsImproving] = useState(false);

  const handleImproveDescription = async () => {
    setIsImproving(true);

    try {
      console.log('Iniciando requisição de melhoria da descrição, produto ID:', product.id);
      
      // Usar endpoint simplificado
      const url = '/api/improve-description';
      console.log('URL da requisição:', url);
      
      const requestData = {
        productId: product.id,
        title: product?.title || '',
        description: product?.description || ''
      };
      console.log('Dados enviados:', requestData);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('Status da resposta:', response.status);
      
      // Tentar ler o corpo da resposta
      let responseText;
      try {
        responseText = await response.text();
        console.log('Resposta (texto):', responseText);
      } catch (textError) {
        console.error('Erro ao ler corpo da resposta como texto:', textError);
        throw new Error('Erro ao ler resposta do servidor');
      }
      
      // Se a resposta não for OK, lançar erro
      if (!response.ok) {
        console.error('Erro na resposta:', responseText);
        throw new Error('Falha ao melhorar descrição: ' + responseText);
      }
      
      // Tentar parsear o JSON da resposta
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Dados recebidos (parsed):', data);
      } catch (jsonError) {
        console.error('Erro ao parsear JSON:', jsonError);
        throw new Error('Resposta inválida do servidor: ' + responseText);
      }
      
      if (data.success && data.description) {
        console.log('Resposta de sucesso recebida, atualizando UI');
        
        // Chamar o callback com a nova descrição
        await onImproveDescription(data.description);
        
        toast.success(data.message || 'Descrição melhorada com sucesso');
        
        // Fechar o diálogo após salvar
        onClose();
      } else {
        console.error('Resposta sem dados esperados:', data);
        throw new Error('Resposta inválida do servidor: ' + (data.error || 'Formato inesperado'));
      }
    } catch (error) {
      console.error('Erro completo ao melhorar descrição:', error);
      toast.error('Erro ao melhorar descrição com IA: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsImproving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Melhorar Descrição com IA</DialogTitle>
          <DialogDescription>
            Gerar uma descrição otimizada para conversão usando Inteligência Artificial
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-blue-800">
            <p className="text-sm">
              <strong>Importante:</strong> A descrição atual do produto será substituída por uma versão otimizada 
              gerada por IA, seguindo a estrutura AIDA (Atenção, Interesse, Desejo, Ação).
            </p>
            <p className="text-sm mt-2">
              A nova descrição incluirá:
            </p>
            <ul className="text-sm mt-1 ml-5 list-disc">
              <li>Um gancho forte para capturar a atenção</li>
              <li>Benefícios apresentados de forma emocional e lógica</li>
              <li>Provas sociais para gerar credibilidade</li>
              <li>Chamada para ação persuasiva</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImproveDescription} 
            disabled={isImproving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isImproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Melhorando descrição...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Melhorar com IA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 