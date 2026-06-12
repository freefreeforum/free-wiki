// translate.mjs — generate AI translations of the English canonical content.
//
// Reads each English `en.md` under content/, calls the Anthropic API to
// translate the title + body into the target languages, and writes sibling
// files (content/<doc>/<lang>.md) stamped with the unverified-translation
// frontmatter the rendering layer keys off of. Translations are generated here
// at authoring time and committed as static files — never at runtime.
//
// Usage:
//   node scripts/translate.mjs            # demo subset (5 About + F1 + P1) x 6 langs
//   node scripts/translate.mjs all        # all 16 English docs x 6 langs
//   node scripts/translate.mjs --force    # re-translate even if the file exists
//   (flags combine, e.g. `node scripts/translate.mjs all --force`)

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const MODEL = 'claude-opus-4-8';
// This org is on a low tier (4,000 output tokens/min, 10,000 input/min,
// 5 requests/min — identical across models). So: run serially, keep each
// request's max_tokens under the per-minute output budget (a request whose
// max_tokens exceeds the remaining budget is rejected upfront), and lean on
// the SDK's automatic 429 backoff (honoring retry-after) to pace the rest.
const CONCURRENCY = 1;
const MAX_TOKENS = 3800; // < 4,000 OTPM so requests are admitted
const TODAY = '2026-06-12';

// Target languages (English is the canonical source, not a target).
const LANGUAGES = [
  { code: 'it', name: 'Italian' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'zh-Hans', name: 'Simplified Chinese' },
];

// The demo subset proves the multilingual capability end to end without
// translating all 16 docs (per the migration manifest's demo shortcut).
const DEMO_SLUGS = new Set([
  'about/welcome',
  'about/about-free',
  'about/about-free-foundation',
  'about/how-to-engage',
  'about/a-note-on-this-wiki',
  'starter-kit/f1-what-is-a-free-chapter',
  'starter-kit/p1-seed-team-checklist',
]);

const args = process.argv.slice(2);
const doAll = args.includes('all');
const force = args.includes('--force');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set. Add it to .env, then re-run.');
  process.exit(1);
}
// maxRetries high so the SDK rides out the tight rate limit via 429 backoff.
const client = new Anthropic({ maxRetries: 10 });

// --- Find English canonical files -----------------------------------------
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (name === 'en.md') acc.push(full);
  }
  return acc;
}

function slugOf(enPath) {
  return relative(CONTENT, dirname(enPath)).split(sep).join('/');
}

// --- Frontmatter serialization (mirror of sync-content.mjs) ----------------
function scalar(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s) || /^[\d.]+$/.test(s) || /[:#?'"\[\]{}&*!|>%@`]/.test(s) || /^\s|\s$/.test(s) || s === '') {
    return JSON.stringify(s);
  }
  return s;
}

function buildTranslationFile(en, lang, translatedTitle, translatedBody) {
  const fm = {
    title: translatedTitle,
    identifier: en.data.identifier,
    section: en.data.section,
    language: lang.code,
    status: 'translation',
    translation_of: `${en.slug}/en.md`,
    translated_from_version: en.data.version,
    translation_method: 'ai-generated',
    human_verified: false,
    last_updated: TODAY,
  };
  const lines = ['---'];
  for (const [k, v] of Object.entries(fm)) {
    if (v === undefined || v === null) continue;
    lines.push(`${k}: ${scalar(v)}`);
  }
  lines.push('---');
  return `${lines.join('\n')}\n\n${translatedBody.trim()}\n`;
}

// --- Translation call ------------------------------------------------------
const SYSTEM = `You are an expert translator localizing a public civic-organizing knowledge base (the "FREE Wiki") for a global audience, much of it reading on mobile and in their second language. Your translations must be faithful, natural, and clear.

Rules:
- Preserve the Markdown structure EXACTLY: heading levels, list markers, bold/italic, blockquotes, tables, and link syntax. Translate the visible text, never the structure.
- Do NOT translate: URLs, code, document identifiers (e.g. F1, P1, P5, R1), or the project/organization names "FREE" and "FREE Foundation".
- Keep place names and personal names as in the source (e.g. "Tulsa"), but translate descriptive words around them.
- Render the political and organizing vocabulary in the register a real local chapter in the target language would use — precise, plain, not machine-stiff.
- Output ONLY the translation in the exact envelope requested. No preamble, no explanation, no code fences.`;

