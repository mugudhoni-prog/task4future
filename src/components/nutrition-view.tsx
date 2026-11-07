import { useMemo, useState } from "react";
import {
  FOOD_DB,
  computeMacros,
  computeTargets,
  dailyTotals,
  entriesForDate,
  nutritionStats,
  todayISO,
  useFoodEntries,
  guessMeal,
  MEAL_LABELS,
  type MealType,
  useGoal,
  type Food,
  type Goal,
  type Macros,
} from "@/lib/nutrition-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Target, Utensils, Trash2, Settings, Flame, Star } from "lucide-react";

export function NutritionView() {
  const { goal, loaded: gLoaded, update } = useGoal();
  const { entries, loaded: eLoaded, add, remove } = useFoodEntries();
  const [openAdd, setOpenAdd] = useState(false);
  const [openGoal, setOpenGoal] = useState(false);
  const today = todayISO();

  const targets = useMemo(() => computeTargets(goal), [goal]);
  const todayTotals = useMemo(() => dailyTotals(entries, today), [entries, today]);
  const todayList = useMemo(() => entriesForDate(entries, today), [entries, today]);
  const week = useMemo(() => nutritionStats(entries, 7), [entries]);
  const month = useMemo(() => nutritionStats(entries, 30), [entries]);
  const favorites = goal.favorites ?? [];
  const favFoods = useMemo(
    () => favorites.map((n) => FOOD_DB.find((f) => f.name === n)).filter((f): f is Food => !!f),
    [favorites],
  );
  const toggleFav = (name: string) =>
    update({ favorites: favorites.includes(name) ? favorites.filter((n) => n !== name) : [...favorites, name] });

  if (!gLoaded || !eLoaded) return null;

  return (
    <div className="space-y-6">
      {/* Targets vs intake */}
      <div className="card-elevated rounded-2xl border border-border/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Today · intake vs target</p>
            <h3 className="text-lg font-semibold mt-1">
              Goal:{" "}
              <span className="gradient-text">
                {goal.currentKg}kg → {goal.targetKg}kg
              </span>{" "}
              <span className="text-sm text-muted-foreground font-normal">
                ({goal.goalType})
              </span>
            </h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpenGoal(true)}>
            <Settings className="size-4" /> Goal
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <MacroProgress label="Calories" unit="kcal" value={todayTotals.calories} target={targets.calories} />
          <MacroProgress label="Protein" unit="g" value={todayTotals.protein} target={targets.protein} />
          <MacroProgress label="Carbs" unit="g" value={todayTotals.carbs} target={targets.carbs} />
          <MacroProgress label="Fiber" unit="g" value={todayTotals.fiber} target={targets.fiber} />
          <MacroProgress label="Sugar" unit="g" value={todayTotals.sugar} target={targets.sugar} isLimit />
        </div>

        <div className="mt-4 text-[11px] text-muted-foreground">
          BMR {targets.bmr} · TDEE {targets.tdee} kcal · Protein {targets.protein}g/day
        </div>
      </div>

      {/* Today's foods */}
      <div className="card-elevated rounded-2xl border border-border/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Utensils className="size-4" /> Today's meals
          </h3>
          <Button size="sm" onClick={() => setOpenAdd(true)}>
            <Plus className="size-4" /> Log food
          </Button>
        </div>
        {favFoods.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
              <Star className="size-3" /> Quick log
            </p>
            <div className="flex flex-wrap gap-1.5">
              {favFoods.map((f) => (
                <button
                  key={f.name}
                  onClick={() =>
                    add({
                      dateISO: today,
                      name: f.name,
                      emoji: f.emoji,
                      grams: f.serving,
                      unit: f.unit || "g",
                      macros: computeMacros(f, f.serving),
                      meal: guessMeal(),
                    })
                  }
                  className="text-xs px-2.5 py-1.5 rounded-full border border-border hover:border-primary/60 transition-all"
                >
                  {f.emoji} {f.name} · {f.serving}{f.unit || "g"}
                </button>
              ))}
            </div>
          </div>
        )}
        {todayList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No food logged yet. Tap "Log food" to start.
          </p>
        ) : (
          <div className="space-y-4">
            {MEAL_LABELS.map((m) => {
              const items = todayList.filter((e) => e.meal === m.id);
              if (items.length === 0) return null;
              const kcal = items.reduce((a, b) => a + b.macros.calories, 0);
              return (
                <div key={m.id}>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 flex justify-between">
                    <span>{m.emoji} {m.label}</span>
                    <span>{Math.round(kcal)} kcal</span>
                  </p>
                  <div className="space-y-2">
                    {items.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
                        <span className="text-2xl">{e.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{e.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.grams}
                            {e.unit} · {e.macros.calories} kcal · P {e.macros.protein}g · C{" "}
                            {e.macros.carbs}g · F {e.macros.fiber}g · S {e.macros.sugar}g
                          </p>
                        </div>
                        <button
                          onClick={() => remove(e.id)}
                          className="text-muted-foreground hover:text-destructive p-2"
                          aria-label="Remove entry"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly + monthly averages */}
      <div className="grid sm:grid-cols-2 gap-4">
        <AvgCard title="Last 7 days · avg" macros={week.avg} targets={targets} />
        <AvgCard title="Last 30 days · avg" macros={month.avg} targets={targets} />
      </div>

      {/* Weekly calorie bar chart */}
      <div className="card-elevated rounded-2xl border border-border/60 p-5">
        <h3 className="font-semibold mb-4">Weekly calories</h3>
        <div className="flex items-end gap-2 h-40">
          {week.perDay.map((d) => {
            const pct = Math.min(100, (d.macros.calories / Math.max(targets.calories, 1)) * 100);
            const date = new Date(d.date);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-secondary rounded-md relative h-full">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-md transition-all"
                    style={{ height: `${pct}%`, background: "var(--gradient-accent)" }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {date.toLocaleDateString(undefined, { weekday: "narrow" })}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(d.macros.calories)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AddFoodDialog open={openAdd} onOpenChange={setOpenAdd} onAdd={add} favorites={favorites} onToggleFav={toggleFav} />
      <GoalDialog open={openGoal} onOpenChange={setOpenGoal} goal={goal} onSave={update} />
    </div>
  );
}

function MacroProgress({
  label,
  unit,
  value,
  target,
  isLimit,
}: {
  label: string;
  unit: string;
  value: number;
  target: number;
  isLimit?: boolean;
}) {
  const pct = Math.min(100, (value / Math.max(target, 1)) * 100);
  const over = value > target;
  const color = isLimit
    ? over
      ? "var(--destructive)"
      : "var(--gradient-accent)"
    : "var(--gradient-accent)";
  return (
    <div className="rounded-xl p-3 border border-border/60">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-1">
        {Math.round(value)}
        <span className="text-xs text-muted-foreground font-normal"> / {target} {unit}</span>
      </p>
      <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function AvgCard({
  title,
  macros,
  targets,
}: {
  title: string;
  macros: Macros;
  targets: ReturnType<typeof computeTargets>;
}) {
  const rows: [string, number, number, string][] = [
    ["Calories", macros.calories, targets.calories, "kcal"],
    ["Protein", macros.protein, targets.protein, "g"],
    ["Carbs", macros.carbs, targets.carbs, "g"],
    ["Fiber", macros.fiber, targets.fiber, "g"],
    ["Sugar", macros.sugar, targets.sugar, "g"],
  ];
  return (
    <div className="card-elevated rounded-2xl border border-border/60 p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{title}</p>
      <div className="space-y-2">
        {rows.map(([label, val, tgt, unit]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">
              {Math.round(Number(val))} {unit}{" "}
              <span className="text-muted-foreground text-xs">/ {tgt}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddFoodDialog({
  open,
  onOpenChange,
  onAdd,
  favorites,
  onToggleFav,
}: {
  open: boolean;
  favorites: string[];
  onToggleFav: (name: string) => void;
  onOpenChange: (b: boolean) => void;
  onAdd: (e: {
    dateISO: string;
    name: string;
    emoji: string;
    grams: number;
    unit: "g" | "ml";
    macros: Macros;
    meal: MealType;
  }) => void;
}) {
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState<MealType>(guessMeal());
  const [picked, setPicked] = useState<Food | null>(null);
  const [qty, setQty] = useState<number>(100);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const favs = FOOD_DB.filter((f) => favorites.includes(f.name));
      return [...favs, ...FOOD_DB.filter((f) => !favorites.includes(f.name)).slice(0, 12)];
    }
    return FOOD_DB.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 20);
  }, [query, favorites]);

  const macros = picked ? computeMacros(picked, qty) : null;

  const submit = () => {
    if (!picked || qty <= 0) return;
    onAdd({
      dateISO: todayISO(),
      name: picked.name,
      emoji: picked.emoji,
      grams: qty,
      unit: picked.unit || "g",
      macros: computeMacros(picked, qty),
      meal,
    });
    setPicked(null);
    setQty(100);
    setQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(b) => {
        if (!b) {
          setPicked(null);
          setQty(100);
          setQuery("");
        }
        onOpenChange(b);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log food</DialogTitle>
        </DialogHeader>

        {!picked ? (
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Search food (e.g. rice, chicken, banana)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No matches. Try another name.
                </p>
              ) : (
                filtered.map((f) => (
                  <div key={f.name} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setPicked(f);
                      setQty(f.serving);
                      setMeal(guessMeal());
                    }}
                    className="flex-1 min-w-0 flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/60 text-left transition-all"
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{f.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {f.per100.calories} kcal · {f.per100.protein}g protein per 100
                        {f.unit || "g"}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => onToggleFav(f.name)}
                    aria-label={favorites.includes(f.name) ? "Unpin from quick log" : "Pin to quick log"}
                    className="p-2.5 rounded-lg border border-border/60 hover:border-primary/60"
                  >
                    <Star className={`size-4 ${favorites.includes(f.name) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
              <span className="text-3xl">{picked.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold">{picked.name}</p>
                <p className="text-xs text-muted-foreground">
                  Per 100{picked.unit || "g"}: {picked.per100.calories} kcal · P{" "}
                  {picked.per100.protein}g
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>
                Change
              </Button>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Meal</label>
              <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                {MEAL_LABELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMeal(m.id)}
                    className={`py-1.5 rounded-md text-[11px] border transition-all ${
                      meal === m.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Quantity ({picked.unit || "g"})
              </label>
              <Input
                type="number"
                value={qty}
                min={0}
                onChange={(e) => setQty(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            {macros && (
              <div className="rounded-xl border border-border/60 p-3 text-sm space-y-1">
                <Row label="Calories" value={`${macros.calories} kcal`} />
                <Row label="Protein" value={`${macros.protein} g`} />
                <Row label="Carbs" value={`${macros.carbs} g`} />
                <Row label="Fiber" value={`${macros.fiber} g`} />
                <Row label="Sugar" value={`${macros.sugar} g`} />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={submit} className="flex-1" disabled={qty <= 0}>
                Add
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function GoalDialog({
  open,
  onOpenChange,
  goal,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  goal: Goal;
  onSave: (g: Partial<Goal>) => void;
}) {
  const [g, setG] = useState<Goal>(goal);

  // resync when reopened
  useMemo(() => {
    if (open) setG(goal);
  }, [open, goal]);

  const targets = useMemo(() => computeTargets(g), [g]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="size-4" /> Your goal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name">
            <Input value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} />
          </Field>
          <Field label="Gender">
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((gd) => (
                <button
                  key={gd}
                  onClick={() => setG({ ...g, gender: gd })}
                  className={`py-2 rounded-lg text-sm font-medium border capitalize transition-all ${
                    g.gender === gd
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {gd}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <Input
                type="number"
                value={g.age}
                onChange={(e) => setG({ ...g, age: Number(e.target.value) })}
              />
            </Field>
            <Field label="Height (cm)">
              <Input
                type="number"
                value={g.heightCm}
                onChange={(e) => setG({ ...g, heightCm: Number(e.target.value) })}
              />
            </Field>
            <Field label="Current (kg)">
              <Input
                type="number"
                value={g.currentKg}
                onChange={(e) => setG({ ...g, currentKg: Number(e.target.value) })}
              />
            </Field>
            <Field label="Target (kg)">
              <Input
                type="number"
                value={g.targetKg}
                onChange={(e) => setG({ ...g, targetKg: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Goal">
            <div className="grid grid-cols-3 gap-2">
              {(["lose", "maintain", "gain"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setG({ ...g, goalType: t })}
                  className={`py-2 rounded-lg text-sm font-medium border capitalize transition-all ${
                    g.goalType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Activity">
            <div className="grid grid-cols-4 gap-2">
              {[
                { l: "Low", v: 1.2 },
                { l: "Light", v: 1.375 },
                { l: "Mod", v: 1.55 },
                { l: "High", v: 1.725 },
              ].map((a) => (
                <button
                  key={a.v}
                  onClick={() => setG({ ...g, activity: a.v })}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    g.activity === a.v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {a.l}
                </button>
              ))}
            </div>
          </Field>

          <div className="rounded-xl p-3 border border-primary/30"
               style={{ background: "var(--gradient-hero)" }}>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Your daily target
            </p>
            <p className="text-2xl font-bold gradient-text mt-1">
              {targets.calories} kcal · {targets.protein}g protein
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Carbs ~{targets.carbs}g · Fiber {targets.fiber}g · Sugar &lt;{targets.sugar}g
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(g);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

// Compact summary card used in the Reports view.
export function NutritionReportSummary() {
  const { goal, loaded: gL } = useGoal();
  const { entries, loaded: eL } = useFoodEntries();
  const targets = useMemo(() => computeTargets(goal), [goal]);
  const week = useMemo(() => nutritionStats(entries, 7), [entries]);
  const month = useMemo(() => nutritionStats(entries, 30), [entries]);
  if (!gL || !eL) return null;
  return (
    <div className="card-elevated rounded-2xl border border-border/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="size-4 text-primary" />
        <h3 className="font-semibold">Nutrition report</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <AvgCard title="Last 7 days · avg" macros={week.avg} targets={targets} />
        <AvgCard title="Last 30 days · avg" macros={month.avg} targets={targets} />
      </div>
    </div>
  );
}
