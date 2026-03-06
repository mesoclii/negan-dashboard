import { ENGINE_REGISTRY } from "@/lib/dashboard/engineRegistry";

export default function handler(req, res) {
  if (req.method && req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  return res.status(200).json({
    success: true,
    engines: ENGINE_REGISTRY,
  });
}