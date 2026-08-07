import { cn } from "@/lib/utils";
import { WEATHER_TYPES } from "@/lib/mood-data";
import type { WeatherValue } from "@/lib/mood-data";

interface WeatherPickerProps {
  value: WeatherValue | null;
  onChange: (value: WeatherValue) => void;
}

export function WeatherPicker({ value, onChange }: WeatherPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {WEATHER_TYPES.map((weather) => {
        const isSelected = value === weather.value;
        return (
          <button
            key={weather.value}
            type="button"
            onClick={() => onChange(weather.value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl border p-3 transition-all",
              "hover:bg-accent hover:scale-105 active:scale-95",
              isSelected
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground",
            )}
            aria-pressed={isSelected}
            aria-label={`Weather: ${weather.label}`}
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              {weather.emoji}
            </span>
            <span className="text-xs font-medium">{weather.label}</span>
          </button>
        );
      })}
    </div>
  );
}
