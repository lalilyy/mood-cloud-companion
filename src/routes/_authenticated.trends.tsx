import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getEntries } from "@/lib/mood-entries.functions";
import { MOODS } from "@/lib/mood-data";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/trends")({
  head: () => ({
    meta: [
      { title: "Trends — LilyMood" },
      { name: "description", content: "See your mood trends over time in LilyMood." },
      { property: "og:title", content: "Trends — LilyMood" },
      { property: "og:description", content: "See your mood trends over time in LilyMood." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrendsPage,
});

function TrendsPage() {
  const today = new Date();
  const start = format(subDays(today, 29), "yyyy-MM-dd");
  const end = format(today, "yyyy-MM-dd");
  const getEntriesFn = useServerFn(getEntries);

  const { data = { entries: [] } } = useQuery({
    queryKey: ["mood-entries", "trends", start, end],
    queryFn: () => getEntriesFn({ data: { startDate: start, endDate: end } }),
  });

  const entries = data.entries ?? [];
  const entriesByDate = new Map(entries.map((e) => [e.entry_date, e]));

  const allDays = eachDayOfInterval({ start: subDays(today, 29), end: today }).map((d) => {
    const dateStr = format(d, "yyyy-MM-dd");
    const entry = entriesByDate.get(dateStr);
    return {
      date: format(d, "MMM d"),
      fullDate: dateStr,
      mood: entry ? entry.mood : null,
    };
  });

  const averageMood =
    entries.length > 0
      ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
      : null;

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Trends</h1>
        </div>
        <p className="text-sm text-muted-foreground">Your mood over the last 30 days.</p>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Entries</p>
          <p className="font-display text-2xl font-bold text-foreground">{entries.length}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Average mood</p>
          <p className="font-display text-2xl font-bold text-foreground">
            {averageMood ?? "—"}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        {entries.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={allDays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const item = payload[0];
                    if (!item) return null;
                    const mood = item.value as number | null;
                    if (!mood) return null;
                    const moodInfo = MOODS.find((m) => m.value === mood);
                    return (
                      <div className="rounded-xl border border-border bg-popover p-2 text-xs text-popover-foreground">
                        <p className="font-medium">{(item.payload as { date: string }).date}</p>
                        <p>
                          {moodInfo?.emoji} {moodInfo?.label}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#moodGradient)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No entries yet. Log a few days to see your trends.
          </p>
        )}
      </div>
    </div>
  );
}
