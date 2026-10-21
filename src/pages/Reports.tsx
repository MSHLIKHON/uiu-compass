import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { useApp } from "../state/AppState";
import { summary } from "../state/selectors";
import { tuition, money } from "../domain/finance";
import { policies, CHECKED } from "../policy/repository";
import { Card, Heading, Note, fmt, calculate } from "../components/ui";
export default function Reports() {
  const { data, t } = useApp();
  const [includeId, setIncludeId] = useState(false);
  const s = summary(data),
    fee = calculate(() => tuition(data.finance)).result;
  return (
    <>
      <Heading
        eyebrow={t("ACADEMIC REPORTS", "পড়াশোনার রিপোর্ট")}
        title={t(
          "Your plan, all in one place.",
          "আপনার পুরো পরিকল্পনা এক জায়গায়।",
        )}
        description={t(
          "A private, print-ready summary with the assumptions included.",
          "আপনার তথ্য ও ব্যবহৃত অনুমানসহ প্রিন্ট করার উপযোগী সারাংশ।",
        )}
        action={
          <button className="button" onClick={() => window.print()}>
            <Download size={16} />
            {t("Print / Save PDF", "প্রিন্ট / পিডিএফ সংরক্ষণ")}
          </button>
        }
      />
      <div className="no-print">
        <Note>
          {t(
            "Choose “Save as PDF” in your browser’s print dialog. Your browser preserves Bangla text. Student ID is excluded unless selected. Reports stay on your device.",
            "ব্রাউজারের প্রিন্ট ডায়ালগে “Save as PDF” বেছে নিন। বাংলা লেখা ঠিক থাকবে। না চাইলে শিক্ষার্থী আইডি থাকবে না।",
          )}
        </Note>
        <label className="check">
          <input
            type="checkbox"
            checked={includeId}
            onChange={(e) => setIncludeId(e.target.checked)}
          />
          {t(
            "Include optional student ID",
            "ঐচ্ছিক শিক্ষার্থী আইডি অন্তর্ভুক্ত করুন",
          )}
        </label>
      </div>
      <Card className="report-sheet">
        <div className="report-brand">
          ◈ UIU COMPASS <span>ACADEMIC & FINANCIAL PLAN</span>
        </div>
        <h1>{t("My academic outlook", "আমার পড়াশোনার পরিকল্পনা")}</h1>
        <p>
          {new Intl.DateTimeFormat("en-GB", {
            dateStyle: "long",
            timeZone: "Asia/Dhaka",
          }).format(new Date())}{" "}
          · {data.profile.program} ·{" "}
          {data.profile.batch || "Batch not provided"}
        </p>
        {includeId && data.profile.studentId && (
          <p>Student ID: {data.profile.studentId}</p>
        )}
        <div className="report-metrics">
          <div>
            <small>Current CGPA</small>
            <b>{fmt(s.cgpa)}</b>
          </div>
          <div>
            <small>GPA credits</small>
            <b>{s.credits ?? "Unresolved"}</b>
          </div>
          <div>
            <small>Earned credits</small>
            <b>{s.earned}</b>
          </div>
          <div>
            <small>Target CGPA</small>
            <b>{fmt(data.profile.target)}</b>
          </div>
        </div>
        <h2>Saved scenarios & retake analysis</h2>
        {data.scenarios.length ? (
          <table>
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Final CGPA</th>
                <th>Cost scope</th>
              </tr>
            </thead>
            <tbody>
              {data.scenarios.map((x) => (
                <tr key={x.id}>
                  <td>
                    <b>{x.name}</b>
                    <small>{x.assumption}</small>
                  </td>
                  <td>{fmt(x.cgpa)}</td>
                  <td>{money(x.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>
            No saved scenarios. Create and save plans in Target Planner or
            Retake Optimizer.
          </p>
        )}
        <h2>Saved fee plan</h2>
        {fee && (
          <div className="breakdown">
            {[
              ["Regular tuition", fee.regular],
              ["Retake tuition", fee.retake],
              ["Retake benefit", -fee.retakeBenefit],
              ["Tuition waiver", -fee.benefit],
              ["Other and term fees", fee.fees],
              ["Total", fee.total],
              ["Remaining balance (negative = credit)", fee.balance],
            ].map(([label, v]) => (
              <div key={label}>
                <span>{label}</span>
                <b>{money(Number(v))}</b>
              </div>
            ))}
          </div>
        )}
        <h2>Assumptions & verification</h2>
        <ul>
          <li>
            Profile and grades are user-provided; {data.profile.mode} mode. GPA
            displays round to 2 decimals.
          </li>
          <li>
            Retake treatment: {data.retakeRule}. Replacement policies are not
            institutionally verified.
          </li>
          <li>
            Fee policy: {data.finance.feeVersion}; rate BDT {data.finance.rate}
            /credit. Individual batch applicability requires confirmation.
          </li>
          <li>
            I/W excluded provisionally. Duplicate course codes require selected
            retake treatment. No future grade or award is guaranteed.
          </li>
          <li>
            Curriculum may be partial. Degree clearance requires complete
            requirements and university approval.
          </li>
        </ul>
        <h2>Source register · checked {CHECKED}</h2>
        {policies.map((p) => (
          <p className="report-source" key={p.id}>
            <b>
              {p.id}: {p.name}
            </b>{" "}
            · {p.status}
            <br />
            <a href={p.url}>{p.url}</a>
          </p>
        ))}
        <footer>
          UIU Compass is an independent student-developed planning tool and is
          not an official United International University service. Verify
          academic and financial decisions with the university.
        </footer>
      </Card>
      <button className="secondary no-print" onClick={() => window.print()}>
        <Printer size={16} />
        {t("Open print preview", "প্রিন্ট প্রিভিউ খুলুন")}
      </button>
    </>
  );
}
