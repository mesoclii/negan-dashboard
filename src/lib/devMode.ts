const explicit = String(process.env.DEV_MODE || "").trim().toLowerCase();
const hasExplicit = explicit.length > 0;
const isEnabled = ["1", "true", "yes", "on", "enabled"].includes(explicit);
const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";

export const DEV_MODE = isProduction ? (hasExplicit && isEnabled) : true;