# FREE Wiki: Content Migration Manifest
**For the build agent. Maps each source file to its destination in the content/ structure.**

---

## How to Use This

Each source file in `_source_content/` maps to a destination path under `content/`, following the structure in `docs/FREE_Wiki_Repo_Architecture.md`. For each file:

1. Move/rename the file to the destination path shown
2. Add or complete the YAML frontmatter as specified
3. The English canonical files are named `en.md` within their document folder (this enables the translation structure)

After English files are placed correctly, generate AI translations (it, es, pt, de, fr, zh-Hans) as sibling files in each document folder, each with the unverified-translation frontmatter and disclaimer.

---

## Section: About (`content/about/`)

The About section is the wiki's orientation layer. `About_01_Welcome` serves as the section landing page.

| Source File | Destination | Frontmatter notes |
|-------------|-------------|-------------------|
| `About_01_Welcome_to_the_FREE_Wiki.md` | `content/about/welcome/en.md` | title: "Welcome to the FREE Wiki"; section: about; status: published; this is the About section landing / first page |
| `About_02_About_FREE.md` | `content/about/about-free/en.md` | title: "About FREE"; section: about; status: published |
| `About_03_How_to_Engage_with_FREE.md` | `content/about/how-to-engage/en.md` | title: "How to Engage with FREE"; section: about; status: published |
| `About_04_A_Note_on_This_Wiki.md` | `content/about/a-note-on-this-wiki/en.md` | title: "A Note on This Wiki"; section: about; status: published |
| `About_05_About_FREE_Foundation.md` | `content/about/about-free-foundation/en.md` | title: "About FREE Foundation"; section: about; status: published |

**Sidebar order for About:** welcome, about-free, about-free-foundation, how-to-engage, a-note-on-this-wiki.

---

## Section: Starter Kit (`content/starter-kit/`)

The sequenced chapter-starting guide. Order matters — these are read in sequence.

| Source File | Destination | Frontmatter notes |
|-------------|-------------|-------------------|
| `F1_What_Is_A_FREE_Chapter.md` | `content/starter-kit/f1-what-is-a-free-chapter/en.md` | title: "What Is a FREE Chapter?"; identifier: f1; section: starter-kit; status: published; version: 0.1 |
| `P1_Seed_Team_Checklist.md` | `content/starter-kit/p1-seed-team-checklist/en.md` | title: "The Seed Team Checklist"; identifier: p1; section: starter-kit; status: published; version: 0.1 |
| `P2_First_Public_Event_Guide.md` | `content/starter-kit/p2-first-public-event-guide/en.md` | title: "First Public Event Guide"; identifier: p2; section: starter-kit; status: published; version: 0.1 |
| `P3_First_General_Assembly_Guide.md` | `content/starter-kit/p3-first-general-assembly-guide/en.md` | title: "First General Assembly Guide"; identifier: p3; section: starter-kit; status: published; version: 0.1 |
| `P4_Second_General_Assembly_Guide.md` | `content/starter-kit/p4-second-general-assembly-guide/en.md` | title: "Second General Assembly Guide"; identifier: p4; section: starter-kit; status: published; version: 0.1 |
| `P5_Stewards_Phase_1_Guide.md` | `content/starter-kit/p5-stewards-phase-1-guide/en.md` | title: "Stewards Phase 1 Guide"; identifier: p5; section: starter-kit; status: published; version: 0.1 |

**Sidebar order for Starter Kit:** f1, p1, p2, p3, p4, p5 (lifecycle sequence).

---

## Section: Reference (`content/reference/`)

Governance guidance documents. These are the "how to adapt" companions. Note: the canonical Code of Conduct and Digital Communication Norms themselves live under the Tulsa chapter (see Chapters section), because the actual content is Tulsa's adopted version. The Reference section holds the adaptation guidance.

| Source File | Destination | Frontmatter notes |
|-------------|-------------|-------------------|
| `R1_Guidance_How_To_Adapt_Code_of_Conduct.md` | `content/reference/code-of-conduct-guidance/en.md` | title: "How to Adapt the Code of Conduct"; identifier: r1-guidance; section: reference; status: published; version: 0.1 |
| `R2_Guidance_How_To_Adapt_Digital_Comms_Norms.md` | `content/reference/digital-comms-norms-guidance/en.md` | title: "How to Adapt the Digital Communication Norms"; identifier: r2-guidance; section: reference; status: published; version: 0.1 |

**Sidebar order for Reference:** code-of-conduct-guidance, digital-comms-norms-guidance.

---

## Section: Chapters (`content/chapters/`)

Chapter-specific content. Tulsa is the only chapter with content right now. The Tulsa overview is the chapter landing page (`_chapter.md`); the canonical governance docs are Tulsa's adopted versions, nested under Tulsa.

