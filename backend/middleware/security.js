const crypto = require("node:crypto");

const secret = process.env.JWT_SECRET || "dev-change-this-secret";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, originalHash] = stored.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signToken(payload) {
  const body = { ...payload, exp: Date.now() + 1000 * 60 * 60 * 12 };
  const encoded = base64url(JSON.stringify(body));
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  const [encoded, signature] = String(token || "").split(".");
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (payload.exp < Date.now()) return null;
  return payload;
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
