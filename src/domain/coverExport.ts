import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type CoverData = {
  type: string;
  mode: "Individual" | "Group";
  template: string;
  student: string;
  studentId: string;
  groupMembers: string;
  program: string;
  course: string;
  code: string;
  section: string;
  faculty: string;
  designation: string;
  facultyDepartment: string;
  title: string;
  date: string;
  experimentNo: string;
  assessmentType: string;
  indexItems: string;
};

const cleanFileName = (value: string) =>
  (value || "UIU Cover Page").replace(/[^a-z0-9 _-]/gi, "").trim();

function saveBlob(blob: Blob, name: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

const logoUrl = `${import.meta.env.BASE_URL}assets/uiu-logo.png`;

export async function downloadCoverDocx(cover: CoverData) {
  const logo = await fetch(logoUrl).then((response) => response.arrayBuffer());
  const details = [
    `Course: ${cover.course || "—"}`,
    `Course code: ${cover.code || "—"}`,
    `Section: ${cover.section || "—"}`,
    cover.experimentNo ? `Experiment no: ${cover.experimentNo}` : "",
    cover.assessmentType ? `Assessment: ${cover.assessmentType}` : "",
  ].filter(Boolean);
  const students =
    cover.mode === "Group" && cover.groupMembers.trim()
      ? cover.groupMembers.split("\n").filter(Boolean)
      : [
          `${cover.student || "Student name"} (${cover.studentId || "Student ID"})`,
        ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: logo,
                type: "png",
                transformation: { width: 230, height: 70 },
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun("United City, Madani Avenue, Dhaka")],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: cover.type.toUpperCase(),
                bold: true,
                color: "E87524",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.TITLE,
            text: cover.title || `${cover.type} title`,
          }),
          ...details.map(
            (line) =>
              new Paragraph({ alignment: AlignmentType.CENTER, text: line }),
          ),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "SUBMITTED BY",
                bold: true,
                color: "E87524",
              }),
            ],
          }),
          ...students.map((line) => new Paragraph({ text: line })),
          new Paragraph({ text: cover.program || "Program / Department" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: "SUBMITTED TO",
                bold: true,
                color: "E87524",
              }),
            ],
          }),
          new Paragraph({ text: cover.faculty || "Faculty name" }),
          new Paragraph({ text: cover.designation || "Designation" }),
          new Paragraph({ text: cover.facultyDepartment || "Department" }),
          new Paragraph({ text: "United International University" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            text: cover.date || "Submission date",
          }),
        ],
      },
    ],
  });
  saveBlob(
    await Packer.toBlob(doc),
    `${cleanFileName(cover.title || cover.type)}.docx`,
  );
}

function fit(text: string, max = 76) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export async function downloadCoverPdf(cover: CoverData, attachment?: File) {
  const output = await PDFDocument.create();
  const page = output.addPage([595.28, 841.89]);
  const bold = await output.embedFont(StandardFonts.HelveticaBold);
  const regular = await output.embedFont(StandardFonts.Helvetica);
  const logoBytes = await fetch(logoUrl).then((response) =>
    response.arrayBuffer(),
  );
  const logo = await output.embedPng(logoBytes);
  const blue = rgb(0.08, 0.25, 0.47);
  const orange = rgb(0.9, 0.36, 0.08);
  const centered = (
    text: string,
    y: number,
    size = 12,
    font = regular,
    color = blue,
  ) => {
    const value = fit(text);
    page.drawText(value, {
      x: (595.28 - font.widthOfTextAtSize(value, size)) / 2,
      y,
      size,
      font,
      color,
    });
  };
  page.drawImage(logo, { x: 177, y: 716, width: 241, height: 73 });
  centered(
    "United City, Madani Avenue, Dhaka",
    690,
    10,
    regular,
    rgb(0.35, 0.39, 0.46),
  );
  page.drawLine({
    start: { x: 90, y: 660 },
    end: { x: 505, y: 660 },
    thickness: 1,
    color: orange,
  });
  centered(cover.type.toUpperCase(), 625, 12, bold, orange);
  centered(cover.title || `${cover.type} title`, 575, 25, bold, blue);
  centered(cover.course || "Course name", 530, 15, bold, blue);
  centered(
    `${cover.code || "Course code"}${cover.section ? ` · Section ${cover.section}` : ""}`,
    505,
    11,
  );
  if (cover.experimentNo)
    centered(`Experiment no: ${cover.experimentNo}`, 480, 11);
  if (cover.assessmentType)
    centered(`Assessment: ${cover.assessmentType}`, 458, 11);
  const submitted =
    cover.mode === "Group" ? "SUBMITTED BY · GROUP" : "SUBMITTED BY";
  page.drawText(submitted, {
    x: 70,
    y: 315,
    size: 10,
    font: bold,
    color: orange,
  });
  const studentLines =
    cover.mode === "Group"
      ? cover.groupMembers.split("\n").filter(Boolean).slice(0, 6)
      : [cover.student || "Student name", cover.studentId || "Student ID"];
  studentLines.forEach((line, index) =>
    page.drawText(fit(line, 44), {
      x: 70,
      y: 290 - index * 18,
      size: 11,
      font: index === 0 ? bold : regular,
      color: blue,
    }),
  );
  page.drawText(fit(cover.program || "Program / Department", 40), {
    x: 70,
    y: 175,
    size: 10,
    font: regular,
    color: blue,
  });
  page.drawText("SUBMITTED TO", {
    x: 340,
    y: 315,
    size: 10,
    font: bold,
    color: orange,
  });
  [
    cover.faculty || "Faculty name",
    cover.designation || "Designation",
    cover.facultyDepartment || "Department",
    "United International University",
  ].forEach((line, index) =>
    page.drawText(fit(line, 34), {
      x: 340,
      y: 290 - index * 18,
      size: 10,
      font: index === 0 ? bold : regular,
      color: blue,
    }),
  );
  centered(
    cover.date || "Submission date",
    80,
    10,
    regular,
    rgb(0.35, 0.39, 0.46),
  );

  if (attachment) {
    const existing = await PDFDocument.load(await attachment.arrayBuffer());
    const copied = await output.copyPages(existing, existing.getPageIndices());
    copied.forEach((item) => output.addPage(item));
  }
  saveBlob(
    new Blob([await output.save()], { type: "application/pdf" }),
    `${cleanFileName(cover.title || cover.type)}.pdf`,
  );
}
