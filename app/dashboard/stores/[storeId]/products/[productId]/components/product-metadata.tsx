'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ProductMetadataProps {
  product: {
    title: string;
    description: string;
  };
}

export function ProductMetadata({ product }: ProductMetadataProps) {
  const slug = product.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">SEO e Metadados</h4>
        <p className="text-sm text-muted-foreground">
          Informações para otimização em mecanismos de busca
        </p>
      </div>

      <div className="grid gap-6">
        {/* URL Amigável */}
        <div className="space-y-2">
          <Label>URL Amigável</Label>
          <div className="flex items-center gap-2">
            <Input
              value={slug}
              readOnly
              className="font-mono text-sm bg-muted"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(slug)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            URL otimizada para SEO, gerada automaticamente a partir do título
          </p>
        </div>

        {/* Meta Título */}
        <div className="space-y-2">
          <Label>Meta Título</Label>
          <Input
            defaultValue={product.title}
            className="border-border/60"
          />
          <p className="text-sm text-muted-foreground">
            Título que aparecerá nos resultados de busca (recomendado: até 60 caracteres)
          </p>
        </div>

        {/* Meta Descrição */}
        <div className="space-y-2">
          <Label>Meta Descrição</Label>
          <Textarea
            defaultValue={product.description}
            className="resize-none min-h-[100px] border-border/60"
          />
          <p className="text-sm text-muted-foreground">
            Descrição que aparecerá nos resultados de busca (recomendado: até 160 caracteres)
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <Input
            placeholder="pokemon, cards, tcg"
            className="border-border/60"
          />
          <p className="text-sm text-muted-foreground">
            Palavras-chave separadas por vírgula
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-2 rounded-lg border p-4">
          <span className="text-sm font-medium">Preview do Google</span>
          <div className="space-y-1">
            <p className="text-[#1a0dab] text-xl hover:underline cursor-pointer">
              {product.title} | Pokify
            </p>
            <p className="text-[#006621] text-sm">
              https://pokify.com/produtos/{slug}
            </p>
            <p className="text-sm text-[#545454] line-clamp-2">
              {product.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
