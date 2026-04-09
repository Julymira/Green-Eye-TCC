const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'minha_chave_secreta_tcc_2026';

router.post('/login', async (req, res) => {
    const { cnpj, password } = req.body;

    if (!cnpj || !password) {
        return res.status(400).json({ error: "CNPJ e senha são obrigatórios" });
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '');

    try {
        // CORREÇÃO: Usando db.query conforme seu db.js exporta
        const result = await db.query('SELECT * FROM public.companies WHERE cnpj = $1', [cnpjLimpo]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "CNPJ ou senha incorretos." });
        }

        // CORREÇÃO: Pegando o primeiro item do array
        const company = result.rows[0]; 

        // Compara a senha digitada com o hash do banco
        const isPasswordValid = await bcrypt.compare(password, company.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "CNPJ ou senha incorretos." });
        }

        // Gera o Token JWT para a Empresa
        const token = jwt.sign(
            { id: company.id, userType: 'company', name: company.nome_fantasia },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login realizado com sucesso!",
            token,
            user: {
                id: company.id,
                nome: company.nome_fantasia,
                userType: 'company'
            }
        });

    } catch (err) {
        console.error("Erro no login da empresa:", err);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// -----------------------------------------------------------
// 2. POST: Cadastro de Empresa Parceira (Com correção do ID)
// -----------------------------------------------------------

router.post('/', async (req, res) => {
    const { nome_fantasia, cnpj, email_contato, password, telefone, responsavel, is_ong, categories } = req.body;

    const cnpjLimpo = cnpj.replace(/\D/g, '');
    const client = await db.connect();

    try {
        await client.query('BEGIN'); // Inicia a transação

        // 1. Criptografia da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insere a Empresa
        const companyRes = await client.query(
            `INSERT INTO public.companies 
            (nome_fantasia, cnpj, email_contato, password, telefone, responsavel, is_ong) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [nome_fantasia, cnpjLimpo, email_contato, hashedPassword, telefone, responsavel, is_ong]
        );

        const companyId = companyRes.rows[0].id;

        // 3. Insere as Categorias Selecionadas (agora sem limite de 3)
        if (categories && categories.length > 0) {
            const categoryQueries = categories.map(categoryId => {
                return client.query(
                    'INSERT INTO public.company_categories (company_id, category_id) VALUES ($1, $2)',
                    [companyId, categoryId]
                );
            });
            await Promise.all(categoryQueries);
        }

        await client.query('COMMIT'); // Se tudo deu certo, salva no banco
        res.status(201).json({ message: "Empresa e categorias registradas com sucesso!", id: companyId });

    } catch (err) {
        await client.query('ROLLBACK'); // Se der erro em qualquer parte, desfaz tudo
        console.error("Erro no cadastro:", err);
        res.status(500).json({ error: "Erro ao cadastrar empresa. Verifique se o CNPJ já existe." });
    } finally {
        client.release(); // Libera o cliente de volta para o pool
    }
});

// GET: Listar todas as categorias
router.get('/categories', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM public.categories ORDER BY nome ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar categorias:", err);
        res.status(500).json({ error: "Erro ao buscar categorias." });
    }
});

module.exports = router;