import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "./tracker-store";

// ---- Shared per-user health logging (water, sleep, mood, rest days, weight).
// Each hook follows the same pattern as useTasks: optimistic local state,
// straight write to the cloud table (RLS-scoped to the signed-in user).

async function currentUser(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ---- Water ------------------------------------------------------------------

export type WaterEntry = { id: string; dateISO: string; ml: number; createdAt: string };
export const WATER_TARGET_ML = 3000;

type WaterRow = { id: string; user_id: string; date_iso: string; ml: number; created_at: string };

export function useWaterEntries() {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = await currentUser();
      if (!uid) {
        if (active) setLoaded(true);
        return;
      }
      const { data } = await supabase.from("water_entries").select("*").eq("user_id", uid);
      if (!active) return;
      setEntries(
        ((data ?? []) as WaterRow[]).map((r) => ({
          id: r.id,
          dateISO: r.date_iso,
          ml: r.ml,
          createdAt: r.created_at,
        })),
      );
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setMl = useCallback((dateISO: string, ml: number) => {
    const next = Math.max(0, Math.round(ml));
    setEntries((prev) => {
      const existing = prev.find((e) => e.dateISO === dateISO);
      if (existing) return prev.map((e) => (e.dateISO === dateISO ? { ...e, ml: next } : e));
      return [...prev, { id: crypto.randomUUID(), dateISO, ml: next, createdAt: new Date().toISOString() }];
    });
    void (async () => {
      const uid = await currentUser();
      if (!uid) return;
      const { error } = await supabase.from("water_entries").upsert(
        { user_id: uid, date_iso: dateISO, ml: next },
        { onConflict: "user_id,date_iso" },
      );
      if (error) console.error("Failed to save water:", error.message);
    })();
  }, []);

  return { entries, loaded, setMl };
}

export function waterForDate(entries: WaterEntry[], dateISO: string): number {
  return entries.find((e) => e.dateISO === dateISO)?.ml ?? 0;
}

// ---- Sleep ------------------------------------------------------------------

export type SleepEntry = { id: string; dateISO: string; hours: number; createdAt: string };

type SleepRow = { id: string; user_id: string; date_iso: string; hours: number; created_at: string };

export function useSleepEntries() {
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = await currentUser();
      if (!uid) {
        if (active) setLoaded(true);
        return;
      }
      const { data } = await supabase.from("sleep_entries").select("*").eq("user_id", uid);
      if (!active) return;
      setEntries(
        ((data ?? []) as SleepRow[]).map((r) => ({
          id: r.id,
          dateISO: r.date_iso,
          hours: Number(r.hours),
          createdAt: r.created_at,
        })),
      );
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setHours = useCallback((dateISO: string, hours: number) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.dateISO === dateISO);
      if (existing) return prev.map((e) => (e.dateISO === dateISO ? { ...e, hours } : e));
      return [...prev, { id: crypto.randomUUID(), dateISO, hours, createdAt: new Date().toISOString() }];
    });
    void (async () => {
      const uid = await currentUser();
      if (!uid) return;
      const { error } = await supabase.from("sleep_entries").upsert(
        { user_id: uid, date_iso: dateISO, hours },
        { onConflict: "user_id,date_iso" },
      );
      if (error) console.error("Failed to save sleep:", error.message);
    })();
  }, []);

  return { entries, loaded, setHours };
}

export function sleepForDate(entries: SleepEntry[], dateISO: string): number | null {
  return entries.find((e) => e.dateISO === dateISO)?.hours ?? null;
}

// ---- Mood -------------------------------------------------------------------

export type MoodEntry = { id: string; dateISO: string; mood: number; createdAt: string };
export const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

type MoodRow = { id: string; user_id: string; date_iso: string; mood: number; created_at: string };

export function useMoodEntries() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = await currentUser();
      if (!uid) {
        if (active) setLoaded(true);
        return;
      }
      const { data } = await supabase.from("mood_entries").select("*").eq("user_id", uid);
      if (!active) return;
      setEntries(
        ((data ?? []) as MoodRow[]).map((r) => ({
          id: r.id,
          dateISO: r.date_iso,
          mood: r.mood,
          createdAt: r.created_at,
        })),
      );
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const setMood = useCallback((dateISO: string, mood: number) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.dateISO === dateISO);
      if (existing) return prev.map((e) => (e.dateISO === dateISO ? { ...e, mood } : e));
      return [...prev, { id: crypto.randomUUID(), dateISO, mood, createdAt: new Date().toISOString() }];
    });
    void (async () => {
      const uid = await currentUser();
      if (!uid) return;
      const { error } = await supabase.from("mood_entries").upsert(
        { user_id: uid, date_iso: dateISO, mood },
        { onConflict: "user_id,date_iso" },
      );
      if (error) console.error("Failed to save mood:", error.message);
    })();
  }, []);

  return { entries, loaded, setMood };
}

