const express = require('express');
const router = express.Router();
const pool = require('./db');
const multer = require('multer');
const { verifyToken } = require('./auth');

const upload = multer({ storage: multer.memoryStorage() });

/*
 * 1. ROTA DE CRIAÇÃO (POST)
 * Agora salva na tabela intermediária report_categories
 */
router.post('/', upload.single('foto'), async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            categorias,
            quantidade,
            problemas_causados,
            descricao_adicional,
            lat,
            lng
        } = req.body;

        // Bug 1 fix: validar antes de converter
        if (!lat || !lng || !categorias) {
            return res.status(400).json({ error: 'Localização e Tipo de Resíduo são obrigatórios.' });
        }

        // Multer retorna string se vier um valor, array se vier múltiplos
        const categoriasArray = Array.isArray(categorias)
            ? categorias.map(Number)
            : [Number(categorias)];

        const photoBuffer = req.file ? req.file.buffer : null;
        const extensao = req.file
            ? req.file.originalname.split('.').pop().toLowerCase()
            : null;

        await client.query('BEGIN');

        const novaOcorrenciaQuery = `
            INSERT INTO reports (
                lat, lng, descricao_adicional,
                quantidade, problemas_causados,
                photo_content, extensao, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id;
        `;

        const resReport = await client.query(novaOcorrenciaQuery, [
            lat, lng, descricao_adicional,
            quantidade, problemas_causados,
            photoBuffer, extensao, 'Nova'
        ]);

        const reportId = resReport.rows[0].id;

        // Vincular todas as categorias na tabela intermediária
        await Promise.all(
            categoriasArray.map(categoryId =>
                client.query(
                    'INSERT INTO report_categories (report_id, category_id) VALUES ($1, $2)',
                    [reportId, categoryId]
                )
            )
        );

        await client.query('COMMIT');
        res.status(201).json({ id: reportId, message: "Ocorrência criada com sucesso!" });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro ao criar ocorrência:", err.message);
        res.status(500).json({ error: 'Erro no servidor ao tentar criar ocorrência.' });
    } finally {
        client.release();
    }
});

/*
 * 2. ROTA DE LEITURA (GET)
 * Buscando o nome da categoria com JOIN
 */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        
        // Query com JOIN e STRING_AGG para agrupar categorias numa única linha
        let query = `
            SELECT
                r.id, r.lat, r.lng, r.quantidade, r.status, r.created_at, r.descricao_adicional,
                r.problemas_causados, r.empresa_selecionada,
                (r.photo_content IS NOT NULL) as has_photo,
                COALESCE(STRING_AGG(DISTINCT c.nome, ', ' ORDER BY c.nome), 'Sem categoria') as tipo_lixo,
                (SELECT COUNT(*) FROM public.collection_requests cr
                 WHERE cr.report_id = r.id AND cr.status = 'Pendente') as solicitacoes_pendentes
            FROM reports r
            LEFT JOIN report_categories rc ON r.id = rc.report_id
            LEFT JOIN categories c ON rc.category_id = c.id
        `;

        let condicoes = [
            "(r.status != 'Resolvida' OR (r.status = 'Resolvida' AND r.updated_at > NOW() - INTERVAL '24 HOURS'))"
        ];

        let params = [];

        if (status) {
            const statusArray = status.split(',');
            params.push(statusArray);
            condicoes.push(`r.status = ANY($${params.length})`);
        }

        if (condicoes.length > 0) {
            query += " WHERE " + condicoes.join(" AND ");
        }

        query += " GROUP BY r.id, r.lat, r.lng, r.quantidade, r.status, r.created_at, r.descricao_adicional, r.problemas_causados, r.empresa_selecionada";
        query += " ORDER BY r.created_at DESC";
        
        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error('Erro na rota GET /reports:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/*
 * 3. ROTA DE IMAGEM (GET)
 * Serve os bytes da foto armazenada no banco
 */
router.get('/:id/foto', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT photo_content, extensao FROM reports WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0 || !result.rows[0].photo_content) {
            return res.status(404).send('Imagem não encontrada');
        }

        const { photo_content, extensao } = result.rows[0];
        const contentType = extensao === 'jpg' ? 'image/jpeg' : `image/${extensao}`;

        res.set('Content-Type', contentType);
        res.send(photo_content);
    } catch (err) {
        console.error('Erro ao buscar imagem:', err.message);
        res.status(500).send('Erro ao buscar imagem.');
    }
});

