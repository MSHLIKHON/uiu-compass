export type ExamSlot = "T1" | "T2" | "T3";

export type OfferedCourse = {
  code: string;
  title: string;
  credits: number;
  day: number | null;
  slot: ExamSlot | null;
};

export const MID_TIMES: Record<ExamSlot, string> = {
  T1: "9:00–11:00 AM",
  T2: "11:30 AM–1:30 PM",
  T3: "2:00–4:00 PM",
};

export const FINAL_TIMES: Record<ExamSlot, string> = {
  T1: "9:00–11:00 AM",
  T2: "11:30 AM–1:30 PM",
  T3: "2:30–4:30 PM",
};

export const CSE_FALL_2026: OfferedCourse[] = [
  ["ENG 1011", "English I", 3, 1, "T1"],
  ["BDS 1201", "History of the Emergence of Bangladesh", 2, 6, "T1"],
  ["CSE 1110", "Introduction to Computer Systems", 1, null, null],
  ["MATH 1151", "Fundamental Calculus", 3, 2, "T2"],
  ["ENG 1013", "English II", 3, 1, "T2"],
  ["CSE 1111", "Structured Programming Language", 3, 4, "T2"],
  ["CSE 1112", "Structured Programming Language Laboratory", 1, null, null],
  ["CSE 2213", "Discrete Mathematics", 3, 3, "T2"],
  ["MATH 2183", "Calculus and Linear Algebra", 3, 1, "T3"],
  ["PHY 2105", "Physics", 3, 7, "T3"],
  ["PHY 2106", "Physics Lab", 1, null, null],
  ["CSE 2215", "Data Structure and Algorithms I", 3, 4, "T2"],
  ["CSE 2216", "Data Structure and Algorithms I Laboratory", 1, null, null],
  ["MATH 2201", "Coordinate Geometry and Vector Analysis", 3, 5, "T1"],
  ["CSE 1325", "Digital Logic Design", 3, 3, "T3"],
  ["CSE 1326", "Digital Logic Design Lab", 1, null, null],
  ["CSE 1115", "Object Oriented Programming", 3, 6, "T2"],
  ["CSE 1116", "Object Oriented Programming Lab", 1, null, null],
  ["MATH 2205", "Probability and Statistics", 3, 2, "T3"],
  ["SOC 2101", "Society, Technology and Engineering Ethics", 3, 1, "T3"],
  ["CSE 2217", "Data Structure and Algorithms II", 3, 5, "T2"],
  ["CSE 2218", "Data Structure and Algorithms II Laboratory", 1, null, null],
  ["EEE 2113", "Electrical Circuits", 3, 6, "T3"],
  ["CSE 3521", "Database Management Systems", 3, 2, "T1"],
  ["CSE 3522", "Database Management Systems Lab", 1, null, null],
  ["EEE 2123", "Electronics", 3, 6, "T3"],
  ["EEE 2124", "Electronics Lab", 1, null, null],
  ["CSE 4165", "Web Programming", 3, 7, "T1"],
  ["CSE 3313", "Computer Architecture", 3, 1, "T3"],
  ["CSE 2118", "Advanced Object Oriented Programming Lab", 1, null, null],
  ["BIO 3105", "Biology for Engineers", 3, 3, "T3"],
  ["CSE 3411", "System Analysis and Design", 3, 5, "T1"],
  ["CSE 3412", "System Analysis and Design Lab", 1, null, null],
  ["CSE 4325", "Microprocessors and Microcontrollers", 3, 2, "T2"],
  ["CSE 4326", "Microprocessors and Microcontrollers Lab", 1, null, null],
  ["CSE 3421", "Software Engineering", 3, 5, "T3"],
  ["CSE 3422", "Software Engineering Lab", 1, null, null],
  ["CSE 3811", "Artificial Intelligence", 3, 3, "T1"],
  ["CSE 3812", "Artificial Intelligence Lab", 1, null, null],
  ["CSE 2233", "Theory of Computation", 3, 7, "T2"],
  ["PMG 4101", "Project Management", 3, 3, "T2"],
  ["CSE 3711", "Computer Networks", 3, 4, "T3"],
  ["CSE 3712", "Computer Networks Lab", 1, null, null],
  ["CSE 4509", "Operating Systems", 3, 1, "T1"],
  ["CSE 4510", "Operating Systems Laboratory", 1, null, null],
  ["CSE 4531", "Computer Security", 3, 6, "T3"],
  ["EEE 4261", "Green Computing", 3, 5, "T1"],
  ["GED 1005", "AI Literacy and Prompt Engineering", 3, 1, "T1"],
  ["ECO 4101", "Economics", 3, 6, "T1"],
  ["ACT 2111", "Financial and Managerial Accounting", 3, 2, "T3"],
  ["TEC 2499", "Technology Entrepreneurship", 3, 3, "T2"],
  ["CSE 4125", "Ethical Hacking and Network Defense", 3, 1, "T3"],
  ["CSE 4777", "Network Security", 3, 3, "T3"],
  ["CSE 4587", "Cloud Computing", 3, 5, "T3"],
  ["CSE 4611", "Compiler Design", 3, 4, "T1"],
  ["CSE 4621", "Computer Graphics", 3, 2, "T1"],
  ["CSE 4451", "Human Computer Interaction", 3, 3, "T1"],
  ["CSE 4435", "Software Architecture", 3, 4, "T2"],
  ["CSE 4181", "Mobile Application Development", 3, 6, "T3"],
  ["CSE 4945", "UI: Concepts and Design", 3, 1, "T2"],
  ["CSE 4495", "Software Testing and Quality Assurance", 3, 7, "T3"],
  ["CSE 4327", "VLSI Design", 3, 4, "T1"],
  ["CSE 4399", "Embedded Machine Learning", 3, 7, "T2"],
  ["CSE 4889", "Machine Learning", 3, 1, "T3"],
  ["CSE 4891", "Data Mining", 3, 7, "T1"],
  ["CSE 4817", "Big Data Analytics", 3, 5, "T3"],
  ["CSE 4883", "Digital Image Processing", 3, 4, "T1"],
  ["CSE 4811", "Natural Language Processing", 3, 4, "T1"],
  ["CSE 4813", "Deep Learning", 3, 1, "T3"],
  ["CSE 4893", "Introduction to Bioinformatics", 3, 4, "T3"],
  ["CSE 4133", "Business Intelligence", 3, 6, "T3"],
].map(([code, title, credits, day, slot]) => ({
  code: String(code),
  title: String(title),
  credits: Number(credits),
  day: day === null ? null : Number(day),
  slot: slot as ExamSlot | null,
}));

export function normalizeCourseCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function findFall2026Course(value: string) {
  const query = normalizeCourseCode(value);
  return CSE_FALL_2026.find((course) => course.code === query);
}
