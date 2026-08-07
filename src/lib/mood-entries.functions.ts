import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { startOfWeek, endOfWeek, format, subDays, isSameDay } from "date-fns";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const moodEntrySchema = z.object({
  id: z.string().uuid().optional(),
  date: dateSchema,
  mood: z.number().int().min(1).max(5),
  weather: z.string().min(1),
  note: z.string().max(1000).optional(),
});

const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

const singleDateSchema = z.object({
  date: dateSchema,
});

const idSchema = z.object({
  id: z.string().uuid(),
});

export const getCurrentUser = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return { userId: context.userId };
  });

export const getEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => dateRangeSchema.parse(data))
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("mood_entries")
      .select("id, entry_date, mood, weather, note, created_at, updated_at")
      .order("entry_date", { ascending: false });

    if (data.startDate) {
      query = query.gte("entry_date", data.startDate);
    }
    if (data.endDate) {
      query = query.lte("entry_date", data.endDate);
    }

    const { data: entries, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return { entries: entries ?? [] };
  });

export const getEntryByDate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => singleDateSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { data: entry, error } = await context.supabase
      .from("mood_entries")
      .select("id, entry_date, mood, weather, note, created_at, updated_at")
      .eq("entry_date", data.date)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return { entry };
  });

export const createEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => moodEntrySchema.parse(data))
  .handler(async ({ context, data }) => {
    const { data: entry, error } = await context.supabase
      .from("mood_entries")
      .insert({
        user_id: context.userId,
        entry_date: data.date,
        mood: data.mood,
        weather: data.weather,
        note: data.note ?? null,
      })
      .select("id, entry_date, mood, weather, note, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { entry };
  });

export const updateEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => moodEntrySchema.required({ id: true }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: entry, error } = await context.supabase
      .from("mood_entries")
      .update({
        mood: data.mood,
        weather: data.weather,
        note: data.note ?? null,
      })
      .eq("id", data.id!)
      .eq("user_id", context.userId)
      .select("id, entry_date, mood, weather, note, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { entry };
  });

export const deleteEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => idSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("mood_entries")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });

export const getInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: entries, error } = await context.supabase
      .from("mood_entries")
      .select("entry_date, mood, weather, note")
      .order("entry_date", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const list = (entries ?? []) as Array<{
      entry_date: string;
      mood: number;
      weather: string;
      note: string | null;
    }>;

    const total = list.length;
    if (total === 0) {
      return {
        total: 0,
        averageMood: 0,
        moodCounts: {},
        weatherCounts: {},
        weatherMood: {},
        streak: 0,
        thisWeek: { average: 0, entries: 0 },
        lastWeek: { average: 0, entries: 0 },
        recentTrend: [],
      };
    }

    const averageMood =
      list.reduce((sum, e) => sum + e.mood, 0) / total;

    const moodCounts: Record<number, number> = {};
    const weatherCounts: Record<string, number> = {};
    const weatherMoodSums: Record<string, { sum: number; count: number }> = {};

    for (const entry of list) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      weatherCounts[entry.weather] = (weatherCounts[entry.weather] || 0) + 1;
      let weatherSummary = weatherMoodSums[entry.weather];
      if (!weatherSummary) {
        weatherSummary = { sum: 0, count: 0 };
        weatherMoodSums[entry.weather] = weatherSummary;
      }
      weatherSummary.sum += entry.mood;
      weatherSummary.count += 1;
    }

    const weatherMood: Record<string, number> = {};
    for (const [weather, { sum, count }] of Object.entries(weatherMoodSums)) {
      weatherMood[weather] = sum / count;
    }

    // Current streak: consecutive days with entries ending today
    let streak = 0;
    const today = format(new Date(), "yyyy-MM-dd");
    for (let i = 0; i < 365; i++) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const hasEntry = list.some((e) => e.entry_date === d);
      if (hasEntry) {
        streak += 1;
      } else if (d !== today) {
        break;
      }
    }

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekEnd, 7);

    const thisWeekEntries = list.filter(
      (e) =>
        new Date(e.entry_date) >= thisWeekStart &&
        new Date(e.entry_date) <= thisWeekEnd,
    );
    const lastWeekEntries = list.filter(
      (e) =>
        new Date(e.entry_date) >= lastWeekStart &&
        new Date(e.entry_date) <= lastWeekEnd,
    );

    const thisWeekAverage =
      thisWeekEntries.length > 0
        ? thisWeekEntries.reduce((sum, e) => sum + e.mood, 0) /
          thisWeekEntries.length
        : 0;
    const lastWeekAverage =
      lastWeekEntries.length > 0
        ? lastWeekEntries.reduce((sum, e) => sum + e.mood, 0) /
          lastWeekEntries.length
        : 0;

    const recentTrend = list.slice(-14).map((e) => ({
      date: e.entry_date,
      mood: e.mood,
    }));

    return {
      total,
      averageMood,
      moodCounts,
      weatherCounts,
      weatherMood,
      streak,
      thisWeek: { average: thisWeekAverage, entries: thisWeekEntries.length },
      lastWeek: { average: lastWeekAverage, entries: lastWeekEntries.length },
      recentTrend,
    };
  });
