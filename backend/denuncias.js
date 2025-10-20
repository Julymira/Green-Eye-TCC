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
 * 2. ROTA DE LEITURA (GET) - ATUALIZADA
 * (Envia todas as denúncias para o mapa principal)
 */
router.get('/', async (req, res) => {
    try {
        // Agora podemos selecionar as novas colunas para o mapa
        const todasDenunciasQuery = `
            SELECT id, lat, lng, tipo_lixo, status 
            FROM reports 
            WHERE status != 'Resolvida'; -- Exemplo: não mostrar denúncias resolvidas
        `;
        
        const todasDenuncias = await pool.query(todasDenunciasQuery);
        res.json(todasDenuncias.rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor ao buscar denúncias.');
    }
});


// (As outras rotas, como PUT e DELETE, vêm depois)
// ...

module.exports = router;