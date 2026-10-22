import { POINTS } from "./academic";
import type { Category, Course, Grade } from "./types";

export const UCAM_FORMAT = "uiu-compass-ucam-v1";

type RawUcamCourse = {
  term?: unknown;
  code?: unknown;
  title?: unknown;
  credits?: unknown;
  grade?: unknown;
  category?: unknown;
  attempt?: unknown;
};

const categories: Category[] = [
  "core",
  "elective",
  "project",
  "thesis",
  "internship",
  "lab",
];

function text(value: unknown, fallback = "") {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string" && typeof value !== "number")
    throw new Error("UCAM import contains an invalid text field.");
  return String(value).trim();
}

function grade(value: unknown): Grade {
  const normalized = text(value)
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace("A−", "A-");
  if (![...Object.keys(POINTS), "I", "W"].includes(normalized))
    throw new Error(`Unsupported grade: ${text(value) || "blank"}.`);
  return normalized as Grade;
}

export function parseUcamImport(input: unknown): Course[] {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid UCAM import file.");
  const record = input as Record<string, unknown>;
  if (record.format !== UCAM_FORMAT)
    throw new Error("This is not a UIU Compass UCAM import file.");
  if (!Array.isArray(record.courses) || !record.courses.length)
    throw new Error("No courses were found in the UCAM import file.");
  if (record.courses.length > 500)
    throw new Error("UCAM import contains too many courses.");

  const attempts = new Map<string, number>();
  const rows = record.courses.map((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new Error(`Course ${index + 1} is invalid.`);
    const item = raw as RawUcamCourse;
    const code = text(item.code).toUpperCase().replace(/\s+/g, " ");
    const credits = Number(text(item.credits));
    if (!code || code.length > 100)
      throw new Error(`Course ${index + 1} has no valid code.`);
    if (!Number.isFinite(credits) || credits <= 0 || credits > 20)
      throw new Error(`${code} has invalid credits.`);
    const inferredAttempt = (attempts.get(code) ?? 0) + 1;
    const attempt =
      item.attempt === undefined ? inferredAttempt : Number(item.attempt);
    if (!Number.isInteger(attempt) || attempt < 1 || attempt > 20)
      throw new Error(`${code} has an invalid attempt number.`);
    attempts.set(code, Math.max(inferredAttempt, attempt));
    const rawCategory = text(item.category, "core").toLowerCase();
    const category = categories.includes(rawCategory as Category)
      ? (rawCategory as Category)
      : "core";
    return {
      id: crypto.randomUUID(),
      term: text(item.term, "UCAM import").slice(0, 200),
      code,
      title: text(item.title).slice(0, 200),
      credits,
      grade: grade(item.grade),
      attempt,
      category,
      excluded: false,
    } satisfies Course;
  });

  const keys = rows.map((course) => `${course.code}:${course.attempt}`);
  if (new Set(keys).size !== keys.length)
    throw new Error("UCAM import contains duplicate course attempts.");
  return rows;
}

export function mergeUcamCourses(existing: Course[], imported: Course[]) {
  const keys = new Set(
    existing.map((course) => `${course.code.toUpperCase()}:${course.attempt}`),
  );
  const added = imported.filter(
    (course) => !keys.has(`${course.code.toUpperCase()}:${course.attempt}`),
  );
  return { courses: [...existing, ...added], added: added.length };
}
