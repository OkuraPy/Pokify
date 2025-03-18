import { EditProductForm } from "../edit-product-form";
import { Metadata } from "next";

export interface EditProductPageProps {
  params: {
    storeId: string;
    productId: string;
  };
}

export const metadata: Metadata = {
  title: 'Editar Produto | Pokify',
  description: 'Edite as informações do produto',
};

export default function EditProductPage({ params }: EditProductPageProps) {
  return (
    <div className="container py-6">
      <EditProductForm storeId={params.storeId} productId={params.productId} />
    </div>
  );
} 