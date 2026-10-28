import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { validISODate, defaultDate } from "../util";

const nonNeg = z.number().min(0).max(10000);

export default defineTool({
  name: "log_food",
  title: "Log a food entry",
  description:
    "Log food the user ate on a date with its nutrition totals (calories, protein, carbs, fiber, sugar). Values are totals for the amount eaten, not per 100 g.",
  inputSchema: {
    name: z.string().min(1).max(200).describe("Food name, e.g. 'Chicken breast (cooked)'."),
    calories: nonNeg.describe("Total calories (kcal) for the amount eaten."),
    protein: nonNeg.optional().describe("Total protein in grams. Defaults to 0."),
    carbs: nonNeg.optional().describe("Total carbohydrates in grams. Defaults to 0."),
    fiber: nonNeg.optional().describe("Total fiber in grams. Defaults to 0."),
    sugar: nonNeg.optional().describe("Total sugar in grams. Defaults to 0."),
    grams: nonNeg.optional().describe("Amount eaten in grams or ml. Defaults to 100."),
    unit: z.enum(["g", "ml"]).optional().describe("Unit for the amount. Defaults to 'g'."),
    emoji: z.string().min(1).max(8).optional().describe("A short emoji shown next to the entry. Defaults to 🍽️."),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe("Date the food was eaten, as YYYY-MM-DD in the user's local time. Defaults to today (UTC)."),
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
    const id = crypto.randomUUID();
    const macros = {
      calories: args.calories,
      protein: args.protein ?? 0,
      carbs: args.carbs ?? 0,
      fiber: args.fiber ?? 0,
      sugar: args.sugar ?? 0,
    };
    const grams = args.grams ?? 100;
    const emoji = args.emoji?.trim() || "🍽️";
    const supabase = supabaseForUser(ctx);
    const { error } = await supabase.from("food_entries").insert({
      id,
      user_id: userId,
      date_iso: date,
      name: args.name.trim(),
      emoji,
      grams,
      unit: args.unit ?? "g",
      macros,
    });
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [
        {
          type: "text",
          text: `Logged ${emoji} ${args.name.trim()} (${grams}${args.unit ?? "g"}, ${macros.calories} kcal, ${macros.protein} g protein) for ${date}.`,
        },
      ],
      structuredContent: { entry_id: id, date, name: args.name.trim(), emoji, grams, unit: args.unit ?? "g", macros },
    };
  },
});
