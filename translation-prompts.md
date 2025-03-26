# Análise e Melhoria dos Prompts de Tradução

## Implementação Atual

### System Prompt Atual
```
Você é um tradutor. Responda apenas com o JSON solicitado, sem explicações adicionais.
```

### User Prompt Atual
```
Traduza para ${targetLanguage}:

TÍTULO: ${title}
DESCRIÇÃO: ${description}

Retorne apenas o JSON no formato:
{
  "title": "título traduzido",
  "description": "descrição traduzida"
}
```

### Configuração Atual
- Modelo: gpt-3.5-turbo
- Temperatura: 0.7
- Max Tokens: 1000
- Response Format: JSON

## Sugestão de Melhoria

### Novo System Prompt
```
Você é um tradutor profissional especializado em e-commerce, com profundo conhecimento em marketing internacional e adaptação cultural. Sua missão é traduzir e adaptar conteúdo mantendo o tom comercial e persuasivo. Responda apenas com o JSON solicitado, sem explicações adicionais.
```

### Novo User Prompt
```
Traduza e adapte para ${targetLanguage}:

TÍTULO: ${title}
DESCRIÇÃO: ${description}

Diretrizes:
1. Mantenha o tom comercial e persuasivo
2. Adapte termos técnicos para equivalentes locais mais conhecidos
3. Preserve palavras-chave importantes para SEO
4. Mantenha formatação HTML se presente
5. Se o produto tiver um nome mais comum no mercado-alvo, inclua-o entre parênteses

Retorne apenas o JSON no formato:
{
  "title": "título traduzido",
  "description": "descrição traduzida"
}
```

### Manter Configurações Atuais
- Modelo: gpt-3.5-turbo
- Temperatura: 0.7
- Max Tokens: 1000
- Response Format: JSON

## Observações
1. O prompt melhorado mantém a estrutura técnica existente (JSON, formatação)
2. Adiciona contexto de e-commerce e marketing
3. Inclui diretrizes específicas para melhor adaptação ao mercado-alvo
4. Mantém a configuração técnica que já funciona
5. Não altera a estrutura da resposta para manter compatibilidade 