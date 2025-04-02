'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Image, Info } from 'lucide-react';

interface DescriptionImagesProps {
  images: string[];
  title: string;
}

export function DescriptionImages({ images, title }: DescriptionImagesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Se não houver imagens, não mostrar o componente
  if (!images || images.length === 0) {
    return null;
  }
  
  return (
    <Card className="border-0 shadow-sm overflow-hidden mt-4">
      <CardHeader className="border-b bg-gray-50 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Imagens da Descrição do Produto</CardTitle>
          <div className="text-sm text-muted-foreground">
            {images.length} {images.length === 1 ? 'imagem' : 'imagens'} encontrada{images.length !== 1 ? 's' : ''} na descrição
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {images.length > 0 ? (
          <>
            {/* Modal para visualização ampliada */}
            {selectedImage && (
              <div 
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                onClick={() => setSelectedImage(null)}
              >
                <div className="relative max-w-3xl max-h-[90vh] w-full">
                  <img 
                    src={selectedImage} 
                    alt={title} 
                    className="w-full h-auto object-contain rounded-lg"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                    onClick={() => setSelectedImage(null)}
                  >
                    <span className="sr-only">Fechar</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="h-5 w-5"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Galeria de imagens */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className="relative overflow-hidden rounded-md border aspect-square cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage(image)}
                >
                  <img 
                    src={image} 
                    alt={`${title} - Imagem ${index + 1}`} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/300x300/f3f4f6/a1a1aa?text=Imagem+indisponível';
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <Alert variant="default" className="bg-muted text-muted-foreground">
            <Info className="h-4 w-4" />
            <AlertTitle>Sem imagens</AlertTitle>
            <AlertDescription>
              Este produto não possui imagens adicionais na descrição.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 