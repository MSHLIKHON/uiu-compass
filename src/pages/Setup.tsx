import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useApp } from "../state/AppState";
import { Card, Field, NumberField, Heading, Note } from "../components/ui";
import { programs, batchAtLeast } from "../policy/repository";
export default function Setup() {
  const { data, update, t, notify } = useApp();
  const [p, setP] = useState(data.profile);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const set = <K extends keyof typeof p>(key: K, value: (typeof p)[K]) =>
    setP({ ...p, [key]: value });
  return (
    <>
      <Heading
        eyebrow={t("YOUR PERSONAL COMPASS", "আপনার ব্যক্তিগত কম্পাস")}
        title={t(
          "A good plan starts with you.",
          "আপনার তথ্য থেকেই পরিকল্পনার শুরু।",
        )}
        description={t(
          "Three small steps. Your information stays in this browser.",
          "তিনটি সহজ ধাপ। আপনার তথ্য এই ব্রাউজারেই থাকবে।",
        )}
      />
      <div className="setup-grid">
        <Card>
          <div className="steps">
            {["Your details", "Study info", "Preferences"].map((s, i) => (
              <span key={s} className={i === step ? "active" : ""}>
                {i + 1}. {t(s, ["পরিচয়", "পড়াশোনা", "পছন্দ"][i])}
              </span>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 2) setStep(step + 1);
              else {
                update((d) => ({ ...d, profile: { ...p, ready: true } }));
                notify(
                  t(
                    "Profile saved on this device.",
                    "প্রোফাইল এই ডিভাইসে সংরক্ষিত হয়েছে।",
                  ),
                );
                navigate(p.mode === "detailed" ? "/calculator" : "/dashboard");
              }
            }}
          >
            {step === 0 ? (
              <div className="form-grid">
                <Field label={t("Program", "বিভাগ")}>
                  <select
                    value={p.program}
                    onChange={(e) => set("program", e.target.value)}
                  >
                    {programs.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={t("Admission batch", "ভর্তির ব্যাচ")}
                  hint="Example: Spring 2025"
                >
                  <input
                    required
                    value={p.batch}
                    onChange={(e) => set("batch", e.target.value)}
                    placeholder="Spring 2025"
                  />
                </Field>
                <Field label={t("Curriculum", "পাঠ্যক্রম")}>
                  <select
                    value={p.curriculum}
                    onChange={(e) => {
                      const value = e.target.value;
                      setP({
                        ...p,
                        curriculum: value,
                        degreeCredits:
                          value === "cse2026" ? 141 : p.degreeCredits,
                      });
                    }}
                  >
                    <option value="manual">
                      Manual / confirm with department
                    </option>
                    {p.program === "CSE" &&
                      batchAtLeast(p.batch, 2026, "Summer") && (
                        <option value="cse2026">
                          CSE Summer 2026 onward · 141 credits
                        </option>
                      )}
                  </select>
                </Field>
                <Field
                  label={t("Student ID (optional)", "শিক্ষার্থী আইডি (ঐচ্ছিক)")}
                >
                  <input
                    value={p.studentId}
                    maxLength={50}
                    onChange={(e) => set("studentId", e.target.value)}
                  />
                </Field>
              </div>
            ) : step === 1 ? (
              <>
                <div className="segmented">
                  <button
                    type="button"
                    className={p.mode === "quick" ? "selected" : ""}
                    onClick={() => set("mode", "quick")}
                  >
                    {t("Quick start", "দ্রুত শুরু")}
                  </button>
                  <button
                    type="button"
                    className={p.mode === "detailed" ? "selected" : ""}
                    onClick={() => set("mode", "detailed")}
                  >
                    {t("Course-by-course", "কোর্স অনুযায়ী")}
                  </button>
                </div>
                {p.mode === "quick" ? (
                  <div className="form-grid">
                    <NumberField
                      label={t("Current CGPA", "বর্তমান সিজিপিএ")}
                      value={p.cgpa}
                      max={4}
                      onChange={(n) => set("cgpa", n)}
                    />
                    <NumberField
                      label={t("Credits used for CGPA", "জিপিএ গণনার ক্রেডিট")}
                      value={p.gpaCredits}
                      max={2000}
                      onChange={(n) => set("gpaCredits", n)}
                      hint="Enter the credit total your transcript uses to calculate CGPA."
                    />
                    <NumberField
                      label={t(
                        "Credits completed toward your degree",
                        "অর্জিত ডিগ্রি ক্রেডিট",
                      )}
                      value={p.earnedCredits}
                      max={2000}
                      onChange={(n) => set("earnedCredits", n)}
                    />
                  </div>
                ) : (
                  <Note>
                    {t(
                      "After setup, add your courses and grades. We will calculate your CGPA from that list.",
                      "সেটআপ শেষে সব কোর্সের তথ্য যোগ করুন। বিস্তারিত মোডে দ্রুত শুরুর মোট তথ্য ব্যবহার হবে না।",
                    )}
                  </Note>
                )}
                <div className="form-grid">
                  <NumberField
                    label={t(
                      "Credits required for your degree",
                      "ডিগ্রির মোট ক্রেডিট (নিশ্চিত করুন)",
                    )}
                    value={p.degreeCredits}
                    max={1000}
                    onChange={(n) => set("degreeCredits", n)}
                  />
                  <NumberField
                    label={t("Target CGPA", "লক্ষ্য সিজিপিএ")}
                    value={p.target}
                    max={4}
                    onChange={(n) => set("target", n)}
                  />
                </div>
              </>
            ) : (
              <div className="form-grid">
                <Field label={t("Language", "ভাষা")}>
                  <select
                    value={p.language}
                    onChange={(e) =>
                      set("language", e.target.value as "en" | "bn")
                    }
                  >
                    <option value="en">English</option>
                    <option value="bn">বাংলা</option>
                  </select>
                </Field>
                <NumberField
                  label={t(
                    "Planned credits per term",
                    "প্রতি টার্মে পরিকল্পিত ক্রেডিট",
                  )}
                  min={0.01}
                  max={50}
                  value={p.load}
                  onChange={(n) => set("load", n)}
                />
                <Field
                  label={t("Current waiver category", "বর্তমান ওয়েভারের ধরন")}
                >
                  <select
                    value={p.waiver}
                    onChange={(e) => set("waiver", e.target.value)}
                  >
                    {[
                      "Unverified",
                      "None",
                      "Admission result",
                      "Diploma",
                      "Merit ranking",
                      "Other",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            <div className="actions">
              {step > 0 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setStep(step - 1)}
                >
                  {t("Back", "পেছনে")}
                </button>
              )}
              <button className="button" type="submit">
                {step === 2
                  ? t("Open my compass", "আমার কম্পাস খুলুন")
                  : t("Continue", "এগিয়ে যান")}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </Card>
        <aside className="setup-aside">
          <ShieldCheck size={32} />
          <h2>{t("Your future. Your data.", "আপনার ভবিষ্যৎ। আপনার তথ্য।")}</h2>
          <p>
            {t(
              "No portal passwords. No accounts. No tracking. Just a clearer picture of what comes next.",
              "পোর্টালের পাসওয়ার্ড বা অ্যাকাউন্ট লাগবে না। কোনো ট্র্যাকিং নেই। সামনে কী আছে, তার পরিষ্কার ধারণা।",
            )}
          </p>
          <Note>
            {t(
              "A CGPA summary cannot identify which old attempt to replace. Retake analysis needs course history and an explicit policy choice.",
              "শুধু সিজিপিএ দিয়ে আগের কোন গ্রেড বদলাবে তা জানা যায় না। রিটেকের জন্য কোর্সের তথ্য ও নিয়ম নির্বাচন দরকার।",
            )}
          </Note>
        </aside>
      </div>
    </>
  );
}
