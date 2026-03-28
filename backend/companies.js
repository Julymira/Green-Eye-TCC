const express = require('express');
const router = express.Router();
const pool = require('./db');
const bcrypt = require('bcrypt'); 

// POST: Cadastro de Empresa Parceira
router.post('/', async (req, res) => {
    const { nome_fantasia, cnpj, email_contato, password, telefone, responsavel, is_ong, categories } = req.body;

    // Validação de segurança no Backend (Limite de 3 categorias)
    if (!categories || categories.length > 3) {
        return res.status(400).json({ error: "Uma empresa pode selecionar no máximo 3 categorias." });
    }

    const client = await pool.connect(); // Usamos 'client' para garantir uma transação

    try {
        await client.query('BEGIN'); // Inicia a transação

        // Criptografa a senha antes de salvar
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insere na tabela de empresas
        const companyRes = await client.query(
            `INSERT INTO public.companies 
            (nome_fantasia, cnpj, email_contato, password, telefone, responsavel, is_ong) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [nome_fantasia, cnpj, email_contato, hashedPassword, telefone, responsavel, is_ong]
        );

        const companyId = companyRes.rows.id;

        // Insere as categorias na tabela intermediária (N:N)
        const categoryQueries = categories.map(categoryId => {
            return client.query(
                'INSERT INTO public.company_categories (company_id, category_id) VALUES ($1, $2)',
                [companyId, categoryId]
            );
        });

        await Promise.all(categoryQueries); // Executa todas as inserções de categoria

        await client.query('COMMIT'); // Finaliza a transação com sucesso
        res.status(201).json({ message: "Empresa cadastrada com sucesso!", id: companyId });

    } catch (err) {
        await client.query('ROLLBACK'); // Desfaz tudo se der erro
        console.error(err);
        res.status(500).json({ error: "Erro ao cadastrar empresa. Verifique se o CNPJ ou E-mail já existem." });
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
});

// GET: Listar todas as categorias
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.categories ORDER BY nome ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Erro ao buscar categorias." });
    }
});

module.exports = router;