import { useState } from "react";
import { HistoryCharts } from "../components/HistoryCharts";
import { Plus, Trash2, Copy, Pencil } from "lucide-react";
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
export default function Calculator() {
  const { data, update, t, notify } = useApp();
  const [draft, setDraft] = useState(blank);
  const [draftActive, setDraftActive] = useState(false);
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
  const quick = calculate(() => {
    if (termResult.error) throw new Error(termResult.error);
    if (!termStats.gpaCredits)
      throw new Error("Enter a graded course to see a result.");
    if (termStats.unresolved)
      throw new Error("Resolve repeated attempts before calculating.");
    if (preview.filter((c) => c.term === term).some((c) => c.attempt > 1))
      throw new Error(
        "Quick projection only supports new courses. Use detailed mode for retakes.",
      );
    return project(previous, credits, [
      { credits: termStats.gpaCredits ?? 0, gpa: termStats.gpa ?? 0 },
    ]);
  });
  const set = <K extends keyof Course>(k: K, v: Course[K]) => {
    setDraft({ ...draft, [k]: v });
    setDraftActive(true);
    if (k === "term") setTerm(String(v));
  };
  return (
    <>
      <Heading
        eyebrow={t("ACADEMIC TOOLS", "পড়াশোনার হিসাব")}
        title={t("Calculate your CGPA", "আপনার সিজিপিএ হিসাব করুন")}
        description={t(
          "Calculate a term, or build your complete academic record.",
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
      <Advanced title={t("How grades are counted", "গ্রেড কীভাবে গণনা হয়")}>
        <Note>
          {t(
            "F = 0 points and no earned credit. I/W are provisionally excluded from numeric projections because their official denominator treatment is unverified. Repeated course codes require an explicit assumption in Retake Optimizer.",
            "F এর পয়েন্ট শূন্য, ক্রেডিট অর্জিত হয় না। I/W এর গণনার নিয়ম নিশ্চিত নয় বলে পূর্বাভাস থেকে বাদ রাখা হয়। একই কোর্সের একাধিক চেষ্টার জন্য রিটেক প্ল্যানারে নিয়ম বেছে নিন।",
          )}
        </Note>
      </Advanced>
      <div className="two-col">
        <Card>
          <h2>
            {t(
              editing ? "Edit course" : "Add a course",
              editing ? "কোর্স সম্পাদনা" : "কোর্স যোগ করুন",
            )}
          </h2>
          <div className="step-label">
            {t("1 · Enter your course", "১ · কোর্সের তথ্য দিন")}
          </div>
          {data.profile.mode === "quick" && (
            <div className="form-grid">
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
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              if (
                history.some(
                  (c) =>
                    c.id !== draft.id &&
                    c.code.toUpperCase() === draft.code.trim().toUpperCase() &&
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
                        c.id === draft.id
                          ? { ...draft, code: draft.code.trim().toUpperCase() }
                          : c,
                      )
                    : [
                        ...d.courses,
                        { ...draft, code: draft.code.trim().toUpperCase() },
                      ],
                }));
                setTerm(draft.term);
                setDraft({ ...blank(), term: draft.term });
                setEditing(false);
                setDraftActive(false);
                notify(t("Course saved.", "কোর্স সংরক্ষিত হয়েছে।"));
              } catch (e) {
                setError(String(e));
              }
            }}
          >
            <div className="form-grid">
              <Field label={t("Term", "টার্ম")}>
                <input
                  value={draft.term}
                  required
                  maxLength={200}
                  onChange={(e) => set("term", e.target.value)}
                />
              </Field>
              <Field label={t("Course code", "কোর্স কোড")}>
                <input
                  value={draft.code}
                  required
                  maxLength={100}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="CSE 1111"
                />
              </Field>
              <Field label={t("Course title", "কোর্সের নাম")}>
                <input
                  value={draft.title}
                  maxLength={200}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>
              <NumberField
                label={t("Credits", "ক্রেডিট")}
                value={draft.credits}
                min={0.01}
                max={100}
                onChange={(n) => set("credits", n)}
              />
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
            <ResultError message={error} />
            <div className="actions">
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
          <button
            className="secondary"
            onClick={() => {
              setDraft({ ...blank(), term });
              setDraftActive(false);
              setEditing(false);
              setError("");
            }}
          >
            {t("Reset unsaved course", "সংরক্ষণ না করা তথ্য মুছুন")}
          </button>
        </Card>
        <Card>
          <div className="section-title">
            <h2>{t("2 · Your result", "২ · আপনার ফলাফল")}</h2>
            <Badge tone="amber">{t("USER DATA", "আপনার তথ্য")}</Badge>
          </div>
          <Field label={t("Selected term", "নির্বাচিত টার্ম")}>
            <select value={term} onChange={(e) => setTerm(e.target.value)}>
              {[...new Set([term, ...history.map((c) => c.term)])].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
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
              <b>{fmt(termStats.gpa)}</b>
            </div>
            <div>
              <span>
                {t("Quality points (term)", "টার্মের মোট গ্রেড পয়েন্ট")}
              </span>
              <b>{fmt(termStats.points)}</b>
            </div>
            <div>
              <span>{t("GPA credits (term)", "টার্মের জিপিএ ক্রেডিট")}</span>
              <b>{termStats.gpaCredits ?? "Unresolved"}</b>
            </div>
            <div>
              <span>{t("Cumulative GPA credits", "মোট জিপিএ ক্রেডিট")}</span>
              <b>
                {data.profile.mode === "quick"
                  ? Number.isFinite(credits) && termStats.gpaCredits !== null
                    ? credits + termStats.gpaCredits
                    : "—"
                  : (previewResult.result?.gpaCredits ?? "—")}
              </b>
            </div>
          </div>
          {draftActive && (
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
          <h2>{t("Academic history", "পড়াশোনার ইতিহাস")}</h2>
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
