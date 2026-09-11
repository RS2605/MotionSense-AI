import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Database, LineChart, BrainCircuit, Target } from "lucide-react";

const links = [
  { to: "/",             label: "Overview",        icon: Home,         id: "nav-overview" },
  { to: "/data",         label: "Data Explorer",   icon: Database,     id: "nav-data" },
  { to: "/eda",          label: "EDA",             icon: LineChart,    id: "nav-eda" },
  { to: "/model",        label: "Model",           icon: BrainCircuit, id: "nav-model" },
  { to: "/predict",      label: "Live Prediction", icon: Target,       id: "nav-predict" },
];

export default function TopNav() {
  return (
    <header className="relative z-30" data-testid="top-nav">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-3 group" data-testid="brand-link">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
               style={{
                 background: "linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)",
                 boxShadow: "0 8px 20px rgba(14,165,233,0.35)"
               }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3l3.5 5.5-3.5 3.5-3.5-3.5L12 3z" />
              <path d="M3 12l5.5 3.5" />
              <path d="M21 12l-5.5 3.5" />
              <path d="M8.5 15.5L12 21" />
              <path d="M15.5 15.5L12 21" />
            </svg>
          </div>
          <div>
            <div className="font-display font-extrabold text-lg leading-none tracking-tight text-sky-ink">
              MotionSense<span className="text-sky-deep">·AI</span>
            </div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-sky-deep/70">
              Human Activity Recognition
            </div>
          </div>
        </NavLink>

        {/* Nav pills */}
        <nav className="glass flex items-center gap-1 p-1.5" style={{ borderRadius: 999 }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={l.id}
              className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`}
            >
              <l.icon size={16} strokeWidth={2.2} />
              <span className="hidden md:inline">{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
