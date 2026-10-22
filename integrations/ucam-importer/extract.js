/* global chrome */
const clean = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
const key = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
const aliases = {
  code: [/course code/, /course id/, /^code$/],
  title: [/course title/, /course name/, /^title$/, /^course$/],
  credits: [/credit hour/, /^credits?$/, /^cr$/],
  grade: [/letter grade/, /^grade$/, /result/],
  term: [/trimester/, /semester/, /^term$/, /session/],
};

function columnMap(headers) {
  const map = {};
  for (const [name, patterns] of Object.entries(aliases)) {
    const index = headers.findIndex((header) =>
      patterns.some((pattern) => pattern.test(key(header))),
    );
    if (index >= 0) map[name] = index;
  }
  return map;
}

function extractVisibleResults() {
  const candidates = [...document.querySelectorAll("table")]
    .map((table) => {
      const headerRow =
        table.querySelector("thead tr") || table.querySelector("tr");
      const headers = headerRow
        ? [...headerRow.querySelectorAll("th,td")].map((cell) =>
            clean(cell.textContent),
          )
        : [];
      const map = columnMap(headers);
      return {
        table,
        headerRow,
        map,
        score: ["code", "credits", "grade"].filter(
          (field) => map[field] !== undefined,
        ).length,
      };
    })
    .sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best || best.score < 3)
    throw new Error(
      "No result table found. Open UCAM Grade/Result and show the full table.",
    );

  const selectedTerm = clean(
    document.querySelector("select option:checked")?.textContent,
  );
  const rows = [...best.table.querySelectorAll("tbody tr, tr")].filter(
    (row) => row !== best.headerRow,
  );
  const courses = rows.flatMap((row) => {
    const cells = [...row.querySelectorAll(":scope > th, :scope > td")].map(
      (cell) => clean(cell.textContent),
    );
    const code = clean(cells[best.map.code]).toUpperCase();
    const credits = Number.parseFloat(clean(cells[best.map.credits]));
    const grade = clean(cells[best.map.grade])
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace("A−", "A-");
    if (
      !/^[A-Z]{2,10}\s*-?\s*\d{3,4}[A-Z]?$/.test(code) ||
      !Number.isFinite(credits) ||
      !/^(A|A-|B\+|B|B-|C\+|C|C-|D\+|D|F|I|W)$/.test(grade)
    )
      return [];
    const title =
      best.map.title === undefined ? "" : clean(cells[best.map.title]);
    const term =
      best.map.term === undefined
        ? selectedTerm || "UCAM import"
        : clean(cells[best.map.term]);
    return [
      {
        code: code.replace(/\s*-\s*/, " "),
        title,
        credits,
        grade,
        term,
        category: /lab/i.test(title) ? "lab" : "core",
      },
    ];
  });
  if (!courses.length)
    throw new Error(
      "The result table was found, but no valid graded course rows were visible.",
    );
  return {
    format: "uiu-compass-ucam-v1",
    source: location.origin,
    exportedAt: new Date().toISOString(),
    courses,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "UIU_COMPASS_EXTRACT") return;
  try {
    sendResponse({ ok: true, payload: extractVisibleResults() });
  } catch (error) {
    sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
