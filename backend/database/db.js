const path = require("node:path");
const fs = require("node:fs");
const sqlite3 = require("sqlite3").verbose();
const { createPeti } = require("./defaultPeti");
const { hashPassword } = require("../middleware/security");

const dbDir = path.join(__dirname, "../../data");
const dbPath = process.env.DB_PATH || path.join(dbDir, "peti.sqlite");

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => (error ? reject(error) : resolve(row)));
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
}

async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ruc TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    area TEXT NOT NULL,
    module_permissions TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS petis (
    organization_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  )`);

  await seedDemo();
}

async function seedDemo() {
  const row = await get("SELECT COUNT(*) AS count FROM users");
  if (row.count > 0) return;

  const orgId = "org-demo-nova";
  const peti = createPeti("Nova Retail S.A.C.", "20600000001", "Comercio minorista omnicanal");
  peti.data.info.description = "Empresa peruana dedicada a la venta de productos de consumo masivo mediante tiendas físicas y comercio electrónico.";
  peti.data.info.employees = 185;
  peti.data.info.manager = "María Torres";
  peti.data.info.tiLead = "Luis Ramos";

  await run("INSERT INTO organizations (id, name, ruc) VALUES (?, ?, ?)", [orgId, "Nova Retail S.A.C.", "20600000001"]);
  await run("INSERT INTO petis (organization_id, data) VALUES (?, ?)", [orgId, JSON.stringify(peti)]);
  await run(
    "INSERT INTO users (id, organization_id, name, email, password_hash, role, area) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ["usr-demo-owner", orgId, "María Torres", "owner@nova.pe", hashPassword("demo123"), "Administrador Empresa", "Gerencia General"],
  );
  await run(
    "INSERT INTO users (id, organization_id, name, email, password_hash, role, area) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ["usr-demo-ti", orgId, "Luis Ramos", "ti@nova.pe", hashPassword("demo123"), "Área TI", "TI"],
  );
}

module.exports = { db, run, get, all, initDb };
