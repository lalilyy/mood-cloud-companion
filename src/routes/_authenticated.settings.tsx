import { createFileRoute } from "@tanstack/react-router";
import { Palette, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMoodIcons, EMOJI_PRESETS } from "@/hooks/use-mood-icons";
import type { MoodValue } from "@/lib/mood-data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LilyMood" },
      { name: "description", content: "Customize your mood icons in LilyMood." },
      { property: "og:title", content: "Settings — LilyMood" },
      { property: "og:description", content: "Customize your mood icons in LilyMood." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { moods, setEmoji, reset } = useMoodIcons();

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Make LilyMood feel like yours.</p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Mood icons</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} className="rounded-full text-muted-foreground">
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        <div className="space-y-5">
          {moods.map((mood) => (
            <div key={mood.value}>
              <p className="mb-2 text-sm font-medium text-foreground">
                {mood.emoji} {mood.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {EMOJI_PRESETS[mood.value as MoodValue].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setEmoji(mood.value as MoodValue, emoji)}
                    aria-pressed={mood.emoji === emoji}
                    aria-label={`Use ${emoji} for ${mood.label}`}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl border text-2xl transition-all",
                      "hover:scale-105 active:scale-95",
                      mood.emoji === emoji
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-background",
                    )}
                  >
                    <span aria-hidden="true">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
