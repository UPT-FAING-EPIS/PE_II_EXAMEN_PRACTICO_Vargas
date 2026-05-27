const express = require("express");
const { updatePeti } = require("../controllers/petiController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.put("/", requireAuth, updatePeti);

module.exports = router;
