// Shared server-side helpers for Daily Punch MCP tools.

/** Validate a YYYY-MM-DD calendar date (rejects rollovers like 2026-02-31). */
export function validISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Default date for tool calls: today in UTC. Callers should pass the user's local date when known. */
export function defaultDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Clamp/validate a weekday array: 0 = Sunday .. 6 = Saturday. Empty means every day. */
export function validWeekdays(days: number[]): boolean {
  return days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
}

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  emoji: string | null;
  history: Record<string, boolean> | null;
  days: number[] | null;
  created_at: string;
};

export type FoodRow = {
  id: string;
  user_id: string;
  date_iso: string;
  name: string;
  emoji: string | null;
  grams: number;
  unit: string;
  macros: { calories?: number; protein?: number; carbs?: number; fiber?: number; sugar?: number } | null;
  created_at: string;
};

export type ActivityRow = {
  id: string;
  user_id: string;
  date_iso: string;
  activity_name: string;
  emoji: string | null;
  minutes: number;
  calories_burned: number;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  name: string | null;
  age: number;
  gender: string | null;
  height_cm: number;
  current_kg: number;
  target_kg: number;
  goal_type: string | null;
  activity_level: number;
};

/** Mirrors computeTargets in the app (Mifflin-St Jeor, gender aware). */
export function computeTargets(p: ProfileRow) {
  const gender = p.gender === "female" ? "female" : "male";
  const genderConst = gender === "female" ? -161 : 5;
  const bmr = 10 * p.current_kg + 6.25 * p.height_cm - 5 * p.age + genderConst;
  const tdee = bmr * (p.activity_level || 1.55);
  const adjust = p.goal_type === "lose" ? -400 : 400; // default goal is gain
  const calories = Math.round(tdee + adjust);
  const proteinPerKg = p.goal_type === "lose" ? 2.0 : 1.8;
  const protein = Math.round(p.target_kg * proteinPerKg);
  return {
    calories,
    protein,
    carbs: Math.round((calories * 0.5) / 4),
    fiber: 30,
    sugar: 50,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}

const MET_GUESSES: [RegExp, number][] = [
  [/walk/i, 3.8],
  [/run|jog|sprint|hiit/i, 9.8],
  [/cycl|bike/i, 6.8],
  [/swim/i, 6.0],
  [/yoga|pilates|stretch|meditat/i, 2.8],
  [/gym|lift|weight|strength|curl|press|squat|plank|deadlift|lunge/i, 5.0],
  [/football|soccer|cricket|basket|badminton|tennis|boxing|martial/i, 6.5],
];

/** Rough MET estimate for a free-text activity name (Compendium-based). */
export function guessMET(name: string): number {
  for (const [re, met] of MET_GUESSES) if (re.test(name)) return met;
  return 5.0;
}
