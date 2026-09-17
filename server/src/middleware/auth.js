const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gestor-facil-dev-secret-change-in-production';

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
