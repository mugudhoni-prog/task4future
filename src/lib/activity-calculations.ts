export type ActivityGender = "male" | "female";

export function computeCaloriesBurned(
  met: number,
  minutes: number,
  weightKg: number,
  gender: ActivityGender = "male",
) {
  const factor = gender === "female" ? 0.9 : 1;
  return +(met * weightKg * (minutes / 60) * factor).toFixed(0);
}

/** Resistance-load modifier on a MET duration estimate; this remains an estimate, not a measured burn. */
export function computeStrengthCaloriesBurned(
  met: number,
  minutes: number,
  bodyWeightKg: number,
  gender: ActivityGender,
  resistanceWeightKg: number,
  repsPerSet: number,
  sets: number,
) {
  const base = computeCaloriesBurned(met, minutes, bodyWeightKg, gender);
  const liftedVolume = Math.max(0, resistanceWeightKg) * Math.max(0, repsPerSet) * Math.max(0, sets);
  const workloadRatio = liftedVolume / Math.max(1, bodyWeightKg) / 10;
  const effortMultiplier = 1 + Math.min(0.4, Math.log1p(workloadRatio) * 0.15);
  return Math.round(base * effortMultiplier);
}

/** Estimates walking MET from speed and incline using the ACSM walking equation. */
export function computeCustomWalk(
  speedKmh: number,
  distanceKm: number,
  inclineDegrees: number,
  weightKg: number,
  gender: ActivityGender,
) {
  const safeSpeed = Math.max(0.1, speedKmh);
  const safeDistance = Math.max(0, distanceKm);
  const safeIncline = Math.max(0, Math.min(20, inclineDegrees));
  const speedMetersPerMinute = (safeSpeed * 1000) / 60;
  const grade = Math.tan((safeIncline * Math.PI) / 180);
  const met = Math.max(1, Math.min(15, (0.1 * speedMetersPerMinute + 1.8 * speedMetersPerMinute * grade + 3.5) / 3.5));
  const minutes = (safeDistance / safeSpeed) * 60;
  return {
    met: +met.toFixed(1),
    minutes,
    caloriesBurned: computeCaloriesBurned(met, minutes, weightKg, gender),
  };
}