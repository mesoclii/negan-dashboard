import Link from "next/link";

export default function AiRootPage() {
  return (
    <div style={{ color: "#ff5252", padding: 24 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>AI Command</h1>
      <p>AI Personas is a separate engine.</p>
      <Link href="/dashboard/ai/persona" style={{ color: "#ff8a8a", textDecoration: "underline" }}>
        Open AI Personas
      </Link>
    </div>
  );
}
