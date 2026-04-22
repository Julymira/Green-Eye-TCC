# 🌿 Green Eye - TCC

O Green Eye é um sistema de monitoramento ambiental (WebSIG) criado para identificar e combater o descarte irregular de lixo em Luziânia-GO, como parte do Trabalho de Conclusão de Curso em Sistemas de Informação.

## 🛠️ Tecnologias Utilizadas

**Backend:**
- Node.js + Express.js
- PostgreSQL
- JWT (autenticação)
- Multer (upload de fotos via `bytea`)
- bcrypt (hash de senhas)

**Frontend:**
- React.js
- React Router v6
- React-Leaflet + Leaflet.js (mapas interativos)
- leaflet.heat (mapa de calor)
- Axios

## 🚀 Como Rodar o Projeto

### Pré-Requisitos
- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [PostgreSQL](https://www.postgresql.org/download/)
- (Opcional) [pgAdmin](https://www.pgadmin.org/) ou DBeaver

---

### 1. Clone o repositório
```bash
git clone https://github.com/Julymira/Green-Eye-TCC.git
cd Green-Eye-TCC
```

### 2. Configure o Banco de Dados

1. Crie um banco de dados chamado `greeneye` no PostgreSQL.
2. Abra o arquivo `backend/database/init.sql` e execute o script no banco criado. Isso criará todas as tabelas necessárias.

### 3. Configure as Variáveis de Ambiente

Dentro da pasta `backend`, renomeie `.env.example` para `.env` e preencha com suas credenciais:

```
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greeneye
PORT=3000
JWT_SECRET=sua_chave_secreta
```

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

O frontend estará disponível em **[http://localhost:3001](http://localhost:3001)**  
O backend estará disponível em **[http://localhost:3000](http://localhost:3000)**

---

## 💻 Desenvolvedora

- [Julyana Mira](https://github.com/Julymira)
