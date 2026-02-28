import { possum } from "@/styles/possumTheme";

export function PossumCard({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: possum.panelBg,
        border: `1px solid ${possum.border}`,
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 0 26px rgba(255,0,0,0.12), inset 0 0 26px rgba(255,0,0,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 950,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#fff",
              textShadow: "0 0 14px rgba(255,0,0,0.28)",
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: possum.soft,
                opacity: 0.92,
                lineHeight: 1.6,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>
        {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
      </div>

      {children ? <div style={{ marginTop: 16 }}>{children}</div> : null}
    </div>
  );
}
