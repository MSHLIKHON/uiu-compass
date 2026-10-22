import { describe, expect, it } from "vitest";
import {
  routineConflicts,
  sortRoutine,
  type RoutineEntry,
} from "../src/domain/routine";

const entry = (
  id: string,
  course: string,
  day: string,
  time: string,
): RoutineEntry => ({
  id,
  course,
  day,
  time,
  section: "A",
  exam: "Final",
  room: "",
});

describe("exam routine helpers", () => {
  it("detects courses at the same normalized day and time", () => {
    const conflicts = routineConflicts([
      entry("1", "CSE 1111", "Sunday", "10:00 AM"),
      entry("2", "MAT 1101", " sunday ", "10:00 am"),
      entry("3", "ENG 101", "Monday", "10:00 AM"),
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].map((item) => item.course)).toEqual([
      "CSE 1111",
      "MAT 1101",
    ]);
  });

  it("returns a stable day and time order without changing the input", () => {
    const rows = [
      entry("2", "CSE 2222", "Tuesday", "2:00 PM"),
      entry("1", "CSE 1111", "Monday", "9:00 AM"),
    ];
    expect(sortRoutine(rows).map((item) => item.id)).toEqual(["1", "2"]);
    expect(rows.map((item) => item.id)).toEqual(["2", "1"]);
  });
});
