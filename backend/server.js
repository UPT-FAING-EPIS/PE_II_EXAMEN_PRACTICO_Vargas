require("dotenv").config();

const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { initDb } = require("./database/db");

const authRoutes = require("./routes/authRoutes");
const petiRoutes = require("./routes/petiRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendDir = path.join(__dirname, "../frontend");

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/peti", petiRoutes);
app.use("/api/users", userRoutes);

app.use(express.static(frontendDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`PETI Empresarial escuchando en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo iniciar la base de datos:", error);
    process.exit(1);
  });
