import { useCallback, useEffect, useRef, useState } from "react";
import {
  MOODS,
  WATER_TARGET_ML,
  moodForDate,
  sleepForDate,
  useMoodEntries,
  useRestDays,
  useSleepEntries,
  useWaterEntries,
  waterForDate,
} from "@/lib/health-store";
import { MOTIVATIONAL, missedYesterday, tasksForDate, todayISO, type Task } from "@/lib/tracker-store";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check, Droplets, Moon, Sun } from "lucide-react";

// Daily vitals card for the day view: water counter, sleep, mood, rest-day toggle.
export function VitalsCard({ selectedISO, isFuture }: { selectedISO: string; isFuture: boolean }) {
  const { entries: water, loaded: wLoaded, setMl } = useWaterEntries();
  const { entries: sleep, loaded: sLoaded, setHours } = useSleepEntries();
  const { entries: mood, loaded: mLoaded, setMood } = useMoodEntries();
  const { restDates, loaded: rLoaded, toggle: toggleRest } = useRestDays();

  if (!wLoaded || !sLoaded || !mLoaded || !rLoaded) return null;

  const ml = waterForDate(water, selectedISO);
  const glasses = Math.round(ml / 250);
  const targetGlasses = Math.round(WATER_TARGET_ML / 250);
  const sleepH = sleepForDate(sleep, selectedISO);
  const moodV = moodForDate(mood, selectedISO);
  const isRest = restDates.has(selectedISO);

  return (
    <div className="card-elevated rounded-2xl border border-border/60 p-4 space-y-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Daily vitals</p>

      {/* Water */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Droplets className="size-3.5 text-primary" /> Water
          </span>
          <span className="text-xs text-muted-foreground">
            {(ml / 1000).toFixed(2)}L / {(WATER_TARGET_ML / 1000).toFixed(0)}L
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-wrap gap-1">
            {Array.from({ length: Math.max(targetGlasses, glasses) }).map((_, i) => (
              <button
                key={i}
                disabled={isFuture}
                aria-label={`Water glass ${i + 1}`}
                onClick={() => setMl(selectedISO, (i + 1) * 250)}
                className={`w-5 h-7 rounded-b-md rounded-t-sm border transition-all ${
                  i < glasses ? "bg-primary/70 border-primary" : "border-border opacity-60 hover:opacity-100"
                }`}
              />
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <button
              disabled={isFuture}
              onClick={() => setMl(selectedISO, ml + 250)}
              className="text-[11px] px-2 py-0.5 rounded border border-border hover:border-primary/60"
            >
              +250
            </button>
            <button
              disabled={isFuture}
              onClick={() => setMl(selectedISO, ml - 250)}
              className="text-[11px] px-2 py-0.5 rounded border border-border hover:border-primary/60"
            >
              −250
            </button>
          </div>
        </div>
      </div>

      {/* Sleep */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Moon className="size-3.5 text-primary" /> Sleep
          </span>
          <span className="text-xs text-muted-foreground">{sleepH != null ? `${sleepH}h` : "not logged"}</span>
        </div>
        <div className="flex gap-1.5">
          {[5, 6, 7, 8, 9, 10].map((h) => (
            <button
              key={h}
              disabled={isFuture}
              onClick={() => setHours(selectedISO, h)}
              className={`flex-1 py-1.5 rounded-md text-xs border transition-all ${
                sleepH === h ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
              } disabled:opacity-40`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">Mood / energy</span>
          <span className="text-xs text-muted-foreground">{moodV ? MOODS[moodV - 1] : "not logged"}</span>
        </div>
        <div className="flex gap-1.5">
          {MOODS.map((e, i) => (
            <button
              key={e}
              disabled={isFuture}
              onClick={() => setMood(selectedISO, i + 1)}
              className={`flex-1 py-1.5 rounded-md text-lg border transition-all ${
                moodV === i + 1 ? "bg-primary/20 border-primary" : "border-border hover:border-primary/50"
              } disabled:opacity-40`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Rest day */}
      <button
        disabled={isFuture}
        onClick={() => toggleRest(selectedISO)}
        className={`w-full py-2 rounded-lg text-xs font-medium border transition-all disabled:opacity-40 ${
          isRest ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
        }`}
      >
        {isRest ? "✔ Rest day — excluded from streak & stats" : "Mark as rest day"}
      </button>
    </div>
  );
}

// ---- Reminders --------------------------------------------------------------
// Browser notifications while the app is open: a morning nudge and an evening
// check for tasks not done yet. True background push would need a server +
// messaging worker; this works whenever Punch is open (including the home-screen app).

type PermState = "unsupported" | "iframe" | "default" | "granted" | "denied";

function detectPermission(): PermState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (window.top !== window.self) return "iframe";
  return (Notification.permission as PermState) ?? "default";
}

export function RemindersCard({ tasks }: { tasks: Task[] }) {
  const [perm, setPerm] = useState<PermState>("default");
  const [enabled, setEnabled] = useState(false);
  const [justOn, setJustOn] = useState(false);
  const timersRef = useRef<number | null>(null);

  useEffect(() => {
    const p = detectPermission();
    setPerm(p);
    setEnabled(p === "granted" && localStorage.getItem("punch-reminders-on") === "1");
  }, []);

  const notify = useCallback((title: string, body: string) => {
    try {
      new Notification(title, { body });
    } catch {
      /* ignore */
    }
  }, []);

  const enable = async () => {
    const p = detectPermission();
    if (p === "unsupported" || p === "iframe") {
      setPerm(p);
      return;
    }
    const result = p === "granted" ? "granted" : await Notification.requestPermission();
    setPerm(result as PermState);
    if (result === "granted") {
      localStorage.setItem("punch-reminders-on", "1");
      setEnabled(true);
      setJustOn(true);
      setTimeout(() => setJustOn(false), 2500);
      notify("Punch reminders on", "You'll get a morning nudge and an evening check while the app is open.");
    } else {
      localStorage.setItem("punch-reminders-on", "0");
      setEnabled(false);
    }
  };

  const disable = () => {
    localStorage.setItem("punch-reminders-on", "0");
    setEnabled(false);
  };

  // One morning + one evening notification per day, guarded by localStorage.
  useEffect(() => {
    if (!enabled || perm !== "granted") return;
    const check = () => {
      const today = todayISO();
      const hour = new Date().getHours();
      const dayTasks = tasksForDate(tasks, new Date());
      if (dayTasks.length === 0) return;
      const morningKey = `punch-rem-${today}-morning`;
      const eveningKey = `punch-rem-${today}-evening`;
      if (hour >= 6 && hour < 12 && !localStorage.getItem(morningKey)) {
        localStorage.setItem(morningKey, "1");
        const done = dayTasks.filter((t) => t.history[today]).length;
        notify("Good morning — time to punch in", `${dayTasks.length} tasks today, ${done} done so far. Let's go! 💪`);
      } else if (hour >= 19 && hour < 23 && !localStorage.getItem(eveningKey)) {
        const missedToday = dayTasks.filter((t) => !t.history[today]);
        if (missedToday.length > 0) {
          localStorage.setItem(eveningKey, "1");
          const tip = MOTIVATIONAL[new Date().getDate() % MOTIVATIONAL.length];
          notify(
            `${missedToday.length} task${missedToday.length > 1 ? "s" : ""} still open`,
            `${missedToday.slice(0, 3).map((t) => t.emoji + " " + t.title).join(" · ")}${missedToday.length > 3 ? " …" : ""} — ${tip}`,
          );
        }
      }
    };
    check();
    timersRef.current = window.setInterval(check, 5 * 60 * 1000);
    return () => {
      if (timersRef.current) window.clearInterval(timersRef.current);
    };
  }, [enabled, perm, tasks, notify]);

  if (perm === "unsupported" || perm === "iframe") {
    return (
      <div className="card-elevated rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
        <BellOff className="size-4 inline mr-1.5" />
        {perm === "iframe"
          ? "Reminders need the app opened in its own browser tab (not the editor preview)."
          : "This browser doesn't support notifications."}
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="card-elevated rounded-2xl border border-border/60 p-4">
        <div className="flex items-center gap-3">
          <Bell className="size-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Daily reminders</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Morning nudge + evening check while Punch is open.
            </p>
          </div>
          <Button size="sm" onClick={enable}>
            {perm === "denied" ? "Retry" : "Enable"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated rounded-2xl border border-border/60 p-4">
      <div className="flex items-center gap-3">
        <Sun className="size-5 text-success shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Reminders on</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {justOn ? <span className="inline-flex items-center gap-1"><Check className="size-3 text-success" /> enabled</span> : "Morning nudge + evening check, once a day."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={disable}>
          Turn off
        </Button>
      </div>
    </div>
  );
}

// Missed-today warning for the selected (past) day, shown in the sidebar.
export function DayCatchUpCard({ tasks, selectedISO }: { tasks: Task[]; selectedISO: string }) {
  const { restDates } = useRestDays();
  if (restDates.has(selectedISO)) return null;
  const dayTasks = tasksForDate(tasks, new Date(selectedISO));
  const missedToday = dayTasks.filter((t) => !t.history[selectedISO]);
  if (missedToday.length === 0 || selectedISO >= todayISO()) return null;
  return (
    <div className="rounded-2xl border border-accent/30 p-4" style={{ background: "var(--gradient-hero)" }}>
      <p className="text-sm font-semibold">
        {missedToday.length} task{missedToday.length > 1 ? "s" : ""} missed this day
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Yesterday's slip is today's spark. Catch up or move on — win the next rep.
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {missedToday.slice(0, 6).map((t) => (
          <span key={t.id} className="text-[11px] px-2 py-0.5 rounded-full bg-background/60 border border-border">
            {t.emoji} {t.title}
          </span>
        ))}
      </div>
    </div>
  );
}

export { missedYesterday };
