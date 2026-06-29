import { useEffect, useState, useCallback } from "react";

export type Task = {
  id: string;
  title: string;
  emoji?: string;
  // ISO date (YYYY-MM-DD) -> done?
  history: Record<string, boolean>;
  // Optional: which weekdays (0=Sun..6=Sat) this task is scheduled. Empty = every day.
  days: number[];
  createdAt: string;
};

const STORAGE_KEY = "punch-tracker-v1";

export const MOTIVATIONAL = [
  "Yesterday's slip is today's spark. Move.",
  "Discipline is choosing what you want most over what you want now.",
  "Small steps every day beat giant leaps once a month.",
  "You missed it. So what. Win the next rep.",
  "The only bad workout is the one you skipped. Don't skip twice.",
  "Consistency compounds. Show up.",
  "Future you is watching. Make them proud.",
  "Lazy is a story. Write a better one today.",
  "Momentum is built one tiny win at a time.",
  "Don't break the chain — start a new one right now.",
];

export function todayISO() {
  const d = new Date();
  return toISO(d);
}
export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function fromISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Default weekday routine (Mon-Fri). Seeded once on first launch.
const SEED_FLAG = "punch-tracker-seeded-v1";
const WEEKDAYS = [1, 2, 3, 4, 5];
export const DEFAULT_WEEKDAY_TASKS: { title: string; emoji: string }[] = [
  { title: "Gym 5:30 – 7:00", emoji: "🏋️" },
  { title: "Post-gym meal", emoji: "🥚" },
  { title: "Office attire", emoji: "👔" },
  { title: "Office daily tasks", emoji: "💼" },
  { title: "Brunch snack", emoji: "🥪" },
  { title: "Update & think about passive income", emoji: "💡" },
  { title: "2L water", emoji: "💧" },
  { title: "Learn new things / Theory", emoji: "📘" },
  { title: "Pre-eve snack", emoji: "🍎" },
  { title: "Marketing course 1hr", emoji: "📈" },
  { title: "3L water", emoji: "🚰" },
  { title: "Evening walk", emoji: "🚶" },
  { title: "Evening healthy oats", emoji: "🥣" },
  { title: "Happy times for heart", emoji: "❤️" },
  { title: "Podcast / book", emoji: "🎧" },
  { title: "Dinner & light workout", emoji: "🍽️" },
  { title: "Building Brandbuilder agency", emoji: "🚀" },
  { title: "Ideas on passive income", emoji: "🧠" },
  { title: "Movie / episode / game 1hr (optional)", emoji: "🎬" },
];

function maybeSeed(): Task[] {
  if (typeof window === "undefined") return [];
  const existing = loadTasks();
  if (localStorage.getItem(SEED_FLAG)) return existing;
  if (existing.length > 0) {
    localStorage.setItem(SEED_FLAG, "1");
    return existing;
  }
  const now = new Date().toISOString();
  const seeded: Task[] = DEFAULT_WEEKDAY_TASKS.map((t) => ({
    id: crypto.randomUUID(),
    title: t.title,
    emoji: t.emoji,
    history: {},
    days: WEEKDAYS,
    createdAt: now,
  }));
  saveTasks(seeded);
  localStorage.setItem(SEED_FLAG, "1");
  return seeded;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTasks(maybeSeed());
    setLoaded(true);
  }, []);


  const persist = useCallback((next: Task[]) => {
    setTasks(next);
    saveTasks(next);
  }, []);

  const addTask = useCallback(
    (title: string, emoji: string, days: number[]) => {
      const t: Task = {
        id: crypto.randomUUID(),
        title: title.trim(),
        emoji: emoji || "✨",
        history: {},
        days,
        createdAt: new Date().toISOString(),
      };
      persist([...loadTasks(), t]);
    },
    [persist],
  );

  const toggle = useCallback(
    (id: string, dateISO: string) => {
      const next = loadTasks().map((t) =>
        t.id === id
          ? { ...t, history: { ...t.history, [dateISO]: !t.history[dateISO] } }
          : t,
      );
      persist(next);
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(loadTasks().filter((t) => t.id !== id));
    },
    [persist],
  );

  return { tasks, loaded, addTask, toggle, remove };
}

export function isScheduled(task: Task, date: Date) {
  if (!task.days || task.days.length === 0) return true;
  return task.days.includes(date.getDay());
}

export function tasksForDate(tasks: Task[], date: Date) {
  // Only include tasks created on or before this date
  const iso = toISO(date);
  return tasks.filter((t) => {
    const created = t.createdAt.slice(0, 10);
    return created <= iso && isScheduled(t, date);
  });
}

// Tasks that were due yesterday and not done
export function missedYesterday(tasks: Task[]) {
  const y = addDays(new Date(), -1);
  const iso = toISO(y);
  return tasksForDate(tasks, y).filter((t) => !t.history[iso]);
}

export function getMotivation(seed = 0) {
  const i = (new Date().getDate() + seed) % MOTIVATIONAL.length;
  return MOTIVATIONAL[i];
}

export function computeStats(tasks: Task[], days: number) {
  const today = new Date();
  let scheduled = 0;
  let done = 0;
  const perDay: { date: string; done: number; scheduled: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    const dayTasks = tasksForDate(tasks, d);
    const dayDone = dayTasks.filter((t) => t.history[iso]).length;
    scheduled += dayTasks.length;
    done += dayDone;
    perDay.push({ date: iso, done: dayDone, scheduled: dayTasks.length });
  }
  // streak: consecutive days (ending today or yesterday) with 100% completion
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    const dayTasks = tasksForDate(tasks, d);
    if (dayTasks.length === 0) {
      if (i === 0) continue;
      break;
    }
    const allDone = dayTasks.every((t) => t.history[iso]);
    if (allDone) streak++;
    else if (i === 0) {
      // today not fully done yet — don't break
      continue;
    } else break;
  }
  const pct = scheduled === 0 ? 0 : Math.round((done / scheduled) * 100);
  return { scheduled, done, pct, perDay, streak };
}
