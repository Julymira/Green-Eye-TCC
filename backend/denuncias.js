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
        const { status } = req.query;
        
        // 1. Começamos a query básica
        let query = `
            SELECT id, lat, lng, tipo_lixo, quantidade, status, created_at, descricao_adicional, photo_url
            FROM reports 
        `;
        
        // 2. Definimos nossa condição obrigatória (esconder resolvidos velhos)
        let condicoes = [
            "(status != 'Resolvida' OR (status = 'Resolvida' AND updated_at > NOW() - INTERVAL '24 HOURS'))"
        ];
        
        let params = [];

        // 3. Se tiver filtro de status vindo da URL, adicionamos na lista de condições
        if (status) {
            const statusArray = status.split(',');
            // Adiciona a condição do array ($1, $2, etc)
            condicoes.push(`status = ANY($${params.length + 1})`);
            params.push(statusArray);
        }

        // 4. Monta o WHERE dinamicamente
        // Se houver condições, junta elas com " AND "
        if (condicoes.length > 0) {
            query += " WHERE " + condicoes.join(" AND ");
        }
        
        // 5. Ordenação
        query += " ORDER BY created_at DESC";
        
        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (err) {
        console.error('Erro na rota GET /reports:', err.message);
        // Retorna o erro exato para facilitar sua leitura no terminal
        res.status(500).json({ error: err.message });
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