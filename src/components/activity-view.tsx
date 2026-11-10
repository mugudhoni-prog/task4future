import { useMemo, useState } from "react";
import {
  ACTIVITY_DB,
  activityEntriesForDate,
  activityStats,
  computeCaloriesBurned,
  type ActivityDetails,
  dailyBurn,
  todayISO,
  useActivityEntries,
  type Activity,
} from "@/lib/activity-store";
import { computeCustomWalk, computeStrengthCaloriesBurned } from "@/lib/activity-calculations";
import { useGoal } from "@/lib/nutrition-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Flame, Trash2, Clock, Dumbbell } from "lucide-react";

const CATS: { id: Activity["category"]; label: string }[] = [
  { id: "cardio", label: "Cardio" },
  { id: "gym", label: "Gym" },
  { id: "yoga", label: "Yoga" },
  { id: "sports", label: "Sports" },
  { id: "daily", label: "Daily" },
];

export function ActivityView() {
  const { goal, loaded: gLoaded } = useGoal();
  const { entries, loaded, add, remove } = useActivityEntries();
  const [openAdd, setOpenAdd] = useState(false);
  const today = todayISO();

  const todayList = useMemo(() => activityEntriesForDate(entries, today), [entries, today]);
  const todayBurn = useMemo(() => dailyBurn(entries, today), [entries, today]);
  const week = useMemo(() => activityStats(entries, 7), [entries]);

  if (!loaded || !gLoaded) return null;

  // rough daily target: ~10% of TDEE-ish or 300 kcal
  const target = 400;
  const pct = Math.min(100, (todayBurn.calories / target) * 100);

  return (
    <div className="space-y-6">
      <div className="card-elevated rounded-2xl border border-border/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Today · calories burned</p>
            <h3 className="text-3xl font-bold mt-1 gradient-text">
              {todayBurn.calories} <span className="text-base text-muted-foreground font-normal">/ {target} kcal</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="size-3 inline" /> {todayBurn.minutes} min moved today
            </p>
          </div>
          <Button onClick={() => setOpenAdd(true)}>
            <Plus className="size-4" /> Log activity
          </Button>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--gradient-accent)" }} />
        </div>
      </div>

      <div className="card-elevated rounded-2xl border border-border/60 p-5">
        <h3 className="font-semibold mb-4">Today's activities</h3>
        {todayList.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Dumbbell className="size-8 mx-auto mb-2 opacity-40" />
            No activity logged yet. Tap "Log activity" above.
          </div>
        ) : (
          <div className="space-y-2">
            {todayList.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
                <div className="text-2xl">{e.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{e.activityName}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.minutes} min · {e.caloriesBurned} kcal burned
                    {e.details?.kind === "strength" && ` · ${e.details.sets} × ${e.details.repsPerSet} reps at ${e.details.weightKg} kg`}
                    {e.details?.kind === "custom-walk" && ` · ${e.details.distanceKm} km at ${e.details.speedKmh} km/h · ${e.details.inclineDegrees}°`}
                  </p>
                </div>
                <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive p-2" aria-label="Remove">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-elevated rounded-2xl border border-border/60 p-5">
        <h3 className="font-semibold mb-4">Last 7 days</h3>
        <div className="flex items-end gap-2 h-32 mb-3">
          {week.perDay.map((d) => {
            const p = Math.min(100, (d.calories / Math.max(400, week.total.calories / 3)) * 100);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-secondary rounded-md relative" style={{ height: "100%" }}>
                  <div className="absolute bottom-0 left-0 right-0 rounded-md" style={{ height: `${p}%`, background: "var(--gradient-accent)" }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Weekly total</p>
            <p className="font-bold text-lg">{week.total.calories} kcal</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs text-muted-foreground">Daily average</p>
            <p className="font-bold text-lg">{week.avg.calories} kcal</p>
          </div>
        </div>
      </div>

      <AddActivityDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        bodyWeightKg={goal.currentKg}
        gender={goal.gender}
        onAdd={(a, minutes, kcal, details) => {
          add({
            dateISO: today,
            activityName: a.name,
            emoji: a.emoji,
            minutes,
            caloriesBurned: kcal,
            details,
          });
        }}
      />

    </div>
  );
}

function AddActivityDialog({
  open,
  onOpenChange,
  bodyWeightKg,
  gender,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  bodyWeightKg: number;
  gender: "male" | "female";
  onAdd: (a: Activity, minutes: number, calories: number, details?: ActivityDetails) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Activity["category"] | "all">("all");
  const [selected, setSelected] = useState<Activity | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [resistanceKg, setResistanceKg] = useState(0);
  const [repsPerSet, setRepsPerSet] = useState(10);
  const [sets, setSets] = useState(3);
  const [walkSpeed, setWalkSpeed] = useState(5);
  const [walkDistance, setWalkDistance] = useState(3);
  const [walkIncline, setWalkIncline] = useState(0);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ACTIVITY_DB.filter(
      (a) => (cat === "all" || a.category === cat) && (!ql || a.name.toLowerCase().includes(ql)),
    ).slice(0, 80);
  }, [q, cat]);

  const isCustomWalk = selected?.name === "Custom walk";
  const isStrength = selected?.category === "gym";
  const walkEstimate = isCustomWalk
    ? computeCustomWalk(walkSpeed, walkDistance, walkIncline, bodyWeightKg, gender)
    : null;
  const activeMinutes = walkEstimate ? Math.max(1, Math.round(walkEstimate.minutes)) : minutes;
  const details: ActivityDetails | undefined = isCustomWalk
    ? { kind: "custom-walk", speedKmh: walkSpeed, distanceKm: walkDistance, inclineDegrees: walkIncline }
    : isStrength
    ? { kind: "strength", weightKg: resistanceKg, repsPerSet, sets }
      : undefined;
  const preview = selected
    ? isCustomWalk
      ? walkEstimate?.caloriesBurned ?? 0
      : isStrength
        ? computeStrengthCaloriesBurned(selected.met, minutes, bodyWeightKg, gender, resistanceKg, repsPerSet, sets)
        : computeCaloriesBurned(selected.met, minutes, bodyWeightKg, gender)
    : 0;


  const submit = () => {
    if (!selected || (isCustomWalk ? walkDistance <= 0 || walkSpeed <= 0 : minutes <= 0)) return;
    onAdd(selected, activeMinutes, preview, details);
    setSelected(null);
    setMinutes(30);
    setResistanceKg(0);
    setRepsPerSet(10);
    setSets(3);
    setWalkSpeed(5);
    setWalkDistance(3);
    setWalkIncline(0);
    setQ("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
        </DialogHeader>
        {!selected ? (
          <div className="space-y-3">
            <Input autoFocus placeholder="Search activity (e.g. running, plank)" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              <CatChip active={cat === "all"} onClick={() => setCat("all")}>All</CatChip>
              {CATS.map((c) => (
                <CatChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                  {c.label}
                </CatChip>
              ))}
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {filtered.map((a) => (
                <button
                  key={a.name}
                  onClick={() => setSelected(a)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/60 hover:border-primary/50 text-left"
                >
                  <span className="text-xl">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground">MET {a.met} · {a.category}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ~{computeCaloriesBurned(a.met, 30, weightKg, gender)} kcal/30m
                  </span>

                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No matches.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
              <span className="text-3xl">{selected.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold">{selected.name}</p>
                <p className="text-xs text-muted-foreground">MET {selected.met}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Change</Button>
            </div>
            {isCustomWalk ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs text-muted-foreground">Speed (km/h)
                  <Input type="number" min={0.1} step={0.1} value={walkSpeed} onChange={(e) => setWalkSpeed(Math.max(0.1, Number(e.target.value) || 0.1))} className="mt-1.5" />
                </label>
                <label className="text-xs text-muted-foreground">Distance (km)
                  <Input type="number" min={0.1} step={0.1} value={walkDistance} onChange={(e) => setWalkDistance(Math.max(0.1, Number(e.target.value) || 0.1))} className="mt-1.5" />
                </label>
                <label className="text-xs text-muted-foreground">Incline (degrees)
                  <Input type="number" min={0} max={20} step={0.5} value={walkIncline} onChange={(e) => setWalkIncline(Math.min(20, Math.max(0, Number(e.target.value) || 0)))} className="mt-1.5" />
                </label>
                <p className="text-xs text-muted-foreground sm:col-span-3">Estimated time: {activeMinutes} min</p>
              </div>
            ) : (
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Duration (minutes)</label>
              <Input type="number" min={1} value={minutes} onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 0))} className="mt-1.5" />
              <div className="flex gap-1.5 mt-2">
                {[10, 15, 30, 45, 60, 90].map((m) => (
                  <button key={m} onClick={() => setMinutes(m)}
                    className={`flex-1 py-1.5 rounded-md text-xs border ${minutes === m ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            )}
            {isStrength && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs text-muted-foreground">Weight (kg)
                  <Input type="number" min={0} step={0.5} value={resistanceKg} onChange={(e) => setResistanceKg(Math.max(0, Number(e.target.value) || 0))} className="mt-1.5" />
                </label>
                <label className="text-xs text-muted-foreground">Reps per set
                  <Input type="number" min={1} value={repsPerSet} onChange={(e) => setRepsPerSet(Math.max(1, Number(e.target.value) || 1))} className="mt-1.5" />
                </label>
                <label className="text-xs text-muted-foreground">Sets
                  <Input type="number" min={1} value={sets} onChange={(e) => setSets(Math.max(1, Number(e.target.value) || 1))} className="mt-1.5" />
                </label>
              </div>
            )}
            <div className="rounded-xl p-4 border border-primary/30" style={{ background: "var(--gradient-hero)" }}>
              <div className="flex items-center gap-3">
                <Flame className="size-6 text-primary" />
                <div>
                  <p className="text-2xl font-bold gradient-text">{preview} kcal</p>
                  <p className="text-xs text-muted-foreground">{activeMinutes} min · {isStrength ? `${sets} sets × ${repsPerSet} reps · ${resistanceKg} kg` : isCustomWalk ? `${walkDistance} km · ${walkSpeed} km/h · ${walkIncline}° incline` : `at ${bodyWeightKg} kg`}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
              <Button onClick={submit} className="flex-1">Log it</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CatChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1 rounded-full border transition-all ${
        active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

export function ActivityReportSummary() {
  const { entries, loaded } = useActivityEntries();
  const week = useMemo(() => activityStats(entries, 7), [entries]);
  const month = useMemo(() => activityStats(entries, 30), [entries]);
  if (!loaded) return null;

  return (
    <div className="card-elevated rounded-2xl border border-border/60 p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Dumbbell className="size-4" /> Activity
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border/60 p-3">
          <p className="text-xs text-muted-foreground">7-day avg burn</p>
          <p className="font-bold text-lg">{week.avg.calories} kcal</p>
          <p className="text-[11px] text-muted-foreground">{week.avg.minutes} min/day</p>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <p className="text-xs text-muted-foreground">30-day total</p>
          <p className="font-bold text-lg">{month.total.calories} kcal</p>
          <p className="text-[11px] text-muted-foreground">{month.total.minutes} min moved</p>
        </div>
      </div>
    </div>
  );
}
