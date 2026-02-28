import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type SnapshotEntry = {
  name: string;
  createdAt: string;
  sourceGuildId: string;
  config: any;
};

type SnapshotStore = {
  snapshots: Record<string, SnapshotEntry>;
};

const STORE_FILE = path.join(process.cwd(), "data", "dashboard-setup-snapshots.json");

async function readStore(): Promise<SnapshotStore> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    if (!parsed || typeof parsed !== "object") return { snapshots: {} };
    if (!parsed.snapshots || typeof parsed.snapshots !== "object") parsed.snapshots = {};
    return parsed as SnapshotStore;
  } catch {
    return { snapshots: {} };
  }
}

async function writeStore(store: SnapshotStore) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function cleanName(v: string) {
  return String(v || "")
    .trim()
    .replace(/[^\w\-.: ]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const store = await readStore();
      const name = String(req.query.name || "").trim();
      const full = String(req.query.full || "") === "1";

      if (name) {
        const item = store.snapshots[name];
        if (!item) return res.status(404).json({ success: false, error: "Snapshot not found" });
        if (full) return res.status(200).json({ success: true, snapshot: item });
        const { config: _omit, ...meta } = item;
        return res.status(200).json({ success: true, snapshot: meta });
      }

      const all = Object.values(store.snapshots).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      if (full) return res.status(200).json({ success: true, snapshots: all });

      const metas = all.map(({ config: _omit, ...meta }) => meta);
      return res.status(200).json({ success: true, snapshots: metas });
    }

    if (req.method === "POST") {
      const name = cleanName(String(req.body?.name || ""));
      const sourceGuildId = String(req.body?.sourceGuildId || "").trim();
      const config = req.body?.config;

      if (!name) return res.status(400).json({ success: false, error: "name is required" });
      if (!/^\d{16,20}$/.test(sourceGuildId)) {
        return res.status(400).json({ success: false, error: "sourceGuildId is required" });
      }
      if (!config || typeof config !== "object") {
        return res.status(400).json({ success: false, error: "config is required" });
      }

      const store = await readStore();
      store.snapshots[name] = {
        name,
        createdAt: new Date().toISOString(),
        sourceGuildId,
        config
      };
      await writeStore(store);

      const { config: _omit, ...meta } = store.snapshots[name];
      return res.status(200).json({ success: true, snapshot: meta });
    }

    if (req.method === "DELETE") {
      const name = String(req.query.name || "").trim();
      if (!name) return res.status(400).json({ success: false, error: "name is required" });

      const store = await readStore();
      if (!store.snapshots[name]) return res.status(404).json({ success: false, error: "Snapshot not found" });
      delete store.snapshots[name];
      await writeStore(store);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
