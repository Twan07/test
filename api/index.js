// api/index.js
const express = require("express");

const app = express();
app.use(express.json());

// Lấy danh sách key hợp lệ từ biến môi trường
const VALID_KEYS = (process.env.VALID_KEYS || "abc123,tuan-key,demo456")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function readKey(req) {
  // Query
  if (req.query.key) return req.query.key;

  // Authorization: Bearer <KEY>
  const auth = req.headers["authorization"];
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  // X-API-Key header
  if (req.headers["x-api-key"]) return req.headers["x-api-key"];

  return null;
}

function isKeyValid(key) {
  return VALID_KEYS.includes(key);
}

// Business logic demo
async function doBusinessLogic(input) {
  return {
    ok: true,
    now: new Date().toISOString(),
    input: input || null,
    message: "Action executed successfully",
  };
}

// Route check-key
app.get("/api/check-key", (req, res) => {
  const key = readKey(req);
  if (!key) return res.status(400).json({ ok: false, error: "Missing key" });

  const valid = isKeyValid(key);
  return res.status(valid ? 200 : 401).json({ ok: valid });
});

// Route action (có bảo vệ key)
app.post("/api/action", async (req, res) => {
  const key = readKey(req);
  if (!key) return res.status(400).json({ ok: false, error: "Missing key" });

  if (!isKeyValid(key)) return res.status(401).json({ ok: false, error: "Invalid key" });

  const result = await doBusinessLogic(req.body);
  return res.json(result);
});

// Route gốc
app.get("/api", (req, res) => {
  res.json({
    name: "Key-Guarded API (Vercel)",
    routes: ["/api/check-key?key=YOUR_KEY", "/api/action"],
    passKey: "Authorization: Bearer <key> | Header X-API-Key | ?key= query",
  });
});

// Export handler cho Vercel
module.exports = app;
