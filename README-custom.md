# Pokify Project

## Configuração do OpenAI API

Para que a funcionalidade de geração de reviews funcione corretamente, você precisa adicionar as seguintes variáveis de ambiente ao seu arquivo `.env.local`:

```
OPENAI_API_KEY=sua-chave-da-api-openai
NEXT_PUBLIC_OPENAI_API_KEY=sua-chave-da-api-openai
```

A aplicação utiliza a variável `OPENAI_API_KEY` para as funções do lado do servidor e `NEXT_PUBLIC_OPENAI_API_KEY` para os componentes do lado do cliente.

## Funcionalidades Atualizadas

- Geração de reviews usando OpenAI
- Tradução de textos
- Melhoria de descrições de produtos
