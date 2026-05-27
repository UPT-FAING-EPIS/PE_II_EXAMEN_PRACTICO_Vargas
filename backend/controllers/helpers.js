const { all, get } = require("../database/db");

function publicUser(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    role: row.role,
    area: row.area,
    modulePermissions: JSON.parse(row.module_permissions || "{}"),
  };
}

async function sessionPayload(userRow, token) {
  const organization = await get("SELECT id, name, ruc FROM organizations WHERE id = ?", [userRow.organization_id]);
  const users = await all("SELECT * FROM users WHERE organization_id = ? ORDER BY created_at ASC", [userRow.organization_id]);
  const petiRow = await get("SELECT data FROM petis WHERE organization_id = ?", [userRow.organization_id]);
  return {
    token,
    user: publicUser(userRow),
    organization,
    users: users.map(publicUser),
    peti: JSON.parse(petiRow.data),
  };
}

module.exports = { publicUser, sessionPayload };
