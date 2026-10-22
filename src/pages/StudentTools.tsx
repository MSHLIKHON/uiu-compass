import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Download,
  FileText,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Card, Field, Heading, Note } from "../components/ui";
import { useApp } from "../state/AppState";
import {
  routineConflicts,
  sortRoutine,
  type RoutineEntry,
} from "../domain/routine";
import {
  CSE_FALL_2026,
  FINAL_TIMES,
  MID_TIMES,
  findFall2026Course,
} from "../data/cseFall2026";
import {
  downloadCoverDocx,
  downloadCoverPdf,
  type CoverData,
} from "../domain/coverExport";

const ROUTINE_KEY = "uiu-compass:routine:v2";
const COVER_KEY = "uiu-compass:cover:v2";
const DOC_TYPES = [
  "Lab Report",
  "Assignment",
  "Project Report",
  "Term Paper",
  "Thesis / Internship",
  "Presentation",
  "Answer Script",
  "Lab Index",
];
const TEMPLATES = [
  "Classic",
  "Modern",
  "Minimal",
  "Professional",
  "Creative",
  "Elegant",
];

const blankRoutine = (): RoutineEntry => ({
  id: crypto.randomUUID(),
  course: "",
  section: "",
  exam: "Final",
  day: "",
  time: "",
  room: "",
});
const blankCover = (program = "", studentId = ""): CoverData => ({
  type: "Assignment",
  mode: "Individual",
  template: "Classic",
  student: "",
  studentId,
  groupMembers: "",
  program,
  course: "",
  code: "",
  section: "",
  faculty: "",
  designation: "",
  facultyDepartment: "",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  experimentNo: "",
  assessmentType: "Class Test",
  indexItems: "",
});

function readList(): RoutineEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? "[]");
    return Array.isArray(value) ? value.slice(0, 300) : [];
  } catch {
    return [];
  }
}
function readCover(program: string, studentId: string): CoverData {
  const fallback = blankCover(program, studentId);
  try {
    return {
      ...fallback,
      ...JSON.parse(localStorage.getItem(COVER_KEY) ?? "{}"),
    };
  } catch {
    return fallback;
  }
}

