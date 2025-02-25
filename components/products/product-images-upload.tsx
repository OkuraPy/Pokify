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

    setIsUploading(true);
    try {
      // TODO: Implementar upload real para a API
      // Simulando upload
      const newImages = await Promise.all(
        acceptedFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
          });
        })
      );

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
      toast.success('Imagens adicionadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setIsUploading(false);
    }
  }, [images, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 5,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange?.(newImages);
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
                PNG, JPG ou WEBP (max. 5 arquivos)
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
