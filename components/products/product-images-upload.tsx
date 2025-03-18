'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ProductImagesUploadProps {
  productId: string;
  initialImages?: string[];
  onImagesChange?: (images: string[]) => void;
}

export function ProductImagesUpload({
  productId,
  initialImages = [],
  onImagesChange,
}: ProductImagesUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (images.length + acceptedFiles.length > 5) {
      toast.error('Máximo de 5 imagens permitidas');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedImageUrls = await Promise.all(
        acceptedFiles.map(async (file) => {
          // Criar um nome único para o arquivo
          const fileExt = file.name.split('.').pop();
          const fileName = `${productId}/${uuidv4()}.${fileExt}`;
          
          // Upload do arquivo para o bucket 'images' no Supabase Storage
          const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (error) {
            console.error('Erro ao fazer upload:', error);
            throw new Error(`Erro ao fazer upload: ${error.message}`);
          }

          // Obter a URL pública do arquivo
          const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

          return publicUrlData.publicUrl;
        })
      );

      const updatedImages = [...images, ...uploadedImageUrls];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
      toast.success('Imagens adicionadas com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setIsUploading(false);
    }
  }, [images, onImagesChange, productId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeImage = async (index: number) => {
    try {
      const imageUrl = images[index];
      
      // Se for uma URL do Supabase Storage, tenta remover o arquivo
      if (imageUrl.includes('images')) {
        // Extrair o path do arquivo da URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts.slice(urlParts.indexOf('images') + 1).join('/');
        
        if (fileName) {
          const { error } = await supabase.storage
            .from('images')
            .remove([fileName]);
          
          if (error) {
            console.error('Erro ao remover arquivo:', error);
          }
        }
      }
      
      // Atualiza o estado local
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesChange?.(newImages);
      toast.success('Imagem removida');
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          hover:border-primary hover:bg-primary/5
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">Solte as imagens aqui...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Arraste e solte imagens aqui, ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou WEBP (max. 5 arquivos, até 10MB cada)
              </p>
            </>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-2 p-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Fazendo upload...</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="relative aspect-square">
                <Image
                  src={image}
                  alt={`Imagem ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
