const fs = require("fs");
const path = require("path");

const ENGINES_PATH = process.env.ENGINE_PATH;

function loadEngineMeta(filePath) {
  try {
    const engine = require(filePath);

    if (!engine.meta) return null;

    return {
      name: engine.meta.name,
      category: engine.meta.category || "core",
      version: engine.meta.version || "1.0",
      description: engine.meta.description || "",
      configurable: engine.meta.configurable || false,
      hasSchema: !!engine.schema
    };
  } catch (err) {
    console.error("Engine load error:", err.message);
    return null;
  }
}

function discoverEngines() {
  if (!ENGINES_PATH) return [];

  const fullPath = path.resolve(ENGINES_PATH);

  if (!fs.existsSync(fullPath)) return [];

  const files = fs.readdirSync(fullPath);

  return files
    .filter(file => file.endsWith(".js"))
    .map(file => loadEngineMeta(path.join(fullPath, file)))
    .filter(Boolean);
}

module.exports = { discoverEngines };
