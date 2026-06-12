// One-time migration: _source_content/ -> content/ following
// docs/FREE_Wiki_Content_Migration_Manifest.md exactly.
//
// For each source file we strip the leading H1 (Starlight renders the title
// from frontmatter, so a body H1 would duplicate it), then prepend the
// manifest-specified YAML frontmatter. Re-running is safe (it overwrites
// destinations). After migration, content/ is the editable source of truth.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, '_source_content');
const OUT = join(ROOT, 'content');

// last_updated for the drafted/published docs = migration date.
const MIGRATION_DATE = '2026-06-12';

// Each entry maps one source file to its destination and frontmatter.
// `fm` keys are emitted in this order to keep frontmatter legible.
const MAP = [
  // --- About ---
  {
    src: 'About_01_Welcome_to_the_FREE_Wiki.md',
    dest: 'about/welcome/en.md',
    fm: { title: 'Welcome to the FREE Wiki', section: 'about', language: 'en', status: 'published', last_updated: MIGRATION_DATE },
  },
  {
    src: 'About_02_About_FREE.md',
    dest: 'about/about-free/en.md',
    fm: { title: 'About FREE', section: 'about', language: 'en', status: 'published', last_updated: MIGRATION_DATE },
  },
  {
    src: 'About_03_How_to_Engage_with_FREE.md',
    dest: 'about/how-to-engage/en.md',
    fm: { title: 'How to Engage with FREE', section: 'about', language: 'en', status: 'published', last_updated: MIGRATION_DATE },
  },
  {
    src: 'About_04_A_Note_on_This_Wiki.md',
    dest: 'about/a-note-on-this-wiki/en.md',
    fm: { title: 'A Note on This Wiki', section: 'about', language: 'en', status: 'published', last_updated: MIGRATION_DATE },
  },
  {
    src: 'About_05_About_FREE_Foundation.md',
    dest: 'about/about-free-foundation/en.md',
    fm: { title: 'About FREE Foundation', section: 'about', language: 'en', status: 'published', last_updated: MIGRATION_DATE },
  },

  // --- Starter Kit ---
  {
    src: 'F1_What_Is_A_FREE_Chapter.md',
    dest: 'starter-kit/f1-what-is-a-free-chapter/en.md',
    fm: { title: 'What Is a FREE Chapter?', identifier: 'f1', section: 'starter-kit', language: 'en', status: 'published', version: '0.1', last_updated: MIGRATION_DATE },
  },
  {
    src: 'P1_Seed_Team_Checklist.md',
    dest: 'starter-kit/p1-seed-team-checklist/en.md',
    fm: { title: 'The Seed Team Checklist', identifier: 'p1', section: 'starter-kit', language: 'en', status: 'published', version: '0.1', last_updated: MIGRATION_DATE },
  },
  {
    src: 'P2_First_Public_Event_Guide.md',
    dest: 'starter-kit/p2-first-public-event-guide/en.md',
    fm: { title: 'First Public Event Guide', identifier: 'p2', section: 'starter-kit', language: 'en', status: 'published', version: '0.1', last_updated: MIGRATION_DATE },
  },
  {
    src: 'P3_First_General_Assembly_Guide.md',
    dest: 'starter-kit/p3-first-general-assembly-guide/en.md',
    fm: { title: 'First General Assembly Guide', identifier: 'p3', section: 'starter-kit', language: 'en', status: 'published', version: '0.1', last_updated: MIGRATION_DATE },
  },
  {
    src: 'P4_Second_General_Assembly_Guide.md',
    dest: 'starter-kit/p4-second-general-assembly-guide/en.md',
    fm: { title: 'Second General Assembly Guide', identifier: 'p4', section: 'starter-kit', language: 'en', status: 'published', version: '0.1', last_updated: MIGRATION_DATE },
  },
  {
    src: 'P5_Stewards_Phase_1_Guide.md',
    dest: 'starter-kit/p5-stewards-phase-1-guide/en.md',
    fm: { title: 'Stewards Phase 1 Guide', identifier: 'p5', section: 'starter-kit', language: 'en', status: 'published', version: '0.1', last_updated: MIGRATION_DATE },
  },

  // --- Reference (adaptation guidance) ---
  {
    src: 'R1_Guidance_How_To_Adapt_Code_of_Conduct.md',
    dest: 'reference/code-of-conduct-guidance/en.md',
    fm: { title: 'How to Adapt the Code of Conduct', identifier: 'r1-guidance', section: 'reference', language: 'en', status: 'published', version: '0.1', last_updated: MIGRATION_DATE },
  },
  {
    src: 'R2_Guidance_How_To_Adapt_Digital_Comms_Norms.md',
    dest: 'reference/digital-comms-norms-guidance/en.md',
    fm: { title: 'How to Adapt the Digital Communication Norms', identifier: 'r2-guidance', section: 'reference', language: 'en', status: 'published', version: '0.1', last_updated: MIGRATION_DATE },
  },

  // --- Chapters: Tulsa ---
  {
    src: 'Chapter_Tulsa_Overview.md',
    dest: 'chapters/tulsa/_chapter.md',
    fm: { title: 'Tulsa', chapter: 'tulsa', section: 'chapters', language: 'en', status: 'published', last_updated: MIGRATION_DATE },
  },
  {
    // NOTE: source filename says "v12" but the editorial version is 1.2.
    src: 'code-of-conduct-v12.md',
    dest: 'chapters/tulsa/code-of-conduct/en.md',
    fm: { title: 'Tulsa Code of Conduct', chapter: 'tulsa', section: 'chapters', language: 'en', status: 'adopted', version: '1.2', adopted_date: '2026-04-26', last_updated: '2026-04-26' },
  },
  {
    src: 'digital-communications-norms.md',
    dest: 'chapters/tulsa/digital-comms-norms/en.md',
    fm: { title: 'Tulsa Digital Communication Norms', chapter: 'tulsa', section: 'chapters', language: 'en', status: 'adopted', version: '1.2', adopted_date: '2026-04-16', last_updated: '2026-04-16' },
  },
];

// Emit a YAML scalar, quoting when needed so e.g. version 1.2 and titles with
// "?" stay strings and dates stay unquoted ISO.
function yamlValue(v) {
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // ISO date, leave bare
  if (/[:#?'"\[\]{}&*!|>%@`]/.test(s) || /^\s|\s$/.test(s) || /^[\d.]+$/.test(s)) {
    return JSON.stringify(s); // double-quote
  }
  return s;
}

function buildFrontmatter(fm) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) lines.push(`${k}: ${yamlValue(v)}`);
  lines.push('---');
  return lines.join('\n');
}

// Strip a single leading H1 ("# ...") plus the blank line after it.
function stripLeadingH1(body) {
  const lines = body.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++; // skip leading blanks
  if (i < lines.length && /^#\s+/.test(lines[i])) {
    i++;
    while (i < lines.length && lines[i].trim() === '') i++; // collapse blanks after H1
  }
  return lines.slice(i).join('\n').trimEnd();
}

let count = 0;
for (const { src, dest, fm } of MAP) {
  const raw = readFileSync(join(SRC, src), 'utf8');
  const body = stripLeadingH1(raw);
  const out = `${buildFrontmatter(fm)}\n\n${body}\n`;
  const destPath = join(OUT, dest);
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, out, 'utf8');
  console.log(`  ${src}  ->  content/${dest}`);
  count++;
}
console.log(`\nMigrated ${count} English files into content/.`);
