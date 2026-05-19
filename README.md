# 🌿 Green Eye — Sistema de Monitoramento Ambiental

O **Green Eye** é um sistema WebSIG desenvolvido como Trabalho de Conclusão de Curso em Sistemas de Informação no **IFG — Instituto Federal de Goiás**. Seu objetivo é identificar, registrar e combater o descarte irregular de lixo em **Luziânia-GO**, conectando cidadãos, gestores públicos e empresas parceiras de coleta.

---

## ✨ Funcionalidades

- 📸 Registro de ocorrências de descarte irregular com foto e localização
- 🗺️ Mapa interativo e mapa de calor das ocorrências por bairro
- ♻️ Página pública de pontos de coleta e descarte correto
- 👥 Painel do gestor: aprovação, acompanhamento e análise de ocorrências
- 💼 Portal da empresa parceira: solicitação e confirmação de coletas
- 🛡️ Painel do Super Admin: gerenciamento de gestores e níveis de acesso
- 🔑 Redefinição de senha via e-mail (Nodemailer)
- 📊 Dashboard analítico com gráficos, KPIs e ranking de empresas
- 🗄️ Dados espaciais com **PostGIS** (agrupamento por grade geográfica via `ST_SnapToGrid`)

---

## 🛠️ Tecnologias

**Backend:**
- Node.js + Express.js
- PostgreSQL + **PostGIS** (extensão espacial)
- JWT (autenticação por token)
- bcrypt (hash de senhas)
- Multer (upload de fotos em `bytea`)
- Nodemailer (envio de e-mails — Ethereal em dev, SMTP em produção)
- crypto (geração de tokens seguros)

**Frontend:**
- React.js + React Router v6
- React-Leaflet + Leaflet.js (mapas interativos)
- leaflet.heat (mapa de calor)
- Axios
- react-hot-toast (notificações)

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)
- [PostgreSQL](https://www.postgresql.org/download/) com extensão **PostGIS** instalada
- (Opcional) [pgAdmin](https://www.pgadmin.org/) ou DBeaver

---

### 1. Clone o repositório
```bash
git clone https://github.com/Julymira/Green-Eye-TCC.git
cd Green-Eye-TCC
```

### 2. Configure o Banco de Dados

1. Crie um banco chamado `greeneye` no PostgreSQL.
2. Certifique-se de que a extensão PostGIS está disponível no seu PostgreSQL.
3. Execute o script `database/init.sql` no banco criado — ele cria todas as tabelas, triggers e índices espaciais automaticamente.

### 3. Configure as Variáveis de Ambiente

Dentro da pasta `backend`, renomeie `.env.example` para `.env` e preencha:

```env
# Banco de dados
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greeneye

# Servidor
PORT=3000
NODE_ENV=development

# Autenticação
JWT_SECRET=sua_chave_secreta_aqui

# URL do frontend (para links nos e-mails)
FRONTEND_URL=http://localhost:3001

# E-mail (necessário apenas em produção — em desenvolvimento usa Ethereal automaticamente)
MAIL_HOST=smtp.seuservidor.com
MAIL_PORT=587
MAIL_USER=seu@email.com
MAIL_PASS=sua_senha_smtp
```

> Em ambiente de desenvolvimento (`NODE_ENV=development`), o envio de e-mails usa o **Ethereal** automaticamente — nenhuma configuração SMTP é necessária. O link de preview aparece no console do backend.

### 4. Instale as dependências e rode o Backend

```bash
cd backend
npm install
npm run dev
```

### 5. Instale as dependências e rode o Frontend

```bash
cd frontend
npm install
npm start
```

O frontend estará disponível em **http://localhost:3001**  
O backend estará disponível em **http://localhost:3000**

---

## 👤 Perfis de Acesso

| Perfil | Acesso | Login via |
|---|---|---|
| Cidadão | Registra ocorrências publicamente | Sem login |
| Gestor | Aprova, acompanha e analisa ocorrências | CPF + senha |
| Super Admin | Gerencia gestores e níveis de acesso | CPF + senha |
| Empresa/ONG | Solicita e confirma coletas | CNPJ + senha |

---

## 💻 Desenvolvedora

- [Julyana Mira](https://github.com/Julymira) — IFG Luziânia, Sistemas de Informação
