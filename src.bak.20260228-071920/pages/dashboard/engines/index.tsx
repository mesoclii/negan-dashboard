import { engineCatalog } from "@/lib/engineCatalog";

export default function EnginesPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>
        Engine Control
      </h1>

      <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
        {engineCatalog.map((engine) => (
          <div
            key={engine.engineId}
            style={{
              border: "1px solid rgba(255,0,0,0.4)",
              borderRadius: 12,
              padding: 16,
              background: "rgba(0,0,0,0.6)"
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {engine.displayName}
            </div>
            <div style={{ opacity: 0.8, marginTop: 6 }}>
              {engine.description}
            </div>
            <div style={{ marginTop: 12 }}>
              <a href={`/dashboard/engines/${engine.engineId}`}>
                Open
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
