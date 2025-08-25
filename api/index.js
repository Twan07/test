const express = require("express");
const app = express();
app.use(express.json());

// Danh sách key hợp lệ
const VALID_KEYS = (process.env.VALID_KEYS || "abc123,tuan-key,demo456")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function readKey(req) {
  if (req.query.key) return req.query.key;

  const auth = req.headers["authorization"];
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  if (req.headers["x-api-key"]) return req.headers["x-api-key"];

  return null;
}

function isKeyValid(key) {
  return VALID_KEYS.includes(key);
}

// Hàm chính (business logic)
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

// Route action
app.post("/api/action", async (req, res) => {
  const key = readKey(req);
  if (!key) return res.status(400).json({ error: "Missing key" });
  if (!isKeyValid(key)) return res.status(401).json({ error: "Invalid key" });

  // Trả thẳng code function
  const fnCode = doBusinessLogic.toString();
  res.type("application/json").send(fnCode);
});

// Route gốc
app.get("/api", (req, res) => {
  res.json({
    name: "Key-Guarded API (Vercel)",
    routes: ["/api/check-key?key=YOUR_KEY", "/api/action"],
    passKey: "Authorization: Bearer <key> | Header X-API-Key | ?key= query"
  });
});

module.exports = app;
