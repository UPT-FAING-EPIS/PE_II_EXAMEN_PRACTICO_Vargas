const { get } = require("../database/db");
const { verifyToken } = require("./security");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Sesión inválida o expirada." });

  const user = await get("SELECT * FROM users WHERE id = ?", [payload.userId]);
  if (!user) return res.status(401).json({ error: "Usuario no encontrado." });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "Administrador Empresa") {
    return res.status(403).json({ error: "Solo el Administrador Empresa puede realizar esta acción." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
