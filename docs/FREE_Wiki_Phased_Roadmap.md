# FREE Wiki: Phased Build Roadmap
**v0.1 — Planning document**

---

## Purpose

This roadmap sequences the FREE Wiki from a static published site through to a governed, multi-contributor knowledge platform. It exists to keep each build phase focused and to prevent the most common failure mode in projects like this: trying to build everything at once and shipping a sprawling half-working system.

Each phase delivers something usable on its own. Each phase is a precondition for the next. You can stop at the end of any phase and have a working system.

---

## The Core Discipline

**Build the phase you need now. Document the phases you will need later. Do not build ahead of need.**

The wiki has real users today: chapter starters who need to read the Starter Kit. It will have content editors soon: the Documentation Circle. It may have a content-governance process eventually: when the federation exists and multiple chapters propose changes to canonical documents.

These are three different moments, and they map to three phases. Building phase 3 (governance) before there is anything to govern means building a parliament before there are citizens. The phasing protects against that.

---

## Phase 1: Static Wiki + Version Viewer

**Build now. Estimated effort: ~1 day of focused work, ~3 days including migration, branding, and testing.**

### What It Does

Renders the markdown content in the git repository to a clean, fast, public website at a subdomain of freefreeforum.org. Readers browse the full wiki, navigate via a sidebar, switch languages, and view the version history of any document without touching git.

### Scope

- Static site generated from `content/` (per the Repo Architecture doc)
- Clean navigation sidebar showing all five sections
- Full-text search across the wiki
- Mobile-responsive, accessible, fast
- Language switching for documents that have translations
- Status badges (draft, published, adopted) read from frontmatter
- A version viewer: for any document, show its history from git, diffs between versions, and the ability to read past versions
- Custom domain (wiki.freefreeforum.org) with automatic deploy on git push

### Who Edits in This Phase

You, and any other developer comfortable with git. Editing means: edit the markdown file, write a meaningful commit message, push. The site rebuilds automatically. This is sufficient for the first 1-3 months when the editor pool is one or two technical people.

### What Success Looks Like

A chapter starter in Berlin opens wiki.freefreeforum.org on their phone, reads F1, switches the Code of Conduct to German, and checks how the document has changed since last month — all without an account, all without friction.

### Explicitly Out of Scope for Phase 1

- Any in-browser editing (that is phase 2)
- Any authentication or user accounts
- Any approval or governance workflow

---

## Phase 2: CMS Editing Layer

**Build when non-technical people need to edit. Likely 1-3 months out. Estimated effort: 2-3 focused days with off-the-shelf tools.**

### What It Does

Lets non-technical contributors create and edit wiki content through a friendly browser interface, without using git directly. The CMS writes correctly-structured markdown files (with proper frontmatter, in the correct folders) and commits them on the contributor's behalf.

### Scope

- An off-the-shelf git-backed CMS (Decap CMS or Tina CMS are the leading candidates)
- A WYSIWYG or markdown editing interface for content files
- Configured to understand the frontmatter schema and folder structure from the Repo Architecture doc
- Authentication for editors (GitHub OAuth or email-based, depending on the CMS)
- Changes submitted by editors create pull requests rather than direct commits to the main branch, so there is a review step before anything goes live

### The Review Step

This is the bridge to phase 3. Even in phase 2, edits do not go live instantly. A contributor's change creates a pull request. Someone with merge authority (initially you, later the Documentation Circle) reviews and merges. This gives a lightweight editorial gate without yet building a formal governance system.

In phase 2, "review" is simple: a trusted person looks at the proposed change and clicks merge. It is not yet a vote. It is not yet multi-signature. It is one editor approving. That is appropriate for the scale of phase 2.

### Who Edits in This Phase

Documentation Circle members and trusted chapter contributors, through the CMS. Developers can still edit markdown directly. Both paths write to the same files.

### Decision Required Before Building

Which CMS. Decap and Tina are both strong, both git-backed, both support the PR-based workflow. The Tech Circle (or you) should evaluate and choose. This decision can wait until phase 2 is actually needed.

