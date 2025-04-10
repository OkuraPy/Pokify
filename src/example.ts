import { ProductExtractorService } from './services/product-extractor.service';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

/**
 * Exemplo de uso do extrator de produtos
 */
async function main() {
  try {
    // URL de exemplo para teste
    const url = 'https://midastime.com.br/products/body-shaper-body-modelador-canelado-queima-de-estoque';
    
    console.log('==== Iniciando extração de produto ====');
    console.log(`URL: ${url}`);
    
    // Extrair dados do produto
    const productData = await ProductExtractorService.extractProductData(url);
    
    // Exibir os resultados
    console.log('\n==== Dados extraídos do produto ====');
    console.log(`Título: ${productData.title}`);
    console.log(`Descrição: ${productData.description.substring(0, 100)}...`);
    console.log(`Preço atual: ${productData.price}`);
    console.log(`Preço original: ${productData.originalPrice || 'N/A'}`);
    console.log(`Desconto: ${productData.discountPercentage || 'N/A'}%`);
    console.log(`Moeda: ${productData.currency}`);
    console.log(`URL da imagem: ${productData.imageUrl}`);
    console.log(`Variantes: ${productData.variants?.join(', ') || 'N/A'}`);
    
    if (productData.installments) {
      console.log(`Parcelamento: ${productData.installments.count}x de ${productData.installments.value}`);
    }
    
  } catch (error) {
    console.error('Erro ao executar o exemplo:', error);
  }
}

// Executar o exemplo
main().catch(console.error); 