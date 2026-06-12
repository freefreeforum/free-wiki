# CLAUDE.md — FREE Wiki

This file guides AI coding agents working on the FREE Wiki. Read it before making changes.

---

## What This Project Is

The FREE Wiki is the public knowledge base for FREE (Forum for Real Economic Emancipation), a participatory assembly and organizing network. The wiki publishes reference documentation that local chapters use to start and govern themselves: a Starter Kit, governance templates, chapter-specific adaptations, and reusable templates.

The wiki serves a global audience, many of whom are non-native English speakers reading on mobile devices, often via public links with no login. Clarity, speed, accessibility, and clean navigation matter more than visual flourish.

---

## Architecture in Brief

Content lives as markdown files in `content/`, organized into five sections (about, starter-kit, reference, chapters, templates). The web app in `src/` renders this content to a static site. Git is the source of truth for all content and all version history.

The full architecture is documented in `FREE_Wiki_Repo_Architecture.md`. Read it before touching content structure, frontmatter, or the translation/variant model. Do not invent a different content structure; follow the one defined there.

---

## Scope of the Current Build (Phases 1 and 2)

**Phase 1 — Static wiki.** Render content to a clean public site with unified navigation, search, status badges, and multilingual support. Supported languages: English (default), Italian, Spanish, Portuguese, German, French, Simplified Chinese. A language selector at the top of the wiki lets readers choose their language.

**Multilingual approach (important):** Translations are AI-generated from the English canonical at authoring/build time and committed as static files. They are NOT translated at runtime. Each AI-generated translation carries `translation_method: ai-generated` and `human_verified: false` in frontmatter, and renders a visible disclaimer at the top stating it is machine-generated and unverified, pointing to the English original as authoritative.

**Time boundary on multilingual:** Implement multilingual support via the static-file approach (generate translation files, let the static-site framework render them) only if it fits the build timeline. Astro Starlight's built-in i18n makes this fast. If runtime translation or any unexpected complexity threatens the timeline, fall back to English-only — the architecture supports adding languages later without restructuring. NEVER build runtime/on-the-fly translation for the MVP.

**Phase 2 — CMS editing layer.** Integrate a git-backed CMS (Decap or Tina) so non-technical contributors can edit content through a browser. Edits create pull requests for review rather than committing directly to main.

**Deferred (not in MVP): version viewer.** A UI to browse git history and diffs is explicitly excluded from the MVP. The architecture leaves room for it; do not build it now.

**Out of scope: Phase 3 (content governance / voting).** Do not build any voting, multi-signature approval, or governance-gate functionality. The architecture should leave room for it, while excluding it from this build. If a task seems to require it, stop and flag it rather than building it.

The full phasing is in `FREE_Wiki_Phased_Roadmap.md`.

---

## Technical Principles

**Content and code are separate concerns.** Anything under `content/` is editorial content. Anything under `src/` is application code. Do not mix them. A change to how the site looks should not require touching content files, and a change to a document should not require touching application code.

**Markdown stays portable.** Content files are plain markdown with YAML frontmatter. Do not introduce proprietary syntax, framework-specific components embedded in content, or anything that would make the content hard to migrate to a different platform later. If a document needs a special rendering feature, handle it in the rendering layer, not by polluting the markdown.

**Frontmatter is the contract.** The web app reads frontmatter (title, language, status, version, translation/variant relationships) to build navigation, badges, and warnings. Follow the frontmatter schema in the architecture doc exactly. If a field is missing or malformed, fail loudly during build rather than silently rendering something wrong.

**Git history must stay meaningful.** The version viewer surfaces commit messages to users as change descriptions. Commit messages must be human-readable and descriptive. Follow the commit convention below.

**Build-time over runtime where possible.** Prefer generating things at build time (when the site is built and deployed) over querying at runtime. The wiki's update frequency is low, so a rebuild-on-change model is simpler and more robust than live queries. The version viewer, in particular, should read git history at build time and bake it into the site.

**Accessibility is not optional.** Semantic HTML, keyboard navigation, screen-reader support, sufficient contrast, and readable typography. The audience includes people with disabilities and people on low-end devices.

**Internationalization is first-class.** Language switching must work cleanly. Right-to-left language support should be possible even if no RTL language is configured yet. Do not hardcode English assumptions into the layout.

---

## Commit Message Convention

Because commit messages become user-facing change descriptions in the version viewer, they must be clear:

- Write in plain language describing what changed and why
- Start with the affected document or area: `F1: clarify Foundation vs Chapter distinction`
- Avoid jargon, ticket numbers, or developer shorthand in content commits
- For content changes specifically, the message should make sense to a non-technical reader browsing version history

Examples of good content commit messages:
- `Code of Conduct: add section on online harassment`
- `P2: update event cost figures to reflect Tulsa experience`
- `Add German translation of Digital Communication Norms`

Examples to avoid:
- `fix` / `update` / `wip`
- `resolve PR #42`
- `tweaks per feedback`

---

## What Good Looks Like

A reader lands on the wiki via a public link, with no login. The site loads fast, even on mobile, even on a slow connection. The sidebar shows the full structure; they can navigate anywhere. They find a document, read it, switch it to their language if a translation exists, and check how it has changed over time through a friendly version interface. They never see a 404, never hit a login wall, never encounter a broken link between documents.

A Documentation Circle member (phase 2) opens the CMS, edits a document through a clean interface, and submits it. Their change becomes a pull request. A reviewer approves it. The site updates. The contributor never had to learn git.

---

## What to Avoid

- Do not build authentication for readers. The wiki is public.
- Do not store content in a database. Git is the source of truth.
- Do not use browser localStorage or sessionStorage for content or state that should persist; the architecture is git-backed and stateless on the client.
- Do not build the phase 3 governance/voting system. Flag it if a task seems to need it.
- Do not break the content/code separation.
- Do not introduce content structure that diverges from the architecture doc.
- Do not optimize for visual impressiveness at the cost of speed, accessibility, or clarity.

---

## When Uncertain

If a task is ambiguous, or seems to require something out of scope (especially anything resembling phase 3 governance), stop and ask rather than guessing. The phasing discipline matters: building ahead of need is the main risk this project is structured to avoid.

If a decision is genuinely a judgment call within scope (which static-site framework, how to structure a component), prefer the simpler, more standard, more portable option. This project will be maintained by a small volunteer Tech Circle, not a dedicated engineering team. Favor solutions that a part-time volunteer can understand and maintain.
