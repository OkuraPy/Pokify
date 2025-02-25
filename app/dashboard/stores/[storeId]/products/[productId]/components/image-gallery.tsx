'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Expand, MoveLeft, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Imagem Principal */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary/10">
        <Image
          src={images[selectedImage]}
          alt="Imagem do produto"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Controles */}
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={previousImage}
            className="bg-background/80 hover:bg-background/90"
          >
            <MoveLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextImage}
            className="bg-background/80 hover:bg-background/90"
          >
            <MoveRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Botão Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 bg-background/80 hover:bg-background/90"
        >
          <Expand className="h-4 w-4" />
        </Button>
      </div>

      {/* Miniaturas */}
      <div className="grid grid-cols-5 gap-2">
        {images.map((image, index) => (
          <button
            key={image}
            onClick={() => setSelectedImage(index)}
            className={cn(
              'relative aspect-square rounded-md overflow-hidden',
              'ring-2 ring-offset-2 transition-all',
              selectedImage === index
                ? 'ring-primary'
                : 'ring-transparent hover:ring-primary/50'
            )}
          >
            <Image
              src={image}
              alt={`Miniatura ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Modal Fullscreen */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
          <div className="relative w-full max-w-5xl aspect-square">
            <Image
              src={images[selectedImage]}
              alt="Imagem do produto em tela cheia"
              fill
              className="object-contain"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4"
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
