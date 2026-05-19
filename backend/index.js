const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const adminUsersRouter = require('./routes/admin_users');
const ocorrenciasRouter = require('./routes/ocorrencias');
const companiesRouter = require('./routes/companies');
const pontosColetaRouter = require('./routes/pontos_coleta');

const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../frontend')));
app.use(cors({
  origin: 'http://localhost:3001', // A porta onde seu React está rodando
  credentials: true
}));
app.use(express.json());
app.use('/api/admin', adminUsersRouter);
app.use('/api/reports', ocorrenciasRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/pontos-coleta', pontosColetaRouter);


// Testa a conexão imediatamente ao iniciar
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
  } catch (error) {
      console.error('❌ Erro ao conectar ao banco de dados:', error.message);
      process.exit(1);
  }
})();

// Limpeza de tokens de redefinição expirados (roda ao iniciar e a cada hora)
async function limparTokensExpirados() {
    try {
        const result = await pool.query('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
        if (result.rowCount > 0) {
            console.log(`🧹 ${result.rowCount} token(s) expirado(s) removido(s) do banco.`);
        }
    } catch (error) {
        console.error('Erro ao limpar tokens expirados:', error.message);
    }
}
limparTokensExpirados();
setInterval(limparTokensExpirados, 60 * 60 * 1000);

// GET: Redirecinar para dashboard admin
app.get("/admin_dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/admin_dashboard.html"));
});

// Esta linha diz: "Para qualquer rota que o Node não conheça, envie o index.html do React"
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
