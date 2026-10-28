import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { validWeekdays } from "../util";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default defineTool({
  name: "add_task",
  title: "Add a task",
  description:
    "Add a daily task to the user's Punch routine. Optionally restrict it to weekdays (0 = Sunday .. 6 = Saturday); empty means every day.",
  inputSchema: {
    title: z.string().min(1).max(200).describe("Task title, e.g. 'Gym 5:30 – 7:00'."),
    emoji: z.string().min(1).max(8).optional().describe("A short emoji shown next to the task. Defaults to ✨."),
    days: z
      .array(z.number().int().min(0).max(6))
      .max(7)
      .optional()
      .describe("Which weekdays the task repeats on (0 = Sunday .. 6 = Saturday). Omit or empty for every day."),
  },
  annotations: { openWorldHint: false },
  handler: async (args, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const userId = ctx.getUserId();
    if (!userId) {
      return { content: [{ type: "text", text: "Could not determine the signed-in user." }], isError: true };
    }
    const days = args.days ?? [];
    if (!validWeekdays(days)) {
      return { content: [{ type: "text", text: "Invalid days; each must be an integer 0 (Sunday) to 6 (Saturday)." }], isError: true };
    }
    const id = crypto.randomUUID();
    const title = args.title.trim();
    const emoji = args.emoji?.trim() || "✨";
    const supabase = supabaseForUser(ctx);
    const { error } = await supabase.from("tasks").insert({
      id,
      user_id: userId,
      title,
      emoji,
      history: {},
      days,
      created_at: new Date().toISOString(),
    });
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const when = days.length === 0 ? "every day" : days.map((d) => DAY_NAMES[d]).join(", ");
    return {
      content: [{ type: "text", text: `Added task "${emoji} ${title}" (${when}). Task ID: ${id}` }],
      structuredContent: { task_id: id, title, emoji, days, repeats: when },
    };
  },
});
