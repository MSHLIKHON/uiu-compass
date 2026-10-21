import { useState } from "react";
import { useApp } from "../state/AppState";
import { targetPlan, finite } from "../domain/academic";
import { batchAtLeast, policies } from "../policy/repository";
import { tuition, money, waiverEligibility } from "../domain/finance";
import {
  Card,
  Heading,
  NumberField,
  Field,
  Note,
  Badge,
  fmt,
  calculate,
  ResultError,
  Advanced,
} from "../components/ui";
export default function Scholarships() {
  const { data, t } = useApp();
  const [category, setCategory] = useState("admission"),
    [gpa, setGpa] = useState(Number.NaN),
    [credits, setCredits] = useState(Number.NaN),
    [approved, setApproved] = useState(false),
    [eligible, setEligible] = useState(false),
    [percent, setPercent] = useState(25),
    [rate, setRate] = useState(data.finance.rate || Number.NaN),
    [completed, setCompleted] = useState(0),
    [remaining, setRemaining] = useState(9);
  const minimum = category === "diploma" ? 3 : 3.5,
    minCredits = data.profile.program === "Pharmacy" ? 14 : 9;
  const supported =
    category !== "other" &&
    data.profile.program !== "Other" &&
    !(category === "diploma" && data.profile.program === "Pharmacy");
  const cohort = batchAtLeast(data.profile.batch, 2025, "Spring");
  const eligibility = calculate(() =>
    waiverEligibility(
      gpa,
      credits,
      minimum,
      minCredits,
      supported && cohort && approved && eligible,
    ),
  );
  const status = eligibility.result;
  const savings = calculate(() => {
    if (!supported) throw new Error("This award category is not verified.");
    finite(rate, 0.01);
    finite(credits);
    return tuition({
      ...data.finance,
      rate,
      regular: credits,
      excluded: 0,
      retake: 0,
      firstRetake: 0,
      waiver: category === "diploma" ? 25 : percent,
    }).benefit;
  });
  const protection = calculate(() => {
    if (!supported) throw new Error("Choose a supported category first.");
    return targetPlan(gpa, completed, minimum, remaining);
  });
  return (
    <>
      <Heading
        eyebrow={t("FEES & SCHOLARSHIP", "ফি ও বৃত্তি")}
        title={t("Check your scholarship", "আপনার বৃত্তির শর্ত দেখুন")}
        description={t(
          "Check continuation conditions and estimate tuition savings.",
          "বৃত্তি ধরে রাখার শর্ত ও সম্ভাব্য টিউশন ছাড় দেখুন।",
        )}
      />
      <div className="two-col">
        <Card>
          <div className="step-label">
            {t(
              "1 · Enter your qualifying term results",
              "১ · প্রযোজ্য টার্মের ফলাফল দিন",
            )}
          </div>
          <Field label={t("Category", "ধরন")}>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setApproved(false);
              }}
            >
              <option value="admission">
                {t(
                  "Admission-result award · Spring 2025+",
                  "ভর্তির ফলাফলের বৃত্তি · Spring 2025 থেকে",
                )}
              </option>
              <option value="diploma">
                {t(
                  "Government diploma · Spring 2025+",
                  "সরকারি ডিপ্লোমা · Spring 2025 থেকে",
                )}
              </option>
              <option value="other">
                {t("Other / not verified", "অন্যান্য / যাচাইকৃত নয়")}
              </option>
            </select>
          </Field>
          <div className="form-grid">
            <NumberField
              label={t("Qualifying term GPA", "প্রযোজ্য টার্মের জিপিএ")}
              value={gpa}
              max={4}
              onChange={setGpa}
            />
            <NumberField
              label={t(
                "Qualifying registered credits",
                "যোগ্য নিবন্ধিত ক্রেডিট",
              )}
              value={credits}
              max={100}
              onChange={setCredits}
            />
            <NumberField
              label={t("Tuition per credit (BDT)", "প্রতি ক্রেডিটের ফি (টাকা)")}
              value={rate}
              onChange={setRate}
            />
            <Field
              label={t("Approved waiver percentage", "অনুমোদিত ওয়েভারের হার")}
            >
              <select
                value={category === "diploma" ? 25 : percent}
                onChange={(e) => setPercent(Number(e.target.value))}
              >
                <option value={25}>25%</option>
                {category !== "diploma" && <option value={50}>50%</option>}
              </select>
            </Field>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />
            {t(
              "UIU has approved my award and entry qualifications.",
              "UIU আমার বৃত্তি ও ভর্তির যোগ্যতা অনুমোদন করেছে।",
            )}
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={eligible}
              onChange={(e) => setEligible(e.target.checked)}
            />
            {t(
              "I checked the eligible credits and I-grade / improvement restrictions.",
              "যোগ্য ক্রেডিট ও I গ্রেড / ইমপ্রুভমেন্টের শর্ত যাচাই করেছি।",
            )}
          </label>
          <button
            className="secondary"
            onClick={() => {
              setGpa(Number.NaN);
              setCredits(Number.NaN);
              setApproved(false);
              setEligible(false);
            }}
          >
            {t("Reset results", "ফলাফল নতুন করে দিন")}
          </button>
        </Card>
        <Card>
          <div className="step-label">
            {t("2 · Your continuation check", "২ · বৃত্তি ধরে রাখার হিসাব")}
          </div>
          <Badge tone={status === "meets-inputs" ? "green" : "amber"}>
            {!status
              ? t("ENTER YOUR RESULTS", "আপনার ফলাফল দিন")
              : status === "unverified"
                ? t("ELIGIBILITY NOT VERIFIED", "যোগ্যতা নিশ্চিত নয়")
                : status === "at-risk"
                  ? t("CONTINUATION AT RISK", "বৃত্তি হারানোর ঝুঁকি")
                  : t(
                      "ENTERED CONDITIONS MET",
                      "দেওয়া তথ্য অনুযায়ী শর্ত পূরণ",
                    )}
          </Badge>
          <ResultError message={eligibility.error} />
          <div className="breakdown">
            <div>
              <span>{t("Required term GPA", "প্রয়োজনীয় টার্ম জিপিএ")}</span>
              <b>{supported ? fmt(minimum) : "—"}</b>
            </div>
            <div>
              <span>
                {t("Minimum eligible credits", "ন্যূনতম যোগ্য ক্রেডিট")}
              </span>
              <b>{supported ? minCredits : "—"}</b>
            </div>
            <div>
              <span>{t("Admission period", "ভর্তির সময়কাল")}</span>
              <b>
                {cohort
                  ? "Spring 2025+"
                  : t("Confirm your batch", "ব্যাচ নিশ্চিত করুন")}
              </b>
            </div>
          </div>
          <h3>{t("Potential tuition savings", "সম্ভাব্য টিউশন ছাড়")}</h3>
          <div className="medium-number" data-testid="waiver-savings">
            {savings.result === null ? "—" : money(savings.result)}
          </div>
          <p>
            {t(
              "Conditional estimate, not an award approval. Term fees are excluded.",
              "শর্তসাপেক্ষ অনুমান, বৃত্তির অনুমোদন নয়। টার্ম ফি বাদ।",
            )}
          </p>
          <ResultError message={savings.error} />
        </Card>
      </div>
      <Advanced
        title={t(
          "Plan the grades needed to keep your scholarship",
          "বৃত্তি রাখতে কী গ্রেড দরকার দেখুন",
        )}
      >
        <p>
          {t(
            "Use the GPA above for courses already graded in this term.",
            "উপরের জিপিএ এই টার্মে ইতিমধ্যে গ্রেড পাওয়া কোর্সগুলোর গড় হিসেবে দিন।",
          )}
        </p>
        <div className="form-grid">
          <NumberField
            label={t("Already graded credits", "গ্রেড পাওয়া ক্রেডিট")}
            value={completed}
            max={50}
            onChange={setCompleted}
          />
          <NumberField
            label={t("Remaining term credits", "টার্মের বাকি ক্রেডিট")}
            value={remaining}
            max={50}
            onChange={setRemaining}
          />
        </div>
        <p>
          {t(
            "Required average for remaining courses:",
            "বাকি কোর্সে প্রয়োজনীয় গড় জিপিএ:",
          )}{" "}
          <b>
            {fmt(
              protection.result?.required == null
                ? null
                : Math.max(0, protection.result.required),
            )}
          </b>
        </p>
        {protection.result && !protection.result.feasible && (
          <Note>
            {t(
              "This target needs more than the maximum 4.00 GPA.",
              "এই লক্ষ্যে সর্বোচ্চ ৪.০০ জিপিএর চেয়েও বেশি দরকার।",
            )}
          </Note>
        )}
        <ResultError message={protection.error} />
      </Advanced>
      <Advanced title={t("Policy conditions & source", "নীতিমালার শর্ত ও উৎস")}>
        <Note>
          {t(
            "Selected Spring 2025+ rules only. Exclude project, thesis, internship and repeat/retake credits. Other categories and older batches require confirmation from UIU.",
            "শুধু Spring 2025 থেকে কিছু নির্দিষ্ট নিয়ম। প্রজেক্ট, থিসিস, ইন্টার্নশিপ ও রিটেক ক্রেডিট বাদ দিন। অন্য ধরন ও পুরোনো ব্যাচের জন্য UIU থেকে নিশ্চিত করুন।",
          )}
        </Note>
        <a
          className="text-link"
          href={policies.find((p) => p.id === "WAIVER-2025")!.url}
          target="_blank"
          rel="noreferrer"
        >
          {t("Read official policy", "অফিসিয়াল নীতিমালা পড়ুন")} ↗
        </a>
      </Advanced>
    </>
  );
}
