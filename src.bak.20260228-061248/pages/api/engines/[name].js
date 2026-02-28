import fs from "fs";
import path from "path";

const ENGINES_PATH = process.env.ENGINES_PATH || path.join(process.cwd(), "engines");
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function readToken(req) {
  const auth = req.headers.authorization || "";
  const bearer = Array.isArray(auth) ? auth[0] : auth;
  const xDash = req.headers["x-dashboard-token"];
  const xApi = req.headers["x-api-key"];
  return String(
    (Array.isArray(xDash) ? xDash[0] : xDash) ||
    (Array.isArray(xApi) ? xApi[0] : xApi) ||
    bearer.replace(/^Bearer\s+/i, "") ||
    ""
  ).trim();
}

export default function handler(req, res) {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, error: "Not found" });
  }

  if (DASHBOARD_TOKEN && readToken(req) !== DASHBOARD_TOKEN) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const { name } = req.query;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ success: false, error: "Missing engine name" });
  }

  try {
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "");
    const enginePath = path.join(ENGINES_PATH, `${safeName}.js`);

    if (!fs.existsSync(enginePath)) {
      return res.status(404).json({ success: false, error: `Engine not found: ${safeName}` });
    }

    const content = fs.readFileSync(enginePath, "utf8");
    return res.status(200).json({
      success: true,
      name: safeName,
      enginePath,
      bytes: Buffer.byteLength(content, "utf8"),
      content
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
}
