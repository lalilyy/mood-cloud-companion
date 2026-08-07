import { cn } from "@/lib/utils";
import { useMoodIcons } from "@/hooks/use-mood-icons";
import type { MoodValue } from "@/lib/mood-data";

interface MoodPickerProps {
  value: MoodValue | null;
  onChange: (value: MoodValue) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const { moods: MOODS } = useMoodIcons();
  return (
    <div className="grid grid-cols-5 gap-2">
      {MOODS.map((mood) => {
        const isSelected = value === mood.value;
        return (
          <button
            key={mood.value}
            type="button"
            onClick={() => onChange(mood.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all",
              "hover:bg-accent hover:scale-105 active:scale-95",
              isSelected
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground",
            )}
            aria-pressed={isSelected}
            aria-label={`Mood: ${mood.label}`}
          >
            <span className="text-3xl leading-none" aria-hidden="true">
              {mood.emoji}
            </span>
            <span className="text-xs font-medium">{mood.label}</span>
          </button>
        );
      })}
    </div>
  );
}
