// Vercel serverless function (zero-config: any file under /api becomes a
// function, even for a static Astro site). It receives a "Suggest an edit"
// submission from a reader and opens a GitHub Issue.
//
// The GitHub token is read ONLY from the GITHUB_TOKEN environment variable
// (set in the Vercel project settings) — never hardcoded, never committed.
// A fine-grained token with Issues: read & write on the target repo (GITHUB_REPO,
// below) is sufficient.

// Target repository in "owner/repo" form. Read from the GITHUB_REPO environment
// variable so a future repo move/transfer is a config change (set it in Vercel)
// rather than a code edit. Falls back to the current org repo if unset.
const REPO = (process.env.GITHUB_REPO || 'freefreeforum/free-wiki').trim();
const TYPE_LABELS = {
  typo: 'Typo or wording',
  factual: 'Factual correction',
  translation: 'Translation issue',
  broader: 'Broader suggestion',
};

const clip = (v, n) => String(v ?? '').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  // Vercel parses JSON bodies automatically, but tolerate a raw string too.
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  // Honeypot: real users never fill this hidden field. If a bot does, accept
  // the request (so it doesn't retry) but quietly drop it.
  if (clip(body.website, 1)) {
    return res.status(200).json({ ok: true });
  }

  const suggestion = clip(body.suggestion, 5000);
  if (!suggestion) {
    return res.status(400).json({ ok: false, error: 'Please include a suggestion.' });
  }

  const type = clip(body.type, 40) || 'broader';
  const typeLabel = TYPE_LABELS[type] || 'Suggestion';
  const pageTitle = clip(body.pageTitle, 200) || 'Unknown page';
  const pageLang = clip(body.pageLang, 20) || 'en';
  const pageUrl = clip(body.pageUrl, 500);
  const name = clip(body.name, 120);
  const email = clip(body.email, 200);

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    // Misconfiguration — don't leak details, but log for the operator.
    console.error('suggest-edit: GITHUB_TOKEN is not set');
    return res
      .status(500)
      .json({ ok: false, error: "Suggestions aren't set up yet. Please try again later." });
  }

  const issueTitle = `[Edit suggestion] ${pageTitle} (${pageLang})`;
  const submitter =
    name || email ? [name, email].filter(Boolean).join(' — ') : 'anonymous reader';
  const issueBody = [
    `**Type:** ${typeLabel}`,
    '',
    '**Suggestion**',
    '',
    // Quote the reader's text so any Markdown they wrote can't reshape the issue.
    suggestion
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n'),
    '',
    '---',
    `**Page:** ${pageTitle}`,
    `**Language:** ${pageLang}`,
    pageUrl ? `**URL:** ${pageUrl}` : null,
    `**Submitted by:** ${submitter}`,
    '',
    '_Submitted via the “Suggest an edit” form on the FREE Wiki._',
  ]
    .filter((l) => l !== null)
    .join('\n');

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'free-wiki-suggest-edit',
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: ['edit-suggestion'],
      }),
    });

    if (!ghRes.ok) {
      const detail = await ghRes.text().catch(() => '');
      console.error('suggest-edit: GitHub API error', ghRes.status, detail.slice(0, 500));
      return res
        .status(502)
        .json({ ok: false, error: "We couldn't send your suggestion. Please try again." });
    }

    const issue = await ghRes.json();
    return res.status(200).json({ ok: true, url: issue.html_url });
  } catch (err) {
    console.error('suggest-edit: request failed', err);
    return res
      .status(502)
      .json({ ok: false, error: "We couldn't send your suggestion. Please try again." });
  }
}
