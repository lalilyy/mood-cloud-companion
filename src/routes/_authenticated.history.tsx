import { format, parseISO } from "date-fns";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getEntries, deleteEntry } from "@/lib/mood-entries.functions";
import { WEATHER_TYPES } from "@/lib/mood-data";
import { useMoodIcons } from "@/hooks/use-mood-icons";
import { List, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — LilyMood" },
      { name: "description", content: "Browse and edit your past mood and weather entries." },
      { property: "og:title", content: "History — LilyMood" },
      { property: "og:description", content: "Browse and edit your past mood and weather entries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { moods: MOODS } = useMoodIcons();
  const queryClient = useQueryClient();
  const getEntriesFn = useServerFn(getEntries);
  const deleteEntryFn = useServerFn(deleteEntry);

  const { data = { entries: [] } } = useQuery({
    queryKey: ["mood-entries", "all"],
    queryFn: () => getEntriesFn({ data: {} }),
  });

  const entries = data.entries ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteEntryFn({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: ["mood-entries"] });
      toast.success("Entry deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">History</h1>
        </div>
        <p className="text-sm text-muted-foreground">All your past entries.</p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No entries yet.</p>
          <Link
            to="/"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Log your first day
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const mood = MOODS.find((m) => m.value === entry.mood);
            const weather = WEATHER_TYPES.find((w) => w.value === entry.weather);
            const date = parseISO(entry.entry_date);
            return (
              <div
                key={entry.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="text-3xl">{mood?.emoji}</span>
                    <div>
                      <p className="font-semibold text-foreground">
                        {format(date, "MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {mood?.label} mood · {weather?.emoji} {weather?.label}
                      </p>
                      {entry.note && (
                        <p className="mt-1 max-w-[200px] text-xs text-foreground">{entry.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link to="/" search={{ edit: entry.entry_date }}>
                      <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(entry.id)}
                      className="rounded-full text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
