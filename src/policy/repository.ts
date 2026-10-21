import type { Requirement } from "../domain/types";
export const CHECKED = "2026-10-22";
const base = "https://www.uiu.ac.bd/";
export const policies = [
  {
    id: "GRADE-UIU",
    name: "Grading & performance",
    url: base + "academics/grading-performance-evaluation/",
    effective: "Not stated",
    batches: "Not stated",
    programs: "University-wide",
    status: "Verified in official indexed content",
    notes:
      "A 4.00, A− 3.67, B+ 3.33 through F 0.00. Credit-weighted GPA. I/W denominator treatment remains unresolved.",
  },
  {
    id: "RETAKE-ACADEMIC",
    name: "Academic retake treatment",
    url: base + "academics/academic-information-policies/",
    effective: "Not established",
    batches: "Unverified",
    programs: "Unverified",
    status: "Unresolved",
    notes:
      "Latest, highest and all-attempt calculations are user-selected assumptions, not verified institutional rules.",
  },
  {
    id: "RETAKE-FEE-2024",
    name: "First retake tuition concession",
    url:
      base +
      "notice/notice-regarding-waiver-of-course-fee-of-retake-repeat-courses/",
    effective: "Fall 2024",
    batches: "All students; term effective date applies",
    programs: "All UIU programs",
    status: "Verified in official indexed content",
    notes:
      "50% tuition concession on the first retake/repeat of each course only. Mixed pre/post-effective histories require confirmation.",
  },
  {
    id: "FEES-ADVERTISED",
    name: "Advertised tuition schedule",
    url: base + "admission/tuition-fees-payment-policies/tuition-fees-waiver/",
    effective: "Not stated",
    batches: "Historical applicability unverified",
    programs: "Program-specific schedule",
    status: "Verified figures; individual applicability unverified",
    notes:
      "Most listed undergraduate programs: ৳6,500/credit. English/MSJ: ৳5,525. Term fee ৳6,500; Pharmacy ৳9,750. Use as an explicit estimate, never infer an old batch rate.",
  },
  {
    id: "WAIVER-2025",
    name: "Scholarship continuation",
    url:
      base +
      "admission/tuition-fees-payment-policies/scholarship-tuition-fee-and-other-fees-waiver-policy/",
    effective: "Spring 2025",
    batches: "Spring 2025 onward",
    programs:
      "Listed undergraduate programs; Pharmacy has separate credit condition",
    status: "Selected rules verified in official indexed content",
    notes:
      "Admission-result awards: qualifying GPA 3.50, 9 credits (Pharmacy 14). Diploma: 3.00, 9 credits, listed non-Pharmacy programs. Award approval and entry conditions still required.",
  },
  {
    id: "CSE-2026",
    name: "CSE course plan",
    url: "https://cse.uiu.ac.bd/ug-program/course-plan/",
    effective: "Summer 2026",
    batches: "Summer 2026 onward",
    programs: "CSE",
    status: "Selected facts verified; partial catalog",
    notes:
      "141 credits; degree CGPA ≥2.00; all required courses passed; final-year project ≥C. Only eight verified course rows are included. English prerequisite inconsistency needs confirmation.",
  },
  {
    id: "CSE-CATALOG",
    name: "Curriculum version index",
    url: "https://cse.uiu.ac.bd/ug-program/curriculum/",
    effective: "Multiple versions",
    batches: "Select matching official version",
    programs: "CSE",
    status: "Version labels verified",
    notes:
      "Current and historical course plans are distinct. Complete historical catalogs have not been imported.",
  },
  {
    id: "PAYMENT",
    name: "Payment policies",
    url: base + "admission/tuition-fees-payment-policies/payment-policies/",
    effective: "Unverified",
    batches: "Unverified",
    programs: "Program-specific",
    status: "Page not retrieved",
    notes:
      "No official dates are embedded. Planner dates and splits are personal estimates. Current advertised registration amount conflicts with an older notice.",
  },
];
export const programs = [
  "CSE",
  "DS",
  "EEE",
  "Civil",
  "BBA",
  "BBA-AIS",
  "Economics",
  "EDS",
  "Pharmacy",
  "BGE",
  "English",
  "MSJ",
  "Other",
];
const rows: [string, string, number, string[]][] = [
  ["ENG 1011", "English I", 3, []],
  ["BDS 1201", "History of the Emergence of Bangladesh", 2, []],
  ["CSE 1110", "Introduction to Computer Systems", 1, []],
  ["MATH 1151", "Fundamental Calculus", 3, []],
  ["CSE 1111", "Structured Programming Language", 3, ["CSE 1110"]],
  ["CSE 1112", "Structured Programming Language Laboratory", 1, ["CSE 1110"]],
  ["MATH 2183", "Calculus and Linear Algebra", 3, ["MATH 1151"]],
  ["CSE 2215", "Data Structure and Algorithms I", 3, ["CSE 1111"]],
];
export const csePartial: Requirement[] = rows.map(
  ([code, title, credits, prerequisites]) => ({
    id: code,
    code,
    title,
    credits,
    prerequisites,
    category: code === "CSE 1112" ? "lab" : "core",
    electiveGroup: "",
    selected: true,
  }),
);
export function batchAtLeast(
  batch: string,
  year: number,
  term: "Spring" | "Summer" | "Fall",
) {
  const m = /^(Spring|Summer|Fall) (\d{4})$/i.exec(batch.trim());
  if (!m) return false;
  const order = ["spring", "summer", "fall"];
  return (
    Number(m[2]) * 3 + order.indexOf(m[1].toLowerCase()) >=
    year * 3 + order.indexOf(term.toLowerCase())
  );
}
