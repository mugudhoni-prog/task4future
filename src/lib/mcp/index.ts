import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTasks from "./tools/list_tasks";
import markTask from "./tools/mark_task";
import addTask from "./tools/add_task";
import logFood from "./tools/log_food";
import logActivity from "./tools/log_activity";
import dailySummary from "./tools/daily_summary";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "daily-punch",
  title: "Daily Punch",
  version: "0.1.0",
  instructions:
    "Tools for Daily Punch, a daily habit, food and activity tracker. Callers act as the signed-in Punch user. " +
    "Use `list_tasks` to see a day's tasks and get IDs, `mark_task` to punch a task done, `add_task` to add a routine task, " +
    "`log_food` to log meals with macros, `log_activity` to log workouts, and `daily_summary` for tasks + nutrition + activity progress. " +
    "Always pass dates as YYYY-MM-DD in the user's local time.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
    requireOAuthClientClaim: true,
  }),
  tools: [listTasks, markTask, addTask, logFood, logActivity, dailySummary],
});
