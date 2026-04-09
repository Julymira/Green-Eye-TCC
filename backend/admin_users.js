const jwt = require('jsonwebtoken');const express = require("express");
const JWT_SECRET = process.env.JWT_SECRET || 'minha_chave_secreta_tcc_2026';
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("./db");

const router = express.Router();

const { verifyToken } = require('./auth');

// Somente usuários logados podem ver a lista de denúncias
router.get('/reports', verifyToken, async (req, res) => {
    // Se chegou aqui, é porque o Token é válido!
    // Você pode até verificar se o usuário é admin:
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ error: "Apenas administradores podem ver isso." });
    }
    
});

// POST: Cadastrar usuário administrador (apenas para uso interno/inicial)
router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            "INSERT INTO users (email, password, is_temp_password) VALUES ($1, $2, TRUE) RETURNING id, email",
            [email, hashedPassword]
        );
        res.status(201).json({ message: "Usuário administrador cadastrado com sucesso!", user: result.rows[0] });
    } catch (error) {
        console.error("Erro ao cadastrar usuário administrador:", error);
        if (error.code === "23505") {
            return res.status(409).json({ error: "Email já cadastrado." });
        }
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// POST: Login de usuário administrador
router.post("/login", async (req, res) => {
    const { cpf, password } = req.body; // O CPF já vem limpo do frontend

    try {
        // 1. Busca o usuário pelo CPF
        const result = await db.query('SELECT id, email, password, cpf, is_temp_password FROM public.users WHERE cpf = $1', [cpf]);

        // 2. Verifica se encontrou alguém
        if (result.rows.length === 0) {
            console.log("❌ Nenhum usuário encontrado com este CPF no banco.");
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        // 3. PEGA O PRIMEIRO USUÁRIO DA LISTA (Obrigatório!)
        const user = result.rows[0];

        // 4. TESTE DE LOG (Para você ver no console se os dados chegaram)
        console.log("✅ Usuário extraído da lista:", user.email);
        console.log("✅ Hash encontrado:", user.password);

        // 5. COMPARAÇÃO (Agora vai funcionar sem erro de 'arguments required')
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        // 4. Gera o Token JWT
        const token = jwt.sign(
            { id: user.id, userType: 'admin' }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );

        // 5. Retorna o sucesso
        res.json({ 
            message: "Sucesso!", 
            token, 
            user: { 
                id: user.id, 
                email: user.email,
                needsPasswordChange: user.is_temp_password // 👈 Adicione isso
            } 
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// POST: Alterar senha (obrigatório para senhas temporárias)
router.post("/change-password", async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Email, senha atual e nova senha são obrigatórios" });
    }

    try {
        // Busca pelo email enviado no formulário
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Usuário não encontrado." });
        }

        // Adicionamos o aqui também
        const user = result.rows[0];
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({ error: "Senha atual incorreta." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.query(
            "UPDATE users SET password = $1, is_temp_password = FALSE WHERE email = $2",
            [hashedNewPassword, email]
        );

        res.json({ message: "Senha alterada com sucesso!" });
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// POST: Gerar senha temporária para um usuário existente
router.post("/generate-temp-password", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email é obrigatório." });
    }

    try {
        const result = await db.query("SELECT id FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        const tempPassword = crypto.randomBytes(8).toString("hex");
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

        await db.query(
            "UPDATE users SET password = $1, is_temp_password = TRUE WHERE email = $2",
            [hashedTempPassword, email]
        );

        res.json({ message: "Senha temporária gerada e atualizada com sucesso.", tempPassword: tempPassword });
    } catch (error) {
        console.error("Erro ao gerar senha temporária:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

module.exports = router;