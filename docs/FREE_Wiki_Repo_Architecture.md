# FREE Wiki: Repository Architecture Design
**v0.1 — Drafted for planning. Not yet implemented.**

---

## Purpose

This document defines how the FREE Wiki's content is structured in a git repository: how documents, versions, translations, and chapter variants relate to one another. It is the foundation that the static site, the version viewer, the CMS, and any future governance layer all sit on. Decisions here shape everything downstream, so this document should be reviewed and agreed before any building begins.

This is a data-architecture document, not a code document. It describes structure and naming, not implementation.

---

## Core Principles

**Git is the source of truth.** Every document, every version, every translation lives as a markdown file in the repository. The web app renders from the repo. There is no separate database of content. Git history is the version history.

**Markdown files are portable.** Content is plain markdown with a small amount of structured metadata (frontmatter) at the top of each file. If the wiki platform changes in the future, the content moves cleanly because it was never locked into a proprietary format.

**Structure is legible to humans.** Someone browsing the repository directly, without any tooling, should be able to understand what each file is and how it relates to others, from the folder structure and file names alone.

**Variants and translations are explicit, not magical.** A German translation of the Code of Conduct and a Hamburg-specific adaptation are different things. The structure distinguishes them clearly rather than collapsing them into one ambiguous concept.

---

## Top-Level Repository Structure

```
free-wiki/
├── content/
│   ├── about/
│   ├── starter-kit/
│   ├── reference/
│   ├── chapters/
│   └── templates/
├── config/
│   ├── navigation.yaml
│   └── languages.yaml
├── public/
│   └── (images, logos, static assets)
├── src/
│   └── (the web app code — separate concern from content)
├── CLAUDE.md
├── PRD.md
└── README.md
```

The key separation: **`content/` holds everything that gets published**, organized to mirror the wiki's structure. **`src/` holds the web app code.** These are different concerns and live in different places, even though they share one repository. Content editors touch `content/`. Developers touch `src/`. This separation also means a future migration of the web app (changing static-site frameworks, for example) leaves `content/` untouched.

---

## Content Organization

### The Five Sections

The `content/` directory mirrors the five sections of the wiki:

```
content/
├── about/              # About FREE, About FREE Foundation, How to Engage, etc.
├── starter-kit/        # F1, P1–P5
├── reference/          # R-series canonical templates + guidance
├── chapters/           # Chapter-specific adaptations, organized by chapter
└── templates/          # T-series recurring-use templates
```

### Document File Naming

Within each section, documents are named by their identifier and a human-readable slug:

```
starter-kit/
├── f1-what-is-a-free-chapter.md
├── p1-seed-team-checklist.md
├── p2-first-public-event-guide.md
├── p3-first-general-assembly-guide.md
├── p4-second-general-assembly-guide.md
└── p5-stewards-phase-1-guide.md
```

The identifier prefix (f1, p1, etc.) keeps files sorted in lifecycle order and matches how the documents reference each other in their text.

---

## Handling Translations and Variants

This is the most important architectural decision, because the relationship between a canonical document, its translations, and chapter-specific adaptations is exactly what most wiki tools handle badly.

### Two Distinct Concepts

**A translation** is the same content in a different language. The German translation of the canonical Code of Conduct says the same things the English version says; only the language differs.

**A variant (adaptation)** is different content that serves the same purpose. The Hamburg chapter's Code of Conduct is Hamburg's own document, adapted for their context. It may have been inspired by the canonical version, but it is not a translation of it.

The structure must distinguish these, because they have different relationships to the canonical source and different update dynamics.

### Translations: Language Subfolders

Canonical documents and their translations live together, distinguished by language code:

```
reference/
├── code-of-conduct/
│   ├── en.md           # canonical English
│   ├── de.md           # German translation of canonical
│   ├── it.md           # Italian translation of canonical
│   └── es.md           # Spanish translation of canonical
├── code-of-conduct-guidance/
│   ├── en.md
│   └── de.md
└── digital-comms-norms/
    ├── en.md
    └── de.md
```

Each document becomes a folder; each language is a file within it named by ISO language code. The English file (`en.md`) is the canonical reference. Other language files are translations of it.

The frontmatter of each translation records which version of the canonical it was translated from, so staleness is visible:

