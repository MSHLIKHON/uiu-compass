import { describe, expect, it } from "vitest";
import { mergeUcamCourses, parseUcamImport } from "../src/domain/ucamImport";

const payload = {
  format: "uiu-compass-ucam-v1",
  courses: [
    {
      term: "Fall 2026",
      code: "cse   1111",
      title: "Structured Programming Language",
      credits: "3",
      grade: "A -",
    },
    {
      term: "Fall 2026",
      code: "CSE 1112",
      title: "Structured Programming Language Lab",
      credits: 1,
      grade: "B+",
      category: "lab",
    },
  ],
};

describe("UCAM import", () => {
  it("normalizes validated course rows and infers attempts", () => {
    const courses = parseUcamImport(payload);
    expect(courses).toHaveLength(2);
    expect(courses[0]).toMatchObject({
      code: "CSE 1111",
      credits: 3,
      grade: "A-",
      attempt: 1,
      excluded: false,
    });
    expect(courses[1]).toMatchObject({ category: "lab", grade: "B+" });
  });

  it("skips an existing matching attempt during merge", () => {
    const imported = parseUcamImport(payload);
    const result = mergeUcamCourses([imported[0]], imported);
    expect(result.added).toBe(1);
    expect(result.courses).toHaveLength(2);
  });

  it("rejects unknown files and unsupported grades", () => {
    expect(() => parseUcamImport({ format: "other", courses: [] })).toThrow(
      "not a UIU Compass UCAM import",
    );
    expect(() =>
      parseUcamImport({
        ...payload,
        courses: [{ code: "CSE 1111", credits: 3, grade: "P" }],
      }),
    ).toThrow("Unsupported grade");
  });
});
