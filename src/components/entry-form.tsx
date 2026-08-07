import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MoodPicker } from "@/components/mood-picker";
import { WeatherPicker } from "@/components/weather-picker";
import { cn } from "@/lib/utils";
import type { MoodValue, WeatherValue } from "@/lib/mood-data";

export interface EntryFormData {
  id?: string;
  date: string;
  mood: MoodValue | null;
  weather: WeatherValue | null;
  note: string;
}

interface EntryFormProps {
  initialData?: Partial<EntryFormData> | undefined;
  onSubmit: (data: { id?: string; date: string; mood: MoodValue; weather: WeatherValue; note: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function EntryForm({ initialData, onSubmit, isSubmitting }: EntryFormProps) {
  const [date, setDate] = useState<Date>(
    initialData?.date ? parseISO(initialData.date) : new Date(),
  );
  const [mood, setMood] = useState<MoodValue | null>(initialData?.mood ?? null);
  const [weather, setWeather] = useState<WeatherValue | null>(initialData?.weather ?? null);
  const [note, setNote] = useState(initialData?.note ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood || !weather) return;
    await onSubmit({
      ...(initialData?.id ? { id: initialData.id } : {}),
      date: format(date, "yyyy-MM-dd"),
      mood,
      weather,
      note: note.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start rounded-2xl border-border bg-card text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              {date ? format(date, "MMMM d, yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
              className="p-3"
              disabled={(d) => d > new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">How are you feeling?</label>
        <MoodPicker value={mood} onChange={setMood} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">What was the weather like?</label>
        <WeatherPicker value={weather} onChange={setWeather} />
      </div>

      <div className="space-y-2">
        <label htmlFor="note" className="text-sm font-medium text-foreground">
          Note (optional)
        </label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything you want to remember about today..."
          className="min-h-[100px] rounded-2xl border-border bg-card"
          maxLength={1000}
        />
      </div>

      <Button
        type="submit"
        disabled={!mood || !weather || isSubmitting}
        className="w-full rounded-full py-6 text-base font-semibold shadow-sm transition-transform active:scale-95"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : initialData?.id ? (
          "Update entry"
        ) : (
          "Save entry"
        )}
      </Button>
    </form>
  );
}
