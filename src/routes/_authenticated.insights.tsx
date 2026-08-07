import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getInsights } from "@/lib/mood-entries.functions";
import { MOODS, WEATHER_TYPES } from "@/lib/mood-data";
import { Lightbulb, TrendingUp, Calendar, Cloud } from "lucide-react";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Insights — LilyMood" },
      { name: "description", content: "Discover patterns between your mood and the weather." },
      { property: "og:title", content: "Insights — LilyMood" },
      { property: "og:description", content: "Discover patterns between your mood and the weather." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const getInsightsFn = useServerFn(getInsights);

  const { data: insights } = useQuery({
    queryKey: ["mood-insights"],
    queryFn: () => getInsightsFn(),
  });

  const topMood = insights
    ? Object.entries(insights.moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;
  const topWeather = insights
    ? Object.entries(insights.weatherCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  const moodInfo = topMood ? MOODS.find((m) => m.value === Number(topMood)) : null;
  const weatherInfo = topWeather ? WEATHER_TYPES.find((w) => w.value === topWeather) : null;

  const weatherMoodEntries = insights?.weatherMood
    ? Object.entries(insights.weatherMood).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Insights</h1>
        </div>
        <p className="text-sm text-muted-foreground">Patterns in your mood and weather.</p>
      </header>

      {!insights || insights.total === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Log a few more entries to unlock insights.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Average mood
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                {insights.averageMood.toFixed(1)}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Current streak
              </div>
              <p className="font-display text-2xl font-bold text-foreground">
                {insights.streak} days
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Cloud className="h-4 w-4 text-primary" />
              Weather vs. mood
            </div>
            <div className="space-y-2">
              {weatherMoodEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not enough weather data yet.</p>
              ) : (
                weatherMoodEntries.map(([weather, avg]) => {
                  const weatherInfo = WEATHER_TYPES.find((w) => w.value === weather);
                  return (
                    <div
                      key={weather}
                      className="flex items-center justify-between rounded-2xl bg-background p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{weatherInfo?.emoji}</span>
                        <span className="text-sm font-medium text-foreground">
                          {weatherInfo?.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        avg mood {avg.toFixed(1)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Most common mood</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {moodInfo ? `${moodInfo.emoji} ${moodInfo.label}` : "—"}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Most common weather</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {weatherInfo ? `${weatherInfo.emoji} ${weatherInfo.label}` : "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
