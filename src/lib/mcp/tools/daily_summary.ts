import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import {
  validISODate,
  defaultDate,
  computeTargets,
  type TaskRow,
  type FoodRow,
  type ActivityRow,
  type ProfileRow,
} from "../util";

export default defineTool({
  name: "daily_summary",
  title: "Daily summary",
  description:
    "Get the user's Punch day: tasks done vs scheduled (with missed task titles), nutrition totals vs targets, and calories burned from activity.",
  inputSchema: {
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Date to summarize, as YYYY-MM-DD in the user's local time. Defaults to today (UTC)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (args, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const date = args.date ?? defaultDate();
    if (!validISODate(date)) {
      return { content: [{ type: "text", text: `Invalid date "${args.date}"; use YYYY-MM-DD.` }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const [tasksRes, foodRes, activityRes, profileRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at"),
      supabase.from("food_entries").select("*").eq("date_iso", date),
      supabase.from("activity_entries").select("*").eq("date_iso", date),
      supabase.from("profiles").select("*").eq("id", ctx.getUserId() ?? "").maybeSingle(),
    ]);

    const err = [tasksRes.error, foodRes.error, activityRes.error, profileRes.error].find(Boolean);
    if (err) {
      return { content: [{ type: "text", text: err.message }], isError: true };
    }

    const rows = (tasksRes.data ?? []) as unknown as TaskRow[];
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const scheduled = rows
      .filter((t) => (t.created_at ?? "").slice(0, 10) <= date)
      .filter((t) => !t.days || t.days.length === 0 || t.days.includes(weekday));
    const done = scheduled.filter((t) => t.history?.[date]);
    const missed = scheduled.filter((t) => !t.history?.[date]);

    const foods = (foodRes.data ?? []) as unknown as FoodRow[];
    const sum = (k: "calories" | "protein" | "carbs" | "fiber" | "sugar") =>
      +foods.reduce((a, f) => a + (f.macros?.[k] ?? 0), 0).toFixed(1);
    const nutrition = { calories: sum("calories"), protein: sum("protein"), carbs: sum("carbs"), fiber: sum("fiber"), sugar: sum("sugar") };

    const activities = (activityRes.data ?? []) as unknown as ActivityRow[];
    const activeMinutes = activities.reduce((a, x) => a + Number(x.minutes ?? 0), 0);
    const burned = activities.reduce((a, x) => a + Number(x.calories_burned ?? 0), 0);

    const profile = (profileRes.data ?? null) as unknown as ProfileRow | null;
    const targets = profile ? computeTargets(profile) : null;

    const lines = [
      `Punch summary for ${date}:`,
      `• Tasks: ${done.length}/${scheduled.length} done${missed.length ? ` — missed: ${missed.map((t) => t.title).join(", ")}` : ""}`,
      `• Food: ${nutrition.calories} kcal, ${nutrition.protein} g protein, ${nutrition.carbs} g carbs, ${nutrition.fiber} g fiber, ${nutrition.sugar} g sugar (${foods.length} entries)`,
      targets ? `• Targets: ${targets.calories} kcal, ${targets.protein} g protein (BMR ${targets.bmr}, TDEE ${targets.tdee})` : "• No profile set up yet.",
      `• Activity: ${activities.length} session(s), ${activeMinutes} min, ${burned} kcal burned`,
    ];
    return {
      content: [{ type: "text", text: lines.join("\n") }],
      structuredContent: {
        date,
        tasks: { done: done.length, scheduled: scheduled.length, missed: missed.map((t) => ({ id: t.id, title: t.title })) },
        nutrition,
        targets,
        activity: { sessions: activities.length, minutes: activeMinutes, calories_burned: burned },
      },
    };
  },
});
