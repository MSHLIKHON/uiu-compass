import { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { useApp } from "../state/AppState";
import { summary } from "../state/selectors";
import { targetPlan, project, discretePlan } from "../domain/academic";
import {
  Card,
  Heading,
  NumberField,
  Field,
  Note,
  Stat,
  fmt,
  calculate,
  ResultError,
  Badge,
  Advanced,
} from "../components/ui";
export default function Target() {
  const { data, update, t, notify } = useApp(),
    s = summary(data);
  const [cgpa, setCgpa] = useState(
      data.profile.ready || data.courses.length
        ? (s.cgpa ?? Number.NaN)
        : Number.NaN,
    ),
    [credits, setCredits] = useState(
      data.profile.ready || data.courses.length
        ? (s.credits ?? Number.NaN)
        : Number.NaN,
    ),
    [target, setTarget] = useState(data.profile.target);
  const [program, setProgram] = useState(data.profile.program || "");
  const [degreeCredits, setDegreeCredits] = useState(
    data.profile.degreeCredits || 140,
  );
  const [terms, setTerms] = useState([
    { credits: data.profile.load, gpa: 3.67 },
  ]);
  const [courseText, setCourseText] = useState("3, 3, 3, 3");
  const [discrete, setDiscrete] = useState<
    ReturnType<typeof discretePlan> | undefined
  >();
  const [error, setError] = useState("");
  useEffect(() => {
    setDiscrete(undefined);
    setError("");
  }, [cgpa, credits, target]);
  const remaining = terms.reduce((sum, x) => sum + x.credits, 0);
  const degreeRemaining = Number.isFinite(credits)
    ? Math.max(0, degreeCredits - credits)
    : degreeCredits;
  const calc = calculate(() => ({
    plan: targetPlan(cgpa, credits, target, remaining),
    final: project(cgpa, credits, terms),
  }));
  const r = calc.result;
  return (
    <>
      <Heading
        eyebrow={t("TARGET CGPA PLANNER", "লক্ষ্য সিজিপিএ পরিকল্পনা")}
        title={t("Plan your target CGPA", "লক্ষ্য সিজিপিএর পরিকল্পনা করুন")}
        description={t(
          "Explore the average you need, then build a term-by-term plan.",
          "প্রয়োজনীয় গড় জিপিএ দেখুন, তারপর প্রতি টার্মের পরিকল্পনা করুন।",
        )}
      />
      <Advanced title={t("Assumptions & formula", "অনুমান ও সূত্র")}>
        <Note>
          {t(
            "New-course projection only. Enter GPA-denominator credits. Retakes require the separate optimizer; forecasts are not guarantees.",
            "এটি শুধু নতুন কোর্সের পূর্বাভাস। জিপিএ গণনার ক্রেডিট দিন। রিটেকের জন্য আলাদা প্ল্যানার ব্যবহার করুন।",
          )}
        </Note>
      </Advanced>
      <div className="two-col">
        <Card>
          <div className="step-label">
            {t("1 · Enter information", "১ · তথ্য দিন")}
          </div>
          <h2>{t("Starting point", "শুরুর তথ্য")}</h2>
          <div className="form-grid">
            <Field label={t("Program", "প্রোগ্রাম")}>
              <input
                value={program}
                onChange={(event) => setProgram(event.target.value)}
                placeholder={t("Type any program", "যেকোনো প্রোগ্রাম লিখুন")}
                maxLength={100}
              />
            </Field>
            <NumberField
              label={t("Current CGPA", "বর্তমান সিজিপিএ")}
              value={cgpa}
              max={4}
              onChange={setCgpa}
            />
            <NumberField
              label={t("Current GPA credits", "বর্তমান জিপিএ ক্রেডিট")}
              value={credits}
              max={2000}
              onChange={setCredits}
            />
            <NumberField
              label={t("Target CGPA", "লক্ষ্য সিজিপিএ")}
              value={target}
              max={4}
              onChange={setTarget}
            />
            <NumberField
              label={t("Degree credits", "ডিগ্রির মোট ক্রেডিট")}
              value={degreeCredits}
              max={300}
              onChange={setDegreeCredits}
            />
            <p className="caption full-span">
              {t(
                "Program and total credits are fully editable. Use the curriculum that applies to you.",
                "প্রোগ্রাম ও মোট ক্রেডিট সম্পূর্ণ পরিবর্তন করা যাবে। আপনার curriculum-এর তথ্য দিন।",
              )}
            </p>
          </div>
          <div className="goal-actions">
            <button
              className="button"
              disabled={!Number.isFinite(credits) || degreeRemaining <= 0}
              onClick={() => {
                const load = Math.max(1, data.profile.load || 12);
                const count = Math.ceil(degreeRemaining / load);
                setTerms(
                  Array.from({ length: count }, (_, index) => ({
                    credits: Math.min(load, degreeRemaining - index * load),
                    gpa: 3.67,
                  })),
                );
              }}
            >
              {t(
                `Plan remaining ${Number.isFinite(degreeRemaining) ? degreeRemaining : "—"} credits`,
                "বাকি ক্রেডিট পরিকল্পনা করুন",
              )}
            </button>
            <button
              className="secondary"
              onClick={() => {
                setCgpa(Number.NaN);
                setCredits(Number.NaN);
                setTarget(data.profile.target);
                setTerms([{ credits: data.profile.load, gpa: 3.67 }]);
              }}
            >
              {t("Reset inputs", "তথ্য নতুন করে দিন")}
            </button>
          </div>
          <h3>{t("Your future terms", "ভবিষ্যতের টার্মগুলো")}</h3>
          {terms.map((term, i) => (
            <div className="plan-row" key={i}>
              <span className="term-number">{i + 1}</span>
              <NumberField
                label={`${t("Credits", "ক্রেডিট")} ${i + 1}`}
                value={term.credits}
                max={50}
                onChange={(n) =>
                  setTerms(
                    terms.map((x, j) => (i === j ? { ...x, credits: n } : x)),
                  )
                }
              />
              <NumberField
                label={`${t("Expected GPA", "আনুমানিক জিপিএ")} ${i + 1}`}
                value={term.gpa}
                max={4}
                onChange={(n) =>
                  setTerms(
                    terms.map((x, j) => (i === j ? { ...x, gpa: n } : x)),
                  )
                }
              />
              <button
                className="icon-button"
                aria-label={`Remove term ${i + 1}`}
                onClick={() => setTerms(terms.filter((_, j) => i !== j))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            className="secondary"
            disabled={terms.length >= 30}
            onClick={() =>
              setTerms([...terms, { credits: data.profile.load, gpa: 3.67 }])
            }
          >
            <Plus size={16} />
            {t("Add future term", "ভবিষ্যৎ টার্ম যোগ করুন")}
          </button>
        </Card>
        <Card className="target-result">
          <div className="step-label">
            {t(
              "2 · Your result updates as you type",
              "২ · তথ্য বদলালেই ফলাফল বদলাবে",
            )}
          </div>
          <Badge tone={r?.plan.feasible ? "green" : "amber"}>
            {!r
              ? t("ENTER YOUR INFORMATION", "আপনার তথ্য দিন")
              : r.plan.feasible
                ? t("MATHEMATICALLY FEASIBLE", "গাণিতিকভাবে সম্ভব")
                : t("TARGET NOT REACHABLE", "এই পরিকল্পনায় সম্ভব নয়")}
          </Badge>
          <div className="big-number">
            {fmt(
              r?.plan.required == null ? null : Math.max(0, r.plan.required),
            )}
          </div>
          <h2>{t("Required average GPA", "প্রয়োজনীয় গড় জিপিএ")}</h2>
          <p>
            {Number.isFinite(remaining) ? remaining : "—"}{" "}
            {t("new credits across", "নতুন ক্রেডিট, মোট")} {terms.length}{" "}
            {t("planned terms", "টার্ম")}
          </p>
          <div className="breakdown">
            <div>
              <span>
                {t("Your planned final CGPA", "পরিকল্পিত শেষ সিজিপিএ")}
              </span>
              <b>{fmt(r?.final)}</b>
            </div>
            <div>
              <span>
                {t("Highest possible (all A)", "সর্বোচ্চ সম্ভব (সব A)")}
              </span>
              <b>{fmt(r?.plan.maximum)}</b>
            </div>
            <div>
              <span>{t("Gap from target", "লক্ষ্য থেকে ব্যবধান")}</span>
              <b>
                {r?.final !== null && r?.final !== undefined
                  ? fmt(Math.max(0, target - r.final))
                  : "—"}
              </b>
            </div>
          </div>
          {r?.plan.required === null && (
            <Note>
              No future credits: the final result equals your current CGPA. Add
              credits to calculate a required average.
            </Note>
          )}
          {r?.plan.required !== null &&
            r?.plan.required !== undefined &&
            r.plan.required > 4 && (
              <Note>
                The required average exceeds UIU’s 4.00 maximum. New courses
                alone cannot reach this target.
              </Note>
            )}
          {r?.plan.alreadySecured && (
            <Note>
              Your existing grade points secure this numerical target even with
              zero future points. Degree completion still requires passing
              required courses.
            </Note>
          )}
          <ResultError message={calc.error} />
          <button
            className="button"
            disabled={!r || r.final === null || data.scenarios.length >= 100}
            onClick={() => {
              if (!r || r.final === null) return;
              update((d) => ({
                ...d,
                profile: { ...d.profile, target },
                scenarios: [
                  ...d.scenarios,
                  {
                    id: crypto.randomUUID(),
                    name: `Plan ${d.scenarios.length + 1}`,
                    cgpa: r.final!,
                    futureGpa: remaining
                      ? terms.reduce((s, x) => s + x.gpa * x.credits, 0) /
                        remaining
                      : 0,
                    credits: remaining,
                    cost: Math.round(remaining * d.finance.rate * 100),
                    assumption: `New courses only. Starting ${cgpa} over ${credits} GPA credits. Tuition-only estimate; no waivers or term fees. ${terms.map((x) => `${x.credits} credits at ${x.gpa}`).join("; ")}`,
                  },
                ],
              }));
              notify(
                t(
                  "Scenario saved for comparison.",
                  "তুলনার জন্য পরিকল্পনা সংরক্ষিত হয়েছে।",
                ),
              );
            }}
          >
            <Save size={16} />
            {t("Save scenario", "পরিকল্পনা সংরক্ষণ")}
          </button>
        </Card>
      </div>
      <Advanced
        title={t("Compare future grades", "ভবিষ্যতের গ্রেড তুলনা করুন")}
      >
        <div className="stats-grid three">
          {[3, 3.67, 4].map((g) => (
            <Stat
              key={g}
              label={`${t("If future average is", "ভবিষ্যতের গড় হলে")} ${g.toFixed(2)}`}
              value={fmt(
                calculate(() =>
                  project(cgpa, credits, [{ credits: remaining, gpa: g }]),
                ).result,
              )}
              sub={`${Number.isFinite(remaining) ? remaining : "—"} new credits · no retakes`}
            />
          ))}
        </div>
      </Advanced>
      <Advanced
        title={t(
          "Find an exact letter-grade combination",
          "সঠিক লেটার গ্রেডের সমন্বয় খুঁজুন",
        )}
      >
        <Card>
          <div className="section-title">
            <div>
              <h2>
                {t(
                  "Find an attainable grade combination",
                  "সম্ভব এমন গ্রেডের সমন্বয় খুঁজুন",
                )}
              </h2>
              <p>
                {t(
                  "An exact search over official letter-grade points, up to 10 courses.",
                  "সর্বোচ্চ ১০টি কোর্সে অফিসিয়াল গ্রেড পয়েন্ট অনুযায়ী নির্ভুল অনুসন্ধান।",
                )}
              </p>
            </div>
            <Badge>DISCRETE PLANNER</Badge>
          </div>
          <Field
            label={t(
              "Future course credits, separated by commas",
              "ভবিষ্যৎ কোর্সের ক্রেডিট, কমা দিয়ে আলাদা করুন",
            )}
          >
            <input
              value={courseText}
              onChange={(e) => {
                setCourseText(e.target.value);
                setDiscrete(undefined);
              }}
            />
          </Field>
          <button
            className="button"
            onClick={() => {
              const result = calculate(() => {
                const list = courseText.split(",").map(Number);
                return discretePlan(
                  list,
                  target * (credits + list.reduce((a, b) => a + b, 0)) -
                    cgpa * credits,
                );
              });
              setDiscrete(result.result);
              setError(result.error);
            }}
          >
            {t(
              "Find minimum total grade points",
              "সর্বনিম্ন মোট গ্রেড পয়েন্ট খুঁজুন",
            )}
          </button>
          <ResultError message={error} />
          {discrete === null && !error && (
            <Note>No valid grade combination reaches this target.</Note>
          )}
          {discrete && (
            <div className="result-strip">
              <strong>{discrete.grades.join(" · ")}</strong>
              <span>
                Average {fmt(discrete.gpa)} · {fmt(discrete.points)} quality
                points. One minimum-total-point solution; not a unique
                recommendation.
              </span>
            </div>
          )}
        </Card>
      </Advanced>
    </>
  );
}
