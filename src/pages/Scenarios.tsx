import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useApp } from "../state/AppState";
import { money } from "../domain/finance";
import { Card, Heading, Badge, Empty, Note, fmt } from "../components/ui";
export default function Scenarios() {
  const { data, update, t } = useApp();
  return (
    <>
      <Heading
        eyebrow={t("WHAT-IF LAB", "সম্ভাবনার তুলনা")}
        title={t(
          "Different routes. One informed decision.",
          "আলাদা পথ, ভেবেচিন্তে সিদ্ধান্ত।",
        )}
        description={t(
          "Compare the scenarios you saved from Target Planner and Retake Optimizer.",
          "লক্ষ্য ও রিটেক প্ল্যানারে সংরক্ষিত পরিকল্পনা তুলনা করুন।",
        )}
        action={
          <Link className="button" to="/target">
            {t("Create a scenario", "পরিকল্পনা তৈরি")}
          </Link>
        }
      />
      <Note>
        {t(
          "Costs have different scopes: target plans show new-course tuition; retake plans show additional retake tuition. Read each assumption before comparing amounts. Saved scenarios are snapshots and do not update when policies or your profile change.",
          "খরচের পরিধি আলাদা: লক্ষ্য পরিকল্পনায় নতুন কোর্সের টিউশন, রিটেকে অতিরিক্ত রিটেক টিউশন। তুলনার আগে প্রতিটি অনুমান পড়ুন। সংরক্ষিত ফলাফল নিজে থেকে বদলায় না।",
        )}
      </Note>
      {!data.scenarios.length ? (
        <Card>
          <Empty
            title={t("Make room for possibilities", "সম্ভাবনা খুঁজে দেখুন")}
            body={t(
              "Save two or more plans to compare grades, credits, and estimated costs.",
              "দুই বা তার বেশি পরিকল্পনা সংরক্ষণ করে গ্রেড, ক্রেডিট ও খরচ তুলনা করুন।",
            )}
            to="/target"
            label={t("Open target planner", "লক্ষ্য প্ল্যানার খুলুন")}
          />
        </Card>
      ) : (
        <div className="scenario-grid">
          {data.scenarios.map((s, i) => (
            <Card key={s.id}>
              <div className="section-title">
                <Badge>SCENARIO {i + 1}</Badge>
                <button
                  className="icon-button"
                  aria-label={`Delete ${s.name}`}
                  onClick={() => {
                    if (window.confirm("Delete this saved scenario?"))
                      update((d) => ({
                        ...d,
                        scenarios: d.scenarios.filter((x) => x.id !== s.id),
                      }));
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <input
                aria-label="Scenario name"
                className="scenario-name"
                value={s.name}
                maxLength={200}
                onChange={(e) =>
                  update((d) => ({
                    ...d,
                    scenarios: d.scenarios.map((x) =>
                      x.id === s.id ? { ...x, name: e.target.value } : x,
                    ),
                  }))
                }
              />
              <div className="big-number">{fmt(s.cgpa)}</div>
              <p>{t("Projected final CGPA", "আনুমানিক শেষ সিজিপিএ")}</p>
              <div className="breakdown">
                <div>
                  <span>Future credits</span>
                  <b>{s.credits}</b>
                </div>
                <div>
                  <span>Future GPA</span>
                  <b>{fmt(s.futureGpa)}</b>
                </div>
                <div>
                  <span>Estimated tuition scope</span>
                  <b>{money(s.cost)}</b>
                </div>
              </div>
              <p className="caption">{s.assumption}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
