# Plano de Implementação: Extrator de Produtos com OpenAI

## 1. Análise da Implementação Atual

### 1.1 Fluxo da API de Extração Atual

- A API atual usa o endpoint do Linkfy: `https://api.linkfy.io/api/text/extract-web-info`
- A requisição recebe a URL do produto e retorna um objeto com:
  - `title`: título do produto
  - `description`: descrição em HTML
  - `markdownText`: conteúdo em formato markdown
  - `images`: array com URLs das imagens
  - `price`: objeto com preços (current/compare)

### 1.2 Processo de Extração de Imagens

- As imagens são extraídas de duas formas:
  - Diretamente do array `images` retornado pela API
  - Extraídas do markdown usando regex: `/!\[.*?\]\((.*?)\)/g`
- São filtradas imagens válidas (terminadas em jpg, png, webp)
- O sistema limita a 5 imagens (slice)

### 1.3 Salvamento no Banco de Dados

- Processo executado pela função `saveExtractedProduct` no arquivo `lib/product-extractor.ts`
- Para cada imagem:
  - É gerado um nome único
  - A imagem é baixada via fetch
  - É feito upload para o Supabase Storage
  - A URL pública é armazenada
- O produto é salvo com:
  - Dados básicos (título, descrição, preço)
  - URLs das imagens do Supabase
  - Informações de origem (URL, plataforma)
  - Status 'imported'
- Se houver reviews, são salvos na tabela 'reviews'

### 1.4 Integração com OpenAI (Padrão existente)

- Inicialização da API:
  ```js
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  ```

- Formato das chamadas de API:
  ```js
  const completion = await openai.chat.completions.create({
    model: "gpt-4", // ou "gpt-3.5-turbo" para chamadas mais simples
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      { role: "user", content: userPrompt }
      // mensagens adicionais se necessário
    ],
    temperature: 0.7,
    max_tokens: 1000 // ajustado conforme necessidade
  });
  
  const responseContent = completion.choices[0]?.message?.content || '';
  ```

## 2. Plano de Implementação do Novo Extrator

### 2.1 Estrutura de Arquivos

1. **Novos arquivos a serem criados:**
   - `lib/openai-extractor.ts` - Nova lógica de extração com OpenAI
   - `app/api/products/extract-openai/route.ts` - Nova rota de API

2. **Arquivos a serem modificados:**
   - `app/dashboard/stores/[storeId]/product-form.tsx` - Adicionar opção para usar o novo extrator

### 2.2 Fluxo do Novo Processo

1. **Extração inicial com Linkfy (manter fluxo atual)**
   - Obter markdown e dados iniciais do produto

2. **Processamento com OpenAI**
   - Enviar markdown para OpenAI
   - Solicitar extração estruturada de:
     - Título correto do produto
     - Preço atual e de comparação
     - Descrição refinada
     - URLs das imagens principais (carrossel)
     - URLs das imagens da descrição

3. **Processamento de resultados**
   - Separar imagens em duas categorias:
     - Imagens principais para o carrossel
     - Imagens secundárias da descrição
   - Estruturar dados para retornar ao frontend

4. **Retorno para o frontend**
   - Formato compatível com o existente
   - Categorização clara de imagens

### 2.3 Implementação OpenAI

#### Prompts de Sistema

```
Você é um assistente especializado em extrair informações estruturadas de páginas de produtos. 
Sua tarefa é analisar o markdown fornecido e extrair com precisão os seguintes elementos:

1. O título exato do produto
2. O preço atual (em formato numérico)
3. O preço de comparação/anterior, se disponível (em formato numérico)
4. Uma descrição clara e concisa do produto
5. As URLs das imagens principais do produto (geralmente as primeiras no documento, usadas no carrossel)
6. As URLs das imagens secundárias (que aparecem ao longo da descrição)

Você deve diferenciar corretamente entre imagens principais (do carrossel de produto) e imagens secundárias (ilustrativas na descrição).
```

#### Prompt do Usuário

```
Analise o seguinte markdown de um produto e-commerce e extraia as informações estruturadas:

[MARKDOWN AQUI]

Forneça o resultado APENAS no seguinte formato JSON, sem explicações adicionais:

{
  "title": "Título exato do produto",
  "currentPrice": 99.99,
  "comparePrice": 129.99,
  "description": "Descrição clara do produto",
  "mainImages": ["url1", "url2", "url3"],
  "descriptionImages": ["url1", "url2"]
}

Se algum campo não estiver disponível, retorne null para esse campo, exceto para arrays que devem ser vazios [].
```

## 3. Plano de Execução Passo a Passo

### Parte 1: Preparação e Criação de Arquivos

1. **Criar arquivo de implementação da OpenAI**
   - Criar `lib/openai-extractor.ts`
   - Implementar função `extractProductDataWithOpenAI`

2. **Criar nova rota de API**
   - Criar `app/api/products/extract-openai/route.ts`
   - Implementar fluxo que combina Linkfy + OpenAI

### Parte 2: Implementação das Funções Principais

1. **Implementar extração com OpenAI**
   - Função para processar markdown com a OpenAI
   - Função para estruturar o resultado

2. **Implementar processamento de imagens**
   - Função para validar URLs de imagens
   - Função para remover duplicatas

3. **Adaptar para o formato esperado pelo frontend**
   - Função para converter o resultado para o formato compatível

### Parte 3: Integrações e Testes

1. **Modificar o formulário de produtos**
   - Adicionar opção para usar o novo extrator
   - Manter compatibilidade com o fluxo existente

2. **Testes e Validações**
   - Testar com diferentes URLs de produtos
   - Validar extração correta de imagens principais
   - Comparar com resultados da API atual

### Parte 4: Finalização e Documentação

1. **Refinar implementação**
   - Otimizar prompts com base nos resultados
   - Adicionar tratamento de erros robusto

2. **Documentação**
   - Atualizar este documento com aprendizados
   - Documentar limitações e melhorias futuras

## 4. Considerações Técnicas

### 4.1 Tratamento de Erros

- Implementar fallback para o extrator original em caso de falha do OpenAI
- Adicionar timeouts adequados para as chamadas de API
- Implementar retry logic para casos de falha temporária

### 4.2 Otimização de Custos

- Usar gpt-3.5-turbo quando possível
- Limitar tokens do markdown enviado (truncar se necessário)
- Implementar cache para URLs já processadas

### 4.3 Segurança

- Validar todas as URLs antes de processar
- Sanitizar o markdown antes de enviar para a OpenAI
- Implementar rate limiting para evitar abusos 