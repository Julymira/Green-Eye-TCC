const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('./auth');

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

// GET: Ocorrências compatíveis com as categorias da empresa (painel empresa)
router.get('/my-matches', verifyToken, async (req, res) => {
    const companyId = req.user.id;
    try {
        // Reset automático: libera ocorrências cujo prazo aprovado expirou
        await db.query(`
            UPDATE public.collection_requests
            SET status = 'Expirada'
            WHERE status = 'Aprovada' AND prazo IS NOT NULL AND prazo < NOW()
        `);
        await db.query(`
            UPDATE public.reports r
            SET empresa_selecionada = false
            WHERE empresa_selecionada = true
              AND NOT EXISTS (
                SELECT 1 FROM public.collection_requests cr
                WHERE cr.report_id = r.id AND cr.status = 'Aprovada'
              )
        `);

        const result = await db.query(`
            SELECT DISTINCT
                r.id, r.lat, r.lng, r.quantidade, r.status, r.created_at,
                r.empresa_selecionada, r.descricao_adicional, r.problemas_causados,
                (r.photo_content IS NOT NULL) as has_photo,
                COALESCE(STRING_AGG(DISTINCT c.nome, ', ' ORDER BY c.nome), 'Sem categoria') as tipo_lixo,
                (SELECT status FROM public.collection_requests
                 WHERE report_id = r.id AND company_id = $1
                 ORDER BY created_at DESC LIMIT 1) as minha_solicitacao,
                (SELECT id FROM public.collection_requests
                 WHERE report_id = r.id AND company_id = $1
                 ORDER BY created_at DESC LIMIT 1) as request_id,
                (SELECT prazo FROM public.collection_requests
                 WHERE report_id = r.id AND company_id = $1 AND status = 'Aprovada'
                 LIMIT 1) as prazo_coleta
            FROM public.reports r
            JOIN public.report_categories rc ON r.id = rc.report_id
            JOIN public.company_categories cc ON rc.category_id = cc.category_id AND cc.company_id = $1
            LEFT JOIN public.categories c ON rc.category_id = c.id
            WHERE r.status != 'Resolvida'
              AND (
                r.empresa_selecionada = false
                OR EXISTS (
                  SELECT 1 FROM public.collection_requests cr2
                  WHERE cr2.report_id = r.id AND cr2.company_id = $1
                    AND cr2.status IN ('Pendente', 'Aprovada')
                )
              )
            GROUP BY r.id
            ORDER BY r.created_at DESC
        `, [companyId]);

        const companyRes = await db.query(
            'SELECT id, nome_fantasia, is_ong FROM public.companies WHERE id = $1',
            [companyId]
        );

        res.json({ reports: result.rows, company: companyRes.rows[0] });
    } catch (err) {
        console.error("Erro ao buscar matches:", err);
        res.status(500).json({ error: "Erro ao buscar ocorrências compatíveis." });
    }
});

// POST: Empresa solicita coleta de uma ocorrência
router.post('/requests/:reportId', verifyToken, async (req, res) => {
    const companyId = req.user.id;
    const { reportId } = req.params;
    try {
        await db.query(
            `INSERT INTO public.collection_requests (report_id, company_id, status)
             VALUES ($1, $2, 'Pendente')`,
            [reportId, companyId]
        );
        res.status(201).json({ message: "Solicitação enviada com sucesso!" });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: "Você já solicitou esta coleta." });
        }
        console.error("Erro ao solicitar coleta:", err);
        res.status(500).json({ error: "Erro ao enviar solicitação." });
    }
});

// POST: Empresa confirma que fez a coleta
router.post('/requests/:requestId/confirm', verifyToken, async (req, res) => {
    const companyId = req.user.id;
    const { requestId } = req.params;
    try {
        const result = await db.query(
            `UPDATE public.collection_requests
             SET status = 'Coletada', coletado_em = NOW()
             WHERE id = $1 AND company_id = $2 AND status = 'Aprovada'
             RETURNING *`,
            [requestId, companyId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Solicitação não encontrada ou não autorizada." });
        }
        res.json({ message: "Coleta confirmada!" });
    } catch (err) {
        console.error("Erro ao confirmar coleta:", err);
        res.status(500).json({ error: "Erro ao confirmar coleta." });
    }
});

module.exports = router;