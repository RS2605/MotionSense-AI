import React from "react";

export function Card({ className = "", children, dataTestId }) {
  return (
    <div
      className={`glass glass-hover p-6 ${className}`}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
}

export function Stat({ label, value, unit, icon: Icon, accent = "#0284c7", testid }) {
  return (
    <div className="glass glass-hover p-5 flex items-center gap-4" data-testid={testid}>
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{
          background: `linear-gradient(135deg, ${accent}22, ${accent}55)`,
          border: `1px solid ${accent}55`,
          color: accent,
        }}
      >
        {Icon && <Icon size={22} strokeWidth={2.2} />}
      </div>
      <div className="min-w-0">
        <div className="text-eyebrow truncate">{label}</div>
        <div className="font-display font-bold text-3xl leading-tight text-sky-ink">
          {value}
          {unit && <span className="text-sm font-body font-medium text-sky-deep/70 ml-1">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6" data-testid="section-title">
      {eyebrow && <div className="text-eyebrow mb-2">{eyebrow}</div>}
      <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight text-sky-ink">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sky-deep/80 font-body">{subtitle}</p>
      )}
    </div>
  );
}

export function Chip({ children, color = "#0284c7", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`rounded-xl bg-white/40 animate-pulse ${className}`}
      style={{ backdropFilter: "blur(6px)" }}
    />
  );
}
