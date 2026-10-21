import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calculator,
  Target,
  RotateCcw,
  Wallet,
  GraduationCap,
} from "lucide-react";
import { useApp } from "../state/AppState";
import { summary } from "../state/selectors";
import { tuition, money } from "../domain/finance";
import { Card, Heading, Stat, Note, fmt, calculate } from "../components/ui";
export default function Dashboard() {
  const { data, t } = useApp();
  const s = summary(data),
    p = data.profile;
  const known = p.ready || data.courses.length > 0;
  const remaining =
    known && p.degreeCredits > 0
      ? Math.max(0, p.degreeCredits - s.earned)
      : null;
  const fee =
    data.finance.rate > 0
      ? calculate(() => tuition(data.finance)).result
      : null;
  return (
    <>
      <Heading
        eyebrow={t("YOUR OVERVIEW", "আপনার সারাংশ")}
        title={t("Your next step, made simple", "পরের পদক্ষেপ, সহজ পরিকল্পনা")}
        description={t(
          "Your saved progress and the tools you need most.",
          "সংরক্ষিত অগ্রগতি ও প্রয়োজনীয় হিসাবগুলো এক জায়গায়।",
        )}
        action={
          <Link className="secondary" to="/setup">
            {t(
              p.ready ? "Edit profile" : "Set up profile",
              p.ready ? "প্রোফাইল পরিবর্তন" : "প্রোফাইল তৈরি",
            )}
          </Link>
        }
      />
      {!known && (
        <Note>
          {t(
            "Start with your current CGPA and completed credits, or calculate a term directly below.",
            "বর্তমান সিজিপিএ ও অর্জিত ক্রেডিট দিয়ে শুরু করুন, অথবা নিচে সরাসরি টার্মের হিসাব করুন।",
          )}
        </Note>
      )}
      <div className="overview-metrics">
        <Stat
          label={t("Current CGPA", "বর্তমান সিজিপিএ")}
          value={known ? fmt(s.cgpa) : "—"}
          sub={t("Out of 4.00", "৪.০০ এর মধ্যে")}
        />
        <Stat
          label={t("Completed credits", "অর্জিত ক্রেডিট")}
          value={known ? s.earned : "—"}
          sub={t("Earned degree credits", "ডিগ্রির অর্জিত ক্রেডিট")}
        />
        <Stat
          label={t("Target CGPA", "লক্ষ্য সিজিপিএ")}
          value={p.ready ? fmt(p.target) : "—"}
          sub={t("Your selected goal", "আপনার নির্ধারিত লক্ষ্য")}
        />
        <Stat
          label={t("Remaining credits", "বাকি ক্রেডিট")}
          value={remaining ?? "—"}
          sub={
            p.degreeCredits
              ? `${p.degreeCredits} ${t("degree credits", "ডিগ্রি ক্রেডিট")}`
              : t("Set your degree requirement", "ডিগ্রির মোট ক্রেডিট দিন")
          }
        />
      </div>
      <Card className="cost-summary">
        <div>
          <span className="eyebrow">
            {t("NEXT TERM · ESTIMATE", "পরের টার্ম · আনুমানিক")}
          </span>
          <h2>
            {fee
              ? money(fee.total)
              : t(
                  "Add a fee plan to see your cost",
                  "খরচ দেখতে ফি পরিকল্পনা দিন",
                )}
          </h2>
          <p>
            {t(
              "Based on saved credits, rate and waiver.",
              "সংরক্ষিত ক্রেডিট, রেট ও ওয়েভার অনুযায়ী।",
            )}
          </p>
        </div>
        <Link className="text-link" to="/fees">
          {t("Estimate fees", "ফি হিসাব করুন")}
          <ArrowRight size={17} />
        </Link>
      </Card>
      <h2 className="section-heading">
        {t("What would you like to work out?", "কোন হিসাবটি করতে চান?")}
      </h2>
      <div className="quick-actions">
        {[
          {
            to: "/calculator",
            Icon: Calculator,
            title: t("Calculate CGPA", "সিজিপিএ হিসাব"),
            body: t(
              "Add credits and grades for a clear result.",
              "ক্রেডিট ও গ্রেড দিয়ে ফলাফল দেখুন।",
            ),
          },
          {
            to: "/target",
            Icon: Target,
            title: t("Plan target", "লক্ষ্য পরিকল্পনা"),
            body: t(
              "See the GPA you need next.",
              "সামনে কত জিপিএ দরকার দেখুন।",
            ),
          },
          {
            to: "/retakes",
            Icon: RotateCcw,
            title: t("Check retake", "রিটেকের হিসাব"),
            body: t(
              "Compare a new grade with its cost.",
              "নতুন গ্রেড ও খরচ তুলনা করুন।",
            ),
          },
          {
            to: "/fees",
            Icon: Wallet,
            title: t("Estimate fees", "ফি হিসাব"),
            body: t(
              "Understand tuition and your waiver.",
              "টিউশন ও ওয়েভারের হিসাব বুঝুন।",
            ),
          },
        ].map((x) => (
          <Link className="quick-action" key={x.to} to={x.to}>
            <x.Icon size={23} />
            <div>
              <h3>{x.title}</h3>
              <p>{x.body}</p>
            </div>
            <ArrowRight size={17} />
          </Link>
        ))}
      </div>
      <Link className="graduation-link" to="/graduation">
        <GraduationCap size={20} />
        {t("Plan your remaining courses", "বাকি কোর্সের পরিকল্পনা করুন")}
        <ArrowRight size={16} />
      </Link>
      {s.unresolved && (
        <Note>
          {t(
            "Your history contains repeated courses. Choose a retake assumption before a cumulative GPA can be shown.",
            "ইতিহাসে একই কোর্সের একাধিক চেষ্টা আছে। সিজিপিএ দেখতে রিটেকের অনুমান বেছে নিন।",
          )}
        </Note>
      )}
    </>
  );
}
