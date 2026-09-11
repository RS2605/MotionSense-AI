import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";

/**
 * Multi-select pill dropdown with a PORTAL-based menu so it always renders
 * on top of any surrounding stacking context (glass cards, tabs, etc.).
 */
export default function MultiSelect({ options = [], value = [], onChange, placeholder = "Choose options", testid }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, direction: "down" });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Position the menu relative to the trigger, flip up if there is no room below
  const updatePosition = () => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    const menuHeight = 280; // approximate max height
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const direction = (spaceBelow < menuHeight && spaceAbove > spaceBelow) ? "up" : "down";
    setPos({
      top: direction === "down" ? r.bottom + 6 : r.top - 6,
      left: r.left,
      width: r.width,
      direction,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const remove = (v) => onChange(value.filter(x => x !== v));
  const add = (v) => onChange(value.includes(v) ? value : [...value, v]);
  const toggle = (v) => value.includes(v) ? remove(v) : add(v);
  const clear = () => onChange([]);
  const selectAll = () => onChange(options.map(o => o.value));

  const selectedObjs = value.map(v => options.find(o => o.value === v)).filter(Boolean);

  const menu = open && (
    <div
      ref={menuRef}
      className="glass !rounded-2xl overflow-hidden shadow-2xl"
      style={{
        position: "fixed",
        top: pos.direction === "down" ? pos.top : undefined,
        bottom: pos.direction === "up" ? window.innerHeight - pos.top : undefined,
        left: pos.left,
        width: pos.width,
        maxHeight: 280,
        overflowY: "auto",
        zIndex: 9999,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(18px) saturate(180%)",
      }}
      data-testid={`${testid}-menu`}
    >
      <button
        className="w-full text-left px-4 py-2.5 text-sm text-sky-ink hover:bg-sky-100/60 border-b border-white/60 font-semibold sticky top-0 bg-white/80 backdrop-blur z-10"
        onClick={selectAll}
        data-testid={`${testid}-select-all`}
      >
        Select all
      </button>
      {options.map(opt => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-sky-100/60 flex items-center gap-2 cursor-pointer ${selected ? "bg-white/60 font-semibold" : ""}`}
            onClick={() => toggle(opt.value)}
            data-testid={`${testid}-option-${String(opt.value)}`}
          >
            <span
              className="inline-block w-3.5 h-3.5 rounded-sm border-2 shrink-0"
              style={{
                background: selected ? (opt.color ?? "#8b5cf6") : "transparent",
                borderColor: opt.color ?? "#8b5cf6",
              }}
            />
            {opt.emoji && <span>{opt.emoji}</span>}
            <span className="text-sky-ink">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative" data-testid={testid}>
      <div
        ref={triggerRef}
        className="glass !rounded-full !p-1.5 pr-2 flex items-center gap-1.5 flex-wrap min-h-[42px] cursor-pointer hover:bg-white/70 transition"
        onClick={() => setOpen(o => !o)}
      >
        {selectedObjs.length === 0 && (
          <span className="text-sky-deep/60 text-sm pl-3">{placeholder}</span>
        )}
        {selectedObjs.map(opt => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              background: `${opt.color ?? "#8b5cf6"}22`,
              color: opt.color ?? "#8b5cf6",
              border: `1px solid ${opt.color ?? "#8b5cf6"}44`,
            }}
          >
            {opt.emoji && <span>{opt.emoji}</span>}
            {opt.label}
            <button
              onClick={(e) => { e.stopPropagation(); remove(opt.value); }}
              className="ml-0.5 hover:bg-white/30 rounded-full p-0.5"
              data-testid={`ms-remove-${String(opt.value)}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <div className="ml-auto flex items-center gap-1 pr-1">
          {selectedObjs.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="text-sky-deep/60 hover:text-sky-deep p-1 rounded-full hover:bg-white/40"
              data-testid={`${testid}-clear`}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`text-sky-deep/70 transition ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {menu && createPortal(menu, document.body)}
    </div>
  );
}
