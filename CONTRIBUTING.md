# Contributing

Use Node 24 and `npm ci`. Keep changes scoped, run typecheck, lint, Vitest, production build and applicable Playwright journeys.

Policy changes require an official source, effective date/term, admission cohorts, programs, checked date, verification status and explicit unknowns in `UIU_POLICY_RESEARCH.md` and `src/policy/repository.ts`. Do not overwrite historical tariffs with a current rate. Never infer retake replacement from a tuition concession. Do not invent curriculum rows, deadlines or award eligibility.

Pure engines belong in `src/domain`. UI must distinguish source facts, user data and assumptions. Add edge-case tests independent of UI. Financial fixtures must document their scope and rounding. Official facts and hypothetical fixtures must stay separate.

Backups contain potentially sensitive academic data: never commit real records, screenshots of personal data, credentials or student IDs. Use clearly hypothetical data in tests. All user-facing input must be validated; preserve schema versions when evolving persistence.

Review keyboard navigation, 390px mobile layout, dark mode, Bangla labels and reduced motion. Do not claim a release is production-ready without validating deployed HTTPS behavior and policy applicability with UIU.
