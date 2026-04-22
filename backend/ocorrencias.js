const express = require('express');
const router = express.Router();
const pool = require('./db');
const multer = require('multer');

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

        // Multer retorna string se vier um valor, array se vier múltiplos
        const categoriasArray = Array.isArray(categorias)
            ? categorias.map(Number)
            : [Number(categorias)];

        const photoBuffer = req.file ? req.file.buffer : null;
        const extensao = req.file
            ? req.file.originalname.split('.').pop().toLowerCase()
            : null;

        if (!lat || !lng || !categorias) {
            return res.status(400).json({ error: 'Localização e Tipo de Resíduo são obrigatórios.' });
        }

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
                STRING_AGG(c.nome, ', ' ORDER BY c.nome) as tipo_lixo
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
            condicoes.push(`r.status = ANY($${params.length + 1})`);
            params.push(statusArray);
        }

        if (condicoes.length > 0) {
            query += " WHERE " + condicoes.join(" AND ");
        }

        query += " GROUP BY r.id, r.lat, r.lng, r.quantidade, r.status, r.created_at, r.descricao_adicional";
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
        const { status } = req.body;
        
        const statusValidos = ['Nova', 'Em verificação', 'Resolvida'];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ error: 'Status inválido.' });
        }

        const query = `UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
        const result = await pool.query(query, [status, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ocorrência não encontrada' });
        }
        
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro ao atualizar ocorrência.');
    }
});

module.exports = router;