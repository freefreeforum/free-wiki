// sync-content.mjs — project the portable source of truth in `content/` into
// the layout Astro Starlight expects under `src/content/docs/`.
//
// Why this exists: the architecture (docs/FREE_Wiki_Repo_Architecture.md) stores
// each document as a folder with one file per language (en.md, it.md, ...),
// which keeps content portable and platform-independent. Starlight's i18n,
// however, expects one directory tree per locale (<locale>/<path>.md). This
// script is the deterministic, build-time bridge between the two. It is run
// automatically before `dev` and `build` (see package.json), and it never
// edits `content/` — that stays the human-editable source.
//
// Mapping:
//   content/about/welcome/en.md        -> src/content/docs/about/welcome.md
//   content/about/welcome/it.md        -> src/content/docs/it/about/welcome.md
//   content/chapters/tulsa/_chapter.md -> src/content/docs/chapters/tulsa.md
//
// The disclaimer/badges are NOT injected here; they are rendered from
// frontmatter by src/components/PageTitle.astro. This script only carries the
// frontmatter across and stamps `canonical_version` onto translations so the
// staleness check can stay synchronous.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const DOCS = join(ROOT, 'src', 'content', 'docs');

const SECTIONS = ['about', 'starter-kit', 'reference', 'chapters', 'templates'];
const LOCALES = ['en', 'it', 'es', 'pt', 'de', 'fr', 'zh-Hans'];
const NON_ROOT_LOCALES = LOCALES.filter((l) => l !== 'en');

// --- Discover every content file -----------------------------------------
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

// Parse a content file path into { slug, locale }.
//   .../about/welcome/en.md         -> slug 'about/welcome',   locale 'en'
//   .../about/welcome/zh-Hans.md    -> slug 'about/welcome',   locale 'zh-Hans'
//   .../chapters/tulsa/_chapter.md  -> slug 'chapters/tulsa',  locale 'en'
//   .../chapters/tulsa/_chapter.it.md -> slug 'chapters/tulsa', locale 'it'
function classify(absPath) {
  const rel = relative(CONTENT, absPath).split(sep).join('/');
  const parts = rel.split('/');
  const file = parts.pop();

  if (file === '_chapter.md') return { slug: parts.join('/'), locale: 'en' };
  const chapterMatch = file.match(/^_chapter\.([\w-]+)\.md$/);
  if (chapterMatch) return { slug: parts.join('/'), locale: chapterMatch[1] };

  const locale = file.replace(/\.md$/, '');
  if (!LOCALES.includes(locale)) {
    throw new Error(
      `Unexpected content file "${rel}". Expected <locale>.md (one of ${LOCALES.join(', ')}) or _chapter[.<locale>].md`
    );
  }
  return { slug: parts.join('/'), locale };
}

// --- Build the frontmatter Starlight will consume ------------------------
// Preserve a stable, legible key order. Strings that look like numbers (e.g.
// version "1.2") are kept as strings by the YAML serializer.
const FM_ORDER = [
  'title',
  'identifier',
  'section',
  'language',
  'status',
  'version',
  'last_updated',
  'chapter',
  'adopted_date',
  'adapted_from',
  'adapted_from_version',
  'translation_of',
  'translated_from_version',
  'translation_method',
  'human_verified',
  'canonical_version',
];

function orderFrontmatter(data) {
  const out = {};
  for (const key of FM_ORDER) if (data[key] !== undefined) out[key] = data[key];
  // carry anything unexpected through, too, so nothing is silently lost
  for (const [k, v] of Object.entries(data)) if (!(k in out)) out[k] = v;
  return out;
}

// Emit a single YAML scalar. Dates are normalized to YYYY-MM-DD and quoted, and
// number-looking strings (e.g. version "1.2") are quoted, so Astro's frontmatter
// parser keeps everything as the string type our schema expects.
function scalar(v) {
  if (v instanceof Date) return JSON.stringify(v.toISOString().slice(0, 10));
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  const s = String(v);
  if (
    /^\d{4}-\d{2}-\d{2}/.test(s) || // date-like
    /^[\d.]+$/.test(s) || // number-like (version)
    /[:#?'"\[\]{}&*!|>%@`]/.test(s) ||
    /^\s|\s$/.test(s) ||
    s === ''
  ) {
    return JSON.stringify(s);
  }
  return s;
}

function serialize(data, body) {
  const ordered = orderFrontmatter(data);
  const lines = ['---'];
  for (const [k, v] of Object.entries(ordered)) {
    if (v === undefined || v === null) continue;
    lines.push(`${k}: ${scalar(v)}`);
  }
  lines.push('---');
  return `${lines.join('\n')}\n\n${body.trim()}\n`;
}

// --- Run ------------------------------------------------------------------
const files = walk(CONTENT).map((p) => ({ path: p, ...classify(p) }));

// Index English canonical versions by slug so translations can be stamped with
// the current canonical version (powers the staleness notice, FR-8).
const canonicalVersion = {};
for (const f of files) {
  if (f.locale !== 'en') continue;
  const { data } = matter(readFileSync(f.path, 'utf8'));
  if (data.version) canonicalVersion[f.slug] = String(data.version);
}

// Clean only the directories this script manages; leave hand-authored pages
// (e.g. src/content/docs/index.mdx) untouched. Remove both the original-case
// and lowercase locale dirs so a rename (e.g. zh-Hans -> zh-hans) leaves nothing
// stale behind.
for (const section of SECTIONS) rmSync(join(DOCS, section), { recursive: true, force: true });
for (const loc of NON_ROOT_LOCALES) {
  rmSync(join(DOCS, loc), { recursive: true, force: true });
  rmSync(join(DOCS, loc.toLowerCase()), { recursive: true, force: true });
}

let written = 0;
for (const f of files) {
  const { data, content } = matter(readFileSync(f.path, 'utf8'));
  if (!data.title) throw new Error(`Missing required "title" in ${relative(ROOT, f.path)}`);

  // Stamp the canonical version onto translations for the staleness check.
  if (f.locale !== 'en' && canonicalVersion[f.slug]) {
    data.canonical_version = canonicalVersion[f.slug];
  }

  // Locale directory is lowercased to match Starlight's lowercase locale keys
  // (see astro.config.mjs). The content/ filename keeps its canonical casing
  // (e.g. zh-Hans.md); only the generated Starlight path is normalized.
  const outPath =
    f.locale === 'en'
      ? join(DOCS, `${f.slug}.md`)
      : join(DOCS, f.locale.toLowerCase(), `${f.slug}.md`);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, serialize(data, content), 'utf8');
  written++;
}

console.log(`Synced ${written} file(s) from content/ -> src/content/docs/`);
