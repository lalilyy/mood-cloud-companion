export const MOODS = [
  { value: 1, label: "Rough", emoji: "😔", color: "oklch(0.65 0.18 260)" },
  { value: 2, label: "Low", emoji: "😕", color: "oklch(0.72 0.14 240)" },
  { value: 3, label: "Okay", emoji: "😐", color: "oklch(0.78 0.12 80)" },
  { value: 4, label: "Good", emoji: "🙂", color: "oklch(0.8 0.14 45)" },
  { value: 5, label: "Great", emoji: "😊", color: "oklch(0.75 0.18 15)" },
] as const;

export const WEATHER_TYPES = [
  { value: "sunny", label: "Sunny", emoji: "☀️" },
  { value: "cloudy", label: "Cloudy", emoji: "☁️" },
  { value: "rainy", label: "Rainy", emoji: "🌧️" },
  { value: "stormy", label: "Stormy", emoji: "⛈️" },
  { value: "snowy", label: "Snowy", emoji: "🌨️" },
  { value: "foggy", label: "Foggy", emoji: "🌫️" },
  { value: "windy", label: "Windy", emoji: "🌬️" },
  { value: "partly-cloudy", label: "Partly cloudy", emoji: "⛅" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];
export type WeatherValue = (typeof WEATHER_TYPES)[number]["value"];

export function getMoodByValue(value: number) {
  return MOODS.find((m) => m.value === value) ?? MOODS[2];
}

export function getWeatherByValue(value: string) {
  return WEATHER_TYPES.find((w) => w.value === value) ?? WEATHER_TYPES[1];
}