/*
 * 4. ROTA DE ATUALIZAÇÃO (PUT)
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, empresa_selecionada } = req.body;

        const fields = [];
        const values = [];

        if (status !== undefined) {
            const statusValidos = ['Nova', 'Em verificação', 'Resolvida'];
            if (!statusValidos.includes(status)) {
                return res.status(400).json({ error: 'Status inválido.' });
            }
            fields.push(`status = $${fields.length + 1}`);
            values.push(status);
        }

        if (empresa_selecionada !== undefined) {
            fields.push(`empresa_selecionada = $${fields.length + 1}`);
            values.push(empresa_selecionada);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const query = `UPDATE reports SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ocorrência não encontrada' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao atualizar ocorrência.');
    }
});

/*
 * 5. ROTA: Listar solicitações de coleta de uma ocorrência (Gestor)
 */
router.get('/:id/requests', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT cr.id, cr.status, cr.prazo, cr.coletado_em, cr.created_at,
                   c.nome_fantasia, c.telefone, c.email_contato
            FROM public.collection_requests cr
            JOIN public.companies c ON cr.company_id = c.id
            WHERE cr.report_id = $1
            ORDER BY cr.created_at DESC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar solicitações:", err);
        res.status(500).json({ error: "Erro ao buscar solicitações." });
    }
});

/*
 * 6. ROTA: Gestor aprova uma solicitação e define prazo
 */
router.post('/:id/requests/:requestId/approve', verifyToken, async (req, res) => {
    const { id, requestId } = req.params;
    const { prazo } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Bloqueia aprovação se já existe uma solicitação Aprovada ativa para esta ocorrência
        const jaAprovada = await client.query(
            `SELECT id FROM public.collection_requests
             WHERE report_id = $1 AND status = 'Aprovada'`,
            [id]
        );
        if (jaAprovada.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: "Já existe uma empresa aprovada para esta ocorrência. Aguarde a confirmação de coleta ou negue a solicitação atual." });
        }

        await client.query(
            `UPDATE public.collection_requests SET status = 'Aprovada', prazo = $1 WHERE id = $2`,
            [prazo, requestId]
        );

        // Nega automaticamente todas as outras solicitações pendentes da mesma ocorrência
        await client.query(
            `UPDATE public.collection_requests SET status = 'Negada' WHERE report_id = $1 AND id != $2 AND status = 'Pendente'`,
            [id, requestId]
        );

        await client.query(
            `UPDATE public.reports SET empresa_selecionada = true WHERE id = $1`,
            [id]
        );

        await client.query('COMMIT');
        res.json({ message: "Solicitação aprovada!" });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro ao aprovar solicitação:", err);
        res.status(500).json({ error: "Erro ao aprovar solicitação." });
    } finally {
        client.release();
    }
});

/*
 * 7. ROTA: Gestor nega uma solicitação
 */
router.post('/:id/requests/:requestId/deny', verifyToken, async (req, res) => {
    const { id, requestId } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE public.collection_requests SET status = 'Negada' WHERE id = $1`,
            [requestId]
        );

        // Se não houver mais nenhuma solicitação aprovada, libera a ocorrência
        const aprovadas = await client.query(
            `SELECT id FROM public.collection_requests
             WHERE report_id = $1 AND status = 'Aprovada'`,
            [id]
        );
        if (aprovadas.rows.length === 0) {
            await client.query(
                `UPDATE public.reports SET empresa_selecionada = false WHERE id = $1`,
                [id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: "Solicitação negada." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro ao negar solicitação:", err);
        res.status(500).json({ error: "Erro ao negar solicitação." });
    } finally {
        client.release();
    }
});

module.exports = router;