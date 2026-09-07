"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { RouteResponse } from "@/lib/types";

interface RouteComparisonChartProps {
  route: RouteResponse;
}

export default function RouteComparisonChart({ route }: RouteComparisonChartProps) {
  const { shortest_route, recommended_route } = route;

  const maxDistance = Math.max(shortest_route.distance_nm, recommended_route.distance_nm);
  const maxFuel = Math.max(
    shortest_route.estimated_fuel_tons,
    recommended_route.estimated_fuel_tons
  );
  const maxTime = Math.max(
    shortest_route.estimated_time_hours,
    recommended_route.estimated_time_hours
  );

  const data = [
    {
      metric: "Distance",
      shortest: Math.round((shortest_route.distance_nm / maxDistance) * 100),
      recommended: Math.round((recommended_route.distance_nm / maxDistance) * 100),
      shortestLabel: `${shortest_route.distance_nm} nm`,
      recommendedLabel: `${recommended_route.distance_nm} nm`,
    },
    {
      metric: "Fuel",
      shortest: Math.round((shortest_route.estimated_fuel_tons / maxFuel) * 100),
      recommended: Math.round((recommended_route.estimated_fuel_tons / maxFuel) * 100),
      shortestLabel: `${shortest_route.estimated_fuel_tons} t`,
      recommendedLabel: `${recommended_route.estimated_fuel_tons} t`,
    },
    {
      metric: "Time",
      shortest: Math.round((shortest_route.estimated_time_hours / maxTime) * 100),
      recommended: Math.round((recommended_route.estimated_time_hours / maxTime) * 100),
      shortestLabel: `${shortest_route.estimated_time_hours} h`,
      recommendedLabel: `${recommended_route.estimated_time_hours} h`,
    },
    {
      metric: "Ice risk",
      shortest: shortest_route.ice_risk_pct,
      recommended: recommended_route.ice_risk_pct,
      shortestLabel: `${shortest_route.ice_risk_pct}%`,
      recommendedLabel: `${recommended_route.ice_risk_pct}%`,
    },
  ];

  return (
    <div className="bg-white px-6 py-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={14} className="text-ice-600" />
        <h3 className="text-xs font-semibold text-ice-600 tracking-wide">
          ROUTE COMPARISON
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="2 6" stroke="#E2E8ED" horizontal={false} />
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis
            type="category"
            dataKey="metric"
            tick={{ fontSize: 12, fill: "#0B1D2E" }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 4,
              border: "1px solid #E2E8ED",
              boxShadow: "none",
            }}
            formatter={((_value: unknown, name: unknown, props: unknown) => {
              const key = name === "shortest" ? "shortestLabel" : "recommendedLabel";
              const payload = (props as { payload?: Record<string, string> })?.payload;
              const displayValue = payload?.[key] ?? String(_value);
              const displayName = name === "shortest" ? "Shortest" : "Recommended";
              return [displayValue, displayName];
            }) as any}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={((value: unknown) =>
              value === "shortest" ? "Shortest" : "Recommended") as any}
          />
          <Bar dataKey="shortest" fill="#C4453A" radius={[0, 2, 2, 0]} barSize={12} />
          <Bar dataKey="recommended" fill="#2F8F5B" radius={[0, 2, 2, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}