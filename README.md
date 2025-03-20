# Pokify

Aplicação web para gerenciar e visualizar sua coleção de Pokémon.

## Tecnologias

- Next.js 13.5
- TypeScript
- Tailwind CSS
- Supabase (Autenticação e Banco de Dados)
- Shadcn/UI

## Preparando para deploy no Vercel

### Passos para deploy

1. Faça login na plataforma Vercel (https://vercel.com)
2. Crie um novo projeto e conecte ao repositório Git
3. Configure as seguintes variáveis de ambiente:

```
NEXT_PUBLIC_SUPABASE_URL=seu-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
```

4. Clique em Deploy

### Configurações adicionais

- A região de deploy está configurada para "gru1" (São Paulo) no arquivo vercel.json
- Headers de segurança básicos estão configurados no arquivo vercel.json
- As imagens estão configuradas para os seguintes domínios: 'images.unsplash.com', 'ae01.alicdn.com', 'cdn.shopify.com', 'i.imgur.com'

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Criar build de produção
npm run build

# Iniciar servidor de produção
npm run start
```

## Supabase

Este projeto utiliza o Supabase para autenticação e armazenamento de dados. Certifique-se de configurar corretamente o banco de dados e as políticas de segurança no painel do Supabase. 