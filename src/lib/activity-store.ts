import { useEffect, useState, useCallback } from "react";
import { todayISO, toISO, addDays } from "./tracker-store";
import { supabase } from "@/integrations/supabase/client";
export { computeCaloriesBurned } from "./activity-calculations";

export type ActivityDetails =
  | { kind: "strength"; weightKg: number; repsPerSet: number; sets: number }
  | { kind: "custom-walk"; speedKmh: number; distanceKm: number; inclineDegrees: number };

export type Activity = {
  name: string;
  emoji: string;
  met: number; // metabolic equivalent
  category: "cardio" | "gym" | "sports" | "daily" | "yoga";
};

// MET values sourced from the Compendium of Physical Activities (Ainsworth et al.)
export const ACTIVITY_DB: Activity[] = [
  // Cardio / walking / running
  { name: "Walking (casual, 3 km/h)", emoji: "🚶", met: 2.8, category: "cardio" },
  { name: "Walking (brisk, 5 km/h)", emoji: "🚶", met: 3.8, category: "cardio" },
  { name: "Walking (fast, 6.5 km/h)", emoji: "🚶‍♂️", met: 5.0, category: "cardio" },
  { name: "Custom walk", emoji: "🚶", met: 3.8, category: "cardio" },
  { name: "Hiking", emoji: "🥾", met: 6.0, category: "cardio" },
  { name: "Jogging (8 km/h)", emoji: "🏃", met: 7.0, category: "cardio" },
  { name: "Running (10 km/h)", emoji: "🏃‍♂️", met: 9.8, category: "cardio" },
  { name: "Running (12 km/h)", emoji: "🏃‍♂️", met: 11.5, category: "cardio" },
  { name: "Running (16 km/h)", emoji: "🏃‍♂️", met: 14.5, category: "cardio" },
  { name: "Treadmill (moderate)", emoji: "🏃", met: 8.3, category: "cardio" },
  { name: "Sprints / HIIT", emoji: "⚡", met: 12.0, category: "cardio" },
  { name: "Cycling (leisure)", emoji: "🚴", met: 4.0, category: "cardio" },
  { name: "Cycling (moderate)", emoji: "🚴", met: 6.8, category: "cardio" },
  { name: "Cycling (vigorous)", emoji: "🚴‍♂️", met: 10.0, category: "cardio" },
  { name: "Stationary bike", emoji: "🚲", met: 6.8, category: "cardio" },
  { name: "Rowing machine", emoji: "🚣", met: 7.0, category: "cardio" },
  { name: "Elliptical trainer", emoji: "🏋️", met: 5.0, category: "cardio" },
  { name: "Stair climber", emoji: "🪜", met: 9.0, category: "cardio" },
  { name: "Jump rope", emoji: "🪢", met: 12.3, category: "cardio" },
  { name: "Swimming (moderate)", emoji: "🏊", met: 6.0, category: "cardio" },
  { name: "Swimming (vigorous)", emoji: "🏊‍♂️", met: 9.8, category: "cardio" },
  { name: "Dancing", emoji: "💃", met: 5.0, category: "cardio" },
  { name: "Zumba", emoji: "💃", met: 6.5, category: "cardio" },
  { name: "Aerobics", emoji: "🤸", met: 7.3, category: "cardio" },

  // Gym / strength / bodyweight
  { name: "Weight lifting (general)", emoji: "🏋️", met: 3.5, category: "gym" },
  { name: "Weight lifting (vigorous)", emoji: "🏋️‍♂️", met: 6.0, category: "gym" },
  { name: "Circuit training", emoji: "🔁", met: 8.0, category: "gym" },
  { name: "CrossFit", emoji: "💥", met: 9.0, category: "gym" },
  { name: "Bicep curls", emoji: "💪", met: 3.5, category: "gym" },
  { name: "Tricep extensions", emoji: "💪", met: 3.5, category: "gym" },
  { name: "Shoulder press", emoji: "🏋️", met: 5.0, category: "gym" },
  { name: "Lat pulldown", emoji: "🏋️", met: 4.5, category: "gym" },
  { name: "Bench press", emoji: "🏋️‍♂️", met: 5.0, category: "gym" },
  { name: "Chest fly", emoji: "🏋️", met: 4.0, category: "gym" },
  { name: "Deadlift", emoji: "🏋️‍♂️", met: 6.0, category: "gym" },
  { name: "Squats (barbell)", emoji: "🏋️", met: 5.0, category: "gym" },
  { name: "Squats (bodyweight)", emoji: "🦵", met: 5.0, category: "gym" },
  { name: "Lunges", emoji: "🦵", met: 4.0, category: "gym" },
  { name: "Leg press", emoji: "🦵", met: 5.0, category: "gym" },
  { name: "Leg extension", emoji: "🦵", met: 4.0, category: "gym" },
  { name: "Leg curl", emoji: "🦵", met: 4.0, category: "gym" },
  { name: "Calf raises", emoji: "🦶", met: 3.5, category: "gym" },
  { name: "Push-ups", emoji: "🤸‍♂️", met: 8.0, category: "gym" },
  { name: "Pull-ups", emoji: "🤸", met: 8.0, category: "gym" },
  { name: "Chin-ups", emoji: "🤸", met: 8.0, category: "gym" },
  { name: "Dips", emoji: "🤸", met: 8.0, category: "gym" },
  { name: "Plank", emoji: "🧍", met: 3.8, category: "gym" },
  { name: "Side plank", emoji: "🧍‍♂️", met: 3.8, category: "gym" },
  { name: "Sit-ups / crunches", emoji: "🔥", met: 4.5, category: "gym" },
  { name: "Russian twists", emoji: "🌀", met: 4.0, category: "gym" },
  { name: "Mountain climbers", emoji: "⛰️", met: 8.0, category: "gym" },
  { name: "Burpees", emoji: "💥", met: 10.0, category: "gym" },
  { name: "Jumping jacks", emoji: "🤾", met: 8.0, category: "gym" },
  { name: "Kettlebell swings", emoji: "🏋️", met: 9.8, category: "gym" },
  { name: "Battle ropes", emoji: "🪢", met: 10.3, category: "gym" },
  { name: "Box jumps", emoji: "📦", met: 8.0, category: "gym" },
  { name: "Farmer's walk", emoji: "🚶‍♂️", met: 6.5, category: "gym" },

  // Yoga / stretch / mobility
  { name: "Yoga (hatha)", emoji: "🧘", met: 2.5, category: "yoga" },
  { name: "Yoga (power / vinyasa)", emoji: "🧘‍♀️", met: 4.0, category: "yoga" },
  { name: "Pilates", emoji: "🤸‍♀️", met: 3.0, category: "yoga" },
  { name: "Stretching", emoji: "🙆", met: 2.3, category: "yoga" },
  { name: "Meditation", emoji: "🧘‍♂️", met: 1.3, category: "yoga" },
  { name: "Foam rolling", emoji: "🎯", met: 2.0, category: "yoga" },

  // Sports
  { name: "Cricket", emoji: "🏏", met: 4.8, category: "sports" },
  { name: "Football / soccer", emoji: "⚽", met: 7.0, category: "sports" },
  { name: "Basketball", emoji: "🏀", met: 6.5, category: "sports" },
  { name: "Badminton", emoji: "🏸", met: 5.5, category: "sports" },
  { name: "Tennis", emoji: "🎾", met: 7.3, category: "sports" },
  { name: "Table tennis", emoji: "🏓", met: 4.0, category: "sports" },
  { name: "Volleyball", emoji: "🏐", met: 4.0, category: "sports" },
  { name: "Boxing (sparring)", emoji: "🥊", met: 9.0, category: "sports" },
  { name: "Boxing (bag)", emoji: "🥊", met: 5.5, category: "sports" },
  { name: "Martial arts", emoji: "🥋", met: 10.3, category: "sports" },
  { name: "Rock climbing", emoji: "🧗", met: 8.0, category: "sports" },
  { name: "Skating", emoji: "⛸️", met: 7.0, category: "sports" },
  { name: "Skateboarding", emoji: "🛹", met: 5.0, category: "sports" },
  { name: "Golf (walking)", emoji: "⛳", met: 4.8, category: "sports" },

  // Daily / lifestyle
  { name: "Household chores", emoji: "🧹", met: 3.3, category: "daily" },
  { name: "Cooking", emoji: "🍳", met: 2.5, category: "daily" },
  { name: "Gardening", emoji: "🌱", met: 3.8, category: "daily" },
  { name: "Cleaning (heavy)", emoji: "🧽", met: 3.5, category: "daily" },
  { name: "Grocery shopping", emoji: "🛒", met: 2.3, category: "daily" },
  { name: "Climbing stairs", emoji: "🪜", met: 8.8, category: "daily" },
  { name: "Playing with kids", emoji: "🧒", met: 4.0, category: "daily" },
  { name: "Standing desk work", emoji: "💼", met: 1.8, category: "daily" },
];

