const crypto = require("node:crypto");
const { run, get, all } = require("../database/db");
const { hashPassword } = require("../middleware/security");
const { publicUser } = require("./helpers");

async function listOrgUsers(organizationId) {
  const users = await all("SELECT * FROM users WHERE organization_id = ? ORDER BY created_at ASC", [organizationId]);
  return users.map(publicUser);
}

async function createUser(req, res) {
  const { name, email, password, role, area } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: "Complete todos los campos obligatorios." });

  const existing = await get("SELECT id FROM users WHERE lower(email) = lower(?)", [email]);
  if (existing) return res.status(409).json({ error: "Ese correo ya existe." });

  await run(
    "INSERT INTO users (id, organization_id, name, email, password_hash, role, area) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [`usr-${crypto.randomUUID()}`, req.user.organization_id, name, email.toLowerCase(), hashPassword(password), role, area || role],
  );

  res.status(201).json({ users: await listOrgUsers(req.user.organization_id) });
}

async function updateUser(req, res) {
  const { role, area, modulePermissions } = req.body;
  const target = await get("SELECT * FROM users WHERE id = ? AND organization_id = ?", [req.params.id, req.user.organization_id]);
  if (!target) return res.status(404).json({ error: "Usuario no encontrado." });

  await run("UPDATE users SET role = ?, area = ?, module_permissions = ? WHERE id = ? AND organization_id = ?", [
    role || target.role,
    area || target.area,
    JSON.stringify(modulePermissions || {}),
    req.params.id,
    req.user.organization_id,
  ]);

  res.json({ users: await listOrgUsers(req.user.organization_id) });
}

module.exports = { createUser, updateUser };
