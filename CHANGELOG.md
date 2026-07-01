# Changelog

## Unreleased

Security automation hardening.

- Enabled Dependabot update configuration for npm and GitHub Actions.
- Focused npm Dependabot automation on security updates to avoid noisy major-version PRs.
- Updated GitHub Actions checkout/setup-node actions to current major versions.
- Updated Next.js and eslint-config-next to 16.2.9.
- Updated Vitest to 4.1.9, removing the low-severity esbuild development-server alert.

## v0.1.3 - 2026-07-01

ONPE contract tests.

- Added offline contract tests for public non-contractual ONPE presentation-backend routes.
- Covered national, foreign-vote, and territorial ONPE fetch flows with mocked responses.
- Verified request headers, route/query parameters, schema variants, and snapshot fallback behavior for HTML, invalid JSON, empty body, non-200 responses, `success:false`, and missing candidate data.
- Added `npm run test:onpe-contract`.

## v0.1.2 - 2026-07-01

Official methodology links.

- Added more visible official 2026 sources to the methodology page: PCM/Gob.pe, JNE EG2026, ONPE EG2026, ONPE timeline, RENIEC EG2026, foreign voting, and ONPE open data.
- Updated the README current release link.

## v0.1.1 - 2026-07-01

Source-governance hardening.

- Added a structured official-source registry validated by tests.
- Added canonical source metadata adapters for legacy election datasets.
- Added maintainer, governance, changelog, and Codex maintenance-plan documentation.
- Added historical maintainer attribution for early commits created before Git author details were configured.
- Updated README badges, live methodology link, and contributor-friendly task guidance.
- Added explicit metadata to the ONPE territorial snapshot: `source_url`, `retrieved_at`, and `source_type`.

## v0.1.0 - 2026-07-01

Public open-source governance baseline.

- Added MIT license, contribution guide, security policy, code of conduct, issue templates, and pull request template.
- Added official-source hierarchy for ONPE, JNE, RENIEC, PCM/Gob.pe, Cancilleria/Gob.pe, Datos Abiertos ONPE, Voto Informado, Plataforma Electoral, and Infogob.
- Added GitHub Actions verification for install, lint, tests, production build, and high-severity production dependency audit.
- Published the first public release for reviewer and contributor traceability.
- Documented the civic disclaimer: this project is not an official electoral authority, and simulations are not official results.
