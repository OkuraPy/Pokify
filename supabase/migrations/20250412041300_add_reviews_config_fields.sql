-- Migration para adicionar campos de configuração para o widget de reviews
-- Criado em: 2025-04-12

-- Adicionar colunas para configuração do widget
ALTER TABLE public.review_configs
ADD COLUMN IF NOT EXISTS position_type TEXT,
ADD COLUMN IF NOT EXISTS custom_css TEXT,
ADD COLUMN IF NOT EXISTS display_format TEXT DEFAULT 'padrão',
ADD COLUMN IF NOT EXISTS status TEXT;
