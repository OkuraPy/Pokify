# Sistema de Extração Dual

Este sistema implementa um mecanismo para extrair dados de produtos de e-commerce utilizando duas APIs diferentes:

1. **Linkfy** (extrator original)
2. **FireCrawl** (nova implementação)

## Estrutura

A arquitetura utiliza o padrão Strategy/Adapter para permitir a fácil troca entre os extratores:

- **Interface**: `WebExtractor` define o contrato para todos os extratores
- **Implementações**: Classes que implementam a interface para cada API
  - `LinkfyExtractor`: Extrai dados usando a API Linkfy
  - `FirecrawlExtractor`: Extrai dados usando a API FireCrawl
- **Factory**: `ExtractorFactory` cria a instância apropriada do extrator
- **Configuração**: `ConfigService` gerencia qual extrator deve ser usado
- **Serviço**: `ProductExtractorService` utiliza a factory para extrair dados

## Configuração

A configuração é feita através de variáveis de ambiente:

```
# Controla qual extrator será usado
USE_NEW_EXTRACTOR=false  # false = Linkfy (padrão), true = FireCrawl

# Tokens de API
LINKFY_API_TOKEN=seu_token_aqui
FIRECRAWL_API_KEY=sua_chave_aqui
```

## Como usar

```typescript
import { ProductExtractorService } from './services/product-extractor.service';

// Extrair dados de um produto
const productData = await ProductExtractorService.extractProductData('https://exemplo.com/produto');

console.log(`Título: ${productData.title}`);
console.log(`Preço: ${productData.price}`);
// ...
```

## Alternando entre extratores

Para alternar entre os extratores, basta modificar a variável de ambiente `USE_NEW_EXTRACTOR`:

1. Para usar o Linkfy (original): `USE_NEW_EXTRACTOR=false`
2. Para usar o FireCrawl (novo): `USE_NEW_EXTRACTOR=true`

Isso permite testar a nova implementação sem afetar o funcionamento existente do sistema. 