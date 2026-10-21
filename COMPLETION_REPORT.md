> Historical baseline report. For the repaired release and current GitHub status, see [REPAIR_REPORT.md](REPAIR_REPORT.md).

# UIU Compass — delivery report

Date: **2026-10-22 (Asia/Dhaka)**.

## 1. Delivered implementation

The application runs locally and builds as a static installable PWA. This is a functioning release candidate, not a mockup. Public release still requires the policy and device validation described below; no institutional-precision or blanket production-readiness claim is made.

- Twelve main pages plus a three-step onboarding wizard; desktop sidebar and mobile navigation.
- Quick aggregate and detailed course history modes; add/edit/delete/copy attempts; decimal credits; distinct earned, attempted and GPA credits; grade distribution and term/cumulative charts.
- Immediate weighted CGPA and future-term projections; maximum attainable CGPA; target gap and feasibility; exact valid-letter-grade search for up to ten courses.
- Retake simulations with explicit highest/latest/all-attempt models, baseline consistency checks, minimum individual grade, up to 1,024 candidate subsets and four optimization rankings.
- Tuition calculator with manual batch rates or explicitly selected advertised estimates, eligible/excluded credits, one tuition waiver, first-retake discount, separate term/other fees, payments, overpayment credit and personal installment planning.
- Selected scholarship continuation checks with source/cohort limits, eligibility-not-verified state and conditional protection forecast.
- Manual curriculum infrastructure plus eight verified CSE course rows; prerequisites, selective elective alternatives, blocked-course detection, credit-load duration/cost comparisons and final-CGPA assumptions.
- Named scenario snapshots and comparison, including scope explanations for costs.
- Local browser Print / Save PDF reports with profile metrics, scenarios/retakes, fee breakdown, assumptions, policy URLs and optional ID inclusion.
- Bangla/English main interface, light/dark themes, local persistence, validation, notifications, confirmation dialogs and keyboard focus containment.
- Strict validated JSON backup/restore, schema versioning, private defaults, deletion controls and storage-error reporting.
- Install manifest, 192/512 icons, maskable icon, prompt-based updates and static-asset service worker. No student data is put into a network cache.
- Formatted TypeScript source, locked dependencies, CI workflow, README, contribution guide, license recommendation, policy register and Cloudflare/Netlify preparation.

## 2. University sources used

Exact URLs, effective dates, program/batch scope, checked date, evidence status and limitations are in [UIU_POLICY_RESEARCH.md](UIU_POLICY_RESEARCH.md) and the app's Policy Sources page.

Primary sources: UIU grading/performance page, academic information policies, advertised tuition/waiver schedule, October 2024 first-retake concession notice, Spring 2025 scholarship policy, selected financial-assistance application conditions, CSE curriculum index and current course-plan page. The requested payment-policy page was not retrieved; conflicting indexed registration-payment notices are documented.

Many UIU pages returned 403 on direct access. Supported facts came from indexed content of the exact official source URLs, expressly labeled as such. These facts do not certify a particular student's eligibility.

## 3. Unresolved university policy coverage

| Area               | Implemented safe behavior                                               | Still needed                                                                                          |
| ------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Retake replacement | No official cumulative claim; explicit assumptions                      | Official denominator/replacement algorithm, including repeated attempts                               |
| I/W                | Provisional exclusion with warning                                      | Authoritative denominator and timing treatment                                                        |
| Historical fees    | User-confirmed manual rates                                             | Effective-dated, program/batch historical tariff archive                                              |
| Scholarships       | Selected Spring 2025+ conditions and user-confirmed award prerequisites | Full category/program tables, older cohorts, rank and documentation checks                            |
| Curricula          | Partial CSE 2026 subset plus manual requirements                        | Complete verified current/historical catalogs, elective counts, equivalencies and course availability |
| Retake concessions | First-retake discount with per-course attempt count                     | Mixed pre/post-Fall-2024 entitlement clarification                                                    |
| Payments           | Personal dates and estimates                                            | Current program/term-specific notices and deadlines                                                   |

## 4. Executed test results

| Check                     | Actual result                                                               |
| ------------------------- | --------------------------------------------------------------------------- |
| `npm run typecheck`       | Passed                                                                      |
| `npm run lint`            | Passed                                                                      |
| `npm run format:check`    | Passed                                                                      |
| `npm test`                | **48 tests passed** in 4 files                                              |
| `npm run test:e2e`        | **16 tests passed** across desktop Chromium and Pixel 7 Chromium emulation  |
| Manual browser inspection | Desktop landing/onboarding/dashboard; mobile Bangla and dark mode inspected |

Browser tests cover all routes without page exceptions or horizontal viewport overflow, onboarding and reload persistence, language/theme, course editing, target scenario saving, fee validation, backup replacement and rejection, retake assumption/grade/cost flow, print styling and offline service-worker reload with a functioning calculator.

