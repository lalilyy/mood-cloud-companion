import { useCallback, useEffect, useState } from "react";
import { MOODS } from "@/lib/mood-data";
import type { MoodValue } from "@/lib/mood-data";

const STORAGE_KEY = "lilymood.mood-emojis";
const EVENT = "lilymood:mood-emojis-changed";

/** Emoji presets users can pick from for each mood level. */
export const EMOJI_PRESETS: Record<MoodValue, string[]> = {
  1: ["😔", "😢", "😞", "😩", "🥀", "🌧️", "💔", "😖"],
  2: ["😕", "😟", "🙁", "😬", "☁️", "🥱", "😪", "🫤"],
  3: ["😐", "😶", "🙂", "😌", "⛅", "🌼", "😑", "🫥"],
  4: ["🙂", "😊", "😄", "🌸", "🌷", "☺️", "😺", "💗"],
  5: ["😊", "😁", "🥰", "🤩", "🌞", "🌈", "💖", "🦋"],
};

export type MoodEmojiMap = Partial<Record<MoodValue, string>>;

function read(): MoodEmojiMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MoodEmojiMap) : {};
  } catch {
    return {};
  }
}

/** Moods with any user-customized emoji applied. */
export function useMoodIcons() {
  const [overrides, setOverrides] = useState<MoodEmojiMap>({});

  useEffect(() => {
    setOverrides(read());
    const sync = () => setOverrides(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setEmoji = useCallback((value: MoodValue, emoji: string) => {
    const next = { ...read(), [value]: emoji };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const moods = MOODS.map((m) => ({ ...m, emoji: overrides[m.value] ?? m.emoji }));

  return { moods, setEmoji, reset };
}
