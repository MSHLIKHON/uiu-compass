import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/AppState";
import { summary } from "../state/selectors";
import {
  GRADES,
  academic,
  gradePoint,
  minimumRetake,
  retakeCombinations,
  retakeImpact,
} from "../domain/academic";
import type { Grade, RetakeRule } from "../domain/types";
import {
  Card,
  Heading,
  NumberField,
  Field,
  Note,
  fmt,
  calculate,
  ResultError,
  Badge,
  Empty,
  Advanced,
} from "../components/ui";
import { money } from "../domain/finance";
export default function Retakes() {
  const { data, update, t, notify } = useApp();
  const s = summary(data);
  const [cgpa, setCgpa] = useState(
      data.profile.ready || data.courses.length
        ? (s.cgpa ?? Number.NaN)
        : Number.NaN,
    ),
    [den, setDen] = useState(
      data.profile.ready || data.courses.length
        ? (s.credits ?? Number.NaN)
        : Number.NaN,
    ),
    [target, setTarget] = useState(data.profile.target),
    [future, setFuture] = useState(0),
    [futureGpa, setFutureGpa] = useState(3.67),
    [next, setNext] = useState<Grade>("A"),
    [selected, setSelected] = useState<string[]>([]),
    [goal, setGoal] = useState("cost");
  const candidates = [...new Set(data.courses.map((c) => c.code))]
    .map(
      (code) =>
        data.courses
          .filter(
            (c) =>
              c.code === code && gradePoint(c.grade) !== null && !c.excluded,
          )
          .sort((a, b) =>
            data.retakeRule === "highest"
              ? (gradePoint(b.grade) ?? 0) - (gradePoint(a.grade) ?? 0)
              : b.attempt - a.attempt,
          )[0],
    )
    .filter((c) => c && gradePoint(c.grade) !== 4);
  const active = candidates.filter((c) => selected.includes(c.code));
  const cost = (id: string) => {
    const c = candidates.find((c) => c.id === id)!;
    const maxAttempt = Math.max(
      ...data.courses.filter((x) => x.code === c.code).map((x) => x.attempt),
    );
    return Math.round(
      c.credits *
        data.finance.rate *
        100 *
        (maxAttempt === 1 ? 1 - data.finance.firstDiscount / 100 : 1),
    );
  };
  const calc = calculate(() =>
    retakeCombinations(
      cgpa,
      den,
      active.map((c) => ({
        id: c.id,
        credits: c.credits,
        old: c.grade,
        next,
        cost: cost(c.id),
      })),
      data.retakeRule,
      target,
      future,
      futureGpa,
    ),
  );
  const rows = calc.result
    ?.sort((a, b) =>
      goal === "improvement"
        ? b.cgpa - a.cgpa
        : goal === "future"
          ? (a.required ?? Infinity) - (b.required ?? Infinity)
          : Number(b.feasible) - Number(a.feasible) ||
            (goal === "count"
              ? a.ids.length - b.ids.length || a.cost - b.cost
              : a.cost - b.cost || a.ids.length - b.ids.length),
    )
    .slice(0, 8);
  return (
    <>
      <Heading
        eyebrow={t("RETAKE INTELLIGENCE", "রিটেক পরিকল্পনা")}
        title={t("Check a retake", "রিটেকের ফলাফল দেখুন")}
        description={t(
          "Compare academic impact against the cost of trying again.",
          "আবার চেষ্টা করলে গ্রেড ও খরচের কী পরিবর্তন হবে দেখুন।",
        )}
      />
      <Advanced
        title={t("Important retake assumptions", "রিটেকের গুরুত্বপূর্ণ অনুমান")}
      >
        <Note>
          {t(
            "Official grade replacement is unverified. Every result here is an explicit assumption-based simulation. Aggregate CGPA cannot establish which historical attempt is in your denominator. Confirm the baseline before using results.",
            "গ্রেড প্রতিস্থাপনের অফিসিয়াল নিয়ম নিশ্চিত নয়। এখানকার প্রতিটি ফলাফল আপনার নির্বাচিত অনুমানভিত্তিক। হিসাবের আগে মূল তথ্য নিশ্চিত করুন।",
          )}
        </Note>
      </Advanced>
      <Card>
        <div className="form-grid">
          <Field
            label={t("Retake treatment assumption", "রিটেকের গণনার অনুমান")}
          >
            <select
              value={data.retakeRule}
              onChange={(e) => {
                const rule = e.target.value as RetakeRule;
                update((d) => ({ ...d, retakeRule: rule }));
                if (data.profile.mode === "detailed") {
                  const result = academic(data.courses, rule);
                  setCgpa(result.gpa ?? Number.NaN);
                  setDen(result.gpaCredits ?? Number.NaN);
                }
              }}
            >
              <option value="unresolved">Select explicitly — unresolved</option>
              <option value="highest">Highest grade counts (assumption)</option>
              <option value="latest">Latest grade counts (assumption)</option>
              <option value="all">
                All graded attempts count (assumption)
              </option>
            </select>
          </Field>
          <NumberField
            label={t("Baseline CGPA", "মূল সিজিপিএ")}
            value={cgpa}
            max={4}
            onChange={setCgpa}
          />
          <NumberField
            label={t("Baseline GPA credits", "মূল জিপিএ ক্রেডিট")}
            value={den}
            max={2000}
            onChange={setDen}
          />
          <NumberField
            label={t("Target CGPA", "লক্ষ্য সিজিপিএ")}
            value={target}
            max={4}
            onChange={setTarget}
          />
          <NumberField
            label={t("Remaining new credits", "বাকি নতুন ক্রেডিট")}
            value={future}
            max={1000}
            onChange={setFuture}
          />
          <NumberField
            label={t("Expected future GPA", "ভবিষ্যতের আনুমানিক জিপিএ")}
            value={futureGpa}
            max={4}
            onChange={setFutureGpa}
          />
          <Field label={t("Expected retake grade", "রিটেকের আনুমানিক গ্রেড")}>
            <select
              value={next}
              onChange={(e) => setNext(e.target.value as Grade)}
            >
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label={t("Optimize for", "যে লক্ষ্য অনুযায়ী তুলনা করবেন")}>
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option value="cost">Minimum estimated tuition cost</option>
              <option value="count">Minimum number of retakes</option>
              <option value="improvement">Maximum CGPA improvement</option>
              <option value="future">Lowest required future GPA</option>
            </select>
          </Field>
        </div>
        <p className="caption">
          Costs use your saved <Link to="/fees">fee plan</Link>:{" "}
          {money(data.finance.rate * 100)} / credit. First-retake discount{" "}
          {data.finance.firstDiscount}%. A zero rate means cost is not
          configured.
        </p>
      </Card>
      <Card>
        <div className="section-title">
          <h2>{t("Choose candidates", "কোর্স বেছে নিন")}</h2>
          <Badge tone="amber">{t("ASSUMPTION-BASED", "অনুমানভিত্তিক")}</Badge>
        </div>
        {!candidates.length ? (
          <Empty
            title={t(
              "Add your course history first",
              "আগে কোর্সের ইতিহাস যোগ করুন",
            )}
            body={t(
              "Candidates come from your saved graded courses, never invented records.",
              "আপনার সংরক্ষিত কোর্স থেকে রিটেকের বিকল্প দেখানো হবে।",
            )}
            to="/calculator"
            label={t("Add courses", "কোর্স যোগ করুন")}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Course</th>
                  <th>Old grade</th>
                  <th>Credits</th>
                  <th>Estimated cost</th>
                  <th>Solo CGPA</th>
                  <th>Minimum grade for target*</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${c.code}`}
                        checked={selected.includes(c.code)}
                        disabled={
                          !selected.includes(c.code) && selected.length >= 10
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, c.code]
                              : selected.filter((x) => x !== c.code),
                          )
                        }
                      />
                    </td>
                    <td>
                      <b>{c.code}</b>
                      <small>{c.title}</small>
                    </td>
                    <td>{c.grade}</td>
                    <td>{c.credits}</td>
                    <td>
                      {data.finance.rate ? money(cost(c.id)) : "Set fee rate"}
                    </td>
                    <td>
                      {fmt(
                        calculate(() =>
                          retakeImpact(
                            cgpa,
                            den,
                            c.credits,
                            c.grade,
                            next,
                            data.retakeRule,
                          ),
                        ).result,
                      )}
                    </td>
                    <td>
                      {calculate(() =>
                        minimumRetake(
                          cgpa,
                          den,
                          c.credits,
                          c.grade,
                          target,
                          data.retakeRule,
                        ),
                      ).result ?? "Not attainable / unresolved"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <small>
              * Solo target, without future courses. Up to 10 selected
              candidates; all subsets are searched. For all-attempt mode,
              baseline must already contain every prior graded attempt.
            </small>
          </div>
        )}
      </Card>
      <Advanced
        title={t(
          "Compare multiple retake combinations",
          "একাধিক রিটেকের তুলনা",
        )}
      >
        <Card>
          <h2>
            {t(
              "CGPA vs. money: compare routes",
              "সিজিপিএ ও খরচ: পথগুলো তুলনা করুন",
            )}
          </h2>
          <ResultError message={calc.error} />
          {rows && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Strategy</th>
                    <th>Final CGPA</th>
                    <th>Extra tuition</th>
                    <th>Future GPA needed</th>
                    <th>Target</th>
                    <th>Save</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>
                        {r.ids.length
                          ? r.ids
                              .map(
                                (id) =>
                                  candidates.find((c) => c.id === id)?.code,
                              )
                              .join(", ")
                          : "No retakes · future courses only"}
                      </td>
                      <td>
                        <b>{fmt(r.cgpa)}</b>
                      </td>
                      <td>
                        {data.finance.rate ? money(r.cost) : "Unconfigured"}
                      </td>
                      <td>
                        {r.required === null
                          ? "No new credits"
                          : fmt(Math.max(0, r.required))}
                      </td>
                      <td>
                        <Badge tone={r.feasible ? "green" : "amber"}>
                          {r.feasible ? "Reaches" : "Below"}
                        </Badge>
                      </td>
                      <td>
                        <button
                          className="secondary"
                          disabled={
                            data.scenarios.length >= 100 ||
                            (r.ids.length > 0 && data.finance.rate <= 0)
                          }
                          title={
                            r.ids.length > 0 && data.finance.rate <= 0
                              ? "Set a fee rate before saving this cost comparison"
                              : undefined
                          }
                          onClick={() => {
                            update((d) => ({
                              ...d,
                              scenarios: [
                                ...d.scenarios,
                                {
                                  id: crypto.randomUUID(),
                                  name: `${r.ids.length} retake(s) + future`,
                                  cgpa: r.cgpa,
                                  futureGpa,
                                  credits: future,
                                  cost: r.cost,
                                  assumption: `${data.retakeRule} treatment. Retakes at ${next}. Cost is additional retake tuition only, not total degree cost.`,
                                },
                              ],
                            }));
                            notify("Scenario saved.");
                          }}
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Note>
            {t(
              "Lower required future GPA can mean higher retake expense. Compare the no-retake row before deciding. Expected grades and availability are hypothetical.",
              "ভবিষ্যতে কম জিপিএ দরকার হলে রিটেকের খরচ বাড়তে পারে। সিদ্ধান্তের আগে রিটেক ছাড়াই কী সম্ভব তা দেখুন।",
            )}
          </Note>
        </Card>
      </Advanced>
    </>
  );
}
