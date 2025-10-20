# 🌿 Green Eye - TCC

O Green Eye é um sistema de monitoramento ambiental (WebSIG) criado para identificar e combater o descarte irregular de lixo em Luziânia-GO, como parte do Trabalho de Conclusão de Curso em Sistemas de Informação.

## 🛠️ Tecnologias Utilizadas
* **Backend:** Node.js, Express.js
* **Banco de Dados:** PostgreSQL com a extensão PostGIS
* **Frontend:** HTML5, CSS3, JavaScript
* **Mapas:** Leaflet.js

## 🚀 Como Rodar o Projeto

Para rodar este projeto localmente, siga os passos abaixo:

### Pré-Requisitos
* [Node.js](https://nodejs.org/)
* [Git](https://git-scm.com/)
* [PostgreSQL](https://www.postgresql.org/download/) com a extensão [PostGIS](https://postgis.net/install/)
* (Opcional) [pgAdmin](https://www.pgadmin.org/) ou DBeaver para gerenciar o banco

---

### 1. Instalação do Backend e Frontend

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/Julymira/Green-Eye-TCC.git](https://github.com/Julymira/Green-Eye-TCC.git)
    ```

2.  **Entre na pasta do backend:**
    (O `package.json` está dentro da pasta `backend`, então todos os comandos npm devem ser rodados lá)
    ```bash
    cd Green-Eye-TCC/backend
    ```

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

### 2. Configuração do Banco de Dados

1.  **Crie o Banco de Dados:**
    * Abra o pgAdmin (ou `psql`) e crie um **novo banco de dados** chamado `greeneye`.

2.  **Ative o PostGIS:**
    * Abra uma "Query Tool" (Ferramenta de Consulta) para o banco `greeneye` e rode o comando:
    ```sql
    CREATE EXTENSION postgis;
    ```

3.  **Crie as Tabelas:**
    * Ainda na Query Tool, abra o arquivo `backend/database/init.sql` (que está neste repositório).
    * Copie **todo** o conteúdo do arquivo `init.sql` e cole na Query Tool.
    * Execute o script. Isso irá criar as tabelas `users` e `reports` com todas as colunas corretas.

### 3. Variáveis de Ambiente

1.  **Atualize a senha do arquivo `.env`:**
    * Dentro da pasta `backend`, você encontrará um arquivo chamado `.env`.
    * Abra o arquivo `.env` e preencha suas credenciais do PostgreSQL (principalmente a `DB_PASSWORD` que você usa no seu computador).

    ```
    # Credenciais do Banco de Dados PostgreSQL
    DB_USER=postgres
    DB_PASSWORD=sua_senha_aqui
    DB_HOST=localhost
    DB_PORT=5432
    DB_DATABASE=greeneye
    ```

### 4. Execute a Aplicação

1.  **Inicie o servidor:**
    (Ainda dentro da pasta `backend`)
    ```bash
    node index.js
    ```

    **Para Desenvolvimento (Recomendado):**
    Este comando usa o `nodemon` para reiniciar automaticamente o servidor sempre que você salvar uma alteração no código.

    ```bash
    npm run dev
    ```

2.  **Acesse a Aplicação:**
    * O servidor estará rodando e servindo o frontend. Abra seu navegador e acesse:
    
    **[http://localhost:3000](http://localhost:3000)**

---

## 💻 Desenvolvedora

* [Julyana Mira](https://github.com/Julymira)