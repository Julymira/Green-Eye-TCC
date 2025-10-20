-- Garante que a extensão PostGIS (para mapas) esteja ativada
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

-- 1. Tabela de Denúncias (Reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id integer NOT NULL PRIMARY KEY DEFAULT nextval('public.reports_id_seq'::regclass),
    descricao_adicional text NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    photo_url character varying(255),
    tipo_lixo character varying(100),
    quantidade character varying(100),
    problemas_causados text,
    status character varying(50) DEFAULT 'Nova'::character varying
);

-- Sequência para o ID automático da tabela 'reports'
CREATE SEQUENCE IF NOT EXISTS public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
    OWNED BY public.reports.id;

-- 2. Tabela de Usuários (Administradores)
CREATE TABLE IF NOT EXISTS public.users (
    id integer NOT NULL PRIMARY KEY DEFAULT nextval('public.users_id_seq'::regclass),
    email character varying(255) NOT NULL UNIQUE,
    password character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_temp_password boolean DEFAULT false
);

-- Sequência para o ID automático da tabela 'users'
CREATE SEQUENCE IF NOT EXISTS public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
    OWNED BY public.users.id;

-- (Opcional, mas recomendado) 
-- Cria o usuário admin padrão que você já tem no seu banco
INSERT INTO public.users (email, password, is_temp_password) 
VALUES ('admin@greeneye.com', '$2b$10$CznwWKZSW/9SForJJMAu4e8GihPjFEWDG3vCTOQXTrqSWXVXMMBu', false)
ON CONFLICT (email) DO NOTHING;