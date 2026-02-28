import { PossumCard } from "@/components/possum/PossumCard";
import { PossumToggle } from "@/components/possum/PossumToggle";

export default function SystemHealthPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
        <div>
          <div className="possum-red possum-glow" style={{ fontSize: 28, fontWeight: 950, letterSpacing: "0.22em", textTransform: "uppercase" }}>
            System Health
          </div>
          <div className="possum-soft" style={{ marginTop: 10, letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 12, opacity: 0.92 }}>
            Uptime • memory • heartbeat • API status (wire later)
          </div>
        </div>
        <PossumToggle label="Active" defaultOn={true} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <PossumCard title="Uptime" description="Placeholder (wire /api/health later)">
          <div className="possum-soft" style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12 }}>
            Waiting for API…
          </div>
        </PossumCard>
        <PossumCard title="Memory" description="Placeholder (wire /api/health later)">
          <div className="possum-soft" style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12 }}>
            Waiting for API…
          </div>
        </PossumCard>
        <PossumCard title="Heartbeat" description="Placeholder (wire /api/health later)">
          <div className="possum-soft" style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 12 }}>
            Waiting for API…
          </div>
        </PossumCard>
      </div>
    </div>
  );
}
