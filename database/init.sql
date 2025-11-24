-- 1. CONFIGURAÇÃO INICIAL
-- Garante que a extensão PostGIS (para mapas) esteja ativada
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- 2. CRIAÇÃO DE SEQUÊNCIAS (IDs Automáticos)
-- Sequência para a tabela 'users'
CREATE SEQUENCE IF NOT EXISTS public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Sequência para a tabela (Reports)
CREATE SEQUENCE IF NOT EXISTS public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- 3. CRIAÇÃO DAS TABELAS
-- Tabela de Usuários (Apenas Gestores)
CREATE TABLE IF NOT EXISTS public.users (
    id integer NOT NULL PRIMARY KEY DEFAULT nextval('public.users_id_seq'::regclass),
    email character varying(255) NOT NULL UNIQUE,
    password character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_temp_password boolean DEFAULT false
);

-- Tabela de Denúncias (Reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id integer NOT NULL PRIMARY KEY DEFAULT nextval('public.reports_id_seq'::regclass),
    
    -- Dados descritivos
    descricao_adicional text NOT NULL,
    photo_url character varying(255),
    tipo_lixo character varying(100),
    quantidade character varying(100),
    problemas_causados text,
    status character varying(50) DEFAULT 'Nova'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,

    -- Dados de Localização Simples (Para seu React/Node atual)
    lat double precision NOT NULL,
    lng double precision NOT NULL,

    -- Dados de Localização PostGIS (Para o TCC e Performance)
    -- SRID 4326 = Padrão GPS (WGS 84)
    localizacao geometry(Point, 4326)
);

-- Vincula as sequências às tabelas (Boa prática)
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;

-- 4. LÓGICA GEOGRÁFICA (PostGIS Automático)
-- A. Cria o Índice Espacial (Torna o mapa rápido)
CREATE INDEX IF NOT EXISTS idx_reports_localizacao 
ON public.reports USING GIST (localizacao);

-- B. Função para sincronizar lat/lng com a coluna geométrica
CREATE OR REPLACE FUNCTION public.sync_localizacao_geom()
RETURNS TRIGGER AS $$
BEGIN
    -- Pega a longitude (NEW.lng) e latitude (NEW.lat) e cria o ponto geométrico
    -- Se lat ou lng mudarem, a coluna localizacao atualiza sozinha
    NEW.localizacao := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- C. Gatilho (Trigger) que dispara a função acima
DROP TRIGGER IF EXISTS trg_sync_localizacao ON public.reports;

CREATE TRIGGER trg_sync_localizacao
BEFORE INSERT OR UPDATE OF lat, lng ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.sync_localizacao_geom();

-- 5. DADOS INICIAIS (Seed)
-- Cria o usuário admin padrão
INSERT INTO public.users (email, password, is_temp_password) 
VALUES ('admin@greeneye.com', '$2b$10$CznwWKZSW/9SForJJMAu4e8GihPjFEWDG3vCTOQXTrqSWXVXMMBu', false)
ON CONFLICT (email) DO NOTHING;

-- (Opcional) Insere uma denúncia de teste para validar o Trigger
INSERT INTO public.reports (descricao_adicional, lat, lng, tipo_lixo, quantidade)
VALUES ('Teste de inicialização', -16.2512, -47.9503, 'Entulho', 'Média')
ON CONFLICT DO NOTHING;