```yaml
---
title: Verhaltenskodex
language: de
translation_of: code-of-conduct/en.md
translated_from_version: 1.2
status: translation
last_updated: 2026-06-15
---
```

If the English canonical advances to v1.3, the German file still says `translated_from_version: 1.2`, which immediately flags that the translation needs review. This is the manual-but-visible solution to translation staleness.

### Variants: Chapter Folders

Chapter-specific adaptations live under the chapter, not under the canonical document:

```
chapters/
├── tulsa/
│   ├── _chapter.md             # Tulsa overview/landing page
│   ├── code-of-conduct/
│   │   └── en.md               # Tulsa's adopted CoC (English)
│   └── digital-comms-norms/
│       └── en.md
├── zurich/
│   ├── _chapter.md
│   └── code-of-conduct/
│       └── en.md               # Zurich's adopted CoC (in draft)
├── hamburg/
│   ├── _chapter.md
│   ├── code-of-conduct/
│   │   └── de.md               # Hamburg's adopted CoC (German original)
│   └── digital-comms-norms/
│       └── de.md
└── turin/
    ├── _chapter.md
    └── code-of-conduct/
        └── it.md
```

Each chapter is a folder. The `_chapter.md` file is the chapter's overview page (the underscore prefix keeps it sorted to the top). Each adapted document sits under the chapter, and can itself have language versions if the chapter maintains multiple languages.

The frontmatter of a chapter variant records its relationship to the canonical, without implying it is a translation:

```yaml
---
title: Hamburg Code of Conduct
chapter: hamburg
language: de
adapted_from: reference/code-of-conduct/en.md
adapted_from_version: 1.2
status: adopted
adopted_date: 2026-07-01
last_updated: 2026-07-01
---
```

The difference from a translation is the `adapted_from` field (rather than `translation_of`) and the `status: adopted` (rather than `status: translation`). This tells the web app, and any human reader, that Hamburg's document is Hamburg's own, related to but distinct from the canonical.

### Why This Distinction Matters

When the canonical Code of Conduct updates:

- **Translations** should be updated to match (the German translation should reflect the new English content). The `translated_from_version` field flags which translations are now stale.
- **Variants** are NOT automatically affected. Hamburg's adopted Code of Conduct is Hamburg's, and changes to the canonical do not obligate Hamburg to change theirs. The `adapted_from_version` field is informational; it tells a reader what canonical version Hamburg started from, and Hamburg decides whether to incorporate any later canonical changes.

This is the architecture that lets the wiki hold a growing matrix of canonical documents, translations, and chapter variants without the relationships becoming a tangled mess.

---

## Frontmatter Schema

Every content file begins with YAML frontmatter. The common fields:

```yaml
---
title: string              # Human-readable title
identifier: string         # e.g. "f1", "p1", "r1" (for Starter Kit / Reference)
section: string            # about | starter-kit | reference | chapters | templates
language: string           # ISO 639-1 code (en, de, it, es, ...)
status: string             # draft | published | translation | adopted | in-progress
version: string            # e.g. "0.1", "1.2"
last_updated: date         # ISO date
---
```

Translation-specific additional fields:

```yaml
translation_of: path            # path to the canonical source file
translated_from_version: string
translation_method: string      # ai-generated | human | ai-then-human
human_verified: boolean         # true once a human has reviewed the translation
```

When `translation_method` is `ai-generated` and `human_verified` is `false`, the web app displays a visible disclaimer at the top of the document indicating the translation is machine-generated and unverified, and pointing readers to the English original as authoritative. When a human verifies the translation, `human_verified` is set to `true` (and typically `translation_method` becomes `ai-then-human`), and the disclaimer changes or is removed.

Variant-specific additional fields:

```yaml
chapter: string            # chapter slug
adapted_from: path         # path to the canonical source file
adapted_from_version: string
adopted_date: date
```

The web app reads this frontmatter to build navigation, display status badges, show "this translation may be outdated" warnings, and render the relationships between documents.

---

## Versioning and History

### Git Provides the History

Every change to every file is a git commit. The full version history of any document is the git log for that file. There is no separate versioning system; git is the versioning system.

### The `version` Field Is Editorial

