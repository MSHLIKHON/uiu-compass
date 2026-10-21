import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { useApp } from "../state/AppState";
import { tuition, money } from "../domain/finance";
import { finite } from "../domain/academic";
import {
  Card,
  Heading,
  Field,
  NumberField,
  Note,
  Badge,
  ResultError,
  calculate,
  Advanced,
} from "../components/ui";
import type { Finance } from "../domain/types";
export default function Fees() {
  const { data, update, t, notify } = useApp();
  const [f, setF] = useState<Finance>({
    ...data.finance,
    rate: data.finance.rate || Number.NaN,
  });
  const [registration, setRegistration] = useState(0),
    [scheme, setScheme] = useState("three");
  const set = (k: keyof Finance, n: number) => setF({ ...f, [k]: n });
  const calc = calculate(() => {
    if (!Number.isFinite(f.rate))
      throw new Error(
        t(
          "Enter your per-credit tuition rate to calculate the cost.",
          "খরচ গণনা করতে প্রতি ক্রেডিটের ফি দিন।",
        ),
      );
    if (f.rate === 0 && f.regular + f.retake > 0)
      throw new Error(
        t(
          "Enter the tuition rate before applying a waiver.",
          "ওয়েভার দেওয়ার আগে টিউশন রেট দিন।",
        ),
      );
    return tuition(f);
  });
  const r = calc.result;
  const payments = calculate(() => {
    if (!r) return [];
    finite(registration, 0, Math.max(0, r.balance / 100));
    const balance = Math.max(0, r.balance - Math.round(registration * 100));
    const weights =
      scheme === "four" ? [0.25, 0.25, 0.25, 0.25] : [0.4, 0.3, 0.3];
    let allocated = 0;
    return weights.map((w, i) => {
      const amount =
        i === weights.length - 1
          ? balance - allocated
          : Math.floor(balance * w);
      allocated += amount;
      return amount;
    });
  });
  return (
    <>
      <Heading
        eyebrow={t("FEES & SCHOLARSHIP", "ফি ও বৃত্তি")}
        title={t("Estimate your term fees", "টার্মের ফি হিসাব করুন")}
        description={t(
          "Enter your rate and credits. Your estimate updates immediately.",
          "রেট ও ক্রেডিট দিন। সঙ্গে সঙ্গে আনুমানিক খরচ দেখুন।",
        )}
      />
      <div className="two-col">
        <Card>
          <div className="step-label">
            {t("1 · Enter information", "১ · তথ্য দিন")}
          </div>
          <div className="form-grid">
            <NumberField
              label={t("Tuition per credit (BDT)", "প্রতি ক্রেডিটের ফি (টাকা)")}
              value={f.rate}
              placeholder="e.g. 6500"
              onChange={(n) => set("rate", n)}
            />
            <NumberField
              label={t("Regular course credits", "নিয়মিত কোর্সের ক্রেডিট")}
              value={f.regular}
              max={100}
              onChange={(n) => set("regular", n)}
            />
            <NumberField
              label={t("Single tuition waiver (%)", "একটি টিউশন ওয়েভার (%)")}
              value={f.waiver}
              max={100}
              onChange={(n) => set("waiver", n)}
            />
            <NumberField
              label={t(
                "Trimester / semester fee",
                "ট্রাইমেস্টার / সেমেস্টার ফি",
              )}
              value={f.termFee}
              onChange={(n) => set("termFee", n)}
            />
          </div>
          <p className="caption">
            {t(
              "Use your own batch’s fee rate. Waivers do not reduce the term fee.",
              "নিজের ব্যাচের ফি রেট ব্যবহার করুন। টার্ম ফিতে ওয়েভার প্রযোজ্য নয়।",
            )}
          </p>
          <Advanced
            title={t(
              "Retakes, excluded credits & other charges",
              "রিটেক, বাদ দেওয়া ক্রেডিট ও অন্যান্য ফি",
            )}
          >
            <div className="form-grid">
              <NumberField
                label={t(
                  "Non-waivable regular credits",
                  "ওয়েভার প্রযোজ্য নয় এমন ক্রেডিট",
                )}
                value={f.excluded}
                max={100}
                onChange={(n) => set("excluded", n)}
                hint={t(
                  "Project, thesis, internship and other excluded tuition.",
                  "প্রজেক্ট, থিসিস, ইন্টার্নশিপ ও অন্যান্য বাদ দেওয়া টিউশন।",
                )}
              />
              <NumberField
                label={t("Retake/repeat credits", "রিটেক/রিপিট ক্রেডিট")}
                value={f.retake}
                max={100}
                onChange={(n) => set("retake", n)}
              />
              <NumberField
                label={t(
                  "Eligible first-retake credits",
                  "যোগ্য প্রথম রিটেকের ক্রেডিট",
                )}
                value={f.firstRetake}
                max={100}
                onChange={(n) => set("firstRetake", n)}
              />
              <Field label={t("Retake fee policy", "রিটেক ফি নীতিমালা")}>
                <select
                  value={f.firstDiscount}
                  onChange={(e) => set("firstDiscount", Number(e.target.value))}
                >
                  <option value={0}>
                    {t("No concession / unconfirmed", "ছাড় নেই / নিশ্চিত নয়")}
                  </option>
                  <option value={50}>
                    {t(
                      "Fall 2024+: first retake 50%",
                      "Fall 2024 থেকে: প্রথম রিটেকে ৫০%",
                    )}
                  </option>
                </select>
              </Field>
              <NumberField
                label={t("Lab and other charges", "ল্যাব ও অন্যান্য ফি")}
                value={f.other}
                onChange={(n) => set("other", n)}
              />
              <NumberField
                label={t("Already paid / advance", "আগে পরিশোধিত / অগ্রিম")}
                value={f.paid}
                onChange={(n) => set("paid", n)}
              />
            </div>
          </Advanced>
          <Advanced
            title={t(
              "Choose an advertised rate (estimate)",
              "প্রকাশিত রেট বেছে নিন (আনুমানিক)",
            )}
          >
            <p>
              {t(
                "Historical batch rates are not verified. Confirm advertised figures against your ledger.",
                "পুরোনো ব্যাচের রেট যাচাইকৃত নয়। নিজের লেজারের সঙ্গে প্রকাশিত রেট মিলিয়ে নিন।",
              )}
            </p>
            <Field label={t("Policy version", "নীতিমালার সংস্করণ")}>
              <select
                value={f.feeVersion}
                onChange={(e) => {
                  const feeVersion = e.target.value;
                  setF(
                    feeVersion === "advertised"
                      ? {
                          ...f,
                          feeVersion,
                          rate: ["English", "MSJ"].includes(
                            data.profile.program,
                          )
                            ? 5525
                            : 6500,
                          termFee:
                            data.profile.program === "Pharmacy" ? 9750 : 6500,
                          other:
                            data.profile.program === "Pharmacy"
                              ? 5000
                              : data.profile.program === "BGE"
                                ? 2000
                                : 0,
                        }
                      : { ...f, feeVersion },
                  );
                }}
              >
                <option value="manual">Manual / confirmed by student</option>
                <option
                  value="advertised"
                  disabled={data.profile.program === "Other"}
                >
                  Advertised estimate · {data.profile.program}
                </option>
              </select>
            </Field>
          </Advanced>
          <div className="actions">
            <button
              className="button"
              disabled={!r}
              onClick={() => {
                update((d) => ({ ...d, finance: f }));
                notify(t("Fee plan saved.", "ফি পরিকল্পনা সংরক্ষিত হয়েছে।"));
              }}
            >
              <Save size={16} />
              {t("Save fee plan", "ফি পরিকল্পনা সংরক্ষণ")}
            </button>
            <button
              className="secondary"
              onClick={() =>
                setF({ ...data.finance, rate: data.finance.rate || Number.NaN })
              }
            >
              <RotateCcw size={16} />
              {t("Reset unsaved changes", "সংরক্ষণ না করা পরিবর্তন মুছুন")}
            </button>
          </div>
        </Card>
        <Card className="receipt">
          <div className="step-label">
            {t("2 · Understand your result", "২ · ফলাফল বুঝুন")}
          </div>
          <div className="section-title">
            <h2>{t("Estimated total", "আনুমানিক মোট খরচ")}</h2>
            <Badge tone="amber">{t("ESTIMATE", "আনুমানিক")}</Badge>
          </div>
          <div className="big-number" data-testid="fee-total">
            {r ? money(r.total) : "—"}
          </div>
          <ResultError message={calc.error} />
          {r && (
            <>
              <div className="breakdown">
                {[
                  [t("Regular tuition", "নিয়মিত টিউশন"), r.regular],
                  [t("Retake tuition", "রিটেক টিউশন"), r.retake],
                  [
                    t("First-retake benefit", "প্রথম রিটেকের ছাড়"),
                    -r.retakeBenefit,
                  ],
                  [t("Tuition waiver", "টিউশন ওয়েভার"), -r.benefit],
                  [t("Term & other fees", "টার্ম ও অন্যান্য ফি"), r.fees],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <b>{money(Number(value))}</b>
                  </div>
                ))}
                <div>
                  <span>{t("Already paid", "পরিশোধিত")}</span>
                  <b>{money(Math.round(f.paid * 100))}</b>
                </div>
                <div>
                  <span>
                    {r.balance < 0
                      ? t("Credit balance", "জমা অবশিষ্ট")
                      : t("Remaining balance", "বাকি টাকা")}
                  </span>
                  <b>{money(Math.abs(r.balance))}</b>
                </div>
              </div>
              <p>
                {t(
                  "One waiver applies to eligible regular tuition only.",
                  "শুধু যোগ্য নিয়মিত টিউশনে একটিমাত্র ওয়েভার প্রযোজ্য।",
                )}
              </p>
            </>
          )}
        </Card>
      </div>
      <Advanced
        title={t("Personal installment plan", "নিজের কিস্তির পরিকল্পনা")}
      >
        <Note>
          {t(
            "These dates and splits are your plan, not university deadlines.",
            "এই তারিখ ও ভাগ আপনার পরিকল্পনা, বিশ্ববিদ্যালয়ের সময়সীমা নয়।",
          )}
        </Note>
        <div className="form-grid">
          <NumberField
            label={t(
              "Planned registration payment (BDT)",
              "পরিকল্পিত রেজিস্ট্রেশন পেমেন্ট (টাকা)",
            )}
            value={registration}
            onChange={setRegistration}
          />
          <Field label={t("Remaining balance split", "বাকি টাকা ভাগ করুন")}>
            <select value={scheme} onChange={(e) => setScheme(e.target.value)}>
              <option value="three">40% / 30% / 30%</option>
              <option value="four">25% × 4</option>
            </select>
          </Field>
        </div>
        <ResultError message={payments.error} />
        <div className="installments">
          {payments.result?.map((v, i) => (
            <div key={i}>
              <span>
                {t("Installment", "কিস্তি")} {i + 1}
              </span>
              <strong>{money(v)}</strong>
              <Field
                label={`${t("Personal target date", "নিজের নির্ধারিত তারিখ")} ${i + 1}`}
              >
                <input
                  type="date"
                  value={f.installmentDates[i] ?? ""}
                  onChange={(e) =>
                    setF({
                      ...f,
                      installmentDates: Array.from(
                        { length: Math.max(3, i + 1) },
                        (_, j) =>
                          j === i
                            ? e.target.value
                            : (f.installmentDates[j] ?? ""),
                      ),
                    })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
        <p className="caption">
          {t(
            "Use Save fee plan above to keep dates.",
            "তারিখ রাখতে উপরের ফি পরিকল্পনা সংরক্ষণ করুন।",
          )}
        </p>
      </Advanced>
    </>
  );
}
