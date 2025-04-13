# Plano de Implementação do Sistema de Reviews para Shopify

## Visão Geral

Este documento detalha o plano de implementação de um sistema de reviews dinâmico para Shopify. O objetivo é criar uma solução flexível que permita aos lojistas configurar a exibição de reviews em suas lojas, utilizando iFrames e uma interface de configuração intuitiva.

## Estrutura Atual do Projeto

- **Componente de Lista de Reviews:** Localizado em `app/dashboard/stores/[storeId]/products/[productId]/components/reviews-list.tsx`. Este componente exibe a lista de reviews de um produto específico.
- **Funções de Backend:** As funções para manipulação de reviews estão em `lib/supabase.ts` e `supabase/functions/extract-reviews/index.ts`.
- **Exemplos de HTML para Reviews:** Exemplos de exibição de reviews estão em `examples/reviews-example.html` e `examples/reviews-final.html`.

## Fases de Implementação

### Fase 1: Interface de Configuração

**Objetivo:** Criar uma interface onde o lojista possa configurar a exibição dos reviews.

- **Localização:** Adicionar um novo componente em `app/dashboard/stores/[storeId]/products/[productId]/components/review-config.tsx`.
- **Componentes:**
  - **Formulário de Configuração:**
    - Dropdown para seleção de posição dos reviews (após descrição, antes do botão de compra, etc.).
    - Campo de texto para inserção de seletor CSS personalizado.
    - Botão para salvar as configurações.
  - **Integração com o Backend:**
    - Utilize as funções existentes em `lib/supabase.ts` para salvar e carregar as configurações.

### Fase 2: Geração do iFrame para Reviews

**Objetivo:** Gerar um link de iFrame que exibe os reviews dinamicamente.

- **Localização:** Criar uma nova função em `supabase/functions/generate-iframe/index.ts`.
- **Funcionalidades:**
  - **API para Gerar iFrame:**
    - Endpoint que retorna o link do iFrame com os reviews.
    - O iFrame deve carregar os reviews dinamicamente do backend.

### Fase 3: Integração com Shopify

**Objetivo:** Integrar o sistema de reviews com a loja Shopify.

- **Injeção de Script Tags:**
  - Utilize a API de Script Tags da Shopify para injetar o script de carregamento do iFrame.
  - Modifique o script existente para carregar o iFrame com base nas configurações salvas.

### Fase 4: Testes e Lançamento

- **Testes:** Realizar testes em um ambiente de desenvolvimento para garantir que todas as funcionalidades estão funcionando conforme o esperado.
- **Lançamento:** Após os testes, implementar as mudanças na loja Shopify.

## Próximos Passos

1. **Desenvolver a Interface de Configuração:** Implemente o formulário com as opções de posição e o campo de seletor CSS.
2. **Implementar o Backend:** Crie as APIs necessárias para salvar e carregar as configurações e gerar o iFrame.
3. **Testar a Funcionalidade:** Teste a interface e as APIs para garantir que tudo funcione conforme o esperado.

Este documento deve ser atualizado conforme o projeto avança e novas necessidades surgem. Use-o como referência para garantir que todos os membros da equipe estejam alinhados com o plano de implementação.
