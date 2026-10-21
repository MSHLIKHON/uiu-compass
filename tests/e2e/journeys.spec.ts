import { Buffer } from "node:buffer";
import { test, expect } from "@playwright/test";
import { initial } from "../../src/state/storage";
async function seed(page: import("@playwright/test").Page) {
  await page.addInitScript(
    (data) => {
      if (!localStorage.getItem("uiu-compass:v1"))
        localStorage.setItem("uiu-compass:v1", JSON.stringify(data));
    },
    {
      ...initial,
      profile: {
        ...initial.profile,
        ready: true,
        batch: "Summer 2026",
        curriculum: "cse2026",
        cgpa: 3.2,
        gpaCredits: 45,
        earnedCredits: 42,
        degreeCredits: 141,
      },
    },
  );
}
test("all routes render without exceptions or viewport overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/dashboard",
    "/setup",
    "/calculator",
    "/target",
    "/retakes",
    "/fees",
    "/scholarships",
    "/graduation",
    "/scenarios",
    "/reports",
    "/settings",
    "/policies",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("onboarding persists, theme and Bangla work", async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === "desktop")
    await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/setup");
  await page.getByLabel("Admission batch").fill("Summer 2026");
  await page
    .getByRole("combobox", { name: "Curriculum", exact: true })
    .selectOption("cse2026");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Current CGPA", { exact: true }).fill("3.2");
  await page.getByLabel("GPA-denominator credits").fill("45");
  await page.getByLabel("Earned degree credits").fill("42");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Open my compass" }).click();
  await expect(page.getByText("3.20", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("3.20", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `docs/screenshots/dashboard-${testInfo.project.name}.png`,
    fullPage: testInfo.project.name === "mobile",
  });
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Change language" }).click();
  await expect(
    page.getByRole("heading", { name: "পরের পদক্ষেপ, সহজ পরিকল্পনা" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await page.screenshot({
    path: `docs/screenshots/bangla-dark-${testInfo.project.name}.png`,
    fullPage: testInfo.project.name === "mobile",
  });
});
test("course history, edit, and discrete target scenario", async ({ page }) => {
  await seed(page);
  await page.goto("/calculator");
  await page
    .getByRole("combobox", { name: "Grade", exact: true })
    .selectOption("A-");
  await page.getByRole("button", { name: "Add course", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "COURSE 1", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit COURSE 1" }).click();
  await page.getByLabel("Credits", { exact: true }).fill("1.5");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("cell", { name: "1.5", exact: true }),
  ).toBeVisible();
  await page.goto("/target");
  await page.getByLabel("Current CGPA", { exact: true }).fill("2");
  await page.getByLabel("Current GPA credits", { exact: true }).fill("100");
  await expect(page.getByText("TARGET NOT REACHABLE")).toBeVisible();
  await page
    .getByRole("button", { name: "Save scenario", exact: true })
    .click();
  await page.goto("/scenarios");
  await expect(page.getByLabel("Scenario name")).toHaveValue("Plan 1");
});
test("fee breakdown validates allocations and stores plan", async ({
  page,
}) => {
  await page.goto("/fees");
  await page.getByLabel("Tuition per credit (BDT)").fill("6500");
  await page
    .getByText("Retakes, excluded credits & other charges", { exact: true })
    .click();
  await page.getByLabel("Non-waivable regular credits").fill("3");
  await page.getByLabel("Single tuition waiver").fill("50");
  await page.getByLabel("Trimester / semester fee").fill("6500");
  await page.getByRole("button", { name: "Save fee plan" }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("uiu-compass:v1")!).finance.rate,
    ),
  ).toBe(6500);
  await page.getByLabel("Non-waivable regular credits").fill("13");
  await expect(page.getByRole("alert")).toContainText("cannot exceed");
  await expect(
    page.getByRole("button", { name: "Save fee plan" }),
  ).toBeDisabled();
});
test("backup import is validated and confirmation-gated", async ({ page }) => {
  await page.goto("/settings");
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        ...initial,
        profile: { ...initial.profile, batch: "Fall 2025", ready: true },
      }),
    ),
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Replace data" }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("uiu-compass:v1")!).profile.batch,
    ),
  ).toBe("Fall 2025");
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole("alert")).toContainText(
    "Unsupported backup version",
  );
});
test("manifest and service worker support offline calculator reload", async ({
  page,
  context,
}) => {
  await page.goto("/target");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  expect(
    manifest.icons.some((i: { sizes: string }) => i.sizes === "512x512"),
  ).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Plan your target CGPA" }),
  ).toBeVisible();
  await page.getByLabel("Current CGPA", { exact: true }).fill("3");
  await page.getByLabel("Current GPA credits", { exact: true }).fill("30");
  await expect(
    page.locator(".target-result").getByText("3.19", { exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
});
test("report includes assumptions without ID by default", async ({ page }) => {
  await seed(page);
  await page.goto("/reports");
  await expect(
    page.getByText("Assumptions & verification", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Source register · checked 2026-10-22"),
  ).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".report-sheet")).toBeVisible();
});

test("retake simulation requires explicit rule and saves comparison", async ({
  page,
}) => {
  await page.addInitScript(
    (data) => localStorage.setItem("uiu-compass:v1", JSON.stringify(data)),
    {
      ...initial,
      profile: {
        ...initial.profile,
        ready: true,
        cgpa: 2,
        gpaCredits: 30,
        target: 2.3,
      },
      finance: { ...initial.finance, rate: 6500, firstDiscount: 50 },
      courses: [
        {
          id: "test-failed",
          term: "Term 1",
          code: "TEST 101",
          title: "Hypothetical failed course",
          credits: 3,
          grade: "F",
          attempt: 1,
          category: "core",
          excluded: false,
        },
      ],
    },
  );
  await page.goto("/retakes");
  await page
    .getByText("Compare multiple retake combinations", { exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Select an explicit");
  await page
    .getByRole("combobox", { name: "Retake treatment assumption" })
    .selectOption("highest");
  await page.getByRole("checkbox", { name: "Select TEST 101" }).check();
  await expect(
    page.getByRole("cell", { name: "2.40", exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByRole("cell", { name: "B", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Reaches", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("uiu-compass:v1")!).scenarios[0].cgpa,
    ),
  ).toBe(2.4);
});

test("navigation, live savings, graduation and backup export", async ({
  page,
}, testInfo) => {
  await seed(page);
  await page.goto("/dashboard");
  const navigation = page.locator(
    testInfo.project.name === "mobile" ? ".mobile-bottom-nav" : ".sidebar nav",
  );
  await navigation.locator('a[href="/fees"]').click();
  await page.locator('.section-tabs a[href="/scholarships"]').click();
  await page.getByLabel("Qualifying term GPA").fill("3.7");
  await page.getByLabel("Qualifying registered credits").fill("12");
  await page.getByLabel("Tuition per credit (BDT)").fill("6500");
  await expect(page.getByTestId("waiver-savings")).toContainText("19,500");
  await page.getByLabel("Qualifying registered credits").fill("9");
  await expect(page.getByTestId("waiver-savings")).toContainText("14,625");
  await page.goto("/graduation");
  await page.getByLabel("Completed degree credits").fill("51");
  await expect(page.getByText("90", { exact: true })).toBeVisible();
  await page.goto("/settings");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON backup" }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  expect(await download.failure()).toBeNull();
});
test("report print action opens browser printing", async ({ page }) => {
  await seed(page);
  await page.goto("/reports");
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printRequested = "true";
    };
  });
  await page
    .getByRole("button", { name: "Print / Save PDF", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-print-requested",
    "true",
  );
  const pdf = await page.pdf({ format: "A4" });
  expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
});

test("mobile install dialog covers the viewport without being trapped in the sidebar", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/graduation");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Install Compass" }).click();
  const backdrop = page.locator(".modal-backdrop");
  await expect(backdrop).toBeVisible();
  const box = await backdrop.boundingBox();
  const viewport = page.viewportSize();
  expect(box?.x).toBe(0);
  expect(box?.y).toBe(0);
  expect(box?.width).toBe(viewport?.width);
  expect(box?.height).toBe(viewport?.height);
  await expect(page.getByRole("dialog")).toBeInViewport();
});

test("curriculum planner explains its inputs and sequence limits", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/graduation");
  await page
    .getByText("Curriculum checklist & suggested sequence", { exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "How this planner works" }),
  ).toBeVisible();
  await expect(
    page.getByText(/only the requirements currently loaded below/),
  ).toBeVisible();
});
