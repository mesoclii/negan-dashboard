import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

function readBuildTimestamp() {
  const rootDir = process.cwd();
  const buildIdPath = path.join(rootDir, ".next", "BUILD_ID");
  const rollbackMetaPath = path.join(rootDir, ".next.rollback.json");

  try {
    const stats = fs.statSync(buildIdPath);
    if (stats?.mtime) {
      return stats.mtime.toISOString();
    }
  } catch {}

  try {
    const raw = fs.readFileSync(rollbackMetaPath, "utf8");
    const json = JSON.parse(raw || "{}");
    const builtAt = String(json?.builtAt || "").trim();
    if (builtAt) {
      return builtAt;
    }
  } catch {}

  return "";
}

export async function GET() {
  return NextResponse.json({
    success: true,
    build: {
      updatedAt: readBuildTimestamp(),
    },
  });
}
