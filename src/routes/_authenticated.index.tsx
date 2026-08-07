import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format as formatDate } from "date-fns";

import { getEntries, createEntry, updateEntry, deleteEntry } from "@/lib/mood-entries.functions";
import { EntryForm } from "@/components/entry-form";
import { Button } from "@/components/ui/button";
import { MOODS, WEATHER_TYPES } from "@/lib/mood-data";
import type { MoodValue, WeatherValue } from "@/lib/mood-data";
import { Pencil, Trash2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Today — LilyMood" },
      { name: "description", content: "Log today's mood and weather in LilyMood." },
      { property: "og:title", content: "Today — LilyMood" },
      { property: "og:description", content: "Log today's mood and weather in LilyMood." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const today = formatDate(new Date(), "yyyy-MM-dd");
  const monthStart = formatDate(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = formatDate(endOfMonth(new Date()), "yyyy-MM-dd");

  const getEntriesFn = useServerFn(getEntries);
  const createEntryFn = useServerFn(createEntry);
  const updateEntryFn = useServerFn(updateEntry);
  const deleteEntryFn = useServerFn(deleteEntry);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data = { entries: [] } } = useQuery({
    queryKey: ["mood-entries", monthStart, monthEnd],
    queryFn: () => getEntriesFn({ data: { startDate: monthStart, endDate: monthEnd } }),
  });

  const entries = data.entries ?? [];

  const todayEntry = entries.find((e) => e.entry_date === today);

  const handleSubmit = async (data: {
    id?: string;
    date: string;
    mood: MoodValue;
    weather: WeatherValue;
    note: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (data.id) {
        await updateEntryFn({
          data: {
            id: data.id,
            date: data.date,
            mood: data.mood,
            weather: data.weather,
            note: data.note,
          },
        });
        toast.success("Entry updated");
      } else {
        await createEntryFn({
          data: {
            date: data.date,
            mood: data.mood,
            weather: data.weather,
            note: data.note,
          },
        });
        toast.success("Entry saved");
      }
      await queryClient.invalidateQueries({ queryKey: ["mood-entries"] });
      await navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!todayEntry) return;
    if (!confirm("Delete today's entry?")) return;
    try {
      await deleteEntryFn({ data: { id: todayEntry.id } });
      await queryClient.invalidateQueries({ queryKey: ["mood-entries"] });
      toast.success("Entry deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const initialData = todayEntry
    ? {
        id: todayEntry.id,
        date: todayEntry.entry_date,
        mood: todayEntry.mood as MoodValue,
        weather: todayEntry.weather as WeatherValue,
        note: todayEntry.note ?? "",
      }
    : undefined;

  const mood = todayEntry ? MOODS.find((m) => m.value === todayEntry.mood) : null;
  const weather = todayEntry ? WEATHER_TYPES.find((w) => w.value === todayEntry.weather) : null;

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {todayEntry ? "Today's entry" : "How was your day?"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </header>

      {todayEntry && (
        <div className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{mood?.emoji}</span>
              <div>
                <p className="font-semibold text-foreground">{mood?.label}</p>
                <p className="text-sm text-muted-foreground">
                  {weather?.emoji} {weather?.label}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {}}
                className="rounded-full text-muted-foreground"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="rounded-full text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {todayEntry.note && (
            <p className="mt-3 text-sm text-foreground">{todayEntry.note}</p>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            {todayEntry ? "Update your entry" : "Log today"}
          </h2>
        </div>
        <EntryForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
