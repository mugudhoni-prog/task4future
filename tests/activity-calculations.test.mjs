import assert from "node:assert/strict";
import {
  computeCaloriesBurned,
  computeCustomWalk,
  computeStrengthCaloriesBurned,
} from "../src/lib/activity-calculations.ts";

const flat = computeCustomWalk(5, 5, 0, 70, "male");
assert.equal(flat.minutes, 60, "a flat 5 km walk at 5 km/h lasts one hour");

const shortFlat = computeCustomWalk(5, 2, 0, 70, "male");
const uphill = computeCustomWalk(5, 2, 10, 70, "male");
assert.ok(uphill.caloriesBurned > shortFlat.caloriesBurned, "incline increases estimated walk calories");

const base = computeCaloriesBurned(5, 30, 70, "male");
const loaded = computeStrengthCaloriesBurned(5, 30, 70, "male", 80, 10, 4);
assert.ok(loaded > base, "weights, reps and sets affect the strength estimate");
assert.ok(loaded <= Math.round(base * 1.4), "strength adjustment is capped");
console.log("Activity calorie calculations passed.");