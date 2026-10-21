import { academic } from "../domain/academic";
import type { StudentData } from "../domain/types";
export function summary(d: StudentData) {
  const a = academic(d.courses, d.retakeRule);
  return d.profile.mode === "detailed"
    ? {
        cgpa: a.gpa,
        credits: a.gpaCredits,
        earned: a.earned,
        attempted: a.attempted,
        unresolved: a.unresolved,
      }
    : {
        cgpa: d.profile.cgpa,
        credits: d.profile.gpaCredits,
        earned: d.profile.earnedCredits,
        attempted: null,
        unresolved: false,
      };
}
