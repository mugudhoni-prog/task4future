import { useEffect, useState, useCallback } from "react";
import { todayISO, toISO, fromISO, addDays } from "./tracker-store";

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugar: number;
};

export type Food = {
  name: string;
  emoji: string;
  // per 100g (or per 100ml for liquids)
  per100: Macros;
  // default serving in grams
  serving: number;
  unit?: "g" | "ml";
};

// Common foods — values are approximate per 100 g/ml
export const FOOD_DB: Food[] = [
  { name: "Boiled egg", emoji: "🥚", per100: { calories: 155, protein: 13, carbs: 1.1, fiber: 0, sugar: 1.1 }, serving: 50 },
  { name: "Chicken breast (cooked)", emoji: "🍗", per100: { calories: 165, protein: 31, carbs: 0, fiber: 0, sugar: 0 }, serving: 150 },
  { name: "White rice (cooked)", emoji: "🍚", per100: { calories: 130, protein: 2.7, carbs: 28, fiber: 0.4, sugar: 0.1 }, serving: 150 },
  { name: "Brown rice (cooked)", emoji: "🍙", per100: { calories: 123, protein: 2.7, carbs: 26, fiber: 1.8, sugar: 0.4 }, serving: 150 },
  { name: "Oats (dry)", emoji: "🥣", per100: { calories: 389, protein: 17, carbs: 66, fiber: 11, sugar: 1 }, serving: 50 },
  { name: "Milk (whole)", emoji: "🥛", per100: { calories: 61, protein: 3.2, carbs: 4.8, fiber: 0, sugar: 5.1 }, serving: 200, unit: "ml" },
  { name: "Greek yogurt", emoji: "🍶", per100: { calories: 59, protein: 10, carbs: 3.6, fiber: 0, sugar: 3.2 }, serving: 150 },
  { name: "Paneer", emoji: "🧀", per100: { calories: 296, protein: 25, carbs: 3.6, fiber: 0, sugar: 2.6 }, serving: 100 },
  { name: "Banana", emoji: "🍌", per100: { calories: 89, protein: 1.1, carbs: 23, fiber: 2.6, sugar: 12 }, serving: 120 },
  { name: "Apple", emoji: "🍎", per100: { calories: 52, protein: 0.3, carbs: 14, fiber: 2.4, sugar: 10 }, serving: 180 },
  { name: "Almonds", emoji: "🌰", per100: { calories: 579, protein: 21, carbs: 22, fiber: 12, sugar: 4.4 }, serving: 28 },
  { name: "Peanut butter", emoji: "🥜", per100: { calories: 588, protein: 25, carbs: 20, fiber: 6, sugar: 9 }, serving: 16 },
  { name: "Roti / chapati", emoji: "🫓", per100: { calories: 297, protein: 8, carbs: 56, fiber: 4, sugar: 1 }, serving: 40 },
  { name: "Idli", emoji: "🍘", per100: { calories: 130, protein: 4, carbs: 27, fiber: 1, sugar: 0.5 }, serving: 60 },
  { name: "Dosa", emoji: "🥞", per100: { calories: 168, protein: 4, carbs: 30, fiber: 1, sugar: 1 }, serving: 80 },
  { name: "Dal (cooked)", emoji: "🍲", per100: { calories: 116, protein: 9, carbs: 20, fiber: 8, sugar: 1.8 }, serving: 200 },
  { name: "Mixed vegetables (cooked)", emoji: "🥦", per100: { calories: 65, protein: 3, carbs: 11, fiber: 4, sugar: 4 }, serving: 150 },
  { name: "Salad (mixed)", emoji: "🥗", per100: { calories: 30, protein: 1.5, carbs: 5, fiber: 2, sugar: 2.5 }, serving: 150 },
  { name: "Whey protein scoop", emoji: "💪", per100: { calories: 400, protein: 80, carbs: 8, fiber: 0, sugar: 4 }, serving: 30 },
  { name: "Bread slice (whole wheat)", emoji: "🍞", per100: { calories: 247, protein: 13, carbs: 41, fiber: 7, sugar: 6 }, serving: 30 },
  { name: "Coffee (black)", emoji: "☕", per100: { calories: 2, protein: 0.3, carbs: 0, fiber: 0, sugar: 0 }, serving: 200, unit: "ml" },
  { name: "Tea (with milk & sugar)", emoji: "🍵", per100: { calories: 40, protein: 1.5, carbs: 6, fiber: 0, sugar: 5 }, serving: 150, unit: "ml" },
  { name: "Dark chocolate", emoji: "🍫", per100: { calories: 546, protein: 4.9, carbs: 61, fiber: 7, sugar: 48 }, serving: 25 },
  { name: "Pizza slice", emoji: "🍕", per100: { calories: 266, protein: 11, carbs: 33, fiber: 2.3, sugar: 3.6 }, serving: 110 },
  { name: "Burger", emoji: "🍔", per100: { calories: 295, protein: 17, carbs: 24, fiber: 1, sugar: 5 }, serving: 200 },
];

