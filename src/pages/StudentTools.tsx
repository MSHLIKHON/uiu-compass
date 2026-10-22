import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  FileText,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import { Card, Field, Heading, Note } from "../components/ui";
import { useApp } from "../state/AppState";
import {
  routineConflicts,
  sortRoutine,
  type RoutineEntry,
} from "../domain/routine";

const ROUTINE_KEY = "uiu-compass:routine:v1";
const COVER_KEY = "uiu-compass:cover:v1";

type CoverData = {
  type: string;
  student: string;
  studentId: string;
  program: string;
  course: string;
  code: string;
  section: string;
  faculty: string;
  title: string;
  date: string;
};

const blankRoutine = (): RoutineEntry => ({
  id: crypto.randomUUID(),
  course: "",
  section: "",
  exam: "Final",
  day: "",
  time: "",
  room: "",
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
  const fallback = {
    type: "Assignment",
    student: "",
    studentId,
    program,
    course: "",
    code: "",
    section: "",
    faculty: "",
    title: "",
    date: new Date().toISOString().slice(0, 10),
  };
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
  const [cover, setCover] = useState(() =>
    readCover(data.profile.program, data.profile.studentId),
  );

  useEffect(() => {
    localStorage.setItem(COVER_KEY, JSON.stringify(cover));
  }, [cover]);

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
  const setCoverField = (key: keyof CoverData, value: string) =>
    setCover((current) => ({ ...current, [key]: value }));

  return (
    <>
      <Heading
        eyebrow={t("STUDENT TOOLS", "শিক্ষার্থী টুলস")}
        title={t(
          "Plan exams and make a cover page",
          "পরীক্ষা ও কভার পেজ গুছিয়ে নিন",
        )}
        description={t(
          "Keep your offering-based exam routine together and create a clean UIU submission cover.",
          "অফারিং থেকে পরীক্ষার রুটিন রাখুন এবং পরিচ্ছন্ন কভার পেজ বানান।",
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
              1 ·{" "}
              {t(
                "Add official offering information",
                "অফিসিয়াল অফারিং তথ্য যোগ করুন",
              )}
            </div>
            <h2>{t("Add an exam", "পরীক্ষার তথ্য যোগ করুন")}</h2>
            <Note>
              {t(
                "Copy the day and time from your current course offering or official exam routine. Entries stay only on this device.",
                "বর্তমান course offering বা অফিসিয়াল exam routine থেকে দিন ও সময় লিখুন। তথ্য শুধু এই ডিভাইসে থাকবে।",
              )}
            </Note>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const course = draft.course.trim();
                if (!course || !draft.day.trim() || !draft.time.trim()) {
                  setError("Course, exam day and time are required.");
                  return;
                }
                const next = [...entries, { ...draft, course }];
                setEntries(next);
                localStorage.setItem(ROUTINE_KEY, JSON.stringify(next));
                setSelected((value) => [...value, draft.id]);
                setDraft(blankRoutine());
                setError("");
                notify(
                  t(
                    "Exam added to your routine.",
                    "পরীক্ষা রুটিনে যোগ হয়েছে।",
                  ),
                );
              }}
            >
              <div className="form-grid">
                <Field label={t("Course code or name", "কোর্স কোড বা নাম")}>
                  <input
                    value={draft.course}
                    onChange={(e) =>
                      setDraft({ ...draft, course: e.target.value })
                    }
                    placeholder="CSE 1111 · Structured Programming"
                    maxLength={120}
                  />
                </Field>
                <Field label={t("Section", "সেকশন")}>
                  <input
                    value={draft.section}
                    onChange={(e) =>
                      setDraft({ ...draft, section: e.target.value })
                    }
                    placeholder="A"
                    maxLength={20}
                  />
                </Field>
                <Field label={t("Exam", "পরীক্ষা")}>
                  <select
                    value={draft.exam}
                    onChange={(e) =>
                      setDraft({ ...draft, exam: e.target.value })
                    }
                  >
                    <option>Midterm</option>
                    <option>Final</option>
                    <option>Class test</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label={t("Day / date", "দিন / তারিখ")}>
                  <input
                    value={draft.day}
                    onChange={(e) =>
                      setDraft({ ...draft, day: e.target.value })
                    }
                    placeholder="Sunday · 25 Oct"
                    maxLength={60}
                  />
                </Field>
                <Field label={t("Time", "সময়")}>
                  <input
                    value={draft.time}
                    onChange={(e) =>
                      setDraft({ ...draft, time: e.target.value })
                    }
                    placeholder="10:00 AM – 12:00 PM"
                    maxLength={60}
                  />
                </Field>
                <Field label={t("Room (optional)", "রুম (ঐচ্ছিক)")}>
                  <input
                    value={draft.room}
                    onChange={(e) =>
                      setDraft({ ...draft, room: e.target.value })
                    }
                    placeholder="Room 401"
                    maxLength={60}
                  />
                </Field>
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button className="button full-button">
                <Plus size={17} />
                {t("Add to routine", "রুটিনে যোগ করুন")}
              </button>
            </form>
          </Card>

          <Card>
            <div className="step-label">
              2 · {t("Find and select courses", "কোর্স খুঁজে নির্বাচন করুন")}
            </div>
            <h2>{t("Your combined routine", "আপনার সম্মিলিত রুটিন")}</h2>
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Search saved courses"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(
                  "Search course or section",
                  "কোর্স বা সেকশন খুঁজুন",
                )}
              />
            </label>
            <div className="routine-picker">
              {matches.map((entry) => (
                <label className="routine-option" key={entry.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(entry.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, entry.id]
                          : selected.filter((id) => id !== entry.id),
                      )
                    }
                  />
                  <span>
                    <strong>{entry.course}</strong>
                    <small>
                      {entry.section ? `Section ${entry.section} · ` : ""}
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
                  {entries.length
                    ? t("No matching course.", "মিলেছে এমন কোর্স নেই।")
                    : t(
                        "Add your first official offering above.",
                        "উপরে প্রথম অফিসিয়াল অফারিং যোগ করুন।",
                      )}
                </div>
              )}
            </div>
            {!!conflicts.length && (
              <div className="error" role="alert">
                {t("Time conflict found: ", "সময় সংঘর্ষ: ")}
                {conflicts
                  .map((group) => group.map((x) => x.course).join(" + "))
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
                    <span>
                      {entry.time}
                      {entry.room ? ` · ${entry.room}` : ""}
                    </span>
                  </div>
                </article>
              ))}
              {!chosen.length && (
                <p className="caption">
                  {t(
                    "Select a few saved courses to see their days and times together.",
                    "কয়েকটি সংরক্ষিত কোর্স নির্বাচন করলে দিন ও সময় একসাথে দেখাবে।",
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
              1 · {t("Fill in the details", "তথ্য দিন")}
            </div>
            <h2>{t("Submission information", "জমা দেওয়ার তথ্য")}</h2>
            <div className="form-grid">
              <Field label={t("Document type", "ডকুমেন্টের ধরন")}>
                <select
                  value={cover.type}
                  onChange={(e) => setCoverField("type", e.target.value)}
                >
                  <option>Assignment</option>
                  <option>Lab Report</option>
                  <option>Project Report</option>
                  <option>Term Paper</option>
                  <option>Presentation</option>
                </select>
              </Field>
              <Field label={t("Title", "শিরোনাম")}>
                <input
                  value={cover.title}
                  onChange={(e) => setCoverField("title", e.target.value)}
                  placeholder="Assignment title"
                />
              </Field>
              <Field label={t("Student name", "শিক্ষার্থীর নাম")}>
                <input
                  value={cover.student}
                  onChange={(e) => setCoverField("student", e.target.value)}
                />
              </Field>
              <Field label={t("Student ID", "স্টুডেন্ট আইডি")}>
                <input
                  value={cover.studentId}
                  onChange={(e) => setCoverField("studentId", e.target.value)}
                />
              </Field>
              <Field label={t("Program", "প্রোগ্রাম")}>
                <input
                  value={cover.program}
                  onChange={(e) => setCoverField("program", e.target.value)}
                />
              </Field>
              <Field label={t("Course name", "কোর্সের নাম")}>
                <input
                  value={cover.course}
                  onChange={(e) => setCoverField("course", e.target.value)}
                />
              </Field>
              <Field label={t("Course code", "কোর্স কোড")}>
                <input
                  value={cover.code}
                  onChange={(e) => setCoverField("code", e.target.value)}
                />
              </Field>
              <Field label={t("Section", "সেকশন")}>
                <input
                  value={cover.section}
                  onChange={(e) => setCoverField("section", e.target.value)}
                />
              </Field>
              <Field label={t("Faculty name", "শিক্ষকের নাম")}>
                <input
                  value={cover.faculty}
                  onChange={(e) => setCoverField("faculty", e.target.value)}
                />
              </Field>
              <Field label={t("Submission date", "জমার তারিখ")}>
                <input
                  type="date"
                  value={cover.date}
                  onChange={(e) => setCoverField("date", e.target.value)}
                />
              </Field>
            </div>
            <button
              className="button full-button"
              onClick={() => window.print()}
            >
              <Printer size={17} />
              {t("Print or save as PDF", "প্রিন্ট বা PDF হিসেবে রাখুন")}
            </button>
          </Card>
          <section className="cover-preview" aria-label="Cover page preview">
            <div className="cover-mark">UIU</div>
            <p>UNITED INTERNATIONAL UNIVERSITY</p>
            <span>United City, Madani Avenue, Dhaka</span>
            <div className="cover-rule" />
            <small>{cover.type.toUpperCase()}</small>
            <h1>{cover.title || `${cover.type} title`}</h1>
            <h2>{cover.course || "Course name"}</h2>
            <p>
              {cover.code || "Course code"}
              {cover.section ? ` · Section ${cover.section}` : ""}
            </p>
            <div className="cover-people">
              <div>
                <small>SUBMITTED BY</small>
                <strong>{cover.student || "Student name"}</strong>
                <span>{cover.studentId || "Student ID"}</span>
                <span>{cover.program || "Program"}</span>
              </div>
              <div>
                <small>SUBMITTED TO</small>
                <strong>{cover.faculty || "Faculty name"}</strong>
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
