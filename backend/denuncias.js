const express = require('express');
const router = express.Router();
const pool = require('./db'); 

/*
 * 1. ROTA DE CRIAÇÃO (POST)
 * (Recebe dados do denuncia.html e salva no banco)
 */
router.post('/', async (req, res) => {
    try {
        // 1. Receber os dados do 'fetch' do frontend
        const { 
            tipo_lixo, 
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

        // 3. Montar a query SQL com TODAS as colunas novas
        const novaDenunciaQuery = `
            INSERT INTO reports (
                lat, lng, descricao_adicional, 
                tipo_lixo, quantidade, problemas_causados, 
                photo_url, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *; 
        `; 
        
        // 4. Executar a query
        const novaDenuncia = await pool.query(novaDenunciaQuery, [
            lat, 
            lng, 
            descricao_adicional,
            tipo_lixo, 
            quantidade, 
            problemas_causados,
            savedPhotoUrl, // Salva 'null' por enquanto
            'Nova'         // Salva 'Nova' como status padrão
        ]);

        // 5. Responder com sucesso
        res.status(201).json(novaDenuncia.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor ao tentar criar denúncia.');
    }
});

/*
 * 2. ROTA DE LEITURA (GET) - COM FILTROS
 * (Envia denúncias filtradas para o mapa e dashboard)
 */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query; // Pega filtro da URL (?status=Nova,Resolvida)
        
        let query = `
            SELECT id, lat, lng, tipo_lixo, quantidade, status, created_at, descricao_adicional
            FROM reports
        `;
        
        let params = [];
        
        // Se tiver filtro de status, aplicar
        if (status) {
            const statusArray = status.split(',');
            query += ' WHERE status = ANY($1)';
            params.push(statusArray);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor ao buscar denúncias.');
    }
});

/*
 * 3. ROTA DE ATUALIZAÇÃO (PUT)
 * (Permite o gestor alterar o status da denúncia)
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validar status
        const statusValidos = ['Nova', 'Em verificação', 'Resolvida'];
        if (!statusValidos.includes(status)) {
            return res.status(400).json({ 
                error: 'Status inválido. Use: Nova, Em verificação ou Resolvida' 
            });
        }

        // Atualizar no banco
        const query = `
            UPDATE reports 
            SET status = $1 
            WHERE id = $2 
            RETURNING *
        `;
        
        const result = await pool.query(query, [status, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Denúncia não encontrada' });
        }
        
        res.json(result.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor ao atualizar denúncia.');
    }
});

// (As outras rotas, como DELETE, vêm depois)
// ...

module.exports = router;