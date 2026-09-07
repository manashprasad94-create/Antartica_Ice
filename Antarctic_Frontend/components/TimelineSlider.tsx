"use client";

import { Calendar } from "lucide-react";
import type { DailyForecast } from "@/lib/types";

interface TimelineSliderProps {
  days: DailyForecast[];
  selectedDay: number;
  onChange: (dayOffset: number) => void;
}

export default function TimelineSlider({ days, selectedDay, onChange }: TimelineSliderProps) {
  const maxIndex = Math.max(days.length - 1, 0);
  const current = days[selectedDay];

  return (
    <div className="h-16 shrink-0 border-b border-border bg-white flex items-center gap-4 px-6">
      <div className="flex items-center gap-2 w-32 shrink-0">
        <Calendar size={13} className="text-ice-600" />
        <span className="font-data text-xs text-ink">
          {current ? current.date : "—"}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={maxIndex}
          step={1}
          value={selectedDay}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-ice-500"
        />
        {/* Day tick labels */}
        <div className="flex justify-between px-0.5">
          {days.map((d, i) => (
            <button
              key={d.day_offset}
              onClick={() => onChange(i)}
              className={`text-[10px] font-data transition-colors ${
                i === selectedDay ? "text-ice-600 font-semibold" : "text-ink-muted"
              }`}
            >
              +{d.day_offset}
            </button>
          ))}
        </div>
      </div>

      <span className="font-data text-xs text-ink-muted w-24 text-right shrink-0">
        Day +{selectedDay} of {maxIndex}
      </span>
    </div>
  );
}