const { run } = require("../database/db");

async function updatePeti(req, res) {
  if (!req.body.peti) return res.status(400).json({ error: "PETI requerido." });
  await run("UPDATE petis SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE organization_id = ?", [
    JSON.stringify(req.body.peti),
    req.user.organization_id,
  ]);
  res.json({ ok: true });
}

module.exports = { updatePeti };
