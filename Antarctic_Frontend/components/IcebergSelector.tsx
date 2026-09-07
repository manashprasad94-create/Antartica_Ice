"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin, Check } from "lucide-react";
import type { IcebergSummary } from "@/lib/types";

interface IcebergSelectorProps {
  icebergs: IcebergSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export default function IcebergSelector({
  icebergs,
  selectedId,
  onSelect,
  loading = false,
}: IcebergSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = icebergs.find((b) => b.id === selectedId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={14} className="text-ice-600" />
        <h2 className="text-xs font-semibold text-ice-600 tracking-wide">
          ICEBERG TRACKING
        </h2>
      </div>

      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={loading}
          className="w-full flex items-center justify-between px-3 py-2 bg-white border border-border rounded text-sm text-ink hover:border-ice-400 transition-colors disabled:opacity-50"
        >
          <span className={selected ? "text-ink" : "text-ink-muted"}>
            {loading
              ? "Loading icebergs…"
              : selected
              ? `${selected.name} · ${selected.area_km2.toLocaleString()} km²`
              : "Select an iceberg"}
          </span>
          <ChevronDown
            size={14}
            className={`text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute z-[1000] top-full left-0 right-0 mt-1 bg-white border border-border rounded shadow-crisp max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                onSelect("");
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-ink-muted hover:bg-surface-alt transition-colors"
            >
              None selected
              {selectedId === "" && <Check size={14} className="text-ice-600" />}
            </button>

            <div className="h-px bg-border" />

            {icebergs.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  onSelect(b.id);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-ink hover:bg-surface-alt transition-colors"
              >
                <span className="flex flex-col items-start">
                  <span className="font-medium">{b.name}</span>
                  <span className="font-data text-xs text-ink-muted">
                    {b.current_lat.toFixed(1)}°, {b.current_lon.toFixed(1)}° ·{" "}
                    {b.area_km2.toLocaleString()} km²
                  </span>
                </span>
                {selectedId === b.id && <Check size={14} className="text-ice-600" />}
              </button>
            ))}

            {icebergs.length === 0 && !loading && (
              <div className="px-3 py-3 text-sm text-ink-muted">
                No icebergs available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}