export default function StudentTools() {
  const { data, t, notify } = useApp();
  const [tool, setTool] = useState<"routine" | "cover">("routine");
  const [entries, setEntries] = useState<RoutineEntry[]>(readList);
  const [draft, setDraft] = useState<RoutineEntry>(blankRoutine);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState<File>();
  const [exporting, setExporting] = useState(false);
  const [cover, setCover] = useState(() =>
    readCover(data.profile.program, data.profile.studentId),
  );
  useEffect(
    () => localStorage.setItem(COVER_KEY, JSON.stringify(cover)),
    [cover],
  );

  const official = useMemo(
    () => findFall2026Course(draft.course),
    [draft.course],
  );
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortRoutine(
      entries.filter((entry) =>
        [entry.course, entry.section, entry.exam].some((value) =>
          value.toLowerCase().includes(q),
        ),
      ),
    );
  }, [entries, query]);
  const chosen = sortRoutine(
    entries.filter((entry) => selected.includes(entry.id)),
  );
  const conflicts = routineConflicts(chosen);
  const setCoverField = <K extends keyof CoverData>(
    key: K,
    value: CoverData[K],
  ) => setCover((current) => ({ ...current, [key]: value }));

  function syncOfficial(value: string, exam = draft.exam) {
    const found = findFall2026Course(value);
    if (!found) return { ...draft, course: value, exam };
    return {
      ...draft,
      course: found.code,
      exam,
      day: found.day ? `Day ${found.day}` : "No central exam",
      time: found.slot
        ? `${found.slot} · ${(exam === "Midterm" ? MID_TIMES : FINAL_TIMES)[found.slot]}`
        : "Not applicable",
    };
  }

  async function runExport(kind: "pdf" | "docx") {
    setExporting(true);
    setError("");
    try {
      if (kind === "pdf") await downloadCoverPdf(cover, attachment);
      else await downloadCoverDocx(cover);
      notify(
        t(
          `${kind.toUpperCase()} downloaded.`,
          `${kind.toUpperCase()} ডাউনলোড হয়েছে।`,
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Heading
        eyebrow={t("STUDENT TOOLS", "শিক্ষার্থী টুলস")}
        title={t(
          "Exam routine and UIU cover page",
          "পরীক্ষার রুটিন ও UIU কভার পেজ",
        )}
        description={t(
          "Find Fall 2026 exam slots by course code and create a complete submission cover.",
          "কোর্স কোড দিয়ে Fall 2026 পরীক্ষার সময় দেখুন এবং সম্পূর্ণ কভার পেজ বানান।",
        )}
      />
      <div className="segmented tool-switch" aria-label="Student tool">
        <button
          className={tool === "routine" ? "selected" : ""}
          onClick={() => setTool("routine")}
        >
          <CalendarDays size={17} /> {t("Exam routine", "পরীক্ষার রুটিন")}
        </button>
        <button
          className={tool === "cover" ? "selected" : ""}
          onClick={() => setTool("cover")}
        >
          <FileText size={17} /> {t("Cover page", "কভার পেজ")}
        </button>
      </div>

      {tool === "routine" ? (
        <div className="two-col routine-layout">
          <Card>
            <div className="step-label">
              1 · {t("Search the official offering", "অফিসিয়াল অফারিং খুঁজুন")}
            </div>
            <h2>{t("Type a course code", "কোর্স কোড লিখুন")}</h2>
            <Note>
              {t(
                "Based on the official CSE Fall 2026 course offering and revised exam template. The source publishes Day 1–7, not calendar dates.",
                "অফিসিয়াল CSE Fall 2026 offering ও revised exam template অনুযায়ী। Source-এ calendar date নয়, Day 1–7 দেওয়া আছে।",
              )}
            </Note>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!official) {
                  setError("Choose a course from the official Fall 2026 list.");
                  return;
                }
                if (!official.day || !official.slot) {
                  setError(
                    "This course has no central written-exam slot in the official offering.",
                  );
                  return;
                }
                const nextEntry = syncOfficial(official.code);
                const next = [...entries, nextEntry];
                setEntries(next);
                localStorage.setItem(ROUTINE_KEY, JSON.stringify(next));
                setSelected((value) => [...value, nextEntry.id]);
                setDraft(blankRoutine());
                setError("");
                notify(
                  t("Official exam added.", "অফিসিয়াল পরীক্ষা যোগ হয়েছে।"),
                );
              }}
            >
              <Field label={t("Course code", "কোর্স কোড")}>
                <input
                  list="fall-2026-courses"
                  value={draft.course}
                  onChange={(event) =>
                    setDraft(syncOfficial(event.target.value))
                  }
                  placeholder="CSE 1111"
                  autoComplete="off"
                />
                <datalist id="fall-2026-courses">
                  {CSE_FALL_2026.map((course) => (
                    <option key={course.code} value={course.code}>
                      {course.title}
                    </option>
                  ))}
                </datalist>
              </Field>
              {official ? (
                <div
                  className={`official-match ${official.slot ? "" : "muted-match"}`}
                >
                  <div>
                    <span>{official.code}</span>
                    <strong>{official.title}</strong>
                    <small>{official.credits} credits · Fall 2026</small>
                  </div>
                  <div className="official-slot">
                    <b>
                      {official.day ? `Day ${official.day}` : "No central exam"}
                    </b>
                    <span>
                      {official.slot
                        ? `${official.slot} · ${(draft.exam === "Midterm" ? MID_TIMES : FINAL_TIMES)[official.slot]}`
                        : "Lab/project course"}
                    </span>
                  </div>
                </div>
              ) : draft.course.trim() ? (
                <p className="caption">
                  {t(
                    "No exact official match yet. Choose a suggestion.",
                    "এখনও exact match নেই। suggestion থেকে বেছে নিন।",
                  )}
                </p>
              ) : null}
              <div className="form-grid">
                <Field label={t("Exam", "পরীক্ষা")}>
                  <select
                    value={draft.exam}
                    onChange={(event) =>
                      setDraft(syncOfficial(draft.course, event.target.value))
                    }
                  >
                    <option>Midterm</option>
                    <option>Final</option>
                  </select>
                </Field>
                <Field label={t("Section (optional)", "সেকশন (ঐচ্ছিক)")}>
                  <input
                    value={draft.section}
                    onChange={(event) =>
                      setDraft({ ...draft, section: event.target.value })
                    }
                    placeholder="A"
                  />
                </Field>
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="button full-button" disabled={!official?.slot}>
                <Plus size={17} /> {t("Add this course", "এই কোর্স যোগ করুন")}
              </button>
            </form>
            <p className="caption source-links">
              {t("Official sources: ", "অফিসিয়াল source: ")}
              <a
                href="https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/09/CSE-Course-Offerings-263_compressed.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Course offering
              </a>
              {" · "}
              <a
                href="https://cse.uiu.ac.bd/wp-content/uploads/sites/3/2026/09/Exam-Routine-Fall-2026.pdf"
                target="_blank"
                rel="noreferrer"
              >
                Exam template
              </a>
            </p>
          </Card>
          <Card>
            <div className="step-label">
              2 · {t("Choose several courses", "একাধিক কোর্স বাছুন")}
            </div>
            <h2>{t("Your combined routine", "আপনার সম্মিলিত রুটিন")}</h2>
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Search saved courses"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Search saved courses", "সংরক্ষিত কোর্স খুঁজুন")}
              />
            </label>
            <div className="routine-picker">
              {matches.map((entry) => (
                <label className="routine-option" key={entry.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(entry.id)}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? [...selected, entry.id]
                          : selected.filter((id) => id !== entry.id),
                      )
                    }
                  />
                  <span>
                    <strong>{entry.course}</strong>
                    <small>
                      {entry.exam} · {entry.day} · {entry.time}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Delete ${entry.course}`}
                    onClick={(event) => {
                      event.preventDefault();
                      const next = entries.filter(
                        (item) => item.id !== entry.id,
                      );
                      setEntries(next);
                      setSelected(selected.filter((id) => id !== entry.id));
                      localStorage.setItem(ROUTINE_KEY, JSON.stringify(next));
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </label>
              ))}
              {!matches.length && (
                <div className="empty compact">
                  {t(
                    "Add a course from the official list.",
                    "অফিসিয়াল তালিকা থেকে কোর্স যোগ করুন।",
                  )}
                </div>
              )}
            </div>
            {!!conflicts.length && (
              <div className="error" role="alert">
                {t("Time conflict: ", "সময় সংঘর্ষ: ")}
                {conflicts
                  .map((group) => group.map((item) => item.course).join(" + "))
                  .join(", ")}
              </div>
            )}
            <div className="selected-routine">
              {chosen.map((entry) => (
                <article key={entry.id} className="schedule-card">
                  <span className="schedule-icon">
                    <Check size={16} />
                  </span>
                  <div>
                    <strong>{entry.course}</strong>
                    <small>
                      {entry.exam}
                      {entry.section ? ` · Section ${entry.section}` : ""}
                    </small>
                  </div>
                  <div className="schedule-when">
                    <b>{entry.day}</b>
                    <span>{entry.time}</span>
                  </div>
                </article>
              ))}
              {!chosen.length && (
                <p className="caption">
                  {t(
                    "Selected courses appear together here.",
                    "নির্বাচিত কোর্সগুলো এখানে একসাথে দেখাবে।",
                  )}
                </p>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="cover-workspace">
          <Card className="cover-form no-print">
            <div className="step-label">
              1 · {t("Choose a format", "ফরম্যাট বাছুন")}
            </div>
            <div className="document-type-grid" aria-label="Document type">
              {DOC_TYPES.map((type) => (
                <button
                  key={type}
                  className={cover.type === type ? "selected" : ""}
                  onClick={() => setCoverField("type", type)}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="segmented compact-segment">
              {(["Individual", "Group"] as const).map((mode) => (
                <button
                  key={mode}
                  className={cover.mode === mode ? "selected" : ""}
                  onClick={() => setCoverField("mode", mode)}
                >
                  {mode === "Group" && <Users size={15} />} {mode}
                </button>
              ))}
            </div>
            <Field label={t("Template", "টেমপ্লেট")}>
              <select
                value={cover.template}
                onChange={(event) =>
                  setCoverField("template", event.target.value)
                }
              >
                {TEMPLATES.map((template) => (
                  <option key={template}>{template}</option>
                ))}
              </select>
            </Field>
            <h3>{t("Document details", "ডকুমেন্টের তথ্য")}</h3>
            <div className="form-grid">
              <Field label={t("Title", "শিরোনাম")}>
                <input
                  value={cover.title}
                  onChange={(event) =>
                    setCoverField("title", event.target.value)
                  }
                  placeholder={`${cover.type} title`}
                />
              </Field>
              <Field label={t("Submission date", "জমার তারিখ")}>
                <input
                  type="date"
                  value={cover.date}
                  onChange={(event) =>
                    setCoverField("date", event.target.value)
                  }
                />
              </Field>
              <Field label={t("Course name", "কোর্সের নাম")}>
                <input
                  value={cover.course}
                  onChange={(event) =>
                    setCoverField("course", event.target.value)
                  }
                />
              </Field>
              <Field label={t("Course code", "কোর্স কোড")}>
                <input
                  value={cover.code}
                  onChange={(event) =>
                    setCoverField("code", event.target.value)
                  }
                  placeholder="CSE 1111"
                />
              </Field>
              <Field label={t("Section", "সেকশন")}>
                <input
                  value={cover.section}
                  onChange={(event) =>
                    setCoverField("section", event.target.value)
                  }
                />
              </Field>
              <Field label={t("Program / department", "প্রোগ্রাম / বিভাগ")}>
                <input
                  value={cover.program}
                  onChange={(event) =>
                    setCoverField("program", event.target.value)
                  }
                  placeholder="BSc in CSE"
                />
              </Field>
            </div>
            {cover.type === "Lab Report" && (
              <Field label={t("Experiment number", "এক্সপেরিমেন্ট নম্বর")}>
                <input
                  value={cover.experimentNo}
                  onChange={(event) =>
                    setCoverField("experimentNo", event.target.value)
                  }
                  placeholder="Experiment 01"
                />
              </Field>
            )}
            {cover.type === "Answer Script" && (
              <Field label={t("Assessment type", "পরীক্ষার ধরন")}>
                <select
                  value={cover.assessmentType}
                  onChange={(event) =>
                    setCoverField("assessmentType", event.target.value)
                  }
                >
                  <option>Class Test</option>
                  <option>Quiz</option>
                  <option>Midterm</option>
                  <option>Final</option>
                </select>
              </Field>
            )}
            {cover.type === "Lab Index" && (
              <Field
                label={t(
                  "Index items (one per line)",
                  "ইনডেক্স আইটেম (প্রতি লাইনে একটি)",
                )}
              >
                <textarea
                  rows={4}
                  value={cover.indexItems}
                  onChange={(event) =>
                    setCoverField("indexItems", event.target.value)
                  }
                  placeholder="01. Introduction to the lab"
                />
              </Field>
            )}
            <h3>{t("Student information", "শিক্ষার্থীর তথ্য")}</h3>
            {cover.mode === "Individual" ? (
              <div className="form-grid">
                <Field label={t("Student name", "শিক্ষার্থীর নাম")}>
                  <input
                    value={cover.student}
                    onChange={(event) =>
                      setCoverField("student", event.target.value)
                    }
                  />
                </Field>
                <Field label={t("Student ID", "স্টুডেন্ট আইডি")}>
                  <input
                    value={cover.studentId}
                    onChange={(event) =>
                      setCoverField("studentId", event.target.value)
                    }
                  />
                </Field>
              </div>
            ) : (
              <Field
                label={t(
                  "Group members (name — ID, one per line)",
                  "গ্রুপ সদস্য (নাম — ID, প্রতি লাইনে একজন)",
                )}
              >
                <textarea
                  rows={5}
                  value={cover.groupMembers}
                  onChange={(event) =>
                    setCoverField("groupMembers", event.target.value)
                  }
                  placeholder={
                    "Nusrat Jahan — 011 231 001\nRahim Ahmed — 011 231 002"
                  }
                />
              </Field>
            )}
            <h3>{t("Faculty information", "শিক্ষকের তথ্য")}</h3>
            <div className="form-grid">
              <Field label={t("Faculty name", "শিক্ষকের নাম")}>
                <input
                  value={cover.faculty}
                  onChange={(event) =>
                    setCoverField("faculty", event.target.value)
                  }
                />
              </Field>
              <Field label={t("Designation", "পদবি")}>
                <input
                  value={cover.designation}
                  onChange={(event) =>
                    setCoverField("designation", event.target.value)
                  }
                  placeholder="Assistant Professor"
                />
              </Field>
              <Field label={t("Faculty department", "শিক্ষকের বিভাগ")}>
                <input
                  value={cover.facultyDepartment}
                  onChange={(event) =>
                    setCoverField("facultyDepartment", event.target.value)
                  }
                  placeholder="Department of CSE"
                />
              </Field>
            </div>
            <Field
              label={t(
                "Attach an existing PDF (optional, max 20 MB)",
                "আগের PDF যুক্ত করুন (ঐচ্ছিক, সর্বোচ্চ ২০ MB)",
              )}
            >
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file && file.size > 20 * 1024 * 1024) {
                    setError("The attached PDF must be 20 MB or smaller.");
                    event.target.value = "";
                    return;
                  }
                  setAttachment(file);
                  setError("");
                }}
              />
              <small>
                {attachment
                  ? `${attachment.name} will follow the cover page.`
                  : "The cover will become page 1."}
              </small>
            </Field>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="cover-actions">
              <button
                className="button"
                disabled={exporting}
                onClick={() => runExport("pdf")}
              >
                <Download size={16} /> Download PDF
              </button>
              <button
                className="secondary"
                disabled={exporting}
                onClick={() => runExport("docx")}
              >
                <Download size={16} /> Download Word
              </button>
              <button
                className="secondary reset-cover"
                onClick={() => {
                  if (!window.confirm("Reset all cover-page fields?")) return;
                  setCover(
                    blankCover(data.profile.program, data.profile.studentId),
                  );
                  setAttachment(undefined);
                }}
              >
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </Card>
          <section
            className={`cover-preview cover-${cover.template.toLowerCase()}`}
            aria-label="Cover page preview"
          >
            <img
              className="uiu-cover-logo"
              src={`${import.meta.env.BASE_URL}assets/uiu-logo.png`}
              alt="United International University"
            />
            <span>United City, Madani Avenue, Dhaka</span>
            <div className="cover-rule" />
            <small>{cover.type.toUpperCase()}</small>
            <h1>{cover.title || `${cover.type} title`}</h1>
            {cover.experimentNo && <p>{cover.experimentNo}</p>}
            {cover.assessmentType && cover.type === "Answer Script" && (
              <p>{cover.assessmentType}</p>
            )}
            <h2>{cover.course || "Course name"}</h2>
            <p>
              {cover.code || "Course code"}
              {cover.section ? ` · Section ${cover.section}` : ""}
            </p>
            {cover.type === "Lab Index" && cover.indexItems && (
              <ol className="cover-index">
                {cover.indexItems
                  .split("\n")
                  .filter(Boolean)
                  .map((item) => (
                    <li key={item}>{item.replace(/^\d+[.)]?\s*/, "")}</li>
                  ))}
              </ol>
            )}
            <div className="cover-people">
              <div>
                <small>
                  {cover.mode === "Group"
                    ? "SUBMITTED BY · GROUP"
                    : "SUBMITTED BY"}
                </small>
                {cover.mode === "Group" ? (
                  cover.groupMembers
                    .split("\n")
                    .filter(Boolean)
                    .map((member) => <span key={member}>{member}</span>)
                ) : (
                  <>
                    <strong>{cover.student || "Student name"}</strong>
                    <span>{cover.studentId || "Student ID"}</span>
                  </>
                )}
                <span>{cover.program || "Program / Department"}</span>
              </div>
              <div>
                <small>SUBMITTED TO</small>
                <strong>{cover.faculty || "Faculty name"}</strong>
                <span>{cover.designation || "Designation"}</span>
                <span>{cover.facultyDepartment || "Department"}</span>
                <span>United International University</span>
              </div>
            </div>
            <footer>{cover.date || "Submission date"}</footer>
          </section>
        </div>
      )}
    </>
  );
}
