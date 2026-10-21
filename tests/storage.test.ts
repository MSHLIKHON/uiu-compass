import { beforeEach, it, expect } from "vitest";
import { initial, validateData, readData, KEY } from "../src/state/storage";
import { curriculumPlan } from "../src/domain/curriculum";
import { csePartial } from "../src/policy/repository";
beforeEach(() => localStorage.clear());
it("roundtrips the schema without unknown fields", () => {
  expect(validateData({ ...initial, secret: "discard" })).toEqual(initial);
});
it("rejects malformed numeric and enum values", () => {
  expect(() =>
    validateData({ ...initial, profile: { ...initial.profile, cgpa: "4" } }),
  ).toThrow();
  expect(() =>
    validateData({ ...initial, retakeRule: "fabricated" }),
  ).toThrow();
  expect(() => validateData({ ...initial, version: 2 })).toThrow();
});
it("does not overwrite corrupt storage", () => {
  localStorage.setItem(KEY, "broken");
  expect(readData().error).not.toBe("");
  expect(localStorage.getItem(KEY)).toBe("broken");
});
it("reads valid persisted data", () => {
  const d = { ...initial, theme: "dark" };
  localStorage.setItem(KEY, JSON.stringify(d));
  expect(readData().data.theme).toBe("dark");
});
it("rejects duplicate curriculum codes and oversized data", () => {
  expect(() =>
    validateData({
      ...initial,
      requirements: [csePartial[0], { ...csePartial[0], id: "different" }],
    }),
  ).toThrow();
  expect(() =>
    validateData({ ...initial, courses: Array(2001).fill({}) }),
  ).toThrow();
});
it("places prerequisites in strictly earlier terms", () => {
  const r = curriculumPlan(csePartial, [], 12);
  const intro = r.terms.findIndex((term) =>
    term.some((c) => c.code === "CSE 1110"),
  );
  const programming = r.terms.findIndex((term) =>
    term.some((c) => c.code === "CSE 1111"),
  );
  const structures = r.terms.findIndex((term) =>
    term.some((c) => c.code === "CSE 2215"),
  );
  expect(programming).toBeGreaterThan(intro);
  expect(structures).toBeGreaterThan(programming);
});
it("detects missing prerequisites and overlarge courses", () => {
  const r = curriculumPlan(
    [{ ...csePartial[0], prerequisites: ["MISSING"] }],
    [],
    12,
  );
  expect(r.blocked).toHaveLength(1);
  expect(curriculumPlan([csePartial[0]], [], 1).blocked).toHaveLength(1);
  expect(() => curriculumPlan([], [], 0)).toThrow();
});
it("does not count unselected elective alternatives", () =>
  expect(
    curriculumPlan([{ ...csePartial[0], selected: false }], [], 12).remaining,
  ).toBe(0));
