const jwt = require('jsonwebtoken');
const express = require("express");
const JWT_SECRET = process.env.JWT_SECRET || 'minha_chave_secreta_tcc_2026';
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");
const { sendPasswordResetEmail, sendTempPasswordEmail } = require('../services/mailer');

const router = express.Router();

const { verifyToken, requireSuperAdmin } = require('../middleware/auth');


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
            [email.toLowerCase(), hashedPassword]
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
        const result = await db.query('SELECT id, email, password, cpf, is_temp_password, role FROM public.users WHERE cpf = $1', [cpf]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        const user = result.rows[0];

        // 5. COMPARAÇÃO
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        // 4. Gera o Token JWT
        const token = jwt.sign(
            { id: user.id, userType: 'admin', role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Sucesso!",
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                needsPasswordChange: user.is_temp_password
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

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    if (newPassword === currentPassword) {
        return res.status(400).json({ error: "A nova senha deve ser diferente da senha atual." });
    }

    try {
        // Busca pelo email enviado no formulário
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);

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
            [hashedNewPassword, email.toLowerCase()]
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
        const result = await db.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        const tempPassword = crypto.randomBytes(8).toString("hex");
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

        await db.query(
            "UPDATE users SET password = $1, is_temp_password = TRUE WHERE email = $2",
            [hashedTempPassword, email.toLowerCase()]
        );

        res.json({ message: "Senha temporária gerada e atualizada com sucesso.", tempPassword: tempPassword });
    } catch (error) {
        console.error("Erro ao gerar senha temporária:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// POST: Solicitar redefinição de senha (envia e-mail com link)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "E-mail é obrigatório." });
    }

    try {
        const result = await db.query("SELECT id, email FROM users WHERE email = $1", [email.toLowerCase()]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Nenhuma conta encontrada com este e-mail." });
        }

        const user = result.rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await db.query(
            "DELETE FROM password_reset_tokens WHERE user_id = $1 AND user_type = 'user'",
            [user.id]
        );

        await db.query(
            "INSERT INTO password_reset_tokens (user_id, user_type, token, expires_at) VALUES ($1, 'user', $2, $3)",
            [user.id, token, expiresAt]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${frontendUrl}/redefinir-senha?token=${token}&tipo=user`;

        try {
            await sendPasswordResetEmail({
                to: user.email,
                nome: user.email,
                resetLink,
                userType: 'user',
            });
        } catch (mailError) {
            console.error("Erro ao enviar e-mail de redefinição:", mailError);
            await db.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);
            return res.status(500).json({ error: "Não foi possível enviar o e-mail. Tente novamente." });
        }

        res.json({ message: "E-mail de redefinição enviado com sucesso." });
    } catch (error) {
        console.error("Erro ao solicitar redefinição de senha:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// POST: Redefinir senha com token
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: "Token e nova senha são obrigatórios." });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    try {
        const result = await db.query(
            "SELECT * FROM password_reset_tokens WHERE token = $1 AND user_type = 'user' AND expires_at > NOW()",
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Token inválido ou expirado." });
        }

        const { user_id } = result.rows[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
            "UPDATE users SET password = $1, is_temp_password = FALSE WHERE id = $2",
            [hashedPassword, user_id]
        );

        await db.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);

        res.json({ message: "Senha redefinida com sucesso!" });
    } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// ── ROTAS EXCLUSIVAS DO SUPER ADMIN ──────────────────────────────────────────

// GET: Listar todos os usuários gerenciáveis (exceto o próprio superadmin logado)
router.get('/gestores', verifyToken, requireSuperAdmin, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, email, cpf, is_temp_password, created_at, role FROM public.users WHERE id != $1 ORDER BY created_at DESC",
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Erro ao listar gestores:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// POST: Criar novo gestor
router.post('/gestores', verifyToken, requireSuperAdmin, async (req, res) => {
    const { email, cpf, role } = req.body;

    if (!email || !cpf) {
        return res.status(400).json({ error: "Email e CPF são obrigatórios." });
    }

    const roleValido = ['gestor', 'superadmin'].includes(role) ? role : 'gestor';
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
        return res.status(400).json({ error: "CPF inválido. Informe os 11 dígitos." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email inválido." });
    }

    try {
        const tempPassword = crypto.randomBytes(8).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const result = await db.query(
            "INSERT INTO public.users (email, cpf, password, is_temp_password, role) VALUES ($1, $2, $3, TRUE, $4) RETURNING id, email, cpf, role",
            [email.toLowerCase(), cpfLimpo, hashedPassword, roleValido]
        );

        try {
            await sendTempPasswordEmail({ to: email.toLowerCase(), senha: tempPassword });
        } catch (mailError) {
            console.error("Erro ao enviar e-mail de senha temporária:", mailError);
        }

        res.status(201).json({
            message: "Gestor criado com sucesso!",
            gestor: result.rows[0],
            tempPassword
        });
    } catch (error) {
        console.error("Erro ao criar gestor:", error);
        if (error.code === "23505") {
            return res.status(409).json({ error: "Email ou CPF já cadastrado." });
        }
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// POST: Resetar senha de um gestor (gera nova senha temporária)
router.post('/gestores/:id/reset-senha', verifyToken, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;

    const idNum = parseInt(id);
    if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    try {
        const result = await db.query("SELECT id, email FROM public.users WHERE id = $1 AND id != $2", [idNum, req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Gestor não encontrado." });
        }

        const tempPassword = crypto.randomBytes(8).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        await db.query(
            "UPDATE public.users SET password = $1, is_temp_password = TRUE WHERE id = $2",
            [hashedPassword, idNum]
        );

        try {
            await sendTempPasswordEmail({ to: result.rows[0].email, senha: tempPassword });
        } catch (mailError) {
            console.error("Erro ao enviar e-mail de reset de senha:", mailError);
        }

        res.json({ message: "Senha resetada com sucesso.", tempPassword });
    } catch (error) {
        console.error("Erro ao resetar senha:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

// DELETE: Remover um usuário (superadmin não pode remover outro superadmin)
router.delete('/gestores/:id', verifyToken, requireSuperAdmin, async (req, res) => {
    const { id } = req.params;

    const idNum = parseInt(id);
    if (!Number.isInteger(idNum)) {
        return res.status(400).json({ error: "ID inválido." });
    }

    if (idNum === req.user.id) {
        return res.status(400).json({ error: "Você não pode remover sua própria conta." });
    }

    try {
        const check = await db.query("SELECT role FROM public.users WHERE id = $1", [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        if (check.rows[0].role === 'superadmin') {
            return res.status(403).json({ error: "Não é permitido remover outro Super Admin." });
        }

        await db.query("DELETE FROM public.users WHERE id = $1", [id]);
        res.json({ message: "Gestor removido com sucesso." });
    } catch (error) {
        console.error("Erro ao remover gestor:", error);
        res.status(500).json({ error: "Erro interno do servidor." });
    }
});

module.exports = router;