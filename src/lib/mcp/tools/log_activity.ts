import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { validISODate, defaultDate, guessMET, type ProfileRow } from "../util";

export default defineTool({
  name: "log_activity",
  title: "Log an activity",
  description:
    "Log a workout or activity the user did (name, duration). Calories burned are estimated from the user's profile weight and gender unless you pass calories_burned.",
  inputSchema: {
    activity_name: z.string().min(1).max(200).describe("Activity name, e.g. 'Running (10 km/h)' or 'Plank'."),
    minutes: z.number().min(1).max(1440).describe("How long the activity lasted, in minutes."),
    calories_burned: z.number().min(0).max(20000).optional().describe(
      "Calories burned. Omit to estimate from the user's profile (MET × weight × time, lower for females).",
    ),
    emoji: z.string().min(1).max(8).optional().describe("A short emoji shown next to the entry. Defaults to 🏃."),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Date the activity was done, as YYYY-MM-DD in the user's local time. Defaults to today (UTC)."),
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
    const date = args.date ?? defaultDate();
    if (!validISODate(date)) {
      return { content: [{ type: "text", text: `Invalid date "${args.date}"; use YYYY-MM-DD.` }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    let calories = args.calories_burned;
    if (calories === undefined) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      const p = (profile ?? null) as unknown as ProfileRow | null;
      const weight = p?.current_kg && p.current_kg > 0 ? p.current_kg : 65;
      const factor = p?.gender === "female" ? 0.9 : 1;
      calories = +(guessMET(args.activity_name) * weight * (args.minutes / 60) * factor).toFixed(0);
    }

    const id = crypto.randomUUID();
    const emoji = args.emoji?.trim() || "🏃";
    const { error } = await supabase.from("activity_entries").insert({
      id,
      user_id: userId,
      date_iso: date,
      activity_name: args.activity_name.trim(),
      emoji,
      minutes: args.minutes,
      calories_burned: calories,
    });
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [
        { type: "text", text: `Logged ${emoji} ${args.activity_name.trim()} — ${args.minutes} min, ${calories} kcal burned for ${date}.` },
      ],
      structuredContent: {
        entry_id: id,
        date,
        activity_name: args.activity_name.trim(),
        emoji,
        minutes: args.minutes,
        calories_burned: calories,
        estimated: args.calories_burned === undefined,
      },
    };
  },
});
