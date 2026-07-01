# Governance

Radar Electoral Peru 2026 is a small maintainer-led civic-tech project.

## Decision model

The primary maintainer makes final decisions on releases, data-source acceptance, methodology wording, and security fixes. Contributors can propose changes through issues and pull requests.

## Data-source acceptance

A source can be added when it has:

- A stable `https://` URL.
- A named entity such as ONPE, JNE, RENIEC, PCM/Gob.pe, Cancilleria/Gob.pe, or a clearly identified private pollster.
- A `source_type` that separates official results, official registry/legal context, derived metrics, and simulations.
- A retrieval date or document date when relevant.
- A clear rule for what the source must not be used for.

## Release policy

Releases should include:

- A short description of data, methodology, UI, or governance changes.
- A passing `Verify` workflow.
- Known limitations when official data is partial, unavailable, or not legally final.

## Conflict of interest

Contributors should disclose political campaign affiliation, paid electoral consulting, or direct institutional involvement when proposing methodology or wording changes that could affect interpretation.
