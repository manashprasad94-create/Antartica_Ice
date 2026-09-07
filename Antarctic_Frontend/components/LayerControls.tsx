"use client";

import { Layers, Snowflake, Gauge, MapPin, Route as RouteIcon } from "lucide-react";
import type { LayerVisibility, LayerKey } from "@/lib/types";

interface LayerControlsProps {
  visibility: LayerVisibility;
  onToggle: (key: LayerKey) => void;
}

const LAYER_ITEMS: { key: LayerKey; label: string; icon: React.ElementType }[] = [
  { key: "ice", label: "Ice concentration", icon: Snowflake },
  { key: "confidence", label: "Confidence overlay", icon: Gauge },
  { key: "icebergTracks", label: "Iceberg tracks", icon: MapPin },
  { key: "route", label: "Route", icon: RouteIcon },
];

export default function LayerControls({ visibility, onToggle }: LayerControlsProps) {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={14} className="text-ice-600" />
        <h2 className="text-xs font-semibold text-ice-600 tracking-wide">LAYERS</h2>
      </div>

      <div className="flex flex-col gap-1">
        {LAYER_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = visibility[key];
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={`flex items-center justify-between px-2.5 py-2 rounded text-sm transition-colors ${
                active
                  ? "bg-ice-50 text-ink"
                  : "text-ink-muted hover:bg-surface-alt"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon size={14} className={active ? "text-ice-600" : "text-ink-muted"} />
                {label}
              </span>
              <span
                className={`w-8 h-4.5 rounded-full relative transition-colors ${
                  active ? "bg-ice-500" : "bg-border"
                }`}
                style={{ width: "32px", height: "18px" }}
              >
                <span
                  className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                    active ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}