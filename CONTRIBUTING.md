# Contributing to the WaaP Help Center

This is the user-facing help center for WaaP, deployed at [support.waap.xyz](https://support.waap.xyz).

## What goes here

User-facing lifecycle and orientation content — for people **using** WaaP, not building with it.

- Account help (sign-in, recovery, login methods)
- Wallet usage (send/receive, supported chains, transaction history)
- Security explanations at a high level (2PC, transaction scanning, recovery)
- Agent-related orientation for users (what is a Privilege, when does my agent ask for approval)
- Common troubleshooting
- FAQ

## What does NOT go here

These belong on other surfaces. Don't duplicate.

| Belongs on | Surface | Why |
|---|---|---|
| Developer reference (API, SDK, CLI commands as authoritative spec) | [docs.waap.xyz](https://docs.waap.xyz) | Help center is end-user; docs are for builders |
| Marketing positioning, social proof, CTAs | [waap.xyz](https://waap.xyz) and the WaaP for Agents landing page | Help center is post-conversion; marketing is pre-conversion |
| Internal product specs, PRDs, roadmap | `holonym-foundation/internal-docs` | Internal artifacts, not for public consumption |

## Style and voice

- **Conversational, lifecycle-help tone.** Not marketing, not technical reference.
- **Keep commands minimal.** Multiple are fine when each shows a distinct control; if an article sprawls, link to docs instead.
- **No cryptography explained.** That's docs territory. State what something does, not how it works mathematically.
- **Brand term: "Privileges"** (not "Permission Tokens" — that's the deprecated internal name).
- **`human.tech` lowercase with the dot.**
- **En dashes (–) over em dashes (—).** Em dashes only when nothing else carries the emphasis.

## Content rules

These prevent the help center from leaking unshipped state or drifting from public voice:

1. **Describe only what's shipped.** Don't reference pricing changes, dated features, or unannounced timelines until they're public. Internal-docs roadmap is not the publication source.
2. **Align with shipped marketing voice.** If marketing already says X publicly, the help center says X too. Internal-docs may show more nuance, but shipped voice is the consistency baseline.
3. **Two-source confirmation for product claims.** Verify in both internal-docs (what the product does) AND at least one public surface (what we say publicly) before writing.
4. **Modifier words are flags.** "as signer," "planned," "in progress," "via [X]" — these signal narrow or future scope. Default to omit unless shipped voice elsewhere already includes them.
5. **Read source verbatim, don't paraphrase.** "Stellar (as signer)" is literal narrow scope, not "WaaP supports Stellar."
6. **Cite at the moment of claim.** Open the file, pull the line, then write. No "from memory" claims.

## Process

1. **Branch off `main`.** Feature branch named after the change (`karo/may-fixes`, `feature-page-x`, etc.).
2. **One coherent change per PR.** Editing related articles together is fine; mixing unrelated edits is not.
3. **PR reviewers:**
   - Substantive content (new articles, voice changes, removals): @brunz-me (Daniel) for tone calibration.
   - Trivial factual additions / typo fixes: self-merge OK.
4. **Reference the tracking issue** in commits and PR (`Refs holonym-foundation/internal-docs#NNN`).
5. **Don't merge into `main` without preview.** Vercel deploys previews per PR — review the preview URL before merging.

## Open questions / TBD

Decisions worth resolving in the next iteration:

- **Nav split: Help vs Learn?** As the help center expands with comparison pillars and concept pages (per `internal-docs#858` GEO/pillar content), the flat nav will get crowded. Worth a tabbed split: "Help" (lifecycle/account/troubleshooting) vs "Learn" (concepts/comparisons/long-form FAQ). No decision yet.
- **Cadence + owner for freshness?** The help center drifted Feb → May 2026 with major launches in between. Need a recurring review cadence (quarterly minimum, more often around launches) and a single owner accountable. Currently informal between Karo + Maylynne.
- **Rebrand to `support.waap.human.tech`?** Internal-docs URL plan migrates the help center to `support.waap.human.tech`. Migration timing TBD. Keep `support.waap.xyz` for now.

## Source repo

This repo: [`holonym-foundation/waap-help-center`](https://github.com/holonym-foundation/waap-help-center).

Tracking issue for ongoing maintenance: [`internal-docs#799`](https://github.com/holonym-foundation/internal-docs/issues/799).
