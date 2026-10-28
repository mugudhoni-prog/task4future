import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { validISODate, defaultDate, type TaskRow } from "../util";

export default defineTool({
  name: "mark_task",
  title: "Mark task done or not done",
  description: "Mark one of the user's tasks as done (or undo it) for a specific date. Get the task ID from list_tasks.",
  inputSchema: {
    task_id: z.string().uuid().describe("ID of the task to update, from list_tasks."),
    done: z.boolean().describe("true to mark the task done for that date, false to undo it."),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Date to mark the task for, as YYYY-MM-DD in the user's local time. Defaults to today (UTC)."),
  },
  annotations: { idempotentHint: true, openWorldHint: false },
  handler: async (args, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const date = args.date ?? defaultDate();
    if (!validISODate(date)) {
      return { content: [{ type: "text", text: `Invalid date "${args.date}"; use YYYY-MM-DD.` }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("tasks").select("*").eq("id", args.task_id).maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const row = data as unknown as TaskRow | null;
    if (!row) {
      return {
        content: [{ type: "text", text: "Task not found. Use list_tasks to get the tasks visible to this account." }],
        isError: true,
      };
    }
    const already = !!row.history?.[date];
    if (already === args.done) {
      return {
        content: [{ type: "text", text: `"${row.title}" is already ${args.done ? "done" : "not done"} for ${date}.` }],
        structuredContent: { task_id: row.id, title: row.title, date, done: already, changed: false },
      };
    }
    const history = { ...(row.history ?? {}), [date]: args.done };
    const { error: updateError } = await supabase.from("tasks").update({ history }).eq("id", row.id);
    if (updateError) {
      return { content: [{ type: "text", text: updateError.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Marked "${row.title}" ${args.done ? "done" : "not done"} for ${date}.` }],
      structuredContent: { task_id: row.id, title: row.title, date, done: args.done, changed: true },
    };
  },
});
