import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useTasks,
  toISO,
  fromISO,
  addDays,
  todayISO,
  tasksForDate,
  missedYesterday,
  getMotivation,
  computeStats,
  type Task,
} from "@/lib/tracker-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Check,
  Flame,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Punch — Daily Habit & Task Tracker" },
      { name: "description", content: "Punch in your daily duties. Track streaks, get reminders for missed tasks, and weekly/monthly reports on your consistency." },
      { property: "og:title", content: "Punch — Daily Habit & Task Tracker" },
      { property: "og:description", content: "Track daily tasks, build streaks, stay consistent." },
    ],
  }),
  component: PunchApp,
});

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function PunchApp() {
  const { tasks, loaded, addTask, toggle, remove } = useTasks();
  const [selectedISO, setSelectedISO] = useState<string>(todayISO());
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<"day" | "reports">("day");
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const selectedDate = fromISO(selectedISO);
  const dayTasks = useMemo(() => tasksForDate(tasks, selectedDate), [tasks, selectedISO]);
  const missed = useMemo(() => missedYesterday(tasks), [tasks]);
  const motivation = useMemo(() => getMotivation(), []);
  const weekStats = useMemo(() => computeStats(tasks, 7), [tasks]);
  const monthStats = useMemo(() => computeStats(tasks, 30), [tasks]);

  const isToday = selectedISO === todayISO();
  const isFuture = selectedDate > new Date(new Date().setHours(23, 59, 59, 999));

  if (!loaded) return null;

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow">
              <Flame className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Punch</h1>
              <p className="text-xs text-muted-foreground">Show up. Every day.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
            >
              <CalendarDays className="size-4" /> Days
            </Button>
            <Button
              variant={view === "reports" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("reports")}
            >
              <TrendingUp className="size-4" /> Reports
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Missed-yesterday reminder */}
        {view === "day" && missed.length > 0 && (
          <div className="rounded-2xl border border-accent/30 p-5 relative overflow-hidden"
               style={{ background: "var(--gradient-hero)" }}>
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 text-accent shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-accent-foreground">
                  You missed {missed.length} task{missed.length > 1 ? "s" : ""} yesterday
                </p>
                <p className="text-base mt-1 font-medium gradient-text">{motivation}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {missed.map((t) => (
                    <span key={t.id} className="text-xs px-2.5 py-1 rounded-full bg-background/60 border border-border">
                      {t.emoji} {t.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "day" ? (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            {/* Left: today + tasks */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {isToday ? "Today" : DAY_FULL[selectedDate.getDay()]}
                  </p>
                  <h2 className="text-3xl font-bold mt-1">
                    {selectedDate.toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                </div>
                <Button onClick={() => setShowAdd(true)}>
                  <Plus className="size-4" /> New task
                </Button>
              </div>

              <DayProgress tasks={dayTasks} dateISO={selectedISO} />

              <div className="space-y-2">
                {dayTasks.length === 0 ? (
                  <EmptyState onAdd={() => setShowAdd(true)} />
                ) : (
                  dayTasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      dateISO={selectedISO}
                      disabled={isFuture}
                      onToggle={() => toggle(t.id, selectedISO)}
                      onRemove={() => remove(t.id)}
                    />
                  ))
                )}
              </div>
            </section>

            {/* Right: calendar + week strip */}
            <aside className="space-y-4">
              <WeekStrip selectedISO={selectedISO} onPick={setSelectedISO} tasks={tasks} />
              <CalendarPanel
                month={calMonth}
                onMonthChange={setCalMonth}
                selectedISO={selectedISO}
                onPick={setSelectedISO}
                tasks={tasks}
              />
              <StreakCard streak={weekStats.streak} />
            </aside>
          </div>
        ) : (
          <ReportsView weekStats={weekStats} monthStats={monthStats} tasks={tasks} />
        )}
      </main>

      <AddTaskDialog open={showAdd} onOpenChange={setShowAdd} onAdd={addTask} />
    </div>
  );
}

function DayProgress({ tasks, dateISO }: { tasks: Task[]; dateISO: string }) {
  const done = tasks.filter((t) => t.history[dateISO]).length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : (done / total) * 100;
  return (
    <div className="card-elevated rounded-2xl p-4 border border-border/60">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm text-muted-foreground">Progress</span>
        <span className="text-sm font-semibold">
          {done}/{total} {total > 0 && <span className="text-muted-foreground">· {Math.round(pct)}%</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "var(--gradient-accent)" }}
        />
      </div>
    </div>
  );
}

function TaskRow({
  task,
  dateISO,
  disabled,
  onToggle,
  onRemove,
}: {
  task: Task;
  dateISO: string;
  disabled: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const done = !!task.history[dateISO];
  return (
    <div
      className={`card-elevated rounded-xl border border-border/60 p-4 flex items-center gap-3 transition-all ${
        done ? "opacity-60" : ""
      }`}
    >
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`size-10 rounded-lg shrink-0 flex items-center justify-center border-2 transition-all ${
          done
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border hover:border-primary"
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label={done ? "Mark as not done" : "Mark as done"}
      >
        {done ? <Check className="size-5" strokeWidth={3} /> : <span className="text-lg">{task.emoji}</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${done ? "line-through" : ""}`}>{task.title}</p>
        <p className="text-xs text-muted-foreground">
          {task.days.length === 0
            ? "Every day"
            : task.days.map((d) => DAY_FULL[d]).join(" · ")}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors p-2"
        aria-label="Delete task"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card-elevated rounded-2xl border border-dashed border-border p-10 text-center">
      <div className="text-4xl mb-3">🥊</div>
      <h3 className="font-semibold">No tasks for this day</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Add habits like Gym, Walk, Read, Eat clean — and start punching them daily.
      </p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="size-4" /> Add your first task
      </Button>
    </div>
  );
}

function WeekStrip({
  selectedISO,
  onPick,
  tasks,
}: {
  selectedISO: string;
  onPick: (iso: string) => void;
  tasks: Task[];
}) {
  // Current week (Sun..Sat) containing today
  const today = new Date();
  const start = addDays(today, -today.getDay());
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="card-elevated rounded-2xl p-3 border border-border/60">
      <p className="text-xs uppercase tracking-widest text-muted-foreground px-2 pb-2">This week</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const iso = toISO(d);
          const dayT = tasksForDate(tasks, d);
          const doneCount = dayT.filter((t) => t.history[iso]).length;
          const allDone = dayT.length > 0 && doneCount === dayT.length;
          const isSel = iso === selectedISO;
          const isFuture = d > new Date(new Date().setHours(23, 59, 59, 999));
          return (
            <button
              key={iso}
              onClick={() => onPick(iso)}
              className={`flex flex-col items-center py-2 rounded-lg transition-all ${
                isSel
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              } ${isFuture ? "opacity-50" : ""}`}
            >
              <span className="text-[10px] uppercase opacity-70">{DAY_LABELS[i]}</span>
              <span className="text-base font-bold">{d.getDate()}</span>
              <span
                className={`size-1.5 rounded-full mt-1 ${
                  allDone ? "bg-success" : doneCount > 0 ? "bg-warning" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarPanel({
  month,
  onMonthChange,
  selectedISO,
  onPick,
  tasks,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  selectedISO: string;
  onPick: (iso: string) => void;
  tasks: Task[];
}) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(month.getFullYear(), month.getMonth(), i));

  const todayISOv = todayISO();

  return (
    <div className="card-elevated rounded-2xl p-4 border border-border/60">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-secondary"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="font-semibold text-sm">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-secondary"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((d, i) => (
          <span key={i} className="text-[10px] text-muted-foreground uppercase py-1">
            {d}
          </span>
        ))}
        {cells.map((c, i) => {
          if (!c) return <span key={i} />;
          const iso = toISO(c);
          const dayT = tasksForDate(tasks, c);
          const doneCount = dayT.filter((t) => t.history[iso]).length;
          const pct = dayT.length === 0 ? 0 : doneCount / dayT.length;
          const isSel = iso === selectedISO;
          const isTodayD = iso === todayISOv;
          return (
            <button
              key={iso}
              onClick={() => onPick(iso)}
              className={`aspect-square rounded-lg text-xs relative flex items-center justify-center transition-all ${
                isSel
                  ? "bg-primary text-primary-foreground font-bold"
                  : isTodayD
                    ? "border border-primary/60"
                    : "hover:bg-secondary"
              }`}
            >
              {c.getDate()}
              {pct > 0 && !isSel && (
                <span
                  className="absolute bottom-1 size-1 rounded-full"
                  style={{
                    backgroundColor:
                      pct === 1 ? "var(--success)" : "var(--warning)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StreakCard({ streak }: { streak: number }) {
  return (
    <div className="rounded-2xl p-5 border border-primary/30 relative overflow-hidden"
         style={{ background: "var(--gradient-hero)" }}>
      <div className="flex items-center gap-3">
        <Flame className="size-8 text-primary" />
        <div>
          <p className="text-3xl font-bold gradient-text">{streak}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">day streak</p>
        </div>
      </div>
    </div>
  );
}

function ReportsView({
  weekStats,
  monthStats,
  tasks,
}: {
  weekStats: ReturnType<typeof computeStats>;
  monthStats: ReturnType<typeof computeStats>;
  tasks: Task[];
}) {
  // per-task consistency in last 30 days
  const perTask = tasks.map((t) => {
    let scheduled = 0;
    let done = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(new Date(), -i);
      const iso = toISO(d);
      if (d < fromISO(t.createdAt.slice(0, 10))) continue;
      if (t.days.length > 0 && !t.days.includes(d.getDay())) continue;
      scheduled++;
      if (t.history[iso]) done++;
    }
    return {
      task: t,
      pct: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100),
      done,
      scheduled,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Streak" value={`${weekStats.streak}d`} accent />
        <StatCard label="This week" value={`${weekStats.pct}%`} sub={`${weekStats.done}/${weekStats.scheduled} done`} />
        <StatCard label="Last 30 days" value={`${monthStats.pct}%`} sub={`${monthStats.done}/${monthStats.scheduled} done`} />
      </div>

      <div className="card-elevated rounded-2xl border border-border/60 p-5">
        <h3 className="font-semibold mb-4">Weekly activity</h3>
        <div className="flex items-end gap-2 h-40">
          {weekStats.perDay.map((d) => {
            const pct = d.scheduled === 0 ? 0 : (d.done / d.scheduled) * 100;
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-secondary rounded-md relative" style={{ height: "100%" }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-md transition-all"
                    style={{ height: `${pct}%`, background: "var(--gradient-accent)" }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {DAY_LABELS[fromISO(d.date).getDay()]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-elevated rounded-2xl border border-border/60 p-5">
        <h3 className="font-semibold mb-4">Last 30 days · per task</h3>
        {perTask.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add some tasks to see your consistency.</p>
        ) : (
          <div className="space-y-3">
            {perTask.map(({ task, pct, done, scheduled }) => (
              <div key={task.id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium">
                    {task.emoji} {task.title}
                  </span>
                  <span className="text-muted-foreground">
                    {done}/{scheduled} · {pct}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: "var(--gradient-accent)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-5 border ${accent ? "border-primary/30" : "border-border/60 card-elevated"}`}
      style={accent ? { background: "var(--gradient-hero)" } : undefined}
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ? "gradient-text" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

const EMOJI_CHOICES = ["💪", "🏃", "🚶", "🥗", "📚", "🧘", "💧", "😴", "💼", "✍️", "🎯", "🔥"];

function AddTaskDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onAdd: (title: string, emoji: string, days: number[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [days, setDays] = useState<number[]>([]);

  const submit = () => {
    if (!title.trim()) return;
    onAdd(title, emoji, days);
    setTitle("");
    setEmoji("🔥");
    setDays([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Name</label>
            <Input
              autoFocus
              placeholder="e.g. Morning gym"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Icon</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`size-10 rounded-lg text-xl flex items-center justify-center border transition-all ${
                    emoji === e
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Repeat ({days.length === 0 ? "Every day" : `${days.length} days/week`})
            </label>
            <div className="flex gap-1.5 mt-1.5">
              {DAY_FULL.map((d, i) => {
                const on = days.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() =>
                      setDays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))
                    }
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      on ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {d.slice(0, 1)}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">Leave empty for every day.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={submit} disabled={!title.trim()} className="flex-1">
              Add task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
