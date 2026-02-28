"use client";

import type { CSSProperties, ReactNode } from "react";

export type SelectOption = { value: string; label: string };

const panel: CSSProperties = {
  border: "1px solid #6f0000",
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
  background: "rgba(120,0,0,0.08)"
};

const inputBase: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #7a0000",
  background: "#0d0d0d",
  color: "#ffd2d2",
  outline: "none"
};

export function PageShell(props: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 1200 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>{props.title}</h1>
      {props.subtitle ? <p style={{ marginTop: 0, opacity: 0.9 }}>{props.subtitle}</p> : null}
      {props.children}
    </div>
  );
}

export function SectionCard(props: { title: string; description?: string; children: ReactNode }) {
  return (
    <section style={panel}>
      <h3 style={{ marginTop: 0, marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>{props.title}</h3>
      {props.description ? <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.85 }}>{props.description}</p> : null}
      {props.children}
    </section>
  );
}

export function FieldGrid(props: { cols?: number; children: ReactNode }) {
  const cols = props.cols || 2;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(240px, 1fr))`, gap: 10 }}>
      {props.children}
    </div>
  );
}

export function ToggleRow(props: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <label style={{ display: "block", marginBottom: 8 }}>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        style={{ marginRight: 8 }}
      />
      <span>{props.label}</span>
      {props.help ? <span style={{ marginLeft: 8, opacity: 0.75 }}>({props.help})</span> : null}
    </label>
  );
}

export function TextRow(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.9 }}>{props.label}</div>
      <input
        style={inputBase}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder || ""}
      />
    </div>
  );
}

export function NumberRow(props: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.9 }}>{props.label}</div>
      <input
        type="number"
        style={inputBase}
        value={Number.isFinite(props.value) ? props.value : 0}
        min={props.min}
        max={props.max}
        onChange={(e) => props.onChange(Number(e.target.value || 0))}
      />
    </div>
  );
}

export function TextAreaRow(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.9 }}>{props.label}</div>
      <textarea
        style={{ ...inputBase, minHeight: (props.rows || 4) * 22 }}
        value={props.value}
        rows={props.rows || 4}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder || ""}
      />
    </div>
  );
}

export function SelectRow(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  return (
    <div>
      <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.9 }}>{props.label}</div>
      <select style={inputBase} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        <option value="">{props.placeholder || "Select..."}</option>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function MultiSelectRow(props: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: SelectOption[];
  size?: number;
}) {
  return (
    <div>
      <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.9 }}>{props.label}</div>
      <select
        multiple
        size={props.size || 8}
        style={{ ...inputBase, minHeight: 180 }}
        value={props.values}
        onChange={(e) => {
          const next = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
          props.onChange(next);
        }}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>Hold Ctrl/Cmd to select multiple.</div>
    </div>
  );
}

export function SaveBar(props: { saving: boolean; onSave: () => void; message?: string }) {
  return (
    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={props.onSave} disabled={props.saving}>
        {props.saving ? "Saving..." : "Save"}
      </button>
      {props.message ? <span>{props.message}</span> : null}
    </div>
  );
}
