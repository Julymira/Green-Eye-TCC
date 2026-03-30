const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const adminUsersRouter = require('./admin_users');
const denunciasRouter = require('./denuncias');
const companiesRouter = require('./companies')

const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(cors());
app.use(express.json());
app.use('/api', adminUsersRouter);
app.use('/api/reports', denunciasRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/companies', companiesRouter);


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

// GET: Redirecinar para dashboard admin
app.get("/admin_dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/admin_dashboard.html"));
});

// Esta linha diz: "Para qualquer rota que o Node não conheça, envie o index.html do React"
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
