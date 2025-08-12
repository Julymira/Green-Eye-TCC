const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("./db");

const router = express.Router();

// POST: Cadastrar usuário administrador (apenas para uso interno/inicial)
router.post("/admin/register", async (req, res) => {
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
router.post("/admin/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        // Verifica se é senha temporária
        const needsPasswordChange = user.is_temp_password || false;

        res.json({ 
            message: "Login de administrador bem-sucedido!", 
            user: { 
                id: user.id, 
                email: user.email,
                needsPasswordChange: needsPasswordChange
            } 
        });
    } catch (error) {
        console.error("Erro ao fazer login do administrador:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// POST: Alterar senha (obrigatório para senhas temporárias)
router.post("/admin/change-password", async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Email, senha atual e nova senha são obrigatórios" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    }

    try {
        // Verifica se o usuário existe e a senha atual está correta
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const user = result.rows[0];
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({ error: "Senha atual incorreta." });
        }

        // Atualiza a senha e marca como não temporária
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
router.post("/admin/generate-temp-password", async (req, res) => {
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