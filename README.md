# FREE Wiki

The public knowledge base for **FREE** (the Forum for Real Economic Emancipation) —
a fast, accessible, multilingual static site built with [Astro Starlight](https://starlight.astro.build/).

It publishes the Starter Kit, governance templates, chapter adaptations, and reusable
templates that local chapters use to start and govern themselves.

---

## How it's organized (the important idea)

Content and code are **separate concerns**, and they live in separate places:

| Path | What it is | Who edits it |
|------|------------|--------------|
| `content/` | The wiki's documents — plain Markdown, the portable source of truth | Editors |
| `config/` | Editorial `navigation.yaml` (sidebar) and `languages.yaml` (languages) | Editors |
| `src/` | The web app (Astro/Starlight, components, styles) | Developers |
| `scripts/` | Build/authoring scripts (content sync, translation) | Developers |
| `public/` | Static assets (images, logos) | Either |

Each document is a **folder with one file per language**, e.g.:

```
content/starter-kit/f1-what-is-a-free-chapter/
├── en.md        # English canonical (authoritative)
├── it.md        # Italian (AI-generated)
├── es.md        # Spanish (AI-generated)
└── …
```

Chapter adaptations live under `content/chapters/<chapter>/`, and the chapter
landing page is `_chapter.md`. This structure and the frontmatter schema are
defined in `docs/FREE_Wiki_Repo_Architecture.md` — read that before changing how
content is structured.

### Why there's a "sync" step

Starlight's built-in internationalization expects one directory tree per language
(`src/content/docs/<locale>/…`). Our portable source of truth instead keeps one
file per language inside each document folder. `scripts/sync-content.mjs` bridges
the two: it projects `content/` into the layout Starlight expects under
`src/content/docs/`. **It runs automatically before `dev` and `build`** — you
rarely call it by hand. Never edit `src/content/docs/` directly; it is generated.

The machine-translation disclaimer, status badges, translation-staleness notice,
and chapter-variant note are all rendered from frontmatter by
`src/components/PageTitle.astro` — never hardcoded into any document.

---

## Running it locally

Requires Node 18+.

```bash
npm install
npm run dev          # http://localhost:4321  (runs sync-content first)
```

Other commands:

```bash
npm run build        # production build to dist/ (runs sync-content first)
npm run preview      # preview the production build locally
npm run sync-content # regenerate src/content/docs/ from content/ by hand
```

Full-text search (Pagefind) is built into the production output; run
`npm run build && npm run preview` to exercise it as readers will.

---

## Translations

Translations are **AI-generated at authoring time and committed as static files**
— never translated at runtime. Each carries `translation_method: ai-generated`
and `human_verified: false`, and the page shows a visible disclaimer pointing
readers to the authoritative English original.

Generate them with the Anthropic API (set `ANTHROPIC_API_KEY` in `.env` first):

```bash
node scripts/translate.mjs          # demo subset: 5 About docs + F1 + P1, all 6 languages
node scripts/translate.mjs all      # every English doc, all 6 languages
node scripts/translate.mjs all --force   # re-translate (overwrite existing)
```

When the English canonical changes, re-run translation for that document. The
`translated_from_version` field makes stale translations visible in the UI.

When a human verifies a translation, set `human_verified: true` (and typically
`translation_method: ai-then-human`) in that file's frontmatter; the disclaimer
then no longer appears.

> Governance text (the Tulsa Code of Conduct and Digital Communication Norms) is
> the **highest priority for human verification** because of its legally-weighted
> language — translate it last, and have a fluent human review it.

---

## Deploying (Vercel)

This is a static site. On Vercel, import the repo and accept the auto-detected
Astro preset (build command `npm run build`, output directory `dist`). Pushing to
`main` rebuilds and redeploys. Point the production subdomain (a subdomain of
`freefreeforum.org`) at the deployment, and set `site` in `astro.config.mjs` to
match. The Anthropic key is only needed to *generate* translations, not to build
or serve the site, so it does not need to be set in Vercel.

---

## What's intentionally not here

Per the project roadmap, this build is Phase 1 (static wiki). Deliberately excluded:

- **Version viewer** (browsing git history/diffs in the UI) — deferred.
- **CMS editing layer** (Phase 2) — comes next; the git-backed structure is ready for it.
- **Governance / voting** (Phase 3) — out of scope; do not build it.

See `PRD.md`, `CLAUDE.md`, and `docs/` for the full specification.
