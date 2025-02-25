import { ImportProductEditor } from "./import-editor";
import { Metadata } from "next";

interface ImportProductPageProps {
  params: {
    storeId: string;
  };
  searchParams: {
    url?: string;
    productId?: string;
  };
}

export const metadata: Metadata = {
  title: 'Importar ou Editar Produto | Pokify',
  description: 'Importe, edite ou melhore produtos para sua loja',
};

// Função necessária para rotas dinâmicas com output: export
export async function generateStaticParams() {
  // Em um ambiente real, buscaríamos os IDs das lojas de uma API ou banco de dados
  // Para fins de exemplo, definimos valores estáticos
  return [
    { storeId: '1' },
    { storeId: '2' },
    { storeId: '3' },
    { storeId: '4' },
  ];
}

export default function ImportProductPage({ params, searchParams }: ImportProductPageProps) {
  return (
    <ImportProductEditor 
      storeId={params.storeId} 
      importUrl={searchParams.url || ''}
      productId={searchParams.productId || ''}
    />
  );
} 