### Explicitly Out of Scope for Phase 2

- Multi-signature voting (phase 3)
- Per-chapter granular edit permissions (deferred until multiple chapters actually want edit access — possibly never necessary if the Documentation Circle holds editing centrally)

---

## Phase 3: Content Governance Layer

**Build only when the federation exists and there is something to govern. Likely 6+ months out, possibly much longer. May not be custom-built at all.**

### What It Would Do

Gate changes to canonical documents behind a transparent, multi-participant approval process. Rather than one editor merging a change, a proposed change to a canonical document would require approval from multiple designated parties before it merges, with the approval recorded transparently.

### Why This Is Deferred

There is nothing to govern yet. Canonical documents are few, and they are being authored by a small group. The governance layer matters when:

- There are multiple active chapters who care about what becomes canonical
- Proposed changes to shared documents are contested or consequential enough to warrant collective approval
- The federation has a legitimate basis for deciding who gets a vote

None of these conditions hold today. Building the voting system now would be building governance infrastructure for a constituency that does not yet exist.

### Two Possible Approaches (Decision Deferred)

**Approach A: Route governance through Hypha.**

Hypha already provides circle/space-based voting governance and multi-signature decision tooling. Rather than rebuilding voting infrastructure, the wiki's content governance could integrate with Hypha: a proposed change to a canonical document becomes a Hypha proposal, the relevant circle votes, and a passing vote triggers the merge to git.

*Advantages:* No rebuilding of voting infrastructure. Consistency with how FREE governs other things. Hypha's transparency and contribution-tracking come for free.

*Considerations:* Requires Hypha to expose the integration points. Couples the wiki to Hypha. Requires the Hypha-to-git merge mechanism to be built (the bridge between a passed Hypha vote and an actual git merge).

**Approach B: Self-contained governance in the CMS/git layer.**

Build the voting and approval logic directly into the wiki's own infrastructure, independent of Hypha. Proposed changes are git branches/PRs; approvals are recorded through a custom interface; a threshold of approvals triggers the merge.

*Advantages:* No dependency on Hypha. Full control over the governance logic. Tightly integrated with the git workflow the wiki already uses.

*Considerations:* Rebuilds voting infrastructure that Hypha already has. More code to build and maintain. Another governance system for the organization to reason about.

### Recommendation on the Deferred Decision

Lean toward Approach A (route through Hypha) when the time comes, on the principle of not rebuilding infrastructure that already exists. But make the actual decision when phase 3 is real, with the Tech Circle and with current knowledge of what Hypha can do. Document both approaches now so the option is preserved; decide later.

### Explicitly Not a Phase 3 Concern Right Now

Everything about phase 3 is documented for completeness and to preserve the long-term vision. None of it should be built until the conditions above are met. The Fable goal for the current build should not attempt any of it.

---

## Summary Table

| Phase | Delivers | Build When | Effort | Editors |
|-------|----------|-----------|--------|---------|
| 1 | Public static wiki + version viewer | Now | ~1-3 days | Developers (git) |
| 2 | CMS editing with PR review | Non-tech editors needed (1-3 mo) | ~2-3 days | Doc Circle + contributors (CMS) |
| 3 | Multi-party content governance | Federation exists, contested changes (6+ mo) | Significant; may route through Hypha | Governed by federation process |

---

## What the Current Fable Goal Should Build

The immediate Fable `/goal` covers **phases 1 and 2**: the static wiki with version viewer, plus the CMS editing layer with PR-based review.

Phase 1 is the core deliverable and should work fully. Phase 2 (the CMS) can be configured using an off-the-shelf tool, with the PR-based review workflow as the editorial gate.

Phase 3 is explicitly excluded from the current goal. The architecture leaves room for it, the roadmap documents it, but it is not built now.

---

## A Note on This Document

This is v0.1, a planning roadmap. The phase boundaries and effort estimates will be refined as the build progresses and as the Tech Circle engages. The core discipline — build the phase you need, document the rest, do not build ahead of need — should hold regardless of how the details shift.
