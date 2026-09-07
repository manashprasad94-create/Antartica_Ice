"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import { exportReport, downloadBlob } from "@/lib/api";
import { isApiError } from "@/lib/types";

interface ExportButtonProps {
  routeId?: string;
  onError: (message: string) => void;
}

type ExportState = "idle" | "loading" | "success";

export default function ExportButton({ routeId, onError }: ExportButtonProps) {
  const [state, setState] = useState<ExportState>("idle");

  async function handleExport() {
    setState("loading");
    const result = await exportReport(routeId);

    if (isApiError(result)) {
      setState("idle");
      onError(result.message);
      return;
    }

    downloadBlob(result, `antarctic-route-report-${Date.now()}.txt`);
    setState("success");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Download size={14} className="text-ice-600" />
        <h2 className="text-xs font-semibold text-ice-600 tracking-wide">EXPORT</h2>
      </div>

      <button
        onClick={handleExport}
        disabled={state === "loading"}
        className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded transition-colors ${
          state === "success"
            ? "bg-safe text-white"
            : "bg-white border border-border text-ink hover:border-ice-400"
        } disabled:opacity-60`}
      >
        {state === "loading" && (
          <>
            <Loader2 size={14} className="animate-spin" />
            Generating report…
          </>
        )}
        {state === "success" && (
          <>
            <Check size={14} />
            Downloaded
          </>
        )}
        {state === "idle" && (
          <>
            <Download size={14} />
            Export Report
          </>
        )}
      </button>
    </div>
  );
}