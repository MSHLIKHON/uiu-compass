import { describe, it, expect } from "vitest";
import {
  academic,
  project,
  targetPlan,
  discretePlan,
  retakeImpact,
  minimumRetake,
  retakeCombinations,
  POINTS,
} from "../src/domain/academic";
import type { Course } from "../src/domain/types";
const course = (
  code: string,
  credits: number,
  grade: Course["grade"],
  attempt = 1,
): Course => ({
  id: `${code}-${attempt}`,
  code,
  title: code,
  credits,
  grade,
  attempt,
  term: "Term 1",
  category: "core",
  excluded: false,
});
describe("Official grade-point fixtures (indexed UIU source)", () => {
  it("uses published grade points", () => {
    expect(POINTS["A-"]).toBe(3.67);
    expect(POINTS["B+"]).toBe(3.33);
    expect(POINTS.D).toBe(1);
  });
  it("weights different and decimal credits", () => {
    const r = academic([course("A", 3, "A"), course("B", 1.5, "B+")]);
    expect(r.gpa).toBeCloseTo((12 + 4.995) / 4.5, 10);
    expect(r.earned).toBe(4.5);
  });
  it("counts F with zero points and no earned credits", () => {
    const r = academic([course("A", 3, "A"), course("B", 3, "F")]);
    expect(r.gpa).toBe(2);
    expect(r.earned).toBe(3);
    expect(r.gpaCredits).toBe(6);
  });
  it("computes cumulative weighted GPA", () =>
    expect(project(3, 30, [{ credits: 12, gpa: 4 }])).toBeCloseTo(
      138 / 42,
      12,
    ));
});
describe("Explicit engineering assumptions (NOT official-rule fixtures)", () => {
  it("I/W excluded provisionally, attempted distinct", () => {
    const r = academic([course("A", 3, "I"), course("B", 1, "W")]);
    expect(r.gpa).toBeNull();
    expect(r.attempted).toBe(4);
    expect(r.earned).toBe(0);
  });
  it("withholds unresolved repeat CGPA", () => {
    expect(
      academic([course("A", 3, "F"), course("A", 3, "B", 2)]).gpa,
    ).toBeNull();
  });
  it("does not duplicate earned degree credits", () => {
    const r = academic([course("A", 3, "C"), course("A", 3, "B", 2)], "all");
    expect(r.earned).toBe(3);
    expect(r.gpaCredits).toBe(6);
  });
  it("distinguishes latest from highest after repeated retakes", () => {
    const c = [
      course("A", 3, "C"),
      course("A", 3, "A", 2),
      course("A", 3, "B", 3),
    ];
    expect(academic(c, "latest").gpa).toBe(3);
    expect(academic(c, "highest").gpa).toBe(4);
    expect(academic(c, "all").gpa).toBe(3);
  });
  it("manual exclusions affect all totals", () => {
    const r = academic([{ ...course("A", 3, "A"), excluded: true }]);
    expect(r.attempted).toBe(0);
    expect(r.gpa).toBeNull();
  });
  it("supports retake replacement assumptions", () => {
    expect(retakeImpact(2, 30, 3, "F", "A", "highest")).toBe(2.4);
    expect(retakeImpact(3, 30, 3, "A", "B", "highest")).toBe(3);
    expect(retakeImpact(3, 30, 3, "A", "B", "latest")).toBe(2.9);
    expect(retakeImpact(2, 30, 3, "F", "A", "all")).toBeCloseTo(72 / 33);
  });
  it("requires explicit rule and numeric grades", () => {
    expect(() => retakeImpact(3, 30, 3, "F", "A", "unresolved")).toThrow();
    expect(() => retakeImpact(3, 30, 3, "I", "A", "all")).toThrow();
  });
  it("searches discrete minimum retake grade", () =>
    expect(minimumRetake(2, 30, 3, "F", 2.3, "highest")).toBe("B"));
  it("searches every candidate subset and includes no retake", () => {
    const r = retakeCombinations(
      2,
      30,
      [
        { id: "a", credits: 3, old: "F", next: "A", cost: 975000 },
        { id: "b", credits: 3, old: "D", next: "A", cost: 975000 },
      ],
      "highest",
      2.5,
      0,
      4,
    );
    expect(r).toHaveLength(4);
    expect(r.find((x) => x.ids.length === 2)?.cgpa).toBe(2.7);
    expect(r.filter((x) => x.feasible)).toHaveLength(1);
  });
});
describe("Target math", () => {
  it("identifies impossible targets", () => {
    const r = targetPlan(2, 100, 3.5, 10);
    expect(r.feasible).toBe(false);
    expect(r.required).toBe(18.5);
  });
  it("handles secured target and zero credits", () => {
    expect(targetPlan(4, 100, 2, 10).alreadySecured).toBe(true);
    expect(targetPlan(3, 30, 3, 0).feasible).toBe(true);
    expect(targetPlan(3, 30, 3.5, 0).feasible).toBe(false);
    expect(targetPlan(3, 30, 3, 0).required).toBeNull();
  });
  it("does not promise current target remains after future courses", () =>
    expect(targetPlan(3.5, 30, 3.5, 30).required).toBe(3.5));
  it("supports distinct future term GPAs", () =>
    expect(
      project(3, 30, [
        { credits: 9, gpa: 4 },
        { credits: 12, gpa: 3 },
      ]),
    ).toBeCloseTo(162 / 51));
  it.each([-1, NaN, Infinity])(
    "rejects invalid remaining credits %s",
    (value) => expect(() => targetPlan(3, 30, 3.5, value)).toThrow(),
  );
  it("returns null when no denominator", () =>
    expect(project(0, 0, [])).toBeNull());
  it("finds an exact valid letter-grade plan", () => {
    const r = discretePlan([3, 1.5], 14);
    expect(r).not.toBeNull();
    expect(r!.points).toBeCloseTo(14.01, 8);
    expect(r!.grades.every((x) => x in POINTS)).toBe(true);
  });
  it("returns null for unattainable discrete target", () =>
    expect(discretePlan([3, 3], 25)).toBeNull());
  it("limits exact search and validates decimals", () => {
    expect(() => discretePlan(Array(11).fill(3), 10)).toThrow();
    expect(() => discretePlan([0], 10)).toThrow();
    expect(() => discretePlan([1.234], 2)).toThrow();
  });
});

it("rejects impossible retake baselines", () => {
  expect(() => retakeImpact(0, 30, 3, "A", "A", "latest")).toThrow();
  expect(() =>
    retakeCombinations(
      4,
      3,
      [{ id: "a", credits: 3, old: "F", next: "A", cost: 0 }],
      "highest",
      4,
      0,
      4,
    ),
  ).toThrow();
});
