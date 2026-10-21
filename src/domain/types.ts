export type Grade =
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "F"
  | "I"
  | "W";
export type RetakeRule = "unresolved" | "highest" | "latest" | "all";
export type Category =
  "core" | "elective" | "project" | "thesis" | "internship" | "lab";
export interface Course {
  id: string;
  term: string;
  code: string;
  title: string;
  credits: number;
  grade: Grade;
  attempt: number;
  category: Category;
  excluded: boolean;
}
export interface Requirement {
  id: string;
  code: string;
  title: string;
  credits: number;
  category: Category;
  prerequisites: string[];
  electiveGroup: string;
  selected: boolean;
}
export interface Profile {
  program: string;
  batch: string;
  curriculum: string;
  language: "en" | "bn";
  mode: "quick" | "detailed";
  cgpa: number;
  gpaCredits: number;
  earnedCredits: number;
  degreeCredits: number;
  target: number;
  load: number;
  waiver: string;
  studentId: string;
  ready: boolean;
}
export interface Finance {
  rate: number;
  regular: number;
  excluded: number;
  retake: number;
  firstRetake: number;
  firstDiscount: number;
  termFee: number;
  other: number;
  waiver: number;
  paid: number;
  feeVersion: string;
  installmentDates: string[];
}
export interface Scenario {
  id: string;
  name: string;
  cgpa: number;
  futureGpa: number;
  credits: number;
  cost: number;
  assumption: string;
}
export interface StudentData {
  version: 1;
  profile: Profile;
  courses: Course[];
  requirements: Requirement[];
  scenarios: Scenario[];
  finance: Finance;
  retakeRule: RetakeRule;
  theme: "light" | "dark";
}
