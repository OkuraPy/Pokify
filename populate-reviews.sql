-- Script para popular a tabela published_reviews_json com dados de exemplo
-- Para executar, cole este cu00f3digo no Editor SQL do Supabase

-- Primeiro, vamos garantir que a coluna product_id tenha a restriu00e7u00e3o UNIQUE
-- Verificamos se a restriu00e7u00e3o ju00e1 existe antes de tentar criar
DO $$
BEGIN
    -- Verifica se a restriu00e7u00e3o ju00e1 existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'published_reviews_json_product_id_unique'
    ) THEN
        -- Se nu00e3o existir, cria a restriu00e7u00e3o
        ALTER TABLE public.published_reviews_json
        ADD CONSTRAINT published_reviews_json_product_id_unique UNIQUE (product_id);
    END IF;
END$$;

-- Agora, vamos inserir um registro para o produto com ID 2486825c-6e29-4793-9758-47d8b225ebe7
-- Este produto u00e9 o mesmo que estamos usando na pu00e1gina de teste

INSERT INTO public.published_reviews_json (
  product_id, 
  reviews_data, 
  average_rating, 
  reviews_count, 
  product_name,
  product_image,
  created_at, 
  updated_at
) VALUES (
  '2486825c-6e29-4793-9758-47d8b225ebe7',
  jsonb_build_array(
    -- Reviews 1-5: 5 estrelas
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Carlos Silva',
      'rating', 5,
      'content', 'Produto excelente! Superou todas as minhas expectativas. A qualidade é impressionante e o design é perfeito.',
      'date', now() - interval '2 days',
      'images', jsonb_build_array('https://picsum.photos/id/237/300/300', 'https://picsum.photos/id/238/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '2 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Ana Beatriz',
      'rating', 5,
      'content', 'Estou apaixonada por este produto! Entrega rápida e embalagem segura. Recomendo para todos.',
      'date', now() - interval '5 days',
      'images', jsonb_build_array('https://picsum.photos/id/239/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '5 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Roberto Almeida',
      'rating', 5,
      'content', 'Comprei para dar de presente e foi um sucesso! A pessoa adorou e a qualidade é impecável.',
      'date', now() - interval '7 days',
      'images', jsonb_build_array(),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '7 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Mariana Costa',
      'rating', 5,
      'content', 'Perfeito! Valeu cada centavo. Já é o segundo que compro e continuam me surpreendendo positivamente.',
      'date', now() - interval '10 days',
      'images', jsonb_build_array('https://picsum.photos/id/240/300/300', 'https://picsum.photos/id/241/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '10 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'João Paulo',
      'rating', 5,
      'content', 'Não esperava algo tão bom! Chegou antes do prazo e a qualidade é excelente.',
      'date', now() - interval '12 days',
      'images', jsonb_build_array(),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '12 days'
    ),
    
    -- Reviews 6-10: 4 estrelas
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Fernando Gomes',
      'rating', 4,
      'content', 'Muito bom, mas poderia ter algumas melhorias. De qualquer forma, estou satisfeito com a compra.',
      'date', now() - interval '15 days',
      'images', jsonb_build_array('https://picsum.photos/id/242/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '15 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Cristina Oliveira',
      'rating', 4,
      'content', 'Gostei bastante! Porém, a embalagem chegou um pouco danificada. O produto em si está em perfeitas condições.',
      'date', now() - interval '18 days',
      'images', jsonb_build_array(),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '18 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Daniel Mendes',
      'rating', 4,
      'content', 'Ótimo custo-benefício. Cumpre o que promete e tem boa durabilidade.',
      'date', now() - interval '20 days',
      'images', jsonb_build_array('https://picsum.photos/id/243/300/300', 'https://picsum.photos/id/244/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '20 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Camila Souza',
      'rating', 4,
      'content', 'Produto de qualidade, mas o prazo de entrega foi mais longo do que o esperado.',
      'date', now() - interval '25 days',
      'images', jsonb_build_array(),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '25 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Ricardo Nunes',
      'rating', 4,
      'content', 'Atendeu minhas necessidades. Recomendo, embora o manual de instruções pudesse ser mais claro.',
      'date', now() - interval '30 days',
      'images', jsonb_build_array('https://picsum.photos/id/245/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '30 days'
    ),
    
    -- Reviews 11-14: 3 estrelas
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Luciana Ferreira',
      'rating', 3,
      'content', 'Produto razoável. Esperava um pouco mais, mas serve para o propósito.',
      'date', now() - interval '35 days',
      'images', jsonb_build_array(),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '35 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Bruno Santos',
      'rating', 3,
      'content', 'Cumpre o básico. Nada excepcional, mas também não é ruim.',
      'date', now() - interval '40 days',
      'images', jsonb_build_array('https://picsum.photos/id/246/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '40 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Isabela Lima',
      'rating', 3,
      'content', 'Mediano. Funciona, mas não supera outros produtos similares que já usei.',
      'date', now() - interval '45 days',
      'images', jsonb_build_array(),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '45 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Pedro Cardoso',
      'rating', 3,
      'content', 'Serve para o dia a dia. Nada de especial, mas cumpre o que promete.',
      'date', now() - interval '50 days',
      'images', jsonb_build_array('https://picsum.photos/id/247/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '50 days'
    ),
    
    -- Reviews 15-17: 2 estrelas
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Juliana Martins',
      'rating', 2,
      'content', 'Decepcionante. A qualidade está abaixo do que esperava para o preço.',
      'date', now() - interval '55 days',
      'images', jsonb_build_array(),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '55 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Marcos Andrade',
      'rating', 2,
      'content', 'Não recomendo. Muitos problemas logo nos primeiros dias de uso.',
      'date', now() - interval '60 days',
      'images', jsonb_build_array('https://picsum.photos/id/248/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '60 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Carolina Dias',
      'rating', 2,
      'content', 'Esperava mais. O material parece frágil e a funcionalidade deixa a desejar.',
      'date', now() - interval '65 days',
      'images', jsonb_build_array(),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '65 days'
    ),
    
    -- Reviews 18-20: 1 estrela
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Rafael Moreira',
      'rating', 1,
      'content', 'Horrível! Quebrou no segundo dia de uso. Não vale o dinheiro.',
      'date', now() - interval '70 days',
      'images', jsonb_build_array('https://picsum.photos/id/249/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '70 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Amanda Castro',
      'rating', 1,
      'content', 'Pior compra que já fiz. Não funciona como descrito na propaganda.',
      'date', now() - interval '75 days',
      'images', jsonb_build_array(),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '75 days'
    ),
    jsonb_build_object(
      'id', gen_random_uuid(),
      'product_id', '2486825c-6e29-4793-9758-47d8b225ebe7',
      'author', 'Gustavo Pereira',
      'rating', 1,
      'content', 'Estou muito insatisfeito. O suporte ao cliente é inexistente e o produto veio com defeito.',
      'date', now() - interval '80 days',
      'images', jsonb_build_array('https://picsum.photos/id/250/300/300', 'https://picsum.photos/id/251/300/300'),
      'is_selected', true,
      'is_published', true,
      'created_at', now() - interval '80 days'
    )
  ),
  3.45,  -- Média de avaliações: (5*5 + 4*5 + 3*4 + 2*3 + 1*3) / 20 = 3.45
  20,    -- 20 avaliações no total
  'Shampoo Revitalizante Capilar',  -- Nome do produto
  'https://picsum.photos/id/100/300/300',  -- Imagem do produto
  now(),
  now()
)
ON CONFLICT (product_id) DO UPDATE
SET 
  reviews_data = EXCLUDED.reviews_data,
  average_rating = EXCLUDED.average_rating,
  reviews_count = EXCLUDED.reviews_count,
  updated_at = now();

-- Confirme que os dados foram inseridos
SELECT product_id, average_rating, reviews_count, jsonb_array_length(reviews_data) as reviews_count_check
FROM published_reviews_json
WHERE product_id = '2486825c-6e29-4793-9758-47d8b225ebe7';
