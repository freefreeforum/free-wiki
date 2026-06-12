# PRD.md — FREE Wiki

**Product Requirements Document**
**v0.1 — Scoped to Phases 1 and 2**

---

## Overview

The FREE Wiki is the public knowledge base for FREE (Forum for Real Economic Emancipation). It publishes the documentation that local chapters use to start and govern themselves. This PRD covers Phase 1 (static wiki + version viewer) and Phase 2 (CMS editing layer). Phase 3 (content governance) is documented separately and explicitly excluded from this build.

---

## Problem Statement

FREE has a growing global network of people who want to start local chapters. They need reliable access to a Starter Kit, governance templates, and chapter examples. The current interim solution (a third-party hosted wiki) has limitations: opaque URLs, per-collection rather than unified public access, weak mobile experience, and no clean way to manage the growing matrix of document translations and chapter-specific variants.

FREE needs a public wiki that is fast, accessible, navigable as a unified whole, mobile-friendly, multilingual, and built on a foundation (git-backed markdown) that the organization controls and can extend over time.

---

## Goals

1. Publish all FREE reference documentation at a clean, memorable URL (a subdomain of freefreeforum.org)
2. Provide unified navigation across the entire wiki, not isolated per-section views
3. Work excellently on mobile, for public (no-login) readers, on slow connections
4. Support multiple languages with clean language switching
5. Distinguish clearly between canonical documents, their translations, and chapter-specific adaptations
6. Let readers view the version history of any document without using git
7. (Phase 2) Let non-technical contributors edit content through a browser, with a review step before changes go live

---

## Non-Goals

- Reader authentication or accounts (the wiki is fully public)
- A content database (git is the source of truth)
- Real-time collaborative editing
- A discussion or commenting system (discussion happens in the separate FREE Discord)
- Multi-signature voting or formal content governance (Phase 3, excluded)
- Per-chapter granular edit permissions (deferred; the Documentation Circle holds editing centrally for now)

---

## Users

**Primary: Chapter starters and members.** People around the world, varied technical skill, often non-native English speakers, frequently on mobile, usually arriving via a public link. They read documentation and need it to be clear and fast.

**Secondary: Content editors (Phase 2).** Documentation Circle members and trusted contributors who create and update wiki content. Some are comfortable with git; many are not. They need a path to edit that does not require technical skill.

**Tertiary: Developers/maintainers.** The volunteer Tech Circle who maintain the wiki. They need a codebase that is simple, standard, and maintainable by part-time contributors.

---

## Functional Requirements

### Phase 1: Static Wiki + Version Viewer

**FR-1: Content rendering.** Render all markdown content from the `content/` directory to a static website, following the structure in the Repo Architecture document (five sections: about, starter-kit, reference, chapters, templates).

**FR-2: Unified navigation.** Display a sidebar showing the full wiki structure. A reader on any page can navigate to any other page. No isolated section views.

**FR-3: Public access.** The entire wiki is publicly accessible at the subdomain with no login. Every page has a stable, shareable URL. URLs are human-readable (e.g. `/starter-kit/f1-what-is-a-free-chapter`), not opaque hashes.

**FR-4: Search.** Full-text search across all wiki content, accessible from anywhere in the wiki.

**FR-5: Mobile responsiveness.** The wiki is fully usable on mobile devices: readable typography, working navigation (collapsible sidebar), no horizontal scrolling, fast load.

**FR-6: Language switching.** For documents that have multiple language versions, the reader can switch languages. The interface clearly indicates which languages are available for a given document. Documents without a translation in the reader's chosen language gracefully fall back to the default (English).

**FR-7: Status indication.** Documents display their status (draft, published, adopted, in-progress, translation) based on frontmatter, so readers understand what they are looking at.

**FR-8: Translation staleness warning.** When a translation's `translated_from_version` is older than the current canonical version, display a non-intrusive notice that the translation may be outdated.

**FR-9: Variant relationship display.** Chapter-specific documents indicate that they are adaptations and (where relevant) link to the canonical document they were adapted from.

**FR-10: Multilingual content with AI-generated translations.** The wiki supports the following initial languages: English (default), Italian, Spanish, Portuguese, German, French, and Simplified Chinese (`zh-Hans`). A language selector at the top of the wiki lets the reader choose their preferred language. Translations are generated from the English canonical via AI at authoring/build time and committed as static markdown files (not translated at runtime). Each AI-generated translation carries `translation_method: ai-generated` and `human_verified: false` in its frontmatter, and the rendered page displays a visible disclaimer at the top stating the translation is machine-generated and unverified, pointing to the English original as authoritative. When a document lacks a translation in the reader's chosen language, it falls back to English.

**FR-11: Custom domain and auto-deploy.** The wiki is served at a subdomain of freefreeforum.org. Pushing a change to the main branch of the git repository automatically rebuilds and redeploys the site.

### Deferred to a Later Phase (Not in MVP)

