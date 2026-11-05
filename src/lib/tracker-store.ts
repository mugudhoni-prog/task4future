import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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


// Default weekday routine (Mon-Fri), seeded into the user's cloud account on first sign-in.
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

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  emoji: string | null;
  history: Record<string, boolean>;
  days: number[];
  created_at: string;
};

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    title: r.title,
    emoji: r.emoji ?? "✨",
    history: r.history ?? {},
    days: r.days ?? [],
    createdAt: r.created_at,
  };
}

// One-time per account: copy this device's existing tasks into the cloud, or
// seed the default weekday routine for a brand-new account.
const seedPromises = new Map<string, Promise<void>>();
function ensureTasksForUser(userId: string): Promise<void> {
  let p = seedPromises.get(userId);
  if (!p) {
    p = (async () => {
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count ?? 0) > 0) return;
      const local = loadTasks();
      const seed: Task[] = local.length
        ? local
        : DEFAULT_WEEKDAY_TASKS.map((t) => ({
            id: crypto.randomUUID(),
            title: t.title,
            emoji: t.emoji,
            history: {},
            days: WEEKDAYS,
            createdAt: new Date().toISOString(),
          }));
      await supabase
        .from("tasks")
        .insert(
          seed.map((t) => ({
            id: t.id,
            user_id: userId,
            title: t.title,
            emoji: t.emoji,
            history: t.history,
            days: t.days,
            created_at: t.createdAt,
          })),
        );
    })();
    seedPromises.set(userId, p);
  }
  return p;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
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
      await ensureTasksForUser(user.id);
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");
      if (!active) return;
      setTasks(((data ?? []) as TaskRow[]).map(rowToTask));
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const addTask = useCallback((title: string, emoji: string, days: number[]) => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const t: Task = {
        id: crypto.randomUUID(),
        title: title.trim(),
        emoji: emoji || "✨",
        history: {},
        days,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, t]);
      await supabase.from("tasks").insert({
        id: t.id,
        user_id: user.id,
        title: t.title,
        emoji: t.emoji,
        history: {},
        days,
        created_at: t.createdAt,
      });
    })();
  }, []);

  const toggle = useCallback(
    (id: string, dateISO: string) => {
      const row = tasks.find((t) => t.id === id);
      if (!row) return;
      const history = { ...row.history, [dateISO]: !row.history[dateISO] };
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, history } : t)));
      void (async () => {
        const { error } = await supabase.from("tasks").update({ history }).eq("id", id);
        if (error) console.error("Failed to save task state:", error.message);
      })();
    },
    [tasks],
  );

  const remove = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    void (async () => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) console.error("Failed to delete task:", error.message);
    })();
  }, []);

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

// Tasks that were due yesterday and not done. Rest days never count as missed.
export function missedYesterday(tasks: Task[], restDates?: Set<string>) {
  const y = addDays(new Date(), -1);
  const iso = toISO(y);
  if (restDates?.has(iso)) return [];
  return tasksForDate(tasks, y).filter((t) => !t.history[iso]);
}

export function getMotivation(seed = 0) {
  const i = (new Date().getDate() + seed) % MOTIVATIONAL.length;
  return MOTIVATIONAL[i];
}

export function computeStats(tasks: Task[], days: number, restDates?: Set<string>) {
  const today = new Date();
  let scheduled = 0;
  let done = 0;
  const perDay: { date: string; done: number; scheduled: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    if (restDates?.has(iso)) {
      perDay.push({ date: iso, done: 0, scheduled: 0 });
      continue;
    }
    const dayTasks = tasksForDate(tasks, d);
    const dayDone = dayTasks.filter((t) => t.history[iso]).length;
    scheduled += dayTasks.length;
    done += dayDone;
    perDay.push({ date: iso, done: dayDone, scheduled: dayTasks.length });
  }
  // streak: consecutive days (ending today or yesterday) with 100% completion.
  // Rest days are skipped. One "streak shield" per calendar week: a fully
  // missed day uses that week's shield instead of breaking the chain.
  let streak = 0;
  let shieldWeek = -1;
  for (let i = 0; i < 365; i++) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    if (restDates?.has(iso)) continue;
    const dayTasks = tasksForDate(tasks, d);
    if (dayTasks.length === 0) {
      if (i === 0) continue;
      break;
    }
    const allDone = dayTasks.every((t) => t.history[iso]);
    if (allDone) {
      streak++;
    } else if (i === 0) {
      // today not fully done yet — don't break
      continue;
    } else {
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const wk = d.getFullYear() * 100 + Math.floor((+d - +jan1) / 604800000);
      if (wk !== shieldWeek) {
        shieldWeek = wk;
        streak++;
      } else break;
    }
  }
  const pct = scheduled === 0 ? 0 : Math.round((done / scheduled) * 100);
  return { scheduled, done, pct, perDay, streak };
}
