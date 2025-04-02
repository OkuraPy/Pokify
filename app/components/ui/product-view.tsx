function formatProductDescription(description: string) {
  // Se a descrição já for HTML, retornar como está
  if (description.includes('<')) {
    return description;
  }
  
  // Caso contrário, converter simples quebras de linha para HTML
  return description.split('\n')
    .filter(line => line.trim())
    .map(line => `<p>${line}</p>`)
    .join('');
}

{/* Descrição do produto */}
<div className="mt-8">
  <h2 className="text-lg font-medium text-gray-900 mb-4">Descrição do Produto</h2>
  <div 
    className="prose prose-sm text-gray-500 max-w-none product-description"
    dangerouslySetInnerHTML={{ 
      __html: formatProductDescription(product.description) 
    }}
  />
  
  {/* Adicionar estilos CSS específicos para as imagens na descrição */}
  <style jsx global>{`
    .product-description img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      margin: 1rem 0;
      display: block;
    }
    
    .product-gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
    }
    
    .product-image-container {
      width: 100%;
      overflow: hidden;
      border-radius: 6px;
    }
    
    .product-detail-image {
      width: 100%;
      height: auto;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .product-detail-image:hover {
      transform: scale(1.05);
    }
  `}</style>
</div> 