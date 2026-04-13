const express = require('express');
const router = express.Router();
const pool = require('./db'); 

/*
 * 1. ROTA DE CRIAÇÃO (POST)
 * Agora salva na tabela intermediária report_categories
 */
router.post('/', async (req, res) => {
    const client = await pool.connect(); // Usamos client para transação
    try {
        const { 
            tipo_lixo, // Isso agora deve ser o ID da categoria (ex: 1, 2...)
            quantidade, 
            problemas_causados, 
            descricao_adicional, 
            lat, 
            lng 
        } = req.body;

        // (Aqui virá a lógica de UPLOAD DE FOTO no TCC II. 
        // Por enquanto, vamos salvar 'null' no campo photo_url)
        const savedPhotoUrl = null; 

        // 2. Validar dados (exemplo)
        if (!lat || !lng || !tipo_lixo) {
            return res.status(400).json({ error: 'Localização e Tipo de Lixo são obrigatórios.' });
        }

        await client.query('BEGIN');

        // 1. Inserir na tabela reports (SEM a coluna tipo_lixo)
        const novaOcorrenciaQuery = `
            INSERT INTO reports (
                lat, lng, descricao_adicional,
                quantidade, problemas_causados,
                photo_url, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
        `;

        const resReport = await client.query(novaOcorrenciaQuery, [
            lat, lng, descricao_adicional, 
            quantidade, problemas_causados, 
            null, 'Nova'
        ]);

        const reportId = resReport.rows[0].id;

        // 2. Vincular a categoria na tabela intermediária
        await client.query(
            'INSERT INTO report_categories (report_id, category_id) VALUES ($1, $2)',
            [reportId, tipo_lixo]
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
        
        // Query com JOIN para pegar o nome da categoria
        let query = `
            SELECT 
                r.id, r.lat, r.lng, r.quantidade, r.status, r.created_at, r.descricao_adicional,
                c.nome as tipo_lixo -- Aqui pegamos o nome da tabela categorias
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
        
        query += " ORDER BY r.created_at DESC";
        
        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error('Erro na rota GET /reports:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/*
 * 3. ROTA DE ATUALIZAÇÃO (PUT)
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