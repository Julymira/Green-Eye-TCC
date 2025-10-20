const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const adminUsersRouter = require('./admin_users');
const denunciasRouter = require('./denuncias');

const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(cors());
app.use(express.json());
app.use('/api', adminUsersRouter);
app.use('/api/reports', denunciasRouter);


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


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
