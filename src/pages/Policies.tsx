import { ExternalLink } from "lucide-react";
import { useApp } from "../state/AppState";
import { policies, CHECKED } from "../policy/repository";
import { Card, Heading, Note, Badge } from "../components/ui";
export default function Policies() {
  const { t } = useApp();
  return (
    <>
      <Heading
        eyebrow={t("POLICY SOURCES & ABOUT", "নীতিমালার উৎস ও পরিচিতি")}
        title={t(
          "Trust starts with showing our work.",
          "হিসাবের ভিত্তি জানলেই আস্থা আসে।",
        )}
        description={t(
          `Policy register version ${CHECKED}.1. Official evidence, explicit limits.`,
          `নীতিমালার সংস্করণ ${CHECKED}.1। উৎস ও সীমাবদ্ধতা পরিষ্কারভাবে দেখানো হয়েছে।`,
        )}
      />
      <Note>
        {t(
          "UIU pages frequently blocked direct requests. “Verified in official indexed content” means facts were inspected in indexed text from the linked official source, not a live university eligibility determination. Check the source before a decision.",
          "UIU এর অনেক পৃষ্ঠায় সরাসরি প্রবেশ করা যায়নি। “যাচাইকৃত” তথ্য অফিসিয়াল উৎসের সার্চে পাওয়া লেখা থেকে নেওয়া। সিদ্ধান্তের আগে মূল উৎস যাচাই করুন।",
        )}
      </Note>
      <div className="trust-key">
        <Badge tone="green">Official fact</Badge>
        <Badge>User-provided information</Badge>
        <Badge tone="amber">Estimated projection</Badge>
        <Badge tone="gray">Unverified applicability</Badge>
      </div>
      <div className="policy-grid">
        {policies.map((p) => (
          <Card key={p.id}>
            <div className="section-title">
              <span className="eyebrow">{p.id}</span>
              <a
                className="icon-button"
                aria-label={`Open ${p.name}`}
                href={p.url}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={17} />
              </a>
            </div>
            <h2>{p.name}</h2>
            <Badge
              tone={
                p.status.includes("Unresolved") ||
                p.status.includes("not retrieved")
                  ? "amber"
                  : "blue"
              }
            >
              {p.status}
            </Badge>
            <dl>
              <dt>Effective</dt>
              <dd>{p.effective}</dd>
              <dt>Admission batches</dt>
              <dd>{p.batches}</dd>
              <dt>Programs</dt>
              <dd>{p.programs}</dd>
              <dt>Checked</dt>
              <dd>{CHECKED}</dd>
            </dl>
            <p>{p.notes}</p>
            <a
              className="source-url"
              href={p.url}
              target="_blank"
              rel="noreferrer"
            >
              {p.url}
            </a>
          </Card>
        ))}
      </div>
      <Card>
        <h2>{t("Independent by intention", "স্বতন্ত্র উদ্যোগ")}</h2>
        <p>
          UIU Compass is an independent student-developed planning tool and is
          not an official United International University service. Verify
          academic and financial decisions with the university.
        </p>
        <p>
          {t(
            "Built for transparent, private planning. No university affiliation or endorsement is implied. Financial amounts and academic forecasts are planning estimates unless the precise policy and applicability are established.",
            "স্বচ্ছ ও ব্যক্তিগত পরিকল্পনার জন্য তৈরি। বিশ্ববিদ্যালয়ের অনুমোদন বা সংশ্লিষ্টতার দাবি করা হচ্ছে না। সঠিক নিয়ম ও প্রযোজ্যতা নিশ্চিত না হলে সব ফলাফল পরিকল্পনার অনুমান হিসেবে দেখুন।",
          )}
        </p>
      </Card>
    </>
  );
}
