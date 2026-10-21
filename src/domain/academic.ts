import type { Course, Grade, RetakeRule } from "./types";
export const POINTS: Record<Exclude<Grade, "I" | "W">, number> = {
  A: 4,
  "A-": 3.67,
  "B+": 3.33,
  B: 3,
  "B-": 2.67,
  "C+": 2.33,
  C: 2,
  "C-": 1.67,
  "D+": 1.33,
  D: 1,
  F: 0,
};
export const GRADES = Object.keys(POINTS) as (keyof typeof POINTS)[];
export function finite(n: number, min = 0, max = Infinity) {
  if (!Number.isFinite(n) || n < min || n > max)
    throw new Error(
      `Enter a valid number between ${min} and ${max === Infinity ? "the supported limit" : max}.`,
    );
  return n;
}
export function gradePoint(g: Grade): number | null {
  return g === "I" || g === "W" ? null : POINTS[g];
}
export function academic(courses: Course[], rule: RetakeRule = "unresolved") {
  const groups = new Map<string, Course[]>();
  for (const c of courses) {
    finite(c.credits, 0.01, 100);
    const key = c.code.trim().toUpperCase() || c.id;
    groups.set(key, [...(groups.get(key) || []), c]);
  }
  let points = 0,
    gpaCredits = 0,
    earned = 0,
    attempted = 0;
  let unresolved = false;
  for (const group of groups.values()) {
    const counted = group.filter((c) => !c.excluded);
    attempted += counted.reduce((s, c) => s + c.credits, 0);
    const passes = counted.filter((c) => (gradePoint(c.grade) ?? 0) > 0);
    earned += passes.length ? Math.max(...passes.map((c) => c.credits)) : 0;
    const graded = counted.filter((c) => gradePoint(c.grade) !== null);
    if (graded.length > 1 && rule === "unresolved") unresolved = true;
    const chosen =
      rule === "highest"
        ? [...graded]
            .sort(
              (a, b) =>
                POINTS[b.grade as keyof typeof POINTS] -
                POINTS[a.grade as keyof typeof POINTS],
            )
            .slice(0, 1)
        : rule === "latest"
          ? [...graded].sort((a, b) => b.attempt - a.attempt).slice(0, 1)
          : graded;
    for (const c of chosen) {
      points += c.credits * (gradePoint(c.grade) ?? 0);
      gpaCredits += c.credits;
    }
  }
  return {
    gpa: unresolved ? null : gpaCredits ? points / gpaCredits : null,
    points: unresolved ? null : points,
    gpaCredits: unresolved ? null : gpaCredits,
    earned,
    attempted,
    unresolved,
  };
}
export function project(
  cgpa: number,
  credits: number,
  future: { credits: number; gpa: number }[],
) {
  finite(cgpa, 0, 4);
  finite(credits);
  let p = cgpa * credits,
    d = credits;
  for (const f of future) {
    finite(f.credits);
    finite(f.gpa, 0, 4);
    p += f.credits * f.gpa;
    d += f.credits;
  }
  return d ? p / d : null;
}
export function targetPlan(
  cgpa: number,
  credits: number,
  target: number,
  remaining: number,
) {
  finite(cgpa, 0, 4);
  finite(credits);
  finite(target, 0, 4);
  finite(remaining);
  const maximum = project(cgpa, credits, [{ credits: remaining, gpa: 4 }]);
  const required = remaining
    ? (target * (credits + remaining) - cgpa * credits) / remaining
    : null;
  return {
    required,
    maximum,
    feasible: remaining ? required! <= 4 : credits > 0 && cgpa >= target,
    alreadySecured: required !== null && required <= 0,
  };
}
// Exhaustive discrete grade DP, bounded explicitly; integer hundredths avoid unstable keys.
export function discretePlan(credits: number[], requiredPoints: number) {
  if (!Number.isFinite(requiredPoints))
    throw new Error("Enter valid starting values and target first.");
  if (!credits.length || credits.length > 10)
    throw new Error("Use 1–10 courses for exact discrete planning.");
  credits.forEach((c) => {
    finite(c, 0.01, 30);
    if (Math.abs(c * 100 - Math.round(c * 100)) > 1e-6)
      throw new Error("Use at most two decimal places for credits.");
  });
  let states = new Map<number, Grade[]>([[0, []]]);
  for (const credit of credits) {
    const next = new Map<number, Grade[]>();
    for (const [sum, grades] of states)
      for (const g of [...GRADES].reverse()) {
        const key =
          sum + Math.round(credit * 100) * Math.round(POINTS[g] * 100);
        if (!next.has(key)) next.set(key, [...grades, g]);
      }
    if (next.size > 200000)
      throw new Error(
        "This combination is too large for exact search. Use fewer courses.",
      );
    states = next;
  }
  const needed = Math.ceil(requiredPoints * 10000 - 1e-6);
  const best = [...states.keys()]
    .filter((k) => k >= needed)
    .sort((a, b) => a - b)[0];
  return best === undefined
    ? null
    : {
        grades: states.get(best)!,
        points: best / 10000,
        gpa: best / 10000 / credits.reduce((a, b) => a + b, 0),
      };
}
export function retakeImpact(
  cgpa: number,
  denominator: number,
  credits: number,
  oldGrade: Grade,
  newGrade: Grade,
  rule: RetakeRule,
) {
  finite(cgpa, 0, 4);
  finite(denominator, 0.01);
  finite(credits, 0.01, denominator);
  if (rule === "unresolved")
    throw new Error("Select an explicit retake treatment first.");
  const old = gradePoint(oldGrade),
    next = gradePoint(newGrade);
  if (old === null || next === null)
    throw new Error("Retake comparisons require numeric grades.");
  if (
    rule !== "all" &&
    (cgpa * denominator < credits * old - 1e-8 ||
      cgpa * denominator - credits * old > 4 * (denominator - credits) + 1e-8)
  )
    throw new Error(
      "Baseline points are inconsistent with the selected old grade.",
    );
  const delta = rule === "highest" ? Math.max(0, next - old) : next - old;
  const points =
    cgpa * denominator + (rule === "all" ? credits * next : credits * delta);
  return points / (denominator + (rule === "all" ? credits : 0));
}
export function minimumRetake(
  cgpa: number,
  d: number,
  c: number,
  old: Grade,
  target: number,
  rule: RetakeRule,
) {
  finite(target, 0, 4);
  return (
    [...GRADES]
      .reverse()
      .find((g) => retakeImpact(cgpa, d, c, old, g, rule) >= target - 1e-10) ??
    null
  );
}
export function retakeCombinations(
  cgpa: number,
  d: number,
  candidates: {
    id: string;
    credits: number;
    old: Grade;
    next: Grade;
    cost: number;
  }[],
  rule: RetakeRule,
  target: number,
  futureCredits: number,
  futureGpa: number,
) {
  if (rule === "unresolved")
    throw new Error("Select an explicit retake treatment first.");
  if (candidates.length > 10) throw new Error("Select at most 10 candidates.");
  finite(cgpa, 0, 4);
  finite(d, 0.01);
  finite(target, 0, 4);
  finite(futureCredits);
  finite(futureGpa, 0, 4);
  candidates.forEach((c) => {
    finite(c.credits, 0.01, d);
    finite(c.cost);
    if (gradePoint(c.old) === null || gradePoint(c.next) === null)
      throw new Error("Use numeric grades.");
  });
  const oldPoints = candidates.reduce(
    (s, c) => s + c.credits * gradePoint(c.old)!,
    0,
  );
  const candidateCredits = candidates.reduce((s, c) => s + c.credits, 0);
  if (candidateCredits > d + 1e-8)
    throw new Error("Candidate credits exceed baseline GPA credits.");
  if (
    rule !== "all" &&
    (cgpa * d < oldPoints - 1e-8 ||
      cgpa * d - oldPoints > 4 * (d - candidateCredits) + 1e-8)
  )
    throw new Error(
      "Baseline points are inconsistent with selected course grades.",
    );
  const results = [];
  for (let mask = 0; mask < 2 ** candidates.length; mask++) {
    let p = cgpa * d,
      den = d,
      cost = 0;
    const ids: string[] = [];
    candidates.forEach((c, i) => {
      if (mask & (1 << i)) {
        const old = gradePoint(c.old)!,
          next = gradePoint(c.next)!;
        p +=
          c.credits *
          (rule === "all"
            ? next
            : rule === "highest"
              ? Math.max(0, next - old)
              : next - old);
        if (rule === "all") den += c.credits;
        cost += c.cost;
        ids.push(c.id);
      }
    });
    const result = (p + futureCredits * futureGpa) / (den + futureCredits);
    const required = futureCredits
      ? (target * (den + futureCredits) - p) / futureCredits
      : null;
    results.push({
      ids,
      cost,
      cgpa: result,
      required,
      feasible: result >= target - 1e-10,
    });
  }
  return results;
}
