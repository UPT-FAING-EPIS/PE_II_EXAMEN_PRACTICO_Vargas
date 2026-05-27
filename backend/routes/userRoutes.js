const express = require("express");
const { createUser, updateUser } = require("../controllers/userController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, requireAdmin, createUser);
router.put("/:id", requireAuth, requireAdmin, updateUser);

module.exports = router;
