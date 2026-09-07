"use client";

import { useState } from "react";
import { Info, X, Snowflake, Waves, Route as RouteIcon } from "lucide-react";

interface AboutPanelProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    icon: Snowflake,
    title: "Sea-ice forecasting",
    body: "We look at recent satellite images of the ice and use that pattern to predict how much ice will cover each part of the ocean over the next few days — similar to how a weather forecast predicts rain. Areas we're less sure about (further in the future, or far from the last clear satellite pass) are marked with lower confidence.",
  },
  {
    icon: Waves,
    title: "Iceberg drift prediction",
    body: "Icebergs move because of wind, ocean currents, and the Earth's rotation (the Coriolis effect) — this physics gives us a first estimate of where an iceberg is headed. We then correct that estimate using a machine learning model trained on how real icebergs have actually moved in the past, which tends to catch effects the physics alone misses. The further out we predict, the wider the uncertainty circle around the iceberg's expected position.",
  },
  {
    icon: RouteIcon,
    title: "Route optimization",
    body: "Given a start and end point, we compare the shortest possible path against a slightly longer path that steers around forecasted ice and iceberg risk zones. Each risky point on the shortest route is labeled with the specific reason it's flagged, so the tradeoff between a faster trip and a safer one is always visible and explained, not hidden behind a single score.",
  },
];

export default function AboutPanel({ open, onClose }: AboutPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end">
      {/* Backdrop — solid dim, no blur, click to close */}
      <div className="absolute inset-0 bg-navy-950/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-white border-l border-border overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-ice-600" />
            <h2 className="font-semibold text-ink text-sm">How this works</h2>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {SECTIONS.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={15} className="text-ice-600" />
                <h3 className="font-medium text-ink text-sm">{title}</h3>
              </div>
              <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
            </div>
          ))}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-ink-muted leading-relaxed">
              Antarctic satellite coverage is limited and gaps are common — when
              recent data is missing, this tool shows the most recent forecast
              available and says so clearly, rather than guessing silently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}