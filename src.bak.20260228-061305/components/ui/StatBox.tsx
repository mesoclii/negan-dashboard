export function StatBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="neon-border rounded-xl bg-black/60 p-4">
      <div className="text-xs tracking-[0.25em] uppercase text-red-200/70">
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold neon-red">{value}</div>
      {hint ? (
        <div className="mt-2 text-sm text-red-200/60">{hint}</div>
      ) : null}
    </div>
  );
}
