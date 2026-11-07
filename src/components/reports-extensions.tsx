import { useMemo, useState } from "react";
import {
  MOODS,
  WATER_TARGET_ML,
  moodForDate,
  sleepForDate,
  useMoodEntries,
  useRestDays,
  useSleepEntries,
  useWaterEntries,
  useWeightEntries,
  waterForDate,
  type WeightEntry,
} from "@/lib/health-store";
import {
  dailyTotals,
  nutritionStats,
  useFoodEntries,
  useGoal,
  computeTargets,
  type Macros,
} from "@/lib/nutrition-store";
import { activityStats, useActivityEntries } from "@/lib/activity-store";
import { toISO, fromISO, addDays, tasksForDate, computeStats, type Task } from "@/lib/tracker-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Flame, Scale, TrendingUp, Trash2 } from "lucide-react";

// Reports-tab additions: weight trend, consistency heat map, weekly review,
// macro chart, monthly snapshot export, and mood/sleep correlation.

// ---- Weight & body measurements ---------------------------------------------

export function WeightCard() {
  const { entries, loaded, add, remove } = useWeightEntries();
  const { goal, update } = useGoal();
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [saved, setSaved] = useState(false);

  const sorted = useMemo(() => [...entries].sort((a, b) => a.dateISO.localeCompare(b.dateISO)), [entries]);
  if (!loaded) return null;
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];

  const save = () => {
    const w = parseFloat(weight);
    if (!w || w <= 20 || w > 400) return;
    const waistV = waist ? parseFloat(waist) : null;
    const chestV = chest ? parseFloat(chest) : null;
    add({ dateISO: toISO(new Date()), weightKg: w, waistCm: waistV, chestCm: chestV });
    // Keep the profile's current weight in sync so targets auto-update.
    update({ currentKg: w });
    setWeight("");
    setWaist("");
    setChest("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const delta = latest && first && sorted.length > 1 ? +(latest.weightKg - first.weightKg).toFixed(1) : null;
  const toTarget = latest ? +(goal.targetKg - latest.weightKg).toFixed(1) : null;

  return (
    <div className="card-elevated rounded-2xl border border-border/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Scale className="size-4" /> Weight & body
        </h3>
        {latest && (
          <span className="text-sm text-muted-foreground">
            Latest: <span className="font-semibold text-foreground">{latest.weightKg}kg</span>
            {delta != null && (
              <span className={delta >= 0 ? "text-success" : "text-destructive"}>
                {" "}({delta >= 0 ? "+" : ""}{delta}kg)
              </span>
            )}
          </span>
        )}
      </div>

      <WeightChart entries={sorted} targetKg={goal.targetKg} />

      {latest && toTarget != null && (
        <p className="text-xs text-muted-foreground mt-2">
          {toTarget > 0
            ? `${toTarget}kg to go to reach your ${goal.targetKg}kg target.`
            : toTarget < 0
              ? `${Math.abs(toTarget)}kg below your ${goal.targetKg}kg target.`
              : "You're right at your target weight. 🎯"}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        <Input
          type="number"
          step="0.1"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="max-w-[120px]"
        />
        <Input
          type="number"
          step="0.1"
          placeholder="Waist (cm)"
          value={waist}
          onChange={(e) => setWaist(e.target.value)}
          className="max-w-[110px]"
        />
        <Input
          type="number"
          step="0.1"
          placeholder="Chest (cm)"
          value={chest}
          onChange={(e) => setChest(e.target.value)}
          className="max-w-[110px]"
        />
        <Button onClick={save} disabled={!weight} className="min-w-[90px]">
          {saved ? "Saved" : "Log"}
        </Button>
      </div>

      {sorted.length > 0 && (
        <div className="mt-4 space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {[...sorted].reverse().slice(0, 12).map((e) => (
            <div key={e.id} className="flex items-center justify-between text-sm rounded-lg border border-border/50 px-3 py-1.5">
              <span className="text-muted-foreground text-xs">{e.dateISO}</span>
              <span className="font-medium">{e.weightKg}kg</span>
              <span className="text-xs text-muted-foreground">
                {e.waistCm ? `waist ${e.waistCm}` : ""} {e.chestCm ? `chest ${e.chestCm}` : ""}
              </span>
              <button onClick={() => remove(e.id)} aria-label="Delete" className="text-muted-foreground hover:text-destructive p-1">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeightChart({ entries, targetKg }: { entries: WeightEntry[]; targetKg: number }) {
  const pts = entries.slice(-30);
  if (pts.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted-foreground rounded-xl border border-dashed border-border">
        Log your weight at least twice to see the trend.
      </div>
    );
  }
  const w = 560;
  const h = 130;
  const pad = 10;
  const ws = pts.map((p) => p.weightKg);
  const min = Math.min(...ws, targetKg) - 1;
  const max = Math.max(...ws, targetKg) + 1;
  const x = (i: number) => pad + (i / (pts.length - 1)) * (w - 2 * pad);
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (h - 2 * pad);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.weightKg)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
      <line x1={pad} x2={w - pad} y1={y(targetKg)} y2={y(targetKg)} stroke="var(--success)" strokeDasharray="4 4" strokeWidth="1" />
      <text x={w - pad} y={y(targetKg) - 4} textAnchor="end" fontSize="10" fill="var(--success)">
        target {targetKg}kg
      </text>
      <path d={line} fill="none" stroke="url(#wg)" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      {pts.map((p, i) => (
        <circle key={p.id} cx={x(i)} cy={y(p.weightKg)} r="3" fill="var(--primary)" />
      ))}
    </svg>
  );
}

// ---- Consistency heat map ----------------------------------------------------

export function ConsistencyHeatMap({ tasks }: { tasks: Task[] }) {
  const { restDates } = useRestDays();
  const weeks = 18;
  const cells = useMemo(() => {
    const today = new Date();
    // align the grid so it ends on the current week
    const end = addDays(today, 6 - today.getDay());
    const out: { iso: string; pct: number | null; rest: boolean }[] = [];
    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const d = addDays(end, -i);
      const iso = toISO(d);
      if (d > today || restDates.has(iso)) {
        out.push({ iso, pct: null, rest: restDates.has(iso) });
        continue;
      }
      const dayT = tasksForDate(tasks, d);
      const done = dayT.filter((t) => t.history[iso]).length;
      out.push({ iso, pct: dayT.length === 0 ? null : done / dayT.length, rest: false });
    }
    return out;
  }, [tasks, restDates]);

  return (
    <div className="card-elevated rounded-2xl border border-border/60 p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="size-4" /> Consistency heat map
      </h3>
      <div className="overflow-x-auto pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ width: "max-content" }}>
          {cells.map((c) => (
            <div
              key={c.iso}
              title={`${c.iso}${c.rest ? " · rest day" : c.pct == null ? " · no tasks" : ` · ${Math.round(c.pct * 100)}% done`}`}
              className="size-3.5 rounded-[3px]"
              style={{
                backgroundColor:
                  c.rest
                    ? "var(--muted)"
                    : c.pct == null
                      ? "var(--secondary)"
                      : c.pct === 0
                        ? "color-mix(in srgb, var(--primary) 18%, var(--secondary))"
                        : `color-mix(in srgb, var(--primary) ${25 + c.pct * 75}%, var(--secondary))`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
        less
        {[0.1, 0.4, 0.7, 1].map((p) => (
          <span
            key={p}
            className="size-3 rounded-[3px] inline-block"
            style={{ backgroundColor: `color-mix(in srgb, var(--primary) ${25 + p * 75}%, var(--secondary))` }}
          />
        ))}
        more
        <span className="ml-2 flex items-center gap-1">
          <span className="size-3 rounded-[3px] inline-block" style={{ backgroundColor: "var(--muted)" }} /> rest
        </span>
      </div>
    </div>
  );
}

// ---- Weekly review ------------------------------------------------------------

export function WeeklyReviewCard({ tasks, weekStats }: { tasks: Task[]; weekStats: ReturnType<typeof computeStats> }) {
  const { goal } = useGoal();
  const { entries: food } = useFoodEntries();
  const { entries: activity } = useActivityEntries();
  const { entries: sleep } = useSleepEntries();
  const { entries: mood } = useMoodEntries();
  const { restDates } = useRestDays();
  const targets = useMemo(() => computeTargets(goal), [goal]);

  const review = useMemo(() => {
    const days = weekStats.perDay.filter((d) => d.scheduled > 0);
    const active = days.filter((d) => !restDates.has(d.date));
    const scored = active.map((d) => ({ ...d, pct: d.done / d.scheduled }));
    const best = scored.length ? scored.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
    const worst = scored.length ? scored.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
    const foodStats = nutritionStats(food, 7);
    const actStats = activityStats(activity, 7);
    const sleepDays = sleep.filter((s) => withinDays(s.dateISO, 7));
    const moodDays = mood.filter((m) => withinDays(m.dateISO, 7));
    const avgSleep = sleepDays.length ? sleepDays.reduce((a, b) => a + b.hours, 0) / sleepDays.length : null;
    const avgMood = moodDays.length ? moodDays.reduce((a, b) => a + b.mood, 0) / moodDays.length : null;

    const proteinGap = targets.protein - foodStats.avg.protein;
    const tips: string[] = [];
    if (proteinGap > 15) tips.push(`add ~${Math.round(proteinGap)}g protein a day (a whey scoop helps)`);
    if (foodStats.avg.calories < targets.calories * 0.85) tips.push("you're eating under target — add a healthy snack");
    if (foodStats.avg.sugar > targets.sugar) tips.push("trim the sugar — sweets and sodas are the usual suspects");
    if (actStats.avg.calories < 200) tips.push("push daily movement — even a 30-min walk counts");
    if (avgSleep != null && avgSleep < 7) tips.push("sleep is below 7h — recovery drives results");
    if (!tips.length) tips.push("you're on track everywhere — keep the chain alive");

    return {
      best,
      worst,
      avgCalories: foodStats.avg.calories,
      avgProtein: foodStats.avg.protein,
      avgMood,
      avgSleep,
      tip: tips.slice(0, 2).join("; "),
    };
  }, [weekStats, food, activity, sleep, mood, restDates, targets]);

  return (
    <div className="rounded-2xl border border-primary/30 p-5 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Flame className="size-4" /> Weekly review
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="rounded-xl bg-background/50 border border-border/50 p-3">
          <p className="text-xs text-muted-foreground">Completion</p>
          <p className="font-bold text-lg gradient-text">{weekStats.pct}%</p>
        </div>
        <div className="rounded-xl bg-background/50 border border-border/50 p-3">
          <p className="text-xs text-muted-foreground">Best day</p>
          <p className="font-bold text-lg">{review.best ? `${Math.round(review.best.pct * 100)}%` : "—"}</p>
          <p className="text-[11px] text-muted-foreground">{review.best ? fmtDay(review.best.date) : ""}</p>
        </div>
        <div className="rounded-xl bg-background/50 border border-border/50 p-3">
          <p className="text-xs text-muted-foreground">Weakest day</p>
          <p className="font-bold text-lg">{review.worst ? `${Math.round(review.worst.pct * 100)}%` : "—"}</p>
          <p className="text-[11px] text-muted-foreground">{review.worst ? fmtDay(review.worst.date) : ""}</p>
        </div>
        <div className="rounded-xl bg-background/50 border border-border/50 p-3">
          <p className="text-xs text-muted-foreground">Avg intake</p>
          <p className="font-bold text-lg">{Math.round(review.avgCalories)} <span className="text-xs font-normal text-muted-foreground">kcal</span></p>
          <p className="text-[11px] text-muted-foreground">P {Math.round(review.avgProtein)}g / {targets.protein}g</p>
        </div>
      </div>
      {(review.avgSleep != null || review.avgMood != null) && (
        <p className="text-xs text-muted-foreground mt-3">
          {review.avgSleep != null && <>Avg sleep {review.avgSleep.toFixed(1)}h · </>}
          {review.avgMood != null && <>Avg mood {MOODS[Math.min(4, Math.max(0, Math.round(review.avgMood) - 1))]}</>}
        </p>
      )}
      <p className="text-sm mt-3 font-medium">
        <span className="text-accent-foreground">Next-week tip:</span> <span className="gradient-text">{review.tip}.</span>
      </p>
    </div>
  );
}

function withinDays(dateISO: string, days: number) {
  const d = fromISO(dateISO);
  return +d > +addDays(new Date(), -days) && +d <= +new Date();
}

function fmtDay(iso: string) {
  return fromISO(iso).toLocaleDateString(undefined, { weekday: "short" });
}

// ---- Macro split chart ---------------------------------------------------------

export function MacroSplitChart() {
  const { entries } = useFoodEntries();
  const { goal } = useGoal();
  const targets = useMemo(() => computeTargets(goal), [goal]);
  const stats = useMemo(() => nutritionStats(entries, 30), [entries]);

  // approximate calories from protein / carbs / fat (carbs + 2*(sugar counted within carbs))
  const kcalP = stats.avg.protein * 4;
  const kcalC = stats.avg.carbs * 4;
  const kcalTotal = Math.max(stats.avg.calories, kcalP + kcalC + 1);
  const kcalF = Math.max(0, kcalTotal - kcalP - kcalC);
  const segs = [
    { label: "Protein", v: kcalP, color: "var(--primary)" },
    { label: "Carbs", v: kcalC, color: "var(--accent)" },
    { label: "Fat", v: kcalF, color: "var(--warning)" },
  ];

  return (
    <div className="card-elevated rounded-2xl border border-border/60 p-5">
      <h3 className="font-semibold mb-4">30-day macro split (avg day)</h3>
      <div className="h-5 rounded-full overflow-hidden flex bg-secondary">
        {segs.map((s) => (
          <div key={s.label} style={{ width: `${(s.v / kcalTotal) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-3 text-xs">
        {segs.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full inline-block" style={{ background: s.color }} />
            {s.label} {Math.round(s.v)} kcal ({Math.round((s.v / kcalTotal) * 100)}%)
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm">
        <MiniBar label="Fibre" value={stats.avg.fiber} target={targets.fiber} unit="g" />
        <MiniBar label="Sugar" value={stats.avg.sugar} target={targets.sugar} unit="g" limit />
        <MiniBar label="Calories" value={stats.avg.calories} target={targets.calories} unit="kcal" />
      </div>
    </div>
  );
}

function MiniBar({ label, value, target, unit, limit }: { label: string; value: number; target: number; unit: string; limit?: boolean }) {
  const pct = Math.min(100, (value / Math.max(target, 1)) * 100);
  const over = value > target;
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {Math.round(value)} / {target} {unit}
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: limit && over ? "var(--destructive)" : "var(--gradient-accent)",
          }}
        />
      </div>
    </div>
  );
}

// ---- Monthly snapshot export (PNG) ----------------------------------------------

export function MonthlySnapshotButton({ tasks, monthStats }: { tasks: Task[]; monthStats: ReturnType<typeof computeStats> }) {
  const { goal } = useGoal();
  const { entries: food } = useFoodEntries();
  const { entries: water } = useWaterEntries();
  const { entries: activity } = useActivityEntries();
  const [busy, setBusy] = useState(false);

  const exportPng = async () => {
    setBusy(true);
    try {
      const foodStats = nutritionStats(food, 30);
      const actStats = activityStats(activity, 30);
      const waterDays = water.filter((w) => withinDays(w.dateISO, 30));
      const avgWater = waterDays.length ? waterDays.reduce((a, b) => a + b.ml, 0) / waterDays.length : 0;
      const target = computeTargets(goal);

      const W = 900;
      const H = 560;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // dark background
      ctx.fillStyle = "#0b0b14";
      ctx.fillRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, 0, W, 120);
      grad.addColorStop(0, "#7c3aed22");
      grad.addColorStop(1, "#ec489922");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 130);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 34px sans-serif";
      ctx.fillText("Punch — Monthly Report", 40, 62);
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#a1a1b5";
      const monthName = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
      ctx.fillText(`${monthName} · ${goal.name || "Your"} · 30-day snapshot`, 40, 92);

      const rows: [string, string][] = [
        ["Task completion", `${monthStats.pct}%  (${monthStats.done}/${monthStats.scheduled} done)`],
        ["Best streak", `${monthStats.streak} days`],
        ["Avg calories", `${Math.round(foodStats.avg.calories)} / ${target.calories} kcal`],
        ["Avg protein", `${Math.round(foodStats.avg.protein)} / ${target.protein} g`],
        ["Avg fibre / sugar", `${Math.round(foodStats.avg.fiber)}g / ${Math.round(foodStats.avg.sugar)}g`],
        ["Avg water", `${(avgWater / 1000).toFixed(2)} L / ${(WATER_TARGET_ML / 1000).toFixed(0)} L`],
        ["Movement", `${Math.round(actStats.avg.calories)} kcal · ${Math.round(actStats.avg.minutes)} min/day avg`],
        ["Weight", goal.currentKg ? `${goal.currentKg}kg (target ${goal.targetKg}kg)` : "—"],
      ];
      let y = 190;
      for (const [label, value] of rows) {
        ctx.fillStyle = "#8b8ba0";
        ctx.font = "15px sans-serif";
        ctx.fillText(label, 48, y);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText(value, 320, y);
        ctx.strokeStyle = "#23233a";
        ctx.beginPath();
        ctx.moveTo(40, y + 14);
        ctx.lineTo(W - 40, y + 14);
        ctx.stroke();
        y += 42;
      }

      ctx.fillStyle = "#a1a1b5";
      ctx.font = "12px sans-serif";
      ctx.fillText("Generated by Punch · " + new Date().toLocaleDateString(), 40, H - 28);

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `punch-monthly-report-${toISO(new Date())}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" onClick={exportPng} disabled={busy} className="gap-2">
      <Download className="size-4" /> {busy ? "Creating…" : "Save monthly report as image"}
    </Button>
  );
}

export type { Macros };
export { moodForDate };
