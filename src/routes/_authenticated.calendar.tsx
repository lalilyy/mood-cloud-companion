import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar } from "@/components/ui/calendar";
import { getEntries } from "@/lib/mood-entries.functions";
import { MOODS, WEATHER_TYPES } from "@/lib/mood-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — LilyMood" },
      { name: "description", content: "View your mood and weather entries on a calendar." },
      { property: "og:title", content: "Calendar — LilyMood" },
      { property: "og:description", content: "View your mood and weather entries on a calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const [month, setMonth] = useState<Date>(new Date());
  const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");
  const getEntriesFn = useServerFn(getEntries);

  const { data = { entries: [] } } = useQuery({
    queryKey: ["mood-entries", monthStart, monthEnd],
    queryFn: () => getEntriesFn({ data: { startDate: monthStart, endDate: monthEnd } }),
  });

  const entries = data.entries ?? [];
  const entriesByDate = new Map(entries.map((e) => [e.entry_date, e]));

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Calendar</h1>
        </div>
        <p className="text-sm text-muted-foreground">Tap a day to see your entry.</p>
      </header>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <Calendar
          mode="single"
          selected={undefined}
          month={month}
          onMonthChange={setMonth}
          className="w-full"
          components={{
            DayButton: ({ day, ...props }) => {
              const dateStr = format(day.date, "yyyy-MM-dd");
              const entry = entriesByDate.get(dateStr);
              const mood = entry ? MOODS.find((m) => m.value === entry.mood) : null;
              const weather = entry ? WEATHER_TYPES.find((w) => w.value === entry.weather) : null;

              if (entry) {
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        {...props}
                        className="flex aspect-square h-auto w-full flex-col items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <span>{day.date.getDate()}</span>
                        <span className="text-base leading-none">{mood?.emoji}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="center">
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-foreground">
                          {format(day.date, "MMMM d, yyyy")}
                        </p>
                        <p className="text-muted-foreground">
                          {mood?.emoji} {mood?.label} mood
                        </p>
                        <p className="text-muted-foreground">
                          {weather?.emoji} {weather?.label} weather
                        </p>
                        {entry.note && (
                          <p className="max-w-[200px] text-xs text-foreground">{entry.note}</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              return (
                <button
                  type="button"
                  {...props}
                  className="flex aspect-square h-auto w-full flex-col items-center justify-center rounded-md text-xs font-normal text-muted-foreground"
                >
                  {day.date.getDate()}
                </button>
              );
            },
          }}
        />
      </div>
    </div>
  );
}
