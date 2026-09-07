"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { DailyForecast } from "@/lib/types";

interface IceForecastTrendChartProps {
  dailyForecasts: DailyForecast[];
}

function flattenGrid(grid: number[][]): number[] {
  return grid.flat();
}

function average(values: number[]): number {
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

const SERIES_LABELS: Record<string, string> = {
  avgConcentration: "Avg concentration",
  maxConcentration: "Max concentration",
  avgConfidence: "Avg confidence",
};

export default function IceForecastTrendChart({
  dailyForecasts,
}: IceForecastTrendChartProps) {
  const data = dailyForecasts.map((day) => {
    const values = flattenGrid(day.grid.concentration_pct);
    const confValues = flattenGrid(day.grid.confidence_pct);
    return {
      day: `+${day.day_offset}`,
      date: day.date,
      avgConcentration: average(values),
      maxConcentration: Math.max(...values),
      avgConfidence: average(confValues),
    };
  });

  return (
    <div className="bg-white p-4 border-b border-border">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} className="text-ice-600" />
        <h3 className="text-xs font-semibold text-ice-600 tracking-wide">
          ICE CONCENTRATION TREND
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 6" stroke="#E2E8ED" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#5B6B78" }}
            axisLine={{ stroke: "#E2E8ED" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 10, fill: "#5B6B78" }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 4,
              border: "1px solid #E2E8ED",
              boxShadow: "none",
            }}
            formatter={((value: unknown, name: unknown) => {
              const label = SERIES_LABELS[name as string] ?? String(name);
              return [`${value}%`, label];
            }) as any}
            labelFormatter={((label: unknown, payload: unknown) => {
              const items = payload as Array<{ payload?: { date?: string } }> | undefined;
              return items?.[0]?.payload?.date ?? String(label);
            }) as any}
          />
          <Line
            type="monotone"
            dataKey="avgConcentration"
            stroke="#2A6D8F"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="avgConcentration"
          />
          <Line
            type="monotone"
            dataKey="maxConcentration"
            stroke="#C4453A"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={{ r: 2 }}
            name="maxConcentration"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-ice-600 inline-block" />
          <span className="text-[10px] text-ink-muted">Avg concentration</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-danger inline-block border-t border-dashed border-danger" />
          <span className="text-[10px] text-ink-muted">Max concentration</span>
        </div>
      </div>
    </div>
  );
}