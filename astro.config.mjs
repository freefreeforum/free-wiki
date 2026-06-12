// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const read = (rel) =>
  parseYaml(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'));

// --- Languages (config/languages.yaml) -> Starlight i18n locales ---------
// English is the root locale (served at /...); every other language is served
// under its code (/it/..., /es/..., etc.). Missing translations fall back to
// English automatically (Starlight default), satisfying FR-6 / FR-10.
const { languages } = read('./config/languages.yaml');
const locales = {};
for (const lang of languages) {
  // Starlight locale keys (and therefore URL paths and content directories)
  // must be lowercase — Astro lowercases route segments, so a mixed-case key
  // like "zh-Hans" would never match its own pages. The BCP-47 tag with the
  // correct script subtag still goes in `lang` (e.g. lang: "zh-Hans").
  const entry = { label: lang.name, lang: lang.code, dir: lang.direction || 'ltr' };
  if (lang.default) locales.root = entry;
  else locales[lang.code.toLowerCase()] = entry;
}

// --- Navigation (config/navigation.yaml) -> Starlight sidebar ------------
// An item is either:
//   - a wiki slug string -> a link (label is the page's title in the reader's
//     current language, since we pass `slug` rather than a hardcoded label), or
//   - a `group:` mapping -> a collapsible nested group (used for chapters). Its
//     optional `overview` slug becomes the first item ("Overview"), followed by
//     the group's own `items` (recursively). Groups default to collapsed.
function buildItems(items) {
  return items.map((item) => {
    if (typeof item === 'string') return { slug: item };
    const children = [];
    if (item.overview) children.push({ slug: item.overview, label: 'Overview' });
    if (item.items) children.push(...buildItems(item.items));
    return {
      label: item.group,
      collapsed: item.collapsed ?? true,
      items: children,
    };
  });
}

const { sections } = read('./config/navigation.yaml');
const sidebar = sections.map((section) => ({
  label: section.title,
  items: buildItems(section.items),
}));

export default defineConfig({
  // Update to the production subdomain (a subdomain of freefreeforum.org) at
  // deploy time; used for canonical URLs and the sitemap.
  site: 'https://wiki.freefreeforum.org',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'FREE Wiki',
      description:
        'The public knowledge base for FREE — the Forum for Real Economic Emancipation.',
      defaultLocale: 'root',
      locales,
      sidebar,
      // Full-text client-side search (Pagefind) is on by default in Starlight.
      components: {
        // Render status badges, the machine-translation disclaimer, staleness
        // and variant notices from frontmatter — above the article, not baked
        // into any content file.
        PageTitle: './src/components/PageTitle.astro',
        // Append the "Suggest an edit" affordance below the default footer on
        // every doc page (see src/components/Footer.astro).
        Footer: './src/components/Footer.astro',
      },
      customCss: ['./src/styles/custom.css'],
      lastUpdated: true,
      pagination: true,
    }),
  ],
});
