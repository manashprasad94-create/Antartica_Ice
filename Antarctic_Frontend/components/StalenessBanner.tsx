"use client";

import { AlertTriangle, WifiOff, X } from "lucide-react";
import type { ApiError } from "@/lib/types";

interface StalenessBannerProps {
  error: ApiError | null;
  onDismiss: () => void;
}

/**
 * Distinguishes "stale/missing data" (informational, expected, ties to the
 * data-scarcity honesty angle) from genuine failures (network/backend errors)
 * so the tone and icon differ — one is a shrug, the other is a real problem.
 */
function isStaleDataCode(code: string): boolean {
  return (
    code === "ICE_DATA_UNAVAILABLE" ||
    code === "STALE_DATA" ||
    code === "SATELLITE_PASS_MISSING"
  );
}

export default function StalenessBanner({ error, onDismiss }: StalenessBannerProps) {
  if (!error) return null;

  const stale = isStaleDataCode(error.code);

  return (
    <div
      className={`shrink-0 flex items-center justify-between px-6 py-2.5 text-sm border-t ${
        stale
          ? "bg-ice-50 border-ice-200 text-ink"
          : "bg-warn/15 border-warn text-ink"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {stale ? (
          <AlertTriangle size={14} className="text-ice-600 shrink-0" />
        ) : (
          <WifiOff size={14} className="text-warn shrink-0" />
        )}
        <span>{error.message}</span>
        <span className="font-data text-[10px] text-ink-muted">{error.code}</span>
      </div>

      <button
        onClick={onDismiss}
        className="text-ink-muted hover:text-ink transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}