function userPrompt(lang, title, body) {
  return `Translate the following document into ${lang.name}.

Respond in EXACTLY this format and nothing else:
TITLE: <the translated title on a single line>
<<<BODY>>>
<the translated Markdown body>

The title to translate is:
${title}

The Markdown body to translate is:
${body}`;
}

function parseEnvelope(text) {
  let t = text.trim();
  // Strip an accidental wrapping code fence, if any.
  if (t.startsWith('```')) t = t.replace(/^```[^\n]*\n/, '').replace(/\n```\s*$/, '').trim();
  const marker = t.indexOf('<<<BODY>>>');
  if (marker === -1) throw new Error('translation envelope missing <<<BODY>>> marker');
  const head = t.slice(0, marker).trim();
  const body = t.slice(marker + '<<<BODY>>>'.length).replace(/^\n+/, '');
  const m = head.match(/^TITLE:\s*(.+)$/m);
  if (!m) throw new Error('translation envelope missing TITLE line');
  return { title: m[1].trim(), body };
}

function textOf(msg) {
  return msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

// Translate one doc into one language. Because the per-request output cap
// (MAX_TOKENS) is forced low by the rate limit, a long translation can stop at
// `max_tokens`; we then continue it across follow-up requests and concatenate,
// so the output is never silently truncated.
async function translateOne(en, lang) {
  const messages = [{ role: 'user', content: userPrompt(lang, en.data.title, en.body) }];
  let full = '';
  for (let turn = 0; turn < 6; turn++) {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      messages,
    });
    full += textOf(msg);
    if (msg.stop_reason !== 'max_tokens') break;
    // Hit the per-request cap mid-translation — ask it to continue.
    messages.push({ role: 'assistant', content: msg.content });
    messages.push({
      role: 'user',
      content: 'Continue the translation exactly where you left off. Do not repeat any text already produced, and do not add commentary.',
    });
  }
  const { title, body } = parseEnvelope(full);
  const outPath = join(CONTENT, en.slug, `${lang.code}.md`);
  writeFileSync(outPath, buildTranslationFile(en, lang, title, body), 'utf8');
  return outPath;
}

// --- Simple concurrency pool ----------------------------------------------
async function runPool(tasks, limit) {
  let i = 0;
  let done = 0;
  const total = tasks.length;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      const { label, run } = tasks[idx];
      try {
        const out = await run();
        done++;
        console.log(`  [${done}/${total}] ${label} -> ${relative(ROOT, out)}`);
      } catch (err) {
        done++;
        console.error(`  [${done}/${total}] FAILED ${label}: ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, total) }, worker));
}

// --- Run -------------------------------------------------------------------
const englishFiles = walk(CONTENT).map((p) => {
  const parsed = matter(readFileSync(p, 'utf8'));
  return { path: p, slug: slugOf(p), data: parsed.data, body: parsed.content };
});

const selected = englishFiles.filter((en) => (doAll ? true : DEMO_SLUGS.has(en.slug)));

const tasks = [];
for (const en of selected) {
  for (const lang of LANGUAGES) {
    const outPath = join(CONTENT, en.slug, `${lang.code}.md`);
    if (!force && existsSync(outPath)) continue;
    tasks.push({ label: `${en.slug} -> ${lang.code}`, run: () => translateOne(en, lang) });
  }
}

console.log(
  `Translating ${selected.length} doc(s) into ${LANGUAGES.length} languages ` +
    `(${tasks.length} file(s) to generate)${doAll ? '' : ' [demo subset]'}...`
);
if (tasks.length === 0) {
  console.log('Nothing to do (all target files already exist; use --force to regenerate).');
  process.exit(0);
}
await runPool(tasks, CONCURRENCY);
console.log('Done.');
