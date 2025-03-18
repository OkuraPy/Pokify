import { ProductDetails } from "./product-details";
import { Metadata } from "next";

export interface ProductPageProps {
  params: {
    storeId: string;
    productId: string;
  };
}

export async function generateStaticParams() {
  // Como estamos usando dados mockados, vamos retornar apenas os IDs que já conhecemos
  return [
    { storeId: '1', productId: '1' },
    { storeId: '1', productId: '2' },
    { storeId: '1', productId: '3' },
    { storeId: '1', productId: '4' },
  ];
}

export async function generateMetadata(
  { params }: ProductPageProps
): Promise<Metadata> {
  return {
    title: 'Detalhes do Produto | Pokify',
    description: 'Visualize e edite os detalhes do produto',
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div className="container py-6">
      <ProductDetails storeId={params.storeId} productId={params.productId} />
    </div>
  );
}
