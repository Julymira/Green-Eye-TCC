-- =====================================================
-- ARQUIVO DE INICIALIZAÇÃO DO BANCO DE DADOS (Green Eye)
-- =====================================================

-- 1. EXTENSÕES
-- Ativa o PostGIS para lidar com dados geográficos (lat/lng/mapas)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. TABELA DE USUÁRIOS (Gestores)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_temp_password BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE DENÚNCIAS (Reports)
-- Já inclui todas as colunas novas: problemas_causados, photo_url, updated_at
CREATE TABLE IF NOT EXISTS public.reports (
    id SERIAL PRIMARY KEY,
    
    -- Dados Básicos
    tipo_lixo VARCHAR(100),
    quantidade VARCHAR(100),
    problemas_causados TEXT,
    descricao_adicional TEXT NOT NULL,
    photo_url VARCHAR(255),
    
    -- Controle de Status
    status VARCHAR(50) DEFAULT 'Nova',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Localização (Coordenadas numéricas simples)
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,

    -- Localização (Geometria PostGIS para mapas avançados)
    localizacao geometry(Point, 4326)
);

-- 4. ÍNDICES E OTIMIZAÇÃO
-- Cria um índice espacial para deixar as buscas no mapa rápidas
CREATE INDEX IF NOT EXISTS idx_reports_localizacao 
ON public.reports USING GIST (localizacao);

-- 5. AUTOMAÇÃO (TRIGGER)
-- Função que mantém a coluna geométrica (localizacao) sempre sincronizada com lat/lng
CREATE OR REPLACE FUNCTION public.sync_localizacao_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.localizacao := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gatilho que dispara a função acima sempre que alguém insere ou atualiza uma denúncia
DROP TRIGGER IF EXISTS trg_sync_localizacao ON public.reports;
CREATE TRIGGER trg_sync_localizacao
BEFORE INSERT OR UPDATE OF lat, lng ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.sync_localizacao_geom();

-- 6. DADOS INICIAIS (SEED)
-- Usuário Admin Padrão (Senha: admin123)
-- O hash abaixo corresponde a 'admin123' gerado via bcrypt
INSERT INTO public.users (email, password, is_temp_password) 
VALUES ('admin@greeneye.com', '$2b$10$CznwWKZSW/9SForJJMAu4e8GihPjFEWDG3vCTOQXTrqSWXVXMMBu', false)
ON CONFLICT (email) DO NOTHING;

-- Denúncia de Teste (Para ver algo no mapa logo de cara)
INSERT INTO public.reports (descricao_adicional, lat, lng, tipo_lixo, quantidade, problemas_causados, status)
VALUES 
('Lixo acumulado na esquina, teste inicial.', -16.2512, -47.9503, 'Entulho', 'Média', 'Mau cheiro', 'Nova')
ON CONFLICT DO NOTHING;