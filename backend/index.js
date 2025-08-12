const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const adminUsersRouter = require('./admin_users');

const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(cors());
app.use(express.json());
app.use('/api', adminUsersRouter);


// Testa a conexão imediatamente ao iniciar
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
})();


// GET: Listar todas as denúncias

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/api/reports', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar denúncias' });
  }
});

// POST: Criar nova denúncia
app.post('/api/reports', async (req, res) => {
  const { description, lat, lng } = req.body;

  if (!description || !lat || !lng) {
    return res.status(400).json({ error: 'Campos obrigatórios: description, lat, lng' });
  }

  try {
    await pool.query(
      'INSERT INTO reports (description, lat, lng, created_at) VALUES ($1, $2, $3, NOW())',
      [description, lat, lng]
    );
    res.status(201).json({ message: 'Denúncia registrada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar denúncia' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
