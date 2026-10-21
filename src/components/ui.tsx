import type { ReactNode } from "react";
import { Info, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {hint && (
          <span className="hint" title={hint}>
            <Info size={13} />
          </span>
        )}
      </span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 1000000,
  step = "any",
  hint,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        placeholder={placeholder ?? (max === 4 ? "e.g. 3.50" : "Enter a value")}
        aria-invalid={!Number.isNaN(value) && (value < min || value > max)}
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? Number.NaN : Number(e.target.value))
        }
        required
      />
    </Field>
  );
}
export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "amber" | "green" | "gray";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="note">
      <Info size={17} />
      <div>{children}</div>
    </div>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function Stat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className={`stat ${accent ? "accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </Card>
  );
}
export function Empty({
  title,
  body,
  to,
  label,
}: {
  title: string;
  body: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-orbit">✦</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {to && (
        <Link className="button" to={to}>
          {label}
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export const fmt = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : n.toFixed(digits);
export function ResultError({ message }: { message: string }) {
  return message ? (
    <p className="error" role="alert">
      {message}
    </p>
  ) : null;
}
export function calculate<T>(fn: () => T): { result: T | null; error: string } {
  try {
    return { result: fn(), error: "" };
  } catch (e) {
    return {
      result: null,
      error: e instanceof Error ? e.message : "Invalid input",
    };
  }
}

export function Advanced({
  title,
  children,
  open = false,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="advanced" open={open || undefined}>
      <summary>{title}</summary>
      <div className="advanced-content">{children}</div>
    </details>
  );
}