export type FoodEntry = {
  id: string;
  dateISO: string;
  name: string;
  emoji: string;
  grams: number;
  unit: "g" | "ml";
  macros: Macros; // computed totals for this entry
  createdAt: string;
};

export type Goal = {
  name: string;
  age: number;
  heightCm: number;
  currentKg: number;
  targetKg: number;
  goalType: "gain" | "maintain" | "lose";
  activity: number; // 1.2 sedentary..1.725 very active
};

const FOOD_KEY = "punch-food-entries-v1";
const GOAL_KEY = "punch-goal-v1";

export const DEFAULT_GOAL: Goal = {
  name: "Mugundan",
  age: 23,
  heightCm: 175,
  currentKg: 65,
  targetKg: 72,
  goalType: "gain",
  activity: 1.55,
};

function loadEntries(): FoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FOOD_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveEntries(e: FoodEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOOD_KEY, JSON.stringify(e));
}
function loadGoal(): Goal {
  if (typeof window === "undefined") return DEFAULT_GOAL;
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    if (!raw) return DEFAULT_GOAL;
    return { ...DEFAULT_GOAL, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GOAL;
  }
}
function saveGoal(g: Goal) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GOAL_KEY, JSON.stringify(g));
}

export function computeMacros(food: Food, qty: number): Macros {
  const f = qty / 100;
  return {
    calories: +(food.per100.calories * f).toFixed(1),
    protein: +(food.per100.protein * f).toFixed(1),
    carbs: +(food.per100.carbs * f).toFixed(1),
    fiber: +(food.per100.fiber * f).toFixed(1),
    sugar: +(food.per100.sugar * f).toFixed(1),
  };
}

export function emptyMacros(): Macros {
  return { calories: 0, protein: 0, carbs: 0, fiber: 0, sugar: 0 };
}

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (a, b) => ({
      calories: +(a.calories + b.calories).toFixed(1),
      protein: +(a.protein + b.protein).toFixed(1),
      carbs: +(a.carbs + b.carbs).toFixed(1),
      fiber: +(a.fiber + b.fiber).toFixed(1),
      sugar: +(a.sugar + b.sugar).toFixed(1),
    }),
    emptyMacros(),
  );
}

// Mifflin-St Jeor BMR (assuming male)
export function computeTargets(g: Goal) {
  const bmr = 10 * g.currentKg + 6.25 * g.heightCm - 5 * g.age + 5;
  const tdee = bmr * g.activity;
  const adjust = g.goalType === "gain" ? 400 : g.goalType === "lose" ? -400 : 0;
  const calories = Math.round(tdee + adjust);
  // Protein 1.8 g per kg of target weight for gain, 2.0 for lose, 1.6 maintain
  const proteinPerKg = g.goalType === "gain" ? 1.8 : g.goalType === "lose" ? 2.0 : 1.6;
  const protein = Math.round(g.targetKg * proteinPerKg);
  // Carbs ~ 45-55% of calories, fiber ~ 30g, sugar limit ~ 50g
  const carbs = Math.round((calories * 0.5) / 4);
  const fiber = 30;
  const sugar = 50;
  return { calories, protein, carbs, fiber, sugar, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

export function useGoal() {
  const [goal, setGoal] = useState<Goal>(DEFAULT_GOAL);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setGoal(loadGoal());
    setLoaded(true);
  }, []);
  const update = useCallback((patch: Partial<Goal>) => {
    setGoal((prev) => {
      const next = { ...prev, ...patch };
      saveGoal(next);
      return next;
    });
  }, []);
  return { goal, loaded, update };
}

export function useFoodEntries() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setEntries(loadEntries());
    setLoaded(true);
  }, []);

  const add = useCallback((entry: Omit<FoodEntry, "id" | "createdAt">) => {
    const e: FoodEntry = {
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

export function entriesForDate(entries: FoodEntry[], dateISO: string) {
  return entries.filter((e) => e.dateISO === dateISO);
}

export function dailyTotals(entries: FoodEntry[], dateISO: string): Macros {
  return sumMacros(entriesForDate(entries, dateISO).map((e) => e.macros));
}

export function nutritionStats(entries: FoodEntry[], days: number) {
  const today = new Date();
  const perDay: { date: string; macros: Macros }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    perDay.push({ date: iso, macros: dailyTotals(entries, iso) });
  }
  const total = sumMacros(perDay.map((p) => p.macros));
  const avg: Macros = {
    calories: +(total.calories / days).toFixed(0),
    protein: +(total.protein / days).toFixed(1),
    carbs: +(total.carbs / days).toFixed(1),
    fiber: +(total.fiber / days).toFixed(1),
    sugar: +(total.sugar / days).toFixed(1),
  };
  return { perDay, total, avg };
}

export { todayISO, toISO, fromISO, addDays };
