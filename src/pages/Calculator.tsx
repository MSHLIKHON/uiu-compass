import { useState } from "react";
import { HistoryCharts } from "../components/HistoryCharts";
import { Plus, Trash2, Copy, Pencil, RotateCcw } from "lucide-react";
import { useApp } from "../state/AppState";
import { academic, GRADES, project, gradePoint } from "../domain/academic";
import type { Course, Grade } from "../domain/types";
import {
  Card,
  Heading,
  Note,
  NumberField,
  Field,
  Stat,
  fmt,
  calculate,
  ResultError,
  Badge,
  Advanced,
} from "../components/ui";
const blank = (): Course => ({
  id: crypto.randomUUID(),
  term: "Term 1",
  code: "",
  title: "",
  credits: 3,
  grade: "A",
  attempt: 1,
  category: "core",
  excluded: false,
});
const UIU_GRADING = [
  ["A", "4.00", "90–100", "Outstanding"],
  ["A-", "3.67", "86–89", "Excellent"],
  ["B+", "3.33", "82–85", "Very good"],
  ["B", "3.00", "78–81", "Good"],
  ["B-", "2.67", "74–77", "Above average"],
  ["C+", "2.33", "70–73", "Average"],
  ["C", "2.00", "66–69", "Below average"],
  ["C-", "1.67", "62–65", "Poor"],
  ["D+", "1.33", "58–61", "Very poor"],
  ["D", "1.00", "55–57", "Pass"],
  ["F", "0.00", "0–54", "Fail"],
] as const;
export default function Calculator() {
  const { data, update, t, notify } = useApp();
  const [draft, setDraft] = useState(blank);
  const [draftActive, setDraftActive] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [previous, setPrevious] = useState(
    data.profile.ready ? data.profile.cgpa : Number.NaN,
  );
  const [credits, setCredits] = useState(
    data.profile.ready ? data.profile.gpaCredits : Number.NaN,
  );
  const [term, setTerm] = useState(data.courses.at(-1)?.term ?? "Term 1");
  const [deleteId, setDeleteId] = useState("");
  const [quickRows, setQuickRows] = useState<
    Array<{ id: string; credits: number; grade: Grade | "" }>
  >([
    { id: crypto.randomUUID(), credits: 3, grade: "A" },
    { id: crypto.randomUUID(), credits: 3, grade: "" },
  ]);
  const history = data.courses;
  const current = history.filter((c) => c.term === term);
  const preview = draftActive
    ? [
        ...history.filter((c) => c.id !== draft.id),
        { ...draft, term: editing ? draft.term : term },
      ]
    : history;
  const previewResult = calculate(() => academic(preview, data.retakeRule));
  const total = academic(history, data.retakeRule);
  const termResult = calculate(() =>
    academic(
      preview.filter((c) => c.term === term),
      data.retakeRule,
    ),
  );
  const termStats = termResult.result ?? {
    gpa: null,
    points: null,
    gpaCredits: null,
    unresolved: false,
  };
  const quickCredits = quickRows.reduce(
    (sum, row) => sum + (row.grade ? row.credits : 0),
    0,
  );
  const quickPoints = quickRows.reduce(
    (sum, row) =>
      sum + (row.grade ? row.credits * (gradePoint(row.grade) ?? 0) : 0),
    0,
  );
  const quickGpa = quickCredits ? quickPoints / quickCredits : null;
  const quick = calculate(() =>
    project(previous, credits, [{ credits: quickCredits, gpa: quickGpa ?? 0 }]),
  );
  const set = <K extends keyof Course>(k: K, v: Course[K]) => {
    setDraft({ ...draft, [k]: v });
    setDraftActive(true);
    if (k === "term") setTerm(String(v));
  };
  return (
    <>
      <Heading
        eyebrow={t("GRADES & CREDITS", "পড়াশোনার হিসাব")}
        title={t("Calculate your CGPA", "আপনার সিজিপিএ হিসাব করুন")}
        description={t(
          "Add credits and grades to see your term GPA and updated CGPA.",
          "এক টার্মের হিসাব করুন বা সব কোর্সের তথ্য যোগ করুন।",
        )}
      />
      <div className="segmented">
        <button
          className={data.profile.mode === "quick" ? "selected" : ""}
          onClick={() =>
            update((d) => ({ ...d, profile: { ...d.profile, mode: "quick" } }))
          }
        >
          {t("Quick CGPA", "দ্রুত সিজিপিএ")}
        </button>
        <button
          className={data.profile.mode === "detailed" ? "selected" : ""}
          onClick={() =>
            update((d) => ({
              ...d,
              profile: { ...d.profile, mode: "detailed" },
            }))
          }
        >
          {t("Detailed history", "বিস্তারিত ইতিহাস")}
        </button>
      </div>
      <Advanced
        title={t(
          "UIU grading policy & CGPA formula",
          "UIU গ্রেডিং নীতি ও সিজিপিএ সূত্র",
        )}
      >
        <Note>
          {t(
            "Each grade has a point value. We multiply it by the course credits, add the results, then divide by the counted credits. F adds zero points. I and W are left out of estimates. For a repeated course, choose a rule in the Retake planner.",
            "F এর পয়েন্ট শূন্য, ক্রেডিট অর্জিত হয় না। I/W এর গণনার নিয়ম নিশ্চিত নয় বলে পূর্বাভাস থেকে বাদ রাখা হয়। একই কোর্সের একাধিক চেষ্টার জন্য রিটেক প্ল্যানারে নিয়ম বেছে নিন।",
          )}
        </Note>
        <div className="grade-policy-grid" aria-label="UIU grading policy">
          {UIU_GRADING.map(([grade, point, marks, meaning]) => (
            <div className="grade-policy-row" key={grade}>
              <strong>{grade}</strong>
              <span>{point}</span>
              <span>{marks}%</span>
              <small>{meaning}</small>
            </div>
          ))}
        </div>
        <p className="caption policy-source-line">
          {t("Source: ", "উৎস: ")}
          <a
            href="https://www.uiu.ac.bd/academics/grading-performance-evaluation/"
            target="_blank"
            rel="noreferrer"
          >
            {t("Official UIU grading policy", "অফিসিয়াল UIU গ্রেডিং নীতি")}
          </a>
        </p>
      </Advanced>
      <div className="two-col">
        <Card>
          <h2>
            {t(
              editing ? "Edit course" : "Add your grades",
              editing ? "কোর্স সম্পাদনা" : "কোর্স যোগ করুন",
            )}
          </h2>
          <div className="step-label">
            {t("1 · Enter your course", "১ · কোর্সের তথ্য দিন")}
          </div>
          {data.profile.mode === "quick" ? (
            <>
              <div className="form-grid quick-basics">
                <NumberField
                  label={t("Previous CGPA", "আগের সিজিপিএ")}
                  value={previous}
                  max={4}
                  onChange={setPrevious}
                />
                <NumberField
                  label={t("Previous GPA credits", "আগের জিপিএ ক্রেডিট")}
                  value={credits}
                  max={2000}
                  onChange={setCredits}
                />
              </div>
              <div className="quick-course-list">
                {quickRows.map((row, index) => (
                  <div className="quick-course-card" key={row.id}>
                    <div className="quick-course-title">
                      <strong>
                        {t(`Course ${index + 1}`, `কোর্স ${index + 1}`)}
                      </strong>
                      {quickRows.length > 1 && (
                        <button
                          className="icon-button"
                          aria-label={`Remove course ${index + 1}`}
                          onClick={() =>
                            setQuickRows(
                              quickRows.filter((item) => item.id !== row.id),
                            )
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                    <div className="form-grid">
                      <Field label={t("Credit", "ক্রেডিট")}>
                        <select
                          value={row.credits}
                          onChange={(event) =>
                            setQuickRows(
                              quickRows.map((item) =>
                                item.id === row.id
                                  ? {
                                      ...item,
                                      credits: Number(event.target.value),
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          {[1, 2, 3, 4, 5, 6].map((credit) => (
                            <option value={credit} key={credit}>
                              {credit}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={t("Grade", "গ্রেড")}>
                        <select
                          value={row.grade}
                          onChange={(event) =>
                            setQuickRows(
                              quickRows.map((item) =>
                                item.id === row.id
                                  ? {
                                      ...item,
                                      grade: event.target.value as Grade | "",
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          <option value="">Select grade</option>
                          {GRADES.map((grade) => (
                            <option key={grade}>{grade}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
              <div className="quick-course-actions">
                <button
                  className="button"
                  onClick={() =>
                    setQuickRows([
                      ...quickRows,
                      { id: crypto.randomUUID(), credits: 3, grade: "" },
                    ])
                  }
                >
                  <Plus size={17} /> {t("Add more", "আরও যোগ করুন")}
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    setQuickRows([
                      { id: crypto.randomUUID(), credits: 3, grade: "A" },
                      { id: crypto.randomUUID(), credits: 3, grade: "" },
                    ])
                  }
                >
                  <RotateCcw size={16} /> {t("Reset", "রিসেট")}
                </button>
              </div>
              <p className="caption">
                {t(
                  "The result updates instantly. Course name, code and term are not needed.",
                  "ফলাফল সঙ্গে সঙ্গে বদলাবে। কোর্সের নাম, কোড বা টার্ম লাগবে না।",
                )}
              </p>
            </>
          ) : (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  const enteredCode = draft.code.trim().toUpperCase();
                  const nextAutomaticNumber =
                    Math.max(
                      0,
                      ...history.map((course) => {
                        const match = /^COURSE (\d+)$/.exec(course.code);
                        return match ? Number(match[1]) : 0;
                      }),
                    ) + 1;
                  const code = enteredCode || `COURSE ${nextAutomaticNumber}`;
                  const normalizedDraft = {
                    ...draft,
                    term: draft.term.trim() || "Current term",
                    code,
                  };
                  if (
                    history.some(
                      (c) =>
                        c.id !== draft.id &&
                        c.code.toUpperCase() === code &&
                        c.attempt === draft.attempt,
                    )
                  ) {
                    setError("This course attempt already exists.");
                    return;
                  }
                  try {
                    update((d) => ({
                      ...d,
                      courses: editing
                        ? d.courses.map((c) =>
                            c.id === draft.id ? normalizedDraft : c,
                          )
                        : [...d.courses, normalizedDraft],
                    }));
                    setTerm(normalizedDraft.term);
                    setDraft({ ...blank(), term: normalizedDraft.term });
                    setEditing(false);
                    setDraftActive(false);
                    notify(t("Course saved.", "কোর্স সংরক্ষিত হয়েছে।"));
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                <div className="form-grid">
                  <Field label={t("Course credit", "কোর্স ক্রেডিট")}>
                    <select
                      value={draft.credits}
                      onChange={(e) => set("credits", Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((credit) => (
                        <option value={credit} key={credit}>
                          {credit} {credit === 1 ? "credit" : "credits"}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Grade", "গ্রেড")}>
                    <select
                      value={draft.grade}
                      onChange={(e) => set("grade", e.target.value as Grade)}
                    >
                      {[...GRADES, "I", "W"].map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Advanced
                  title={t(
                    "Optional course details",
                    "ঐচ্ছিক কোর্সের বিস্তারিত",
                  )}
                >
                  <p className="caption">
                    {t(
                      "Only add these details when you need term history or retake tracking.",
                      "টার্মের ইতিহাস বা রিটেক হিসাবের দরকার হলেই এই তথ্য দিন।",
                    )}
                  </p>
                  <div className="form-grid">
                    <Field label={t("Term (optional)", "টার্ম (ঐচ্ছিক)")}>
                      <input
                        value={draft.term}
                        maxLength={200}
                        onChange={(e) => set("term", e.target.value)}
                      />
                    </Field>
                    <Field
                      label={t("Course code (optional)", "কোর্স কোড (ঐচ্ছিক)")}
                    >
                      <input
                        value={draft.code}
                        maxLength={100}
                        onChange={(e) => set("code", e.target.value)}
                        placeholder="CSE 1111"
                      />
                    </Field>
                    <Field
                      label={t(
                        "Course title (optional)",
                        "কোর্সের নাম (ঐচ্ছিক)",
                      )}
                    >
                      <input
                        value={draft.title}
                        maxLength={200}
                        onChange={(e) => set("title", e.target.value)}
                      />
                    </Field>
                    <NumberField
                      label={t("Attempt number", "কততম চেষ্টা")}
                      value={draft.attempt}
                      min={1}
                      max={100}
                      step="1"
                      onChange={(n) => set("attempt", n)}
                    />
                    <Field label={t("Category", "ধরন")}>
                      <select
                        value={draft.category}
                        onChange={(e) =>
                          set("category", e.target.value as Course["category"])
                        }
                      >
                        {[
                          "core",
                          "elective",
                          "project",
                          "thesis",
                          "internship",
                          "lab",
                        ].map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </Field>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={draft.excluded}
                        onChange={(e) => set("excluded", e.target.checked)}
                      />
                      {t("Exclude from all totals", "সব হিসাব থেকে বাদ দিন")}
                    </label>
                  </div>
                </Advanced>
                <ResultError message={error} />
                <div className="actions calculator-actions">
                  <button className="button">
                    <Plus size={16} />
                    {t(
                      editing ? "Save changes" : "Add course",
                      editing ? "পরিবর্তন সংরক্ষণ" : "কোর্স যোগ করুন",
                    )}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setDraft(blank());
                        setEditing(false);
                        setDraftActive(false);
                      }}
                    >
                      {t("Cancel", "বাতিল")}
                    </button>
                  )}
                </div>
              </form>
              <div className="calculator-reset-row">
                <button
                  className="secondary"
                  onClick={() => {
                    setDraft({ ...blank(), term });
                    setDraftActive(false);
                    setEditing(false);
                    setError("");
                  }}
                >
                  {t("Clear current entry", "বর্তমান তথ্য মুছুন")}
                </button>
              </div>
            </>
          )}
        </Card>
        <Card>
          <div className="section-title">
            <h2>{t("2 · Your result", "২ · আপনার ফলাফল")}</h2>
            <Badge tone="amber">{t("USER DATA", "আপনার তথ্য")}</Badge>
          </div>
          {data.profile.mode === "detailed" && (
            <Field label={t("Selected term", "নির্বাচিত টার্ম")}>
              <select value={term} onChange={(e) => setTerm(e.target.value)}>
                {[...new Set([term, ...history.map((c) => c.term)])].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </Field>
          )}
          <div className="big-number">
            {fmt(
              data.profile.mode === "quick"
                ? quick.result
                : previewResult.result?.gpa,
            )}
            <small> / 4.00</small>
          </div>
          <p>{t("Projected cumulative GPA", "আনুমানিক মোট সিজিপিএ")}</p>
          <div className="breakdown">
            <div>
              <span>{t("Selected term GPA", "নির্বাচিত টার্মের জিপিএ")}</span>
              <b>
                {fmt(data.profile.mode === "quick" ? quickGpa : termStats.gpa)}
              </b>
            </div>
            <div>
              <span>
                {t("Quality points (term)", "টার্মের মোট গ্রেড পয়েন্ট")}
              </span>
              <b>
                {fmt(
                  data.profile.mode === "quick"
                    ? quickPoints
                    : termStats.points,
                )}
              </b>
            </div>
            <div>
              <span>{t("GPA credits (term)", "টার্মের জিপিএ ক্রেডিট")}</span>
              <b>
                {data.profile.mode === "quick"
                  ? quickCredits
                  : (termStats.gpaCredits ?? "Unresolved")}
              </b>
            </div>
            <div>
              <span>{t("Cumulative GPA credits", "মোট জিপিএ ক্রেডিট")}</span>
              <b>
                {data.profile.mode === "quick"
                  ? Number.isFinite(credits)
                    ? credits + quickCredits
                    : "—"
                  : (previewResult.result?.gpaCredits ?? "—")}
              </b>
            </div>
          </div>
          {draftActive && data.profile.mode === "detailed" && (
            <p className="live-label">
              {t(
                "Live preview · save the course to keep it.",
                "সরাসরি ফলাফল · রাখতে কোর্স সংরক্ষণ করুন।",
              )}
            </p>
          )}
          <ResultError
            message={
              data.profile.mode === "quick" ? quick.error : previewResult.error
            }
          />
          {total.unresolved && (
            <Note>
              Repeated attempts found. Select a retake assumption before a
              cumulative result is available.
            </Note>
          )}
          <p className="formula">
            Σ (credits × grade points) ÷ Σ included credits
          </p>
          <small>
            {t(
              "Displays round to 2 decimals; intermediate calculations are not rounded. Quick mode assumes selected-term courses are all new and not already included in previous credits.",
              "ফলাফল ২ দশমিক পর্যন্ত দেখানো হয়। দ্রুত মোডে নির্বাচিত টার্মের সব কোর্স নতুন হিসেবে ধরা হয়।",
            )}
          </small>
          <div className="selected-grades">
            <div className="section-title">
              <div>
                <h3>{t("Selected grades", "নির্বাচিত গ্রেড")}</h3>
                <p>
                  {t("Courses included in this result", "এই ফলে থাকা কোর্স")}
                </p>
              </div>
              <Badge>
                {data.profile.mode === "quick"
                  ? quickRows.length
                  : preview.filter((course) => course.term === term)
                      .length}{" "}
                {t("COURSES", "কোর্স")}
              </Badge>
            </div>
            {data.profile.mode === "quick"
              ? quickRows.map((row, index) => (
                  <div className="selected-grade-row" key={row.id}>
                    <span className="course-number">{index + 1}</span>
                    <div>
                      <strong>{`Course ${index + 1}`}</strong>
                      <small>{row.credits} credit course</small>
                    </div>
                    <Badge tone={row.grade === "F" ? "amber" : "blue"}>
                      {row.grade
                        ? `${row.grade} · ${gradePoint(row.grade) ?? "—"}`
                        : "Select grade"}
                    </Badge>
                  </div>
                ))
              : preview
                  .filter((course) => course.term === term)
                  .map((course, index) => (
                    <div className="selected-grade-row" key={course.id}>
                      <span className="course-number">{index + 1}</span>
                      <div>
                        <strong>{course.code || `Course ${index + 1}`}</strong>
                        <small>
                          {course.title || `${course.credits} credit course`}
                        </small>
                      </div>
                      <Badge tone={course.grade === "F" ? "amber" : "blue"}>
                        {course.grade} · {gradePoint(course.grade) ?? "—"}
                      </Badge>
                    </div>
                  ))}
            {data.profile.mode === "detailed" &&
              !preview.filter((course) => course.term === term).length && (
                <p className="caption">
                  {t(
                    "Choose a credit and grade to preview a course here.",
                    "ক্রেডিট ও গ্রেড বাছাই করলে কোর্স এখানে দেখাবে।",
                  )}
                </p>
              )}
          </div>
        </Card>
      </div>
      <Advanced title={t("Saved record summary", "সংরক্ষিত তথ্যের সারাংশ")}>
        <div className="stats-grid three">
          <Stat
            label={t("Unique earned credits", "অর্জিত স্বতন্ত্র ক্রেডিট")}
            value={history.length ? total.earned : "—"}
            sub="Same course code counted once"
          />
          <Stat
            label={t("Attempted credits", "চেষ্টা করা ক্রেডিট")}
            value={history.length ? total.attempted : "—"}
            sub="Includes ungraded attempts; excludes manual exclusions"
          />
          <Stat
            label={t("Recorded courses", "সংরক্ষিত কোর্স")}
            value={history.length}
            sub="Saved locally on this device"
          />
        </div>
      </Advanced>
      <Card>
        <div className="section-title">
          <h2>{t("Saved courses", "পড়াশোনার ইতিহাস")}</h2>
          <button
            className="secondary"
            disabled={!current.length}
            onClick={() => {
              const newTerm = window.prompt(
                "Name for copied term (grades are reset to I):",
              );
              if (!newTerm) return;
              const copies = current.map((c) => ({
                ...c,
                id: crypto.randomUUID(),
                term: newTerm,
                grade: "I" as Grade,
                attempt:
                  Math.max(
                    ...history
                      .filter((x) => x.code === c.code)
                      .map((x) => x.attempt),
                  ) + 1,
              }));
              try {
                update((d) => ({ ...d, courses: [...d.courses, ...copies] }));
                setTerm(newTerm);
                notify("Copied as additional attempts; edit before using.");
              } catch (e) {
                setError(String(e));
              }
            }}
          >
            <Copy size={14} />
            {t("Copy term", "টার্ম কপি করুন")}
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  "Term",
                  "Course",
                  "Credits",
                  "Grade",
                  "Attempt",
                  "Category",
                  "Actions",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((c) => (
                <tr key={c.id}>
                  <td>{c.term}</td>
                  <td>
                    <b>{c.code}</b>
                    <small>
                      {c.title}
                      {c.excluded ? " · Excluded" : ""}
                    </small>
                  </td>
                  <td>{c.credits}</td>
                  <td>
                    <Badge tone={c.grade === "F" ? "amber" : "blue"}>
                      {c.grade} · {gradePoint(c.grade) ?? "—"}
                    </Badge>
                  </td>
                  <td>{c.attempt}</td>
                  <td>{c.category}</td>
                  <td>
                    <div className="inline-actions">
                      <button
                        aria-label={`Edit ${c.code}`}
                        className="icon-button"
                        onClick={() => {
                          setDraft(c);
                          setDraftActive(true);
                          setTerm(c.term);
                          setEditing(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        aria-label={`Delete ${c.code}`}
                        className="icon-button"
                        onClick={() => setDeleteId(c.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!history.length && (
            <p className="empty">
              {t(
                "No courses yet. Add your first course above.",
                "কোনো কোর্স নেই। উপরে প্রথম কোর্স যোগ করুন।",
              )}
            </p>
          )}
        </div>
      </Card>
      <Advanced
        title={t("Charts & grade distribution", "চার্ট ও গ্রেডের বণ্টন")}
      >
        <HistoryCharts />
      </Advanced>
      {deleteId && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-course"
          >
            <h2 id="delete-course">Delete this course?</h2>
            <p>This removes the saved attempt from this device.</p>
            <div className="actions">
              <button
                autoFocus
                className="secondary"
                onClick={() => setDeleteId("")}
              >
                Cancel
              </button>
              <button
                className="danger"
                onClick={() => {
                  update((d) => ({
                    ...d,
                    courses: d.courses.filter((c) => c.id !== deleteId),
                  }));
                  setDeleteId("");
                }}
              >
                Delete course
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
