'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Expand, MoveLeft, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // Se não houver imagens, mostrar placeholder
  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-secondary/20 rounded-lg h-64">
        <p className="text-muted-foreground">Nenhuma imagem disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Imagem Principal */}
      <div className="relative aspect-square rounded-md overflow-hidden border border-border/60 group">
        <Image
          src={images[selectedImage]}
          alt={`Imagem ${selectedImage + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setModalOpen(true)}
        >
          <Expand className="h-5 w-5" />
        </Button>
        
        {images.length > 1 && (
          <>
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
              onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
            >
              <MoveLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
              onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
            >
              <MoveRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
      
      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "relative aspect-square rounded-md overflow-hidden border",
                selectedImage === index 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border/60 hover:border-primary/60 transition-colors"
              )}
              onClick={() => setSelectedImage(index)}
            >
              <Image
                src={image}
                alt={`Miniatura ${index + 1}`}
                fill
                sizes="(max-width: 768px) 20vw, 10vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Modal de visualização expandida */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <div className="relative aspect-square w-full overflow-hidden bg-black/95 rounded-lg">
            <Image
              src={images[selectedImage]}
              alt={`Imagem em tela cheia ${selectedImage + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
            
            {images.length > 1 && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                >
                  <MoveLeft className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                >
                  <MoveRight className="h-5 w-5" />
                </Button>
              </>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    selectedImage === index ? "bg-white" : "bg-white/50 hover:bg-white/80"
                  )}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
