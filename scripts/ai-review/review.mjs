#!/usr/bin/env node
// AI PR reviewer — dependency-free, OpenRouter-backed.
//
// Reads a unified diff + PR context, asks one (general) or two (general +
// adversarial) LLM reviewers for STRUCTURED findings, prints a Markdown report
// to stdout, and writes machine outputs (verdict + counts) to $GITHUB_OUTPUT.
//
// All config via env (see scripts/ai-review/README.md). No npm deps: uses the
// Node 20+ global fetch. The workflow handles posting the comment + status.

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const API = 'https://openrouter.ai/api/v1/chat/completions';
const env = process.env;

const KEY = env.OPENROUTER_API_KEY;
if (!KEY) {
  console.error('OPENROUTER_API_KEY is not set');
  process.exit(1);
}

const MODE = (env.AI_REVIEW_MODE || 'single').toLowerCase();
const GENERAL_MODEL = env.GENERAL_MODEL || 'moonshotai/kimi-k2.7-code';
const ADVERSARIAL_MODEL = env.ADVERSARIAL_MODEL || 'z-ai/glm-5.2';
const MAX_DIFF = parseInt(env.MAX_DIFF_CHARS || '120000', 10);

const rawDiff =
  env.DIFF_FILE && existsSync(env.DIFF_FILE) ? readFileSync(env.DIFF_FILE, 'utf8') : '';
if (!rawDiff.trim()) {
  console.error('Diff is empty — nothing to review');
  process.exit(1);
}
const truncated = rawDiff.length > MAX_DIFF;
const diff = truncated ? rawDiff.slice(0, MAX_DIFF) : rawDiff;

const standards =
  env.STANDARDS_FILE && existsSync(env.STANDARDS_FILE)
    ? readFileSync(env.STANDARDS_FILE, 'utf8').slice(0, 8000)
    : '';
const prTitle = env.PR_TITLE || '';
const prBody = (env.PR_BODY || '').slice(0, 4000);

const loadPrompt = (name) => readFileSync(join(HERE, 'prompts', name), 'utf8');

const SCHEMA = `
Respond with ONLY a single JSON object — no prose, no markdown fences:
{
  "verdict": "approve" | "comment" | "request_changes",
  "summary": "1-3 sentence overall assessment",
  "findings": [
    {
      "severity": "critical" | "major" | "minor" | "nit",
      "category": "bug" | "security" | "perf" | "types" | "test" | "a11y" | "style" | "other",
      "file": "path/to/file",
      "line": 0,
      "title": "short headline",
      "detail": "what is wrong and why it matters",
      "suggestion": "concrete fix (optional, omit if none)"
    }
  ]
}
Rules: only report real, actionable issues from THIS diff — do not invent problems to
look busy. No findings => "verdict": "approve" and empty "findings". Use
"request_changes" only when at least one critical or major issue exists.`;

const RANK = { approve: 0, comment: 1, request_changes: 2 };
const SEV_ORDER = ['critical', 'major', 'minor', 'nit'];
const SEV_EMOJI = { critical: '🔴', major: '🟠', minor: '🟡', nit: '⚪' };

function extractJson(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalize(obj) {
  const o = obj || {};
  const verdict = ['approve', 'comment', 'request_changes'].includes(o.verdict)
    ? o.verdict
    : 'comment';
  const findings = Array.isArray(o.findings) ? o.findings.filter((f) => f && f.title) : [];
  return { verdict, summary: (o.summary || '').toString().trim(), findings };
}

async function runReviewer(name, model, systemPrompt) {
  const system = `${systemPrompt}\n\n${standards ? `Project engineering standards (excerpt):\n${standards}\n\n` : ''}${SCHEMA}`;
  const user = `PR title: ${prTitle}\n\nPR description:\n${prBody || '(none)'}\n\nUnified diff${truncated ? ' (TRUNCATED — large PR)' : ''}:\n\`\`\`diff\n${diff}\n\`\`\``;
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/singi-labs',
      'X-Title': 'Singi AI PR Review',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok)
    throw new Error(`${name} (${model}) HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  return { name, model, ...normalize(extractJson(content)) };
}

function renderFindings(findings) {
  if (!findings.length) return '_No issues found._\n';
  const sorted = [...findings].sort(
    (a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity),
  );
  return sorted
    .map((f) => {
      const sev = SEV_EMOJI[f.severity] || '⚪';
      const loc = f.file ? ` \`${f.file}${f.line ? `:${f.line}` : ''}\`` : '';
      const cat = f.category ? ` _(${f.category})_` : '';
      const sug = f.suggestion ? `\n  - **Fix:** ${f.suggestion}` : '';
      return `- ${sev} **${f.title}**${loc}${cat}\n  - ${f.detail || ''}${sug}`;
    })
    .join('\n');
}

(async () => {
  const reviewers = [{ name: 'General', model: GENERAL_MODEL, prompt: loadPrompt('general.md') }];
  if (MODE === 'dual')
    reviewers.push({
      name: 'Adversarial',
      model: ADVERSARIAL_MODEL,
      prompt: loadPrompt('adversarial.md'),
    });

  const results = await Promise.all(
    reviewers.map((r) =>
      runReviewer(r.name, r.model, r.prompt).catch((e) => ({
        name: r.name,
        model: r.model,
        error: e.message,
        verdict: 'comment',
        summary: '',
        findings: [],
      })),
    ),
  );

  const allFindings = results.flatMap((r) => r.findings);
  let worst = results.reduce((w, r) => (RANK[r.verdict] > RANK[w] ? r.verdict : w), 'approve');
  const counts = SEV_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: allFindings.filter((f) => f.severity === s).length }),
    {},
  );
  const total = allFindings.length;
  if (total === 0) worst = 'approve';

  // ---- Markdown report (stdout -> posted as PR comment by the workflow) ----
  const verdictBadge = {
    approve: '✅ Approve',
    comment: '💬 Comments',
    request_changes: '🔴 Changes requested',
  }[worst];
  const lines = [];
  lines.push('<!-- ai-review -->');
  lines.push('## 🤖 AI code review');
  lines.push('');
  lines.push(
    `**Verdict:** ${verdictBadge}  ·  **Findings:** ${total} (🔴 ${counts.critical} · 🟠 ${counts.major} · 🟡 ${counts.minor} · ⚪ ${counts.nit})`,
  );
  lines.push('');
  for (const r of results) {
    lines.push(`### ${r.name} reviewer · \`${r.model}\``);
    if (r.error) {
      lines.push(`> ⚠️ reviewer failed: ${r.error}`);
      lines.push('');
      continue;
    }
    if (r.summary) lines.push(`> ${r.summary}`);
    lines.push('');
    lines.push(renderFindings(r.findings));
    lines.push('');
  }
  if (truncated)
    lines.push('> ℹ️ Diff was truncated for size — review covers the first part only.');
  lines.push('');
  lines.push(
    `<sub>Blocking when changes are requested. Token-based via OpenRouter. Re-runs on each push — add the \`re-review\` label to force a re-run, or \`deep-review\` for a dual general+adversarial pass.</sub>`,
  );
  process.stdout.write(lines.join('\n'));

  // ---- Machine outputs for the workflow ----
  if (env.GITHUB_OUTPUT) {
    appendFileSync(env.GITHUB_OUTPUT, `verdict=${worst}\n`);
    appendFileSync(
      env.GITHUB_OUTPUT,
      `summary=${total} findings: ${counts.critical} critical, ${counts.major} major, ${counts.minor} minor, ${counts.nit} nit\n`,
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
