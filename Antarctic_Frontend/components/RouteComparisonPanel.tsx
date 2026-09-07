"use client";

import { ArrowRight, Flame, Clock, ShieldCheck, TrendingUp } from "lucide-react";
import type { RouteResponse } from "@/lib/types";

interface RouteComparisonPanelProps {
  route: RouteResponse;
}

interface StatRowProps {
  icon: React.ElementType;
  label: string;
  shortestValue: string;
  recommendedValue: string;
  highlightRecommended?: boolean;
}

function StatRow({
  icon: Icon,
  label,
  shortestValue,
  recommendedValue,
  highlightRecommended,
}: StatRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 border-b border-border last:border-b-0">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-ink-muted" />
        <span className="text-xs text-ink-muted">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-data text-sm text-ink-muted w-20 text-right">
          {shortestValue}
        </span>
        <ArrowRight size={12} className="text-border" />
        <span
          className={`font-data text-sm w-20 text-left ${
            highlightRecommended ? "text-safe font-semibold" : "text-ink"
          }`}
        >
          {recommendedValue}
        </span>
      </div>
      <div />
    </div>
  );
}

export default function RouteComparisonPanel({ route }: RouteComparisonPanelProps) {
  const { shortest_route, recommended_route, comparison } = route;

  return (
    <div className="bg-white px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-danger" />
            <span className="text-xs font-medium text-ink">Shortest</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-safe" />
            <span className="text-xs font-medium text-ink">Recommended</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 bg-ice-50 rounded">
          <TrendingUp size={12} className="text-ice-600" />
          <span className="font-data text-xs text-ice-600">
            {comparison.risk_reduction_pct}% less risk
          </span>
        </div>
      </div>

      <StatRow
        icon={ArrowRight}
        label="Distance"
        shortestValue={`${shortest_route.distance_nm} nm`}
        recommendedValue={`${recommended_route.distance_nm} nm (+${comparison.extra_distance_pct}%)`}
      />
      <StatRow
        icon={Flame}
        label="Fuel"
        shortestValue={`${shortest_route.estimated_fuel_tons} t`}
        recommendedValue={`${recommended_route.estimated_fuel_tons} t (+${comparison.extra_fuel_pct}%)`}
      />
      <StatRow
        icon={Clock}
        label="Time"
        shortestValue={`${shortest_route.estimated_time_hours} h`}
        recommendedValue={`${recommended_route.estimated_time_hours} h`}
      />
      <StatRow
        icon={ShieldCheck}
        label="Ice risk"
        shortestValue={`${shortest_route.ice_risk_pct}%`}
        recommendedValue={`${recommended_route.ice_risk_pct}%`}
        highlightRecommended
      />
    </div>
  );
}