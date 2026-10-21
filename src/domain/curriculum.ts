import type { Course, Requirement } from "./types";
export function curriculumPlan(
  requirements: Requirement[],
  courses: Course[],
  load: number,
) {
  if (!Number.isFinite(load) || load <= 0)
    throw new Error("Credit load must be positive.");
  const completed = new Set(
    courses
      .filter((c) => !c.excluded && !["F", "I", "W"].includes(c.grade))
      .map((c) => c.code.toUpperCase()),
  );
  const pending = requirements.filter(
    (r) => r.selected && !completed.has(r.code.toUpperCase()),
  );
  const terms: Requirement[][] = [];
  const available = new Set(completed);
  let rest = [...pending];
  while (rest.length && terms.length < 50) {
    let used = 0;
    const term = rest
      .filter((r) =>
        r.prerequisites.every((p) => available.has(p.toUpperCase())),
      )
      .filter((r) => {
        if (used + r.credits <= load) {
          used += r.credits;
          return true;
        }
        return false;
      });
    if (!term.length) break;
    terms.push(term);
    term.forEach((r) => available.add(r.code.toUpperCase()));
    rest = rest.filter((r) => !term.includes(r));
  }
  return {
    completed,
    pending,
    terms,
    blocked: rest,
    remaining: pending.reduce((s, r) => s + r.credits, 0),
  };
}
