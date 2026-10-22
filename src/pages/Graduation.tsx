import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "../state/AppState";
import { summary } from "../state/selectors";
import { csePartial, batchAtLeast } from "../policy/repository";
import { money, tuition } from "../domain/finance";
import { project } from "../domain/academic";
import { curriculumPlan } from "../domain/curriculum";
import type { Requirement } from "../domain/types";
import {
  Card,
  Heading,
  NumberField,
  Field,
  Note,
  Stat,
  calculate,
  ResultError,
  Badge,
  fmt,
  Advanced,
} from "../components/ui";
const blank = (): Requirement => ({
  id: crypto.randomUUID(),
  code: "",
  title: "",
  credits: 3,
  category: "core",
  prerequisites: [],
  electiveGroup: "",
  selected: true,
});
export default function Graduation() {
  const { data, update, t, notify } = useApp();
  const [r, setR] = useState(blank),
    [load, setLoad] = useState(data.profile.load),
    [error, setError] = useState(""),
    [graduation, setGraduation] = useState(""),
    [futureGpa, setFutureGpa] = useState(3.67),
    [checkCode, setCheckCode] = useState("");
  const set = <K extends keyof Requirement>(k: K, v: Requirement[K]) =>
    setR({ ...r, [k]: v });
  const s = summary(data);
  const [degree, setDegree] = useState(
    data.profile.degreeCredits || Number.NaN,
  );
  const [earned, setEarned] = useState(
    data.profile.ready || data.courses.length ? s.earned : Number.NaN,
  );
  const plan = calculate(() =>
    curriculumPlan(data.requirements, data.courses, load),
  );
  const checkedRequirement = data.requirements.find(
    (requirement) => requirement.code === checkCode,
  );
  const missingPrerequisites =
    checkedRequirement?.prerequisites.filter(
      (code) => !plan.result?.completed.has(code),
    ) ?? [];
  const trackProgress = [
    ...new Set(
      data.requirements
        .filter(
          (requirement) =>
            requirement.selected && requirement.electiveGroup.trim(),
        )
        .map((requirement) => requirement.electiveGroup.trim()),
    ),
  ].map((name) => {
    const requirements = data.requirements.filter(
      (requirement) =>
        requirement.selected && requirement.electiveGroup.trim() === name,
    );
    const completed = requirements.filter((requirement) =>
      plan.result?.completed.has(requirement.code),
    );
    return {
      name,
      completed: completed.length,
      total: requirements.length,
      earnedCredits: completed.reduce(
        (sum, requirement) => sum + requirement.credits,
        0,
      ),
      totalCredits: requirements.reduce(
        (sum, requirement) => sum + requirement.credits,
        0,
      ),
    };
  });
  const remainingResult = calculate(() => {
    if (
      !Number.isFinite(degree) ||
      degree <= 0 ||
      !Number.isFinite(earned) ||
      earned < 0 ||
      earned > degree
    )
      throw new Error(
        "Enter total degree credits and completed credits (completed cannot exceed total).",
      );
    return degree - earned;
  });
  const remaining = remainingResult.result;
  const paceCost = (creditsPerTerm: number) => {
    if (!data.finance.rate || remaining === null) return null;
    const terms = Math.ceil(remaining / creditsPerTerm);
    return tuition({
      ...data.finance,
      regular: remaining,
      excluded: 0,
      retake: 0,
      firstRetake: 0,
      termFee: terms * data.finance.termFee,
      gymFee: terms * data.finance.gymFee,
      busFee: terms * data.finance.busFee,
      other: 0,
      paid: 0,
    }).total;
  };
  const canLoad =
    data.profile.program === "CSE" &&
    batchAtLeast(data.profile.batch, 2026, "Summer");
  return (
    <>
      <Heading
        eyebrow={t("GRADUATION PLANNER", "ডিগ্রি সম্পন্ন করার পরিকল্পনা")}
        title={t("Plan your graduation", "গ্র্যাজুয়েশনের পরিকল্পনা করুন")}
        description={t(
          "Map requirements, check prerequisites and explore a sustainable course load.",
          "কোর্সের শর্ত, পূর্বশর্ত ও প্রতি টার্মের চাপ মিলিয়ে পরিকল্পনা করুন।",
        )}
      />
      <Advanced
        title={t(
          "Curriculum coverage & assumptions",
          "পাঠ্যক্রমের তথ্য ও অনুমান",
        )}
      >
        <Note>
          {t(
            "The verified CSE Summer 2026+ catalog contains only eight confirmed rows here, not the full 141-credit curriculum. Add remaining requirements from your approved plan. Other batches use manual requirements. Suggestions do not guarantee course availability or degree clearance.",
            "এখানে CSE Summer 2026+ এর আটটি নিশ্চিত কোর্স আছে, পুরো ১৪১ ক্রেডিটের তালিকা নয়। অনুমোদিত পরিকল্পনা থেকে বাকি কোর্স যোগ করুন। এটি কোর্স অফার বা ডিগ্রি নিশ্চিত করে না।",
          )}
        </Note>
      </Advanced>
      <Card>
        <div className="step-label">
          {t("1 · Enter your degree progress", "১ · ডিগ্রির অগ্রগতি দিন")}
        </div>
        <div className="form-grid">
          <NumberField
            label={t("Total degree credits", "ডিগ্রির মোট ক্রেডিট")}
            value={degree}
            max={1000}
            onChange={setDegree}
          />
          <NumberField
            label={t("Completed degree credits", "অর্জিত ডিগ্রি ক্রেডিট")}
            value={earned}
            max={1000}
            onChange={setEarned}
          />
        </div>
        <ResultError message={remainingResult.error} />
      </Card>
      <div className="stats-grid three">
        <Stat
          label={t("Earned degree credits", "অর্জিত ডিগ্রি ক্রেডিট")}
          value={Number.isFinite(earned) ? earned : "—"}
          sub="Unique passing course codes / user summary"
        />
        <Stat
          label={t("Remaining degree credits", "ডিগ্রির বাকি ক্রেডিট")}
          value={remaining ?? "—"}
          sub={`${Number.isFinite(degree) ? degree : "Unknown"} total requirement`}
        />
        <Stat
          label={t(
            "Loaded requirement credits remaining",
            "তালিকাভুক্ত বাকি ক্রেডিট",
          )}
          value={
            data.requirements.length ? (plan.result?.remaining ?? "—") : "—"
          }
          sub="Partial catalog — not total degree remaining"
        />
      </div>
      <div className="two-col">
        <Advanced
          title={t(
            "Manage curriculum requirements",
            "পাঠ্যক্রমের কোর্স যোগ করুন",
          )}
        >
          <Card>
            <h2>
              {t("Add an approved requirement", "অনুমোদিত কোর্স যোগ করুন")}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  update((d) => ({
                    ...d,
                    requirements: [
                      ...d.requirements,
                      { ...r, code: r.code.trim().toUpperCase() },
                    ],
                  }));
                  setR(blank());
                  setError("");
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              <div className="form-grid">
                <Field label={t("Course code", "কোর্স কোড")}>
                  <input
                    required
                    value={r.code}
                    onChange={(e) => set("code", e.target.value)}
                  />
                </Field>
                <Field label={t("Title", "নাম")}>
                  <input
                    required
                    value={r.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </Field>
                <NumberField
                  label={t("Credits", "ক্রেডিট")}
                  value={r.credits}
                  min={0.01}
                  max={100}
                  onChange={(n) => set("credits", n)}
                />
                <Field label={t("Category", "ধরন")}>
                  <select
                    value={r.category}
                    onChange={(e) =>
                      set("category", e.target.value as Requirement["category"])
                    }
                  >
                    {[
                      "core",
                      "elective",
                      "project",
                      "thesis",
                      "internship",
                      "lab",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={t(
                    "Prerequisite codes (comma separated)",
                    "পূর্বশর্ত কোর্স কোড (কমা দিয়ে)",
                  )}
                >
                  <input
                    value={r.prerequisites.join(",")}
                    onChange={(e) =>
                      set(
                        "prerequisites",
                        e.target.value
                          .split(",")
                          .map((x) => x.trim().toUpperCase())
                          .filter(Boolean),
                      )
                    }
                  />
                </Field>
                <Field
                  label={t(
                    "Major / minor / track (optional)",
                    "মেজর / মাইনর / ট্র্যাক (ঐচ্ছিক)",
                  )}
                >
                  <input
                    value={r.electiveGroup}
                    onChange={(e) => set("electiveGroup", e.target.value)}
                  />
                </Field>
              </div>
              <ResultError message={error} />
              <button className="button">
                <Plus size={16} />
                {t("Add requirement", "কোর্স যোগ করুন")}
              </button>
            </form>
            <button
              className="secondary mt"
              disabled={!canLoad}
              onClick={() => {
                update((d) => ({
                  ...d,
                  requirements: [
                    ...d.requirements,
                    ...csePartial.filter(
                      (r) => !d.requirements.some((x) => x.code === r.code),
                    ),
                  ],
                }));
                notify(
                  "Eight verified CSE rows loaded. Add the rest manually.",
                );
              }}
            >
              {t("Load verified CSE subset", "যাচাইকৃত CSE অংশ যোগ করুন")}
            </button>
            {!canLoad && (
              <small>
                Available only for a CSE profile with batch Summer 2026 or
                later.
              </small>
            )}
          </Card>
        </Advanced>
        <Card>
          <h2>{t("Explore your pace", "কোর্সের চাপ তুলনা করুন")}</h2>
          <NumberField
            label={t(
              "Maximum credits per term",
              "প্রতি টার্মে সর্বোচ্চ ক্রেডিট",
            )}
            value={load}
            min={0.01}
            max={50}
            onChange={setLoad}
          />
          <Field
            label={t(
              "Personal target graduation term",
              "নিজের লক্ষ্য গ্র্যাজুয়েশন টার্ম",
            )}
          >
            <input
              placeholder="Fall 2029"
              value={graduation}
              onChange={(e) => setGraduation(e.target.value)}
            />
          </Field>
          <div className="breakdown">
            {[9, 12, 15].map((n) => (
              <div key={n}>
                <span>{n} credits / term</span>
                <b>
                  {remaining !== null ? Math.ceil(remaining / n) : "—"} terms*
                  <small style={{ display: "block" }}>
                    {paceCost(n) === null
                      ? "Save a fee plan to estimate cost"
                      : money(paceCost(n)!)}
                  </small>
                </b>
              </div>
            ))}
          </div>
          <p className="caption">
            {graduation
              ? `Personal milestone: ${graduation}. This is your chosen target, not a guaranteed completion date.`
              : "Set a personal graduation milestone above."}
          </p>
          <NumberField
            label={t(
              "Expected GPA in remaining new credits",
              "বাকি নতুন ক্রেডিটে প্রত্যাশিত জিপিএ",
            )}
            value={futureGpa}
            max={4}
            onChange={setFutureGpa}
          />
          <p>
            Projected final CGPA:{" "}
            <b>
              {(data.profile.ready || data.courses.length > 0) &&
              s.cgpa !== null &&
              s.credits !== null
                ? fmt(
                    calculate(() =>
                      project(s.cgpa!, s.credits!, [
                        { credits: remaining ?? Number.NaN, gpa: futureGpa },
                      ]),
                    ).result,
                  )
                : "—"}
            </b>
          </p>
          <p className="caption">
            All remaining credits assumed new; failed-course repeats require
            separate retake analysis. Costs include regular tuition and term
            fees, excluding waivers and extras.
          </p>
          <p className="caption">
            * Cost assumes your saved tuition waiver continues for all remaining
            credits. Semester, gym and bus fees repeat every estimated term and
            receive no waiver. Lab/other fees, retakes and future fee changes
            are excluded. Prerequisites and course availability can extend
            duration.
          </p>
          <Note>
            CSE 2026: minimum CGPA 2.00, all requirements passed, final-year
            design project at least C. A credit total alone cannot certify
            graduation.
          </Note>
        </Card>
      </div>
      <Advanced
        title={t(
          "Curriculum checklist & suggested sequence",
          "পাঠ্যক্রমের তালিকা ও সম্ভাব্য ক্রম",
        )}
      >
        <div className="curriculum-guide">
          <h2>{t("How this planner works", "এই প্ল্যানার যেভাবে কাজ করে")}</h2>
          <ol>
            <li>
              {t(
                "Load the verified CSE subset when eligible, then add the remaining courses from your approved curriculum.",
                "প্রযোজ্য হলে যাচাইকৃত CSE অংশ যোগ করুন, তারপর আপনার অনুমোদিত কারিকুলাম থেকে বাকি কোর্স দিন।",
              )}
            </li>
            <li>
              {t(
                "A requirement becomes Passed when a passing course with the same code exists in Academic history.",
                "Academic history-তে একই কোডের পাস করা কোর্স থাকলে requirement-টি Passed হবে।",
              )}
            </li>
            <li>
              {t(
                "Uncheck elective alternatives you do not plan to take and enter prerequisite course codes exactly.",
                "যে elective বিকল্প নেবেন না সেটি বাদ দিন এবং prerequisite কোড ঠিকভাবে লিখুন।",
              )}
            </li>
            <li>
              {t(
                "The suggestion places eligible courses into terms up to your credit limit; prerequisites move dependent courses to later terms.",
                "নির্বাচিত credit limit পর্যন্ত উপযুক্ত কোর্স একেক টার্মে বসবে; prerequisite থাকা কোর্স পরের টার্মে যাবে।",
              )}
            </li>
          </ol>
          <p>
            {t(
              "This sequence covers only the requirements currently loaded below. It does not certify graduation or predict course availability.",
              "এই sequence শুধু নিচে যোগ করা requirement-এর জন্য। এটি graduation বা course availability নিশ্চিত করে না।",
            )}
          </p>
        </div>
        <Card className="prerequisite-checker">
          <div className="step-label">
            {t("PREREQUISITE CHECKER", "প্রি-রিকুইজিট চেকার")}
          </div>
          <h2>
            {t("Can I register for this course?", "এই কোর্সটি কি নিতে পারব?")}
          </h2>
          <Field label={t("Choose a loaded course", "তালিকা থেকে কোর্স বাছুন")}>
            <select
              value={checkCode}
              onChange={(event) => setCheckCode(event.target.value)}
            >
              <option value="">{t("Select course", "কোর্স বাছুন")}</option>
              {data.requirements
                .filter((requirement) => requirement.selected)
                .map((requirement) => (
                  <option value={requirement.code} key={requirement.id}>
                    {requirement.code} · {requirement.title}
                  </option>
                ))}
            </select>
          </Field>
          {checkedRequirement && (
            <div
              className={`eligibility-result ${missingPrerequisites.length ? "blocked" : "ready"}`}
            >
              <strong>
                {missingPrerequisites.length
                  ? t("Prerequisites still missing", "প্রি-রিকুইজিট এখনও বাকি")
                  : t(
                      "Recorded prerequisites completed",
                      "রেকর্ড করা প্রি-রিকুইজিট সম্পন্ন",
                    )}
              </strong>
              <span>
                {checkedRequirement.prerequisites.length
                  ? missingPrerequisites.length
                    ? missingPrerequisites.join(", ")
                    : checkedRequirement.prerequisites.join(", ")
                  : t(
                      "No prerequisite is recorded for this course.",
                      "এই কোর্সের কোনো prerequisite রেকর্ড করা নেই।",
                    )}
              </span>
            </div>
          )}
          {!data.requirements.length && (
            <p className="caption">
              {t(
                "Add or load curriculum requirements first.",
                "আগে curriculum requirement যোগ বা load করুন।",
              )}
            </p>
          )}
        </Card>
        {!!trackProgress.length && (
          <Card>
            <h2>
              {t(
                "Major, minor & track progress",
                "মেজর, মাইনর ও ট্র্যাক অগ্রগতি",
              )}
            </h2>
            <div className="track-progress-grid">
              {trackProgress.map((track) => (
                <article key={track.name}>
                  <div>
                    <strong>{track.name}</strong>
                    <span>
                      {track.completed}/{track.total} courses
                    </span>
                  </div>
                  <progress
                    value={track.earnedCredits}
                    max={track.totalCredits || 1}
                  />
                  <small>
                    {track.earnedCredits} / {track.totalCredits} credits passed
                  </small>
                </article>
              ))}
            </div>
          </Card>
        )}
        <Card>
          <h2>{t("Your curriculum checklist", "আপনার পাঠ্যক্রমের তালিকা")}</h2>
          <p className="caption">
            Select only the approved elective alternatives you intend to take.
            Group labels do not establish required elective counts; confirm with
            your adviser.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Include</th>
                  <th>Course</th>
                  <th>Credits</th>
                  <th>Category / major-minor-track</th>
                  <th>Prerequisites</th>
                  <th>Status</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {data.requirements.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={c.selected}
                        aria-label={`Include ${c.code}`}
                        onChange={(e) =>
                          update((d) => ({
                            ...d,
                            requirements: d.requirements.map((x) =>
                              x.id === c.id
                                ? { ...x, selected: e.target.checked }
                                : x,
                            ),
                          }))
                        }
                      />
                    </td>
                    <td>
                      <b>{c.code}</b>
                      <small>{c.title}</small>
                    </td>
                    <td>{c.credits}</td>
                    <td>
                      {c.category}
                      {c.electiveGroup ? ` / ${c.electiveGroup}` : ""}
                    </td>
                    <td>{c.prerequisites.join(", ") || "None recorded"}</td>
                    <td>
                      <Badge
                        tone={
                          plan.result?.completed.has(c.code) ? "green" : "gray"
                        }
                      >
                        {plan.result?.completed.has(c.code)
                          ? "Passed"
                          : "Remaining"}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${c.code}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove this curriculum requirement?",
                            )
                          )
                            update((d) => ({
                              ...d,
                              requirements: d.requirements.filter(
                                (x) => x.id !== c.id,
                              ),
                            }));
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.requirements.length && (
            <p className="empty">No requirements loaded yet.</p>
          )}
        </Card>
        <Card>
          <h2>
            {t(
              "Suggested sequence for loaded requirements",
              "তালিকাভুক্ত কোর্সের সম্ভাব্য ক্রম",
            )}
          </h2>
          <ResultError message={plan.error} />
          <div className="installments">
            {plan.result?.terms.map((term, i) => (
              <div key={i}>
                <Badge>Term {i + 1}</Badge>
                <h3>{term.reduce((s, c) => s + c.credits, 0)} credits</h3>
                {term.map((c) => (
                  <p key={c.id}>
                    {c.code} · {c.title}
                  </p>
                ))}
              </div>
            ))}
          </div>
          {!!plan.result?.blocked.length && (
            <Note>
              Unscheduled: {plan.result.blocked.map((c) => c.code).join(", ")}.
              Check missing/cyclic prerequisites or a course larger than the
              selected term limit.
            </Note>
          )}
          <p className="caption">
            Requirements are user-provided except the labeled verified CSE
            subset. For quick-start profiles, completed course codes must still
            be entered in history to check prerequisites.
          </p>
        </Card>
      </Advanced>
    </>
  );
}
