const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'minha_chave_secreta_tcc_2026';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: "Acesso negado. Token não fornecido." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Salva os dados do usuário (id e tipo) na requisição
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido ou expirado." });
    }
};

module.exports = { verifyToken };