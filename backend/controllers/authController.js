const crypto = require("node:crypto");
const { run, get } = require("../database/db");
const { createPeti } = require("../database/defaultPeti");
const { hashPassword, verifyPassword, signToken } = require("../middleware/security");
const { sessionPayload } = require("./helpers");

async function register(req, res) {
  const { companyName, ruc, email, adminName, password } = req.body;
  if (!companyName || !ruc || !email || !adminName || !password) {
    return res.status(400).json({ error: "Complete todos los campos requeridos." });
  }

  const existingEmail = await get("SELECT id FROM users WHERE lower(email) = lower(?)", [email]);
  if (existingEmail) return res.status(409).json({ error: "Ese correo ya está registrado." });

  const existingRuc = await get("SELECT id FROM organizations WHERE ruc = ?", [ruc]);
  if (existingRuc) return res.status(409).json({ error: "Ese RUC ya está registrado." });

  const orgId = `org-${crypto.randomUUID()}`;
  const userId = `usr-${crypto.randomUUID()}`;
  const peti = createPeti(companyName, ruc);
  peti.data.info.manager = adminName;

  await run("INSERT INTO organizations (id, name, ruc) VALUES (?, ?, ?)", [orgId, companyName, ruc]);
  await run("INSERT INTO petis (organization_id, data) VALUES (?, ?)", [orgId, JSON.stringify(peti)]);
  await run(
    "INSERT INTO users (id, organization_id, name, email, password_hash, role, area) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [userId, orgId, adminName, email.toLowerCase(), hashPassword(password), "Administrador Empresa", "Gerencia General"],
  );

  const user = await get("SELECT * FROM users WHERE id = ?", [userId]);
  const token = signToken({ userId });
  res.status(201).json(await sessionPayload(user, token));
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await get("SELECT * FROM users WHERE lower(email) = lower(?)", [email || ""]);
  if (!user || !verifyPassword(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }
  const token = signToken({ userId: user.id });
  res.json(await sessionPayload(user, token));
}

async function me(req, res) {
  res.json(await sessionPayload(req.user, null));
}

module.exports = { register, login, me };
