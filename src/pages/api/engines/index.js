import { engineCatalog } from "@/lib/engineCatalog";

export default function handler(req, res) {
  return res.status(200).json({
    success: true,
    engines: engineCatalog
  });
}
