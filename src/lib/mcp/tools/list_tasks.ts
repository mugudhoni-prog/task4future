import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { validISODate, defaultDate, type TaskRow } from "../util";

const toTaskJson = (t: TaskRow, date: string) => ({
  id: t.id,
  title: t.title,
  emoji: t.emoji ?? "✨",
  done: !!t.history?.[date],
  scheduled_days: t.days ?? [],
});

export default defineTool({
  name: "list_tasks",
  title: "List tasks",
  description:
    "List the signed-in user's scheduled daily tasks for a date, with their done state. Use this before marking a task so you have task IDs.",
  inputSchema: {
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Date to list tasks for, as YYYY-MM-DD in the user's local time. Defaults to today (UTC)."),
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
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("tasks").select("*").order("created_at");
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const rows = (data ?? []) as unknown as TaskRow[];
    const scheduled = rows
      .filter((t) => (t.created_at ?? "").slice(0, 10) <= date)
      .filter((t) => !t.days || t.days.length === 0 || t.days.includes(weekday));
    const done = scheduled.filter((t) => t.history?.[date]).length;
    const text =
      scheduled.length === 0
        ? `No tasks scheduled for ${date}.`
        : `${done}/${scheduled.length} done for ${date}:\n` +
          scheduled.map((t) => `${t.id}: ${t.history?.[date] ? "[x]" : "[ ]"} ${t.emoji ?? "✨"} ${t.title}`).join("\n");
    return {
      content: [{ type: "text", text }],
      structuredContent: { date, done, total: scheduled.length, tasks: scheduled.map((t) => toTaskJson(t, date)) },
    };
  },
});
