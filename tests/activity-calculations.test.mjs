import { describe, expect, test } from "bun:test";
import {
  computeCaloriesBurned,
  computeCustomWalk,
  computeStrengthCaloriesBurned,
} from "../src/lib/activity-calculations.ts";

describe("activity calorie estimates", () => {
  test("a flat 5 km walk at 5 km/h lasts one hour", () => {
    expect(computeCustomWalk(5, 5, 0, 70, "male").minutes).toBe(60);
  });

  test("incline and distance affect custom-walk calories", () => {
    const flat = computeCustomWalk(5, 2, 0, 70, "male");
    const uphill = computeCustomWalk(5, 2, 10, 70, "male");
    expect(uphill.caloriesBurned).toBeGreaterThan(flat.caloriesBurned);
  });

  test("strength workload affects the estimate and remains capped", () => {
    const base = computeCaloriesBurned(5, 30, 70, "male");
    const loaded = computeStrengthCaloriesBurned(5, 30, 70, "male", 80, 10, 4);
    expect(loaded).toBeGreaterThan(base);
    expect(loaded).toBeLessThanOrEqual(Math.round(base * 1.4));
  });
});