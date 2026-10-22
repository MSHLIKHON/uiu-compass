javascript: (() => {
  const c = (v) =>
      String(v ?? "")
        .replace(/\s+/g, " ")
        .trim(),
    k = (v) =>
      c(v)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " "),
    a = {
      code: [/course code/, /course id/, /^code$/],
      title: [/course title/, /course name/, /^title$/, /^course$/],
      credits: [/credit hour/, /^credits?$/, /^cr$/],
      grade: [/letter grade/, /^grade$/, /result/],
      term: [/trimester/, /semester/, /^term$/, /session/],
    },
    candidates = [...document.querySelectorAll("table")]
      .map((t) => {
        const h = t.querySelector("thead tr") || t.querySelector("tr"),
          hs = h
            ? [...h.querySelectorAll("th,td")].map((x) => c(x.textContent))
            : [],
          m = {};
        for (const [n, ps] of Object.entries(a)) {
          const i = hs.findIndex((x) => ps.some((p) => p.test(k(x))));
          if (i >= 0) m[n] = i;
        }
        return {
          t,
          h,
          m,
          s: ["code", "credits", "grade"].filter((x) => m[x] !== undefined)
            .length,
        };
      })
      .sort((x, y) => y.s - x.s),
    b = candidates[0];
  if (!b || b.s < 3)
    return alert(
      "No result table found. Open UCAM Grade/Result and show the full table.",
    );
  const st = c(document.querySelector("select option:checked")?.textContent),
    courses = [...b.t.querySelectorAll("tbody tr,tr")]
      .filter((r) => r !== b.h)
      .flatMap((r) => {
        const x = [...r.querySelectorAll(":scope>th,:scope>td")].map((z) =>
            c(z.textContent),
          ),
          code = c(x[b.m.code]).toUpperCase(),
          credits = parseFloat(c(x[b.m.credits])),
          grade = c(x[b.m.grade])
            .toUpperCase()
            .replace(/\s+/g, "")
            .replace("A−", "A-");
        if (
          !/^[A-Z]{2,10}\s*-?\s*\d{3,4}[A-Z]?$/.test(code) ||
          !Number.isFinite(credits) ||
          !/^(A|A-|B\+|B|B-|C\+|C|C-|D\+|D|F|I|W)$/.test(grade)
        )
          return [];
        const title = b.m.title === undefined ? "" : c(x[b.m.title]),
          term = b.m.term === undefined ? st || "UCAM import" : c(x[b.m.term]);
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
    return alert("No valid graded course rows were visible.");
  const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "uiu-compass-ucam-v1",
            source: location.origin,
            exportedAt: new Date().toISOString(),
            courses,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
    u = URL.createObjectURL(blob),
    d = document.createElement("a");
  d.href = u;
  d.download = "uiu-compass-ucam-results.json";
  d.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
  alert(`${courses.length} course rows exported.`);
})();
