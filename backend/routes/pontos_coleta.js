const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET: Listar todos os pontos ativos (público)
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM public.pontos_coleta WHERE ativo = true ORDER BY cidade, nome'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pontos de coleta:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// GET: Listar todos (incluindo inativos) — restrito a admin
router.get('/todos', verifyToken, async (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    try {
        const result = await db.query(
            'SELECT * FROM public.pontos_coleta ORDER BY cidade, nome'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pontos de coleta:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// POST: Criar novo ponto — restrito a admin
router.post('/', verifyToken, async (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }

    const { nome, endereco, cidade, telefone, horario, lat, lng, tipos_residuo } = req.body;

    if (!nome || !endereco || !cidade) {
        return res.status(400).json({ error: 'Nome, endereço e cidade são obrigatórios.' });
    }

    try {
        const result = await db.query(
            `INSERT INTO public.pontos_coleta (nome, endereco, cidade, telefone, horario, lat, lng, tipos_residuo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [nome, endereco, cidade, telefone || null, horario || null,
             lat || null, lng || null, tipos_residuo || []]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar ponto de coleta:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// PUT: Editar ponto — restrito a admin
router.put('/:id', verifyToken, async (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }

    const { id } = req.params;
    const { nome, endereco, cidade, telefone, horario, lat, lng, tipos_residuo, ativo } = req.body;

    try {
        const result = await db.query(
            `UPDATE public.pontos_coleta
             SET nome=$1, endereco=$2, cidade=$3, telefone=$4, horario=$5,
                 lat=$6, lng=$7, tipos_residuo=$8, ativo=$9
             WHERE id=$10 RETURNING *`,
            [nome, endereco, cidade, telefone || null, horario || null,
             lat || null, lng || null, tipos_residuo || [], ativo ?? true, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ponto não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao editar ponto de coleta:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// DELETE: Remover ponto — restrito a admin
router.delete('/:id', verifyToken, async (req, res) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }

    const { id } = req.params;
    try {
        const result = await db.query(
            'DELETE FROM public.pontos_coleta WHERE id=$1 RETURNING id', [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ponto não encontrado.' });
        }
        res.json({ message: 'Ponto removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover ponto de coleta:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