| Source File | Destination | Frontmatter notes |
|-------------|-------------|-------------------|
| `Chapter_Tulsa_Overview.md` | `content/chapters/tulsa/_chapter.md` | title: "Tulsa"; chapter: tulsa; section: chapters; status: published; this is the Tulsa landing page |
| `code-of-conduct-v12.md` | `content/chapters/tulsa/code-of-conduct/en.md` | title: "Tulsa Code of Conduct"; chapter: tulsa; section: chapters; status: adopted; version: 1.2 (NOTE: source filename says "v12" but the version is 1.2); adopted_date: 2026-04-26 |
| `digital-communications-norms.md` | `content/chapters/tulsa/digital-comms-norms/en.md` | title: "Tulsa Digital Communication Norms"; chapter: tulsa; section: chapters; status: adopted; version: 1.2; adopted_date: 2026-04-16 |

**Note on the Tulsa governance docs:** these have `status: adopted` (not `published`), since they are Tulsa's formally adopted governance documents. Their frontmatter should include `adapted_from` pointing to the eventual canonical reference, but since no abstracted canonical exists yet, `adapted_from` can be omitted or left as a note for now.

---

## Section: Templates (`content/templates/`)

Empty for now. No source files yet. Create the section/folder so it appears in navigation, with a single placeholder landing page noting that templates (meeting agendas, synopses, sign-up sheets) are coming.

| Source File | Destination | Frontmatter notes |
|-------------|-------------|-------------------|
| (none — create placeholder) | `content/templates/welcome/en.md` | title: "Templates"; section: templates; status: in-progress; body: brief note that recurring-use templates (T-series) are in development and will be added |

---

## Translation Generation

After all English (`en.md`) files are placed, generate translations into: Italian (`it`), Spanish (`es`), Portuguese (`pt`), German (`de`), French (`fr`), Simplified Chinese (`zh-Hans`).

For each English source file, create sibling translation files in the same folder (e.g. `content/starter-kit/f1-what-is-a-free-chapter/it.md`, `.../es.md`, etc.).

Each translation file's frontmatter must include:

```yaml
language: <code>
translation_of: <path to the en.md>
translated_from_version: <version of the English source>
translation_method: ai-generated
human_verified: false
```

And each translation renders a visible disclaimer at the top of the page (handled by the rendering layer based on the frontmatter, not hardcoded into each file).

**Priority for translation (if time-constrained):** Translate the About section and the Starter Kit first (these are what a newcomer or chapter starter reads). The Reference guidance and Tulsa governance docs are lower priority for translation, and per their nature (legally-weighted governance language) are the highest priority for eventual human verification — flag them but they can be translated last or deferred.

**Demo shortcut:** If translating all 16 documents into 6 languages is too slow for the demo timeline, translate a representative subset (e.g. the 5 About docs + F1 + P1) into all 6 languages. That proves the multilingual capability end-to-end and is enough for a compelling demo. The rest can be translated in a follow-up pass.

---

## Cross-Reference Note

Several documents reference each other by identifier (e.g. F1 references P1; P5 references R1, R2, X1, T7; the guidance docs reference the canonical CoC). The internal links in the markdown may use the old naming. The agent should update internal cross-references to match the new paths where feasible, or at minimum ensure they resolve. Some references (X1, T7, R3, P6) point to documents that do not exist yet — these can remain as plain text mentions rather than broken links, since those documents are noted as forthcoming.

---

## Summary: Final content/ Tree

After migration, the structure should look like:

```
content/
├── about/
│   ├── welcome/en.md (+ translations)
│   ├── about-free/en.md (+ translations)
│   ├── about-free-foundation/en.md (+ translations)
│   ├── how-to-engage/en.md (+ translations)
│   └── a-note-on-this-wiki/en.md (+ translations)
├── starter-kit/
│   ├── f1-what-is-a-free-chapter/en.md (+ translations)
│   ├── p1-seed-team-checklist/en.md (+ translations)
│   ├── p2-first-public-event-guide/en.md (+ translations)
│   ├── p3-first-general-assembly-guide/en.md (+ translations)
│   ├── p4-second-general-assembly-guide/en.md (+ translations)
│   └── p5-stewards-phase-1-guide/en.md (+ translations)
├── reference/
│   ├── code-of-conduct-guidance/en.md (+ translations)
│   └── digital-comms-norms-guidance/en.md (+ translations)
├── chapters/
│   └── tulsa/
│       ├── _chapter.md (+ translations)
│       ├── code-of-conduct/en.md (+ translations)
│       └── digital-comms-norms/en.md (+ translations)
└── templates/
    └── welcome/en.md
```