The `version` field in frontmatter (e.g. "1.2") is a human-assigned editorial version, distinct from git's commit-level history. It increments when the editors decide a change is substantive enough to warrant a new version number. Git tracks every keystroke-level change; the `version` field tracks meaningful editorial milestones.

### The Version Viewer (Phase 1 Feature)

The web app surfaces git history through a user-facing version viewer, so a reader can see how a document has changed over time without using git directly. For any document, the viewer shows:

- The list of past versions (from git history)
- The date and a short description of each change (from commit messages)
- A readable diff between any two versions
- The ability to view the document as it existed at any past point

This is achievable because git already stores everything needed. The web app reads the git history for a file and renders it in a friendly interface. The key implementation requirement: commit messages must be meaningful, because they become the change descriptions users see. A commit convention (described in the PRD) enforces this.

---

## Configuration Files

### navigation.yaml

Defines the sidebar structure and ordering. Rather than inferring navigation purely from the folder structure, an explicit navigation file gives editorial control over what appears, in what order, with what labels:

```yaml
sections:
  - title: About FREE
    path: about
    items:
      - about/welcome
      - about/about-free
      - about/about-free-foundation
      - about/how-to-engage
  - title: Starter Kit
    path: starter-kit
    items:
      - starter-kit/f1-what-is-a-free-chapter
      - starter-kit/p1-seed-team-checklist
      # ...
```

### languages.yaml

Defines which languages the wiki supports, their display names, and their reading direction. The initial MVP language set:

```yaml
languages:
  - code: en
    name: English
    direction: ltr
    default: true
  - code: it
    name: Italiano
    direction: ltr
  - code: es
    name: Español
    direction: ltr
  - code: pt
    name: Português
    direction: ltr
  - code: de
    name: Deutsch
    direction: ltr
  - code: fr
    name: Français
    direction: ltr
  - code: zh-Hans
    name: 简体中文
    direction: ltr
```

Note on Chinese: the configuration specifies `zh-Hans` (Simplified Chinese) rather than generic `zh`. The choice between Simplified and Traditional carries political and regional meaning, and the political vocabulary of economic organizing translates differently across them. Simplified is the initial target; Traditional (`zh-Hant`) can be added later as a separate language if the network's Chinese-speaking membership warrants it.

---

## What This Architecture Enables

**Phase 1 (static wiki + version viewer):** Renders `content/` to a clean website. Reads frontmatter for navigation and status. Surfaces git history through the version viewer. Handles language switching via the language files within each document folder.

**Phase 2 (CMS):** A CMS layer writes to `content/` following this same structure. When a non-technical editor creates or edits a document, the CMS produces a markdown file with correct frontmatter in the correct folder, and commits it. The architecture does not change; the CMS is just another way of writing to the same files.

**Phase 3 (governance, if pursued):** A governance gate sits between "a change is proposed" and "the change is merged into the main branch." Because git already supports branches and pull requests, the governance layer maps onto git-native concepts: a proposed change is a branch or PR, an approval is what allows the merge, and the transparent record of who approved is the merge history. Whether this routes through Hypha or is built into the CMS is deferred, but either way it sits cleanly on top of this architecture without changing it.

---

## Open Questions for Implementation

These are decisions to make during the build, flagged here so they are not forgotten:

1. **Static site framework.** Astro Starlight, Docusaurus, or MkDocs Material are the main candidates. Starlight is recommended for clean public docs with good i18n support, but this is a build-time decision.

2. **How the version viewer reads git history.** Options range from build-time generation (the site is rebuilt with version data baked in) to a runtime API that queries git on demand. Build-time is simpler and sufficient for the expected update frequency.

3. **Hosting and deploy.** Vercel and Netlify both auto-deploy from a git push and both support custom domains. Either works.

4. **The git hosting provider.** GitHub is the default and integrates with the most tooling (including CMS options like Decap and Tina). GitLab and others are possible.

5. **Whether `src/` (the app code) and `content/` live in the same repository or two separate repositories.** Same repo is simpler to start. Separate repos give cleaner separation but add coordination overhead. Recommendation: start with one repo, split later only if it becomes necessary.

---

## A Note on This Document

This is v0.1, a planning document drafted before implementation. It will be revised as the build surfaces practical constraints. The architecture described here is a starting point designed to be clean and extensible, with the explicit goal of not painting the project into a corner as the CMS and governance layers are added later.
