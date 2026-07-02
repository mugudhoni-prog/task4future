import { useEffect, useState, useCallback } from "react";
import { todayISO, toISO, addDays } from "./tracker-store";

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

// Calories burned = MET × weight(kg) × time(hours) × gender factor
// Females have ~10% lower burn at equal weight/MET due to body-composition differences.
export function computeCaloriesBurned(
  met: number,
  minutes: number,
  weightKg: number,
  gender: "male" | "female" = "male",
) {
  const factor = gender === "female" ? 0.9 : 1;
  return +(met * weightKg * (minutes / 60) * factor).toFixed(0);
}


export function useActivityEntries() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setEntries(loadEntries());
    setLoaded(true);
  }, []);

  const add = useCallback((entry: Omit<ActivityEntry, "id" | "createdAt">) => {
    const e: ActivityEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const next = [...loadEntries(), e];
    saveEntries(next);
    setEntries(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = loadEntries().filter((e) => e.id !== id);
    saveEntries(next);
    setEntries(next);
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
