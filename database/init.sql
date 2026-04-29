-- =====================================================
-- ARQUIVO DE INICIALIZAÇÃO DO BANCO DE DADOS (Green Eye)
-- VERSÃO 03 - TCC 2
-- =====================================================

-- 1. EXTENSÕES
-- Ativa o PostGIS para lidar com dados geográficos (lat/lng/mapas)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. TABELA DE CATEGORIAS DE LIXO
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL
);

-- 3. TABELA DE USUÁRIOS (Gestores/Fiscais)
-- Login principal via CPF, mas mantendo E-mail para contato
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_temp_password BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE EMPRESAS PARCEIRAS (Companhias/ONGs)
-- Inclui senha para login próprio e classificação binária (is_ong)
CREATE TABLE IF NOT EXISTS public.companies (
    id SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email_contato VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    responsavel VARCHAR(100) NOT NULL,
    is_ong BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE DENÚNCIAS (Reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id SERIAL PRIMARY KEY,
    
    -- Dados da Ocorrência
    descricao_adicional TEXT NOT NULL,
    photo_content BYTEA,
    extensao VARCHAR(3),
    problemas_causados TEXT,
    quantidade VARCHAR(100),
    
    -- Empresa que selecionou a ocorrência
    company_id INTEGER REFERENCES public.companies(id) ON DELETE SET NULL,
    
    -- Controle de Status
    status VARCHAR(50) DEFAULT 'Nova',
    empresa_selecionada BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Localização
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    localizacao geometry(Point, 4326)
);

-- 6. TABELAS INTERMEDIÁRIAS (N:N - Muitos para Muitos)

-- Solicitações de coleta feitas por empresas
CREATE TABLE IF NOT EXISTS public.collection_requests (
    id           SERIAL PRIMARY KEY,
    report_id    INTEGER REFERENCES public.reports(id) ON DELETE CASCADE,
    company_id   INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    status       VARCHAR(20) DEFAULT 'Pendente', -- 'Pendente', 'Aprovada', 'Negada', 'Coletada'
    prazo        TIMESTAMP,
    coletado_em  TIMESTAMP,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Normalização: Permite múltiplas categorias para uma denúncia e para uma empresa

-- Relaciona Denúncias com Categorias
CREATE TABLE IF NOT EXISTS public.report_categories (
    report_id INTEGER REFERENCES public.reports(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (report_id, category_id)
);

-- Relaciona Empresas com Categorias que elas coletam/reciclam
CREATE TABLE IF NOT EXISTS public.company_categories (
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (company_id, category_id)
);

-- 7. ÍNDICES E OTIMIZAÇÃO ESPACIAL
CREATE INDEX IF NOT EXISTS idx_reports_localizacao 
ON public.reports USING GIST (localizacao);

-- 8. AUTOMAÇÃO (TRIGGER PARA GEOMETRIA)
CREATE OR REPLACE FUNCTION public.sync_localizacao_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.localizacao := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_localizacao ON public.reports;
CREATE TRIGGER trg_sync_localizacao
BEFORE INSERT OR UPDATE OF lat, lng ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.sync_localizacao_geom();

-- 9. DADOS INICIAIS (SEED)

-- Categorias Principais (Limitadas conforme sugestão do orientador)
INSERT INTO public.categories (nome) VALUES 
('Eletrônico'), ('Orgânico'), ('Entulho'), ('Pneus'), 
('Móveis'), ('Lixo Doméstico'), ('Hospitalar'), ('Outros')
ON CONFLICT (nome) DO NOTHING;

-- Usuário Admin Padrão (Login via CPF)
INSERT INTO public.users (cpf, email, password, is_temp_password) 
VALUES ('000.000.000-00', 'admin@greeneye.com', '$2b$10$CznwWKZSW/9SForJJMAu4e8GihPjFEWDG3vCTOQXTrqSWXVXMMBu', false)
ON CONFLICT (cpf) DO NOTHING;
