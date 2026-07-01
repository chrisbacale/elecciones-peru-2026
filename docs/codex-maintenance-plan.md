# Codex maintenance plan

This repository uses Codex and API credits only for public open-source maintainer work. The goal is to improve source traceability, release safety, issue triage, and documentation quality for a civic-tech election dashboard.

## Allowed workflows

| Workflow | Codex/API use | Human gate |
| --- | --- | --- |
| Pull request review | Summarize diffs, flag missing tests, check source labels, suggest focused changes. | Maintainer approves every merge. |
| Issue triage | Classify bug/data/methodology/security reports and draft reproduction steps. | Maintainer edits labels and responses. |
| Source validation | Compare ONPE/JNE/RENIEC links against the source registry and identify stale URLs. | Maintainer verifies official source pages before publishing. |
| Electoral math tests | Generate or review tests for margins, acta progress, simulation ranges, and fallback behavior. | Maintainer checks formulas and fixtures. |
| Release QA | Run checklist, summarize risk, verify CI, and draft release notes. | Maintainer tags releases manually. |
| Security review | Inspect data-fetching code, dependency changes, and accidental personal-data exposure. | Maintainer decides remediation and disclosure path. |

## Disallowed workflows

- No voter-level personal data processing.
- No publication of DNI lookups, padrón nominal records, private screenshots, credentials, or secrets.
- No automated scraping load against official systems without rate limits and caching.
- No AI-generated claims about election outcomes without source labels and caveats.
- No mixing official results and simulations in a single unlabelled field.

## Maintainer checklist before each public snapshot

1. Confirm whether every changed data file has `source_url`, `retrieved_at`, and `source_type` where applicable.
2. Confirm UI labels distinguish `official_result`, `derived_metric`, and `simulation`.
3. Run `npm run verify`.
4. Check the GitHub Actions `Verify` workflow on the pushed branch.
5. Update release notes or the relevant issue with the source/date of the change.

## Why this matters for Codex for OSS

The project is early-stage, but the maintenance workload is real: official electoral sources can change structure, partial ONPE data can be misread as final, and civic dashboards need careful wording. Codex can materially reduce maintainer toil while keeping a human review gate on every public claim.