export function moodForDate(entries: MoodEntry[], dateISO: string): number | null {
  return entries.find((e) => e.dateISO === dateISO)?.mood ?? null;
}

// ---- Rest days --------------------------------------------------------------
// Shared module store so toggling a rest day updates streaks/stats everywhere.

type RestRow = { date_iso: string };
type RestState = { dates: Set<string>; loaded: boolean };
const REST_INIT: RestState = { dates: new Set(), loaded: false };
let restState: RestState = REST_INIT;
let restLoad: Promise<void> | null = null;
let restAuthWatched = false;
const restListeners = new Set<() => void>();
const notifyRest = () => restListeners.forEach((l) => l());

function loadRestOnce() {
  if (typeof window === "undefined") return;
  if (!restAuthWatched) {
    restAuthWatched = true;
    supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      restState = REST_INIT;
      restLoad = null;
      notifyRest();
    });
  }
  if (restLoad) return;
  restLoad = (async () => {
    const uid = await currentUser();
    if (!uid) {
      restState = { ...restState, loaded: true };
      notifyRest();
      return;
    }
    const { data } = await supabase.from("rest_days").select("date_iso").eq("user_id", uid);
    restState = { dates: new Set(((data ?? []) as RestRow[]).map((r) => r.date_iso)), loaded: true };
    notifyRest();
  })();
}

export function useRestDays() {
  const state = useSyncExternalStore(
    (cb) => {
      restListeners.add(cb);
      return () => {
        restListeners.delete(cb);
      };
    },
    () => restState,
    () => REST_INIT,
  );
  useEffect(() => {
    loadRestOnce();
  }, []);

  const toggle = useCallback((dateISO: string) => {
    const next = new Set(restState.dates);
    const wasRest = next.has(dateISO);
    if (wasRest) next.delete(dateISO);
    else next.add(dateISO);
    restState = { ...restState, dates: next };
    notifyRest();
    void (async () => {
      const uid = await currentUser();
      if (!uid) return;
      const { error } = wasRest
        ? await supabase.from("rest_days").delete().eq("user_id", uid).eq("date_iso", dateISO)
        : await supabase.from("rest_days").insert({ user_id: uid, date_iso: dateISO });
      if (error) console.error("Failed to save rest day:", error.message);
    })();
  }, []);

  return { restDates: state.dates, loaded: state.loaded, toggle };
}

// ---- Weight / body measurements --------------------------------------------

export type WeightEntry = {
  id: string;
  dateISO: string;
  weightKg: number;
  waistCm: number | null;
  chestCm: number | null;
  createdAt: string;
};

type WeightRow = {
  id: string;
  user_id: string;
  date_iso: string;
  weight_kg: number;
  waist_cm: number | null;
  chest_cm: number | null;
  created_at: string;
};

function rowToWeight(r: WeightRow): WeightEntry {
  return {
    id: r.id,
    dateISO: r.date_iso,
    weightKg: Number(r.weight_kg),
    waistCm: r.waist_cm == null ? null : Number(r.waist_cm),
    chestCm: r.chest_cm == null ? null : Number(r.chest_cm),
    createdAt: r.created_at,
  };
}

export function useWeightEntries() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = await currentUser();
      if (!uid) {
        if (active) setLoaded(true);
        return;
      }
      const { data } = await supabase
        .from("weight_entries")
        .select("*")
        .eq("user_id", uid)
        .order("date_iso");
      if (!active) return;
      setEntries(((data ?? []) as WeightRow[]).map(rowToWeight));
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const add = useCallback(
    (e: { dateISO: string; weightKg: number; waistCm?: number | null; chestCm?: number | null }) => {
      const row: WeightEntry = {
        id: crypto.randomUUID(),
        dateISO: e.dateISO,
        weightKg: e.weightKg,
        waistCm: e.waistCm ?? null,
        chestCm: e.chestCm ?? null,
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => [...prev.filter((x) => x.dateISO !== e.dateISO), row]);
      void (async () => {
        const uid = await currentUser();
        if (!uid) return;
        const { error } = await supabase.from("weight_entries").insert({
          user_id: uid,
          date_iso: row.dateISO,
          weight_kg: row.weightKg,
          waist_cm: row.waistCm,
          chest_cm: row.chestCm,
        });
        if (error) console.error("Failed to save weight:", error.message);
      })();
      return row;
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    void (async () => {
      const { error } = await supabase.from("weight_entries").delete().eq("id", id);
      if (error) console.error("Failed to delete weight entry:", error.message);
    })();
  }, []);

  return { entries, loaded, add, remove };
}

export { todayISO };
