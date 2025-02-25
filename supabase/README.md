# Configuração do Supabase para o Pokify

Este diretório contém todos os arquivos necessários para configurar o backend do Pokify usando o Supabase.

## Estrutura

- `migrations/` - Scripts SQL para criar e modificar o banco de dados
- `functions/` - Edge Functions para processamento no servidor
- `config.toml` - Configuração do projeto Supabase
- `import_map.json` - Mapa de importações para as Edge Functions

## Configuração Inicial

### 1. Criar uma conta no Supabase

1. Acesse [supabase.com](https://supabase.com/) e crie uma conta
2. Crie um novo projeto
3. Guarde a URL e a chave anônima (`anon key`) do projeto

### 2. Configurar o arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
OPENAI_API_KEY=sua-chave-api-openai
```

### 3. Criar as tabelas do banco de dados

1. No painel do Supabase, acesse a seção "SQL Editor"
2. Execute o script `scripts/setup-database.sql` para criar todas as tabelas necessárias

### 4. Implantar as Edge Functions

Para cada função na pasta `functions/`, siga os passos:

1. No painel do Supabase, acesse a seção "Edge Functions"
2. Clique em "Create a new function"
3. Dê o nome da função (ex: `extract-product`)
4. Copie o conteúdo do arquivo `functions/nome-da-funcao/index.ts`
5. Clique em "Deploy Function"
6. Repita para todas as funções

### 5. Configurar variáveis de ambiente

No painel do Supabase, acesse a seção "Settings" > "API" e adicione a variável de ambiente:

- `OPENAI_API_KEY`: sua chave da API do OpenAI

## Tabelas do Banco de Dados

- `users` - Informações dos usuários
- `stores` - Lojas conectadas
- `products` - Produtos importados
- `reviews` - Avaliações dos produtos
- `publication_history` - Histórico de publicações no Shopify
- `user_settings` - Configurações do usuário

## Edge Functions

- `extract-product` - Extrai dados de produtos de lojas online
- `extract-reviews` - Extrai avaliações de produtos
- `enhance-text` - Melhora textos usando IA
- `translate-text` - Traduz textos usando IA
- `generate-reviews` - Gera avaliações fictícias usando IA
- `shopify-publish` - Publica produtos no Shopify

## Segurança

Todas as tabelas têm políticas de segurança (RLS) que garantem que os usuários só podem acessar seus próprios dados.

## Testes

Para testar o backend, um usuário de teste é criado durante a configuração:

- **Email**: teste@pokify.com
- **Senha**: senha123 