export type ActivityEntry = {
  id: string;
  dateISO: string;
  activityName: string;
  emoji: string;
  minutes: number;
  caloriesBurned: number;
  details?: ActivityDetails;
  createdAt: string;
};

const LS_ENTRIES = "punch.activity.entries.v1";

function loadEntries(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(LS_ENTRIES);
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}
function saveEntries(e: ActivityEntry[]) {
  localStorage.setItem(LS_ENTRIES, JSON.stringify(e));
}

type ActivityRow = {
  id: string;
  user_id: string;
  date_iso: string;
  activity_name: string;
  emoji: string | null;
  minutes: number;
  calories_burned: number;
  details?: ActivityDetails | null;
  created_at: string;
};

function rowToEntry(r: ActivityRow): ActivityEntry {
  return {
    id: r.id,
    dateISO: r.date_iso,
    activityName: r.activity_name,
    emoji: r.emoji ?? "🏃",
    minutes: Number(r.minutes),
    caloriesBurned: Number(r.calories_burned),
    details: r.details ?? undefined,
    createdAt: r.created_at,
  };
}

// One-time per account: copy this device's existing activity logs into the cloud.
const activityMigratePromises = new Map<string, Promise<void>>();
function ensureActivityMigrated(userId: string): Promise<void> {
  let p = activityMigratePromises.get(userId);
  if (!p) {
    p = (async () => {
      const { count } = await supabase
        .from("activity_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count ?? 0) > 0) return;
      const local = loadEntries();
      if (local.length === 0) return;
      await supabase.from("activity_entries").insert(
        local.map((e) => ({
          id: e.id,
          user_id: userId,
          date_iso: e.dateISO,
          activity_name: e.activityName,
          emoji: e.emoji,
          minutes: e.minutes,
          calories_burned: e.caloriesBurned,
          details: e.details ?? {},
          created_at: e.createdAt,
        })),
      );
    })();
    activityMigratePromises.set(userId, p);
  }
  return p;
}

export function useActivityEntries() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setLoaded(true);
        return;
      }
      await ensureActivityMigrated(user.id);
      const { data } = await supabase
        .from("activity_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      if (!active) return;
      setEntries(((data ?? []) as ActivityRow[]).map(rowToEntry));
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const add = useCallback((entry: Omit<ActivityEntry, "id" | "createdAt">) => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const e: ActivityEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => [...prev, e]);
      await supabase.from("activity_entries").insert({
        id: e.id,
        user_id: user.id,
        date_iso: e.dateISO,
        activity_name: e.activityName,
        emoji: e.emoji,
        minutes: e.minutes,
        calories_burned: e.caloriesBurned,
        details: e.details ?? {},
        created_at: e.createdAt,
      });
    })();
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    void (async () => {
      const { error } = await supabase.from("activity_entries").delete().eq("id", id);
      if (error) console.error("Failed to delete activity entry:", error.message);
    })();
  }, []);

  return { entries, loaded, add, remove };
}

export function activityEntriesForDate(entries: ActivityEntry[], dateISO: string) {
  return entries.filter((e) => e.dateISO === dateISO);
}

export function dailyBurn(entries: ActivityEntry[], dateISO: string) {
  return activityEntriesForDate(entries, dateISO).reduce(
    (a, e) => ({ minutes: a.minutes + e.minutes, calories: a.calories + e.caloriesBurned }),
    { minutes: 0, calories: 0 },
  );
}

export function activityStats(entries: ActivityEntry[], days: number) {
  const today = new Date();
  const perDay: { date: string; minutes: number; calories: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    perDay.push({ date: iso, ...dailyBurn(entries, iso) });
  }
  const total = perDay.reduce(
    (a, p) => ({ minutes: a.minutes + p.minutes, calories: a.calories + p.calories }),
    { minutes: 0, calories: 0 },
  );
  return {
    perDay,
    total,
    avg: {
      minutes: Math.round(total.minutes / days),
      calories: Math.round(total.calories / days),
    },
  };
}

export { todayISO };