**Version viewer.** A user-facing interface to browse the git version history of a document, view diffs between versions, and read past versions, all without using git. The architecture supports this (git stores the history), and it can be added later. It is excluded from the MVP to keep the initial build focused.

### Phase 2: CMS Editing Layer

**FR-12: Browser-based editing.** A git-backed CMS (Decap or Tina) provides a browser interface for creating and editing content. Editors do not use git directly.

**FR-13: Structured content creation.** When an editor creates or edits a document, the CMS produces a correctly-structured markdown file: proper frontmatter per the schema, correct folder location, correct naming. The editor is guided to provide required metadata (title, language, status, etc.).

**FR-14: Editor authentication.** Editors authenticate to access the CMS (via GitHub OAuth or email-based auth, depending on the chosen CMS). Reading the wiki requires no authentication; editing does.

**FR-15: Review workflow.** Editor changes create pull requests rather than committing directly to the main branch. A reviewer with merge authority reviews and approves before the change goes live. (In Phase 2, review is a single trusted approver; this is the lightweight precursor to any future governance.)

---

## Non-Functional Requirements

**NFR-1: Performance.** Pages load quickly on mobile and slow connections. Target: meaningful content visible in under 2 seconds on a typical mobile connection.

**NFR-2: Accessibility.** Meets WCAG 2.1 AA where feasible: semantic HTML, keyboard navigation, screen-reader support, sufficient contrast, scalable text.

**NFR-3: Maintainability.** The codebase is simple and standard enough for a part-time volunteer Tech Circle to maintain. Favor well-documented, widely-used tools over clever custom solutions.

**NFR-4: Portability.** Content remains portable markdown. The wiki could be migrated to a different rendering platform without rewriting content.

**NFR-5: Internationalization-ready.** The layout and components support multiple languages, including the future possibility of right-to-left languages, without hardcoded English assumptions.

**NFR-6: Reliability.** The site stays up. Static hosting with a CDN (via Vercel or Netlify) provides this by default. Content is backed up by virtue of being in git.

---

## Content Structure Reference

The content structure, frontmatter schema, and the translation-vs-variant model are fully specified in `FREE_Wiki_Repo_Architecture.md`. That document is authoritative for all content-structure questions. Summary:

- Five sections under `content/`: about, starter-kit, reference, chapters, templates
- Documents identified by prefix and slug (e.g. `f1-what-is-a-free-chapter`)
- Translations live as language-coded files within a document folder (`en.md`, `de.md`)
- Chapter variants live under `chapters/<chapter>/` with frontmatter linking to the canonical they adapted
- Frontmatter carries title, identifier, section, language, status, version, dates, and translation/variant relationship fields

---

## Technical Stack (Recommended, Not Mandated)

These are recommendations; the implementing agent or Tech Circle may choose alternatives if better suited, but should favor standard, maintainable options.

- **Static site framework:** Astro Starlight (recommended for clean public docs with strong built-in i18n, language switching, and search). Its native internationalization support is a primary reason for the recommendation. Alternatives: Docusaurus, MkDocs Material.
- **Hosting/deploy:** Vercel or Netlify (auto-deploy on git push, custom domain, CDN).
- **Git host:** GitHub (broadest tooling and CMS compatibility).
- **CMS (Phase 2):** Decap CMS or Tina CMS (both git-backed, both support PR-based workflows).
- **Translation generation:** A build-time or authoring-time script that calls an AI translation API (e.g. the Anthropic API) to translate English canonical files into the target languages, stamps the unverified-translation frontmatter and disclaimer, and writes the results as static files. Translations are NOT generated at runtime.

---

## Success Criteria

**Phase 1 is successful when:**
- All current FREE documentation is published and readable at the subdomain
- A reader can navigate the entire wiki from a unified sidebar
- The wiki works well on mobile with no login
- A language selector lets the reader choose among the supported languages
- AI-generated translations display with the required unverified-translation disclaimer
- A document with no translation in the chosen language falls back to English
- Pushing to git auto-deploys the updated site

**Phase 2 is successful when:**
- A non-technical contributor can edit a document through the CMS without using git
- Their edit creates a pull request
- A reviewer can approve, and the approved change deploys
- The CMS produces correctly-structured content files matching the architecture

---

## Explicit Scope Boundary

This build covers Phases 1 and 2. It must not implement Phase 3 (content governance, multi-signature voting, or any formal approval gate beyond single-reviewer PR merge). The architecture must leave room for Phase 3 to be added later — ideally by routing through Hypha, per the roadmap — while excluding it from the current build. If any requirement seems to demand governance/voting functionality, that is a signal to stop and confirm scope rather than build it.

---

## A Note on This Document

This is v0.1, scoped to Phases 1 and 2 of the FREE Wiki. It should be read alongside `FREE_Wiki_Repo_Architecture.md` (authoritative on content structure) and `FREE_Wiki_Phased_Roadmap.md` (authoritative on phasing). It will be revised as the build progresses and as the Tech Circle engages.
