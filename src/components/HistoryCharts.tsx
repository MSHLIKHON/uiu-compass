import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useApp } from "../state/AppState";
import { academic, GRADES } from "../domain/academic";
import { Card, fmt } from "./ui";
export function HistoryCharts() {
  const { data, t } = useApp();
  if (!data.courses.length) return null;
  const terms = [...new Set(data.courses.map((c) => c.term))];
  const points = terms.map((term, i) => ({
    term,
    gpa: academic(
      data.courses.filter((c) => c.term === term),
      data.retakeRule,
    ).gpa,
    cgpa: academic(
      data.courses.filter((c) => terms.slice(0, i + 1).includes(c.term)),
      data.retakeRule,
    ).gpa,
  }));
  const distribution = GRADES.map((grade) => ({
    grade,
    credits: data.courses
      .filter((c) => c.grade === grade && !c.excluded)
      .reduce((s, c) => s + c.credits, 0),
  }));
  return (
    <div className="two-col">
      <Card>
        <h2>{t("Term and cumulative progress", "টার্ম ও মোট অগ্রগতি")}</h2>
        <p className="caption">
          Term order follows first entry. Gaps indicate unresolved histories.
          Term GPA uses the selected attempt model within each term.
        </p>
        <div className="chart">
          <ResponsiveContainer>
            <LineChart data={points}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="term" />
              <YAxis domain={[0, 4]} width={30} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Line
                isAnimationActive={false}
                dataKey="gpa"
                name="Term GPA"
                stroke="#ed9a52"
                strokeWidth={2}
              />
              <Line
                isAnimationActive={false}
                dataKey="cgpa"
                name="Cumulative GPA"
                stroke="#4168ed"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card>
        <h2>{t("Grade distribution", "গ্রেডের বণ্টন")}</h2>
        <p className="caption">
          Recorded graded attempt credits, including repeats. This is not the
          unique degree-credit total.
        </p>
        <div className="chart">
          <ResponsiveContainer>
            <BarChart data={distribution}>
              <XAxis dataKey="grade" tick={{ fontSize: 9 }} />
              <YAxis width={30} />
              <Tooltip />
              <Bar
                isAnimationActive={false}
                dataKey="credits"
                name="Attempt credits"
                fill="#5275e7"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
