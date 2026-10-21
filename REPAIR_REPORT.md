# UIU Compass repair release — 22 October 2026

## Root causes and repairs

| Problem                                    | Root cause                                                                          | Repair                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Blank input appeared as zero               | Empty strings converted with `Number('')`                                           | Empty numeric drafts remain blank; invalid or missing results show a dash and explanation. Valid F/zero GPA still works. |
| CGPA did not react before Add              | Calculations used only persisted history                                            | Draft courses participate in live quick and detailed previews; saving is explicit.                                       |
| Saved courses appeared disconnected        | Selected term always initialized to Term 1                                          | Initialize from the last saved term; editing changes the active term.                                                    |
| Unconfigured baseline looked valid         | Missing profile/unresolved totals became zero                                       | Target and retake inputs remain missing until usable data exists.                                                        |
| Tuition showed zero cost                   | Missing rate used the default zero                                                  | Require an entered positive rate for billed credits; validate allocations before saving.                                 |
| Waiver savings stayed zero                 | Used saved fee values instead of the current form                                   | Compute savings from the scholarship form's current eligible credits and rate; validate GPA/credits.                     |
| Graduation forecast did not respond        | Only saved degree total was used                                                    | Editable degree and completed-credit inputs drive remaining credits and load estimates; reject completed > total.        |
| Rapid updates overwrote each other         | Update functions captured stale render data                                         | Apply each update to the latest validated data reference; batch regression test added.                                   |
| Retake assumptions had stale baselines     | Rule changes did not recompute detailed totals; selection used changing attempt IDs | Recompute baseline on rule changes and track course-code selection.                                                      |
| Unknown retake cost could be saved as zero | Default rate reached scenario storage                                               | Disable saving cost comparisons with selected retakes until a fee rate is configured.                                    |

## Interface

Five main destinations, grouped target/retake and fees/scholarship tabs, and mobile bottom navigation. Dashboard focuses on GPA, completed credits, target, remaining credits and term cost. Advanced grades, comparisons, policies, installment schedules, charts and curriculum tools are expandable. Inter and Hind Siliguri are bundled. Larger controls and labels, neutral surfaces, restrained blue/orange, and simplified headings replace the crowded presentation. Existing routes, backup schema and local-storage key are preserved.

## Validation

- TypeScript: passed.
- ESLint: passed.
- Unit/component tests: 54 passed across four files, including decimal credits, grade mapping, invalid input, zero versus missing, live drafts, tuition/waivers, graduation, storage and batched updates.
- Production build: passed; service worker generated with 50 precache entries (~1.3 MiB).
- Browser suite: 30 passed across desktop, 820px tablet and Pixel 7 Chromium emulation. Covers every route, page errors and viewport overflow, onboarding, saved data, theme/language, course edits, target/retake scenarios, fee validation, scholarship updates, graduation updates, navigation, JSON import/export, offline reload, manifest, print action and PDF byte generation.
- Desktop/mobile light and Bangla dark screenshots visually inspected; refreshed screenshots are in `docs/screenshots`.
- Sensitive filename and token/private-key pattern scan found no credentials in release sources. `.env.example` is the only environment file; build output, dependencies, local environment files and test artifacts are excluded by `.gitignore`.

Tests exercise representative journeys and calculations; this is not a claim of exhaustive testing of every possible control combination. JSDOM emits Recharts zero-size warnings because it does not lay out charts; browser layout checks pass.

## Policy evidence and limitations

Official indexed UIU tuition, waiver and retake-fee sources were rechecked. Direct source requests remained blocked with HTTP 403. Academic retake replacement and I/W denominator treatment are not certified; explicit assumptions and cautions remain. Historical batch tuition rates require student confirmation. Only the documented subset of the CSE curriculum is supplied; manual requirements remain necessary. Scholarship checks are conditional estimates and cannot approve an award. See `UIU_POLICY_RESEARCH.md` and the in-app source register.

Graduation edits and unsaved calculator drafts are temporary scenarios; use profile setup/history to persist academic records. OS-native PWA installation and physical-device Safari behavior were not tested. Print invocation and Chromium PDF generation were tested, but the operating-system Save dialog was not automated. No university login or private transcript was accessed.

## GitHub and deployment

Private repository created and verified: https://github.com/MSHLIKHON/uiu-compass.

The release is committed locally. The repository is still empty remotely: final push requires the owner's approval under the supplied brief. No remote-code or GitHub Actions success is claimed before that push. No public deployment was performed.

Cloudflare Pages configuration is prepared: Node 24, `npm run build`, `dist`, branch `main`, repository root, no API keys required. `public/_redirects` supplies SPA fallback; manifest, icons, headers and service worker are included. Connect GitHub and publish only after approval. Then verify the hosted HTTPS deep links, installation, caching and update behavior on real devices.
