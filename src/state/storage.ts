import type {
  StudentData,
  Course,
  Requirement,
  Scenario,
} from "../domain/types";
import { POINTS } from "../domain/academic";
export const KEY = "uiu-compass:v1";
export const initial: StudentData = {
  version: 1,
  profile: {
    program: "CSE",
    batch: "",
    curriculum: "manual",
    language: "en",
    mode: "quick",
    cgpa: 0,
    gpaCredits: 0,
    earnedCredits: 0,
    degreeCredits: 0,
    target: 3.5,
    load: 12,
    waiver: "Unverified",
    studentId: "",
    ready: false,
  },
  courses: [],
  requirements: [],
  scenarios: [],
  finance: {
    rate: 0,
    regular: 12,
    excluded: 0,
    retake: 0,
    firstRetake: 0,
    firstDiscount: 0,
    termFee: 0,
    other: 0,
    waiver: 0,
    paid: 0,
    feeVersion: "manual",
    installmentDates: ["", "", ""],
  },
  retakeRule: "unresolved",
  theme: "light",
};
function obj(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new Error("Expected an object.");
  return v as Record<string, unknown>;
}
function str(v: unknown, max = 200): string {
  if (typeof v !== "string" || v.length > max)
    throw new Error("Invalid text field.");
  return v;
}
function num(v: unknown, max = 10000000, min = 0): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    throw new Error("Invalid numeric field.");
  return v;
}
function bool(v: unknown): boolean {
  if (typeof v !== "boolean") throw new Error("Invalid checkbox.");
  return v;
}
function choice<T extends string>(v: unknown, choices: readonly T[]): T {
  if (!choices.includes(v as T)) throw new Error("Unknown option in backup.");
  return v as T;
}
function arr(v: unknown, max: number): unknown[] {
  if (!Array.isArray(v) || v.length > max)
    throw new Error("Invalid or oversized list.");
  return v;
}
const categories = [
  "core",
  "elective",
  "project",
  "thesis",
  "internship",
  "lab",
] as const;
function unique<T extends { id: string }>(rows: T[]): T[] {
  if (new Set(rows.map((r) => r.id)).size !== rows.length)
    throw new Error("Duplicate IDs in backup.");
  return rows;
}
export function validateData(input: unknown): StudentData {
  const d = obj(input);
  if (d.version !== 1) throw new Error("Unsupported backup version.");
  const p = obj(d.profile),
    f = obj(d.finance);
  const courses = unique(
    arr(d.courses, 2000).map((v) => {
      const c = obj(v);
      return {
        id: str(c.id),
        term: str(c.term),
        code: str(c.code),
        title: str(c.title),
        credits: num(c.credits, 100, 0.01),
        grade: choice(c.grade, [...Object.keys(POINTS), "I", "W"]),
        attempt: num(c.attempt, 100, 1),
        category: choice(c.category, categories),
        excluded: bool(c.excluded),
      } as Course;
    }),
  );
  if (courses.some((c) => !Number.isInteger(c.attempt)))
    throw new Error("Attempt must be a whole number.");
  if (
    new Set(courses.map((c) => `${c.code.toUpperCase()}:${c.attempt}`)).size !==
    courses.length
  )
    throw new Error("Duplicate course attempt.");
  const requirements = unique(
    arr(d.requirements, 1000).map((v) => {
      const r = obj(v);
      return {
        id: str(r.id),
        code: str(r.code),
        title: str(r.title),
        credits: num(r.credits, 100, 0.01),
        category: choice(r.category, categories),
        prerequisites: arr(r.prerequisites, 50).map((p) => str(p)),
        electiveGroup: str(r.electiveGroup),
        selected: bool(r.selected),
      } as Requirement;
    }),
  );
  if (
    new Set(requirements.map((r) => r.code.toUpperCase())).size !==
    requirements.length
  )
    throw new Error("Duplicate curriculum code.");
  const scenarios = unique(
    arr(d.scenarios, 100).map((v) => {
      const s = obj(v);
      return {
        id: str(s.id),
        name: str(s.name),
        cgpa: num(s.cgpa, 4),
        futureGpa: num(s.futureGpa, 4),
        credits: num(s.credits, 1000),
        cost: num(s.cost, 1e12),
        assumption: str(s.assumption, 2000),
      } as Scenario;
    }),
  );
  const result: StudentData = {
    version: 1,
    profile: {
      program: str(p.program),
      batch: str(p.batch),
      curriculum: str(p.curriculum),
      language: choice(p.language, ["en", "bn"]),
      mode: choice(p.mode, ["quick", "detailed"]),
      cgpa: num(p.cgpa, 4),
      gpaCredits: num(p.gpaCredits, 2000),
      earnedCredits: num(p.earnedCredits, 2000),
      degreeCredits: num(p.degreeCredits, 1000),
      target: num(p.target, 4),
      load: num(p.load, 50, 0.01),
      waiver: str(p.waiver),
      studentId: str(p.studentId),
      ready: bool(p.ready),
    },
    courses,
    requirements,
    scenarios,
    finance: {
      rate: num(f.rate),
      regular: num(f.regular, 100),
      excluded: num(f.excluded, 100),
      retake: num(f.retake, 100),
      firstRetake: num(f.firstRetake, 100),
      firstDiscount: num(f.firstDiscount, 100),
      termFee: num(f.termFee),
      other: num(f.other),
      waiver: num(f.waiver, 100),
      paid: num(f.paid),
      feeVersion: str(f.feeVersion),
      installmentDates: arr(f.installmentDates, 4).map((v) => str(v, 10)),
    },
    retakeRule: choice(d.retakeRule, [
      "unresolved",
      "highest",
      "latest",
      "all",
    ]),
    theme: choice(d.theme, ["light", "dark"]),
  };
  if (
    result.finance.excluded > result.finance.regular ||
    result.finance.firstRetake > result.finance.retake
  )
    throw new Error("Invalid fee credit allocation.");
  return result;
}
export function readData(): { data: StudentData; error: string } {
  try {
    const raw = localStorage.getItem(KEY);
    return {
      data: raw ? validateData(JSON.parse(raw)) : structuredClone(initial),
      error: "",
    };
  } catch {
    return {
      data: structuredClone(initial),
      error:
        "Saved data could not be read. It has not been overwritten. Restore a valid backup or explicitly reset storage.",
    };
  }
}
export function downloadJSON(data: StudentData) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "uiu-compass-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
