const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'minha_chave_secreta_tcc_2026';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: "Acesso negado. Token não fornecido." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};

const requireSuperAdmin = (req, res, next) => {
    if (req.user?.role !== 'superadmin') {
        return res.status(403).json({ error: "Acesso restrito ao Super Admin." });
    }
    next();
};

module.exports = { verifyToken, requireSuperAdmin };