The first browser run failed due to ambiguous test selectors (duplicate values/headings and wrapped select labels). These were corrected, and all final journeys passed against the rebuilt app. A transient development hot-reload context error during whole-project formatting was resolved by reloading; the production route suite passed without page errors.

Screenshots in `docs/screenshots/` use **hypothetical QA data**, not real academic records. Automated reports/traces live in ignored `playwright-report/` and `test-results/` folders.

## 5. Build result

`npm run build` passed using bundled **Node 24.19.0**. Vite produced `dist/`, a valid manifest and generated service worker. Workbox precaches **33 entries, about 832 KiB**. Assets are split by route; the shared chart chunk is about 384 kB before gzip and 106 kB gzip. No build error remained.

Initial installation used the host's Node 21 and emitted engine warnings. The supported project runtime is Node 24 (documented in `.nvmrc`, CI and deployment configuration), and the final production build used Node 24.

## 6. Repository structure

- `src/domain/`: pure academic, financial and curriculum engines, typed records.
- `src/policy/`: checked source register, cohort checks and partial verified curriculum.
- `src/state/`: local persistence, validation and summary selectors.
- `src/components/`: reusable forms/cards, charts, dialog focus and PWA lifecycle.
- `src/pages/`: all route-level product pages and onboarding.
- `public/`: icons, routing fallback and hosting headers.
- `tests/`: unit/component tests and browser journeys.
- `.github/workflows/ci.yml`: Node 24 quality checks.
- `README.md`, `UIU_POLICY_RESEARCH.md`, `CONTRIBUTING.md`, `netlify.toml`, `.env.example` and license recommendation.

## 7. Run locally

From the `uiu-compass` folder, use Node 24:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. For production testing:

```sh
npm run build
npm run preview
```

No secrets, accounts or environment variables are required. The development preview used in this session may contain a clearly hypothetical QA profile; use Settings → Delete all local data for a fresh start. A new browser origin/profile starts empty.

## 8. GitHub and Cloudflare deployment

No remote repository was created, no commits were pushed, and no site was published. No external account was changed.

The README gives exact commands for creating a local repository and pushing **after owner approval**. In Cloudflare Pages, connect the approved GitHub repository, use branch `main`, command `npm run build`, directory `dist`, and Node 24. `_redirects` provides client-route fallback. Configuration is consistent with [Cloudflare's React guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/). Netlify alternative settings are in `netlify.toml`.

After publication, verify HTTPS, deep-link refresh, install prompts, first-visit caching, offline reload and update behavior on actual devices. Git-connected Pages can deploy automatically on future approved pushes; protect the branch and configure deployment rules intentionally.

## 9. Known implementation and verification limits

- This is not a complete verified database of every UIU department/batch. Manual infrastructure is implemented where source data is missing.
- Bangla covers the main navigation, headings and core controls; some technical explanations, policy records, tables and report sections remain English. A full editorial localization pass is recommended before marketing it as completely translated.
- Reports use the browser's print-to-PDF flow. Print-mode structure was tested; a final saved PDF file and platform-specific print pagination were not visually certified in this session.
- Real Android/iOS installation and hosted HTTPS update transitions were not exercised. Chromium desktop/mobile emulation and offline reload were tested.
- Graduation suggestions use entered prerequisites and credit limits. Elective groups require the student to select approved alternatives; full institutional elective/equivalency solving is not claimed. Semester/trimester duration is expressed in terms, not guaranteed calendar dates.
- Upcoming terms, grades, award continuation and costs are forecasts, never guarantees.
- LocalStorage is unencrypted and has browser quotas; device loss/storage clearing can lose records. There is no cloud sync or account recovery.
- Exact discrete search has explicit complexity limits. Retake scenarios require a consistent baseline; aggregate CGPA cannot recover missing attempt details.
- No independent accessibility audit, penetration test, dependency-vulnerability audit, Safari/Firefox automated suite or live university validation was completed.
- No open-source license grant is applied yet; MIT is recommended for owner review.

## 10. Recommended follow-up improvements

1. Obtain official registrar/department confirmation of academic repeat handling, I/W treatment and cohort tariffs.
2. Import and independently verify full CSE curriculum PDFs, then expand one program/cohort at a time.
3. Complete Bangla copy editing and translate technical/report content while preserving exact official policy wording.
4. Validate saved PDFs, iOS/Android installation, update lifecycle and accessibility with actual users/devices.
5. Audit dependencies and deploy a private HTTPS review environment after account/publication approval.
6. Expand scholarship categories only with verified entry, continuation, exclusion and stacking requirements.

The source code and core workflows are delivered and tested. The unresolved items above are explicit release constraints, not silently fabricated functionality.
