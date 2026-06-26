# AI PR Review

Self-owned, token-based AI code review — our replacement for CodeRabbit. Runs in
CI on every PR, posts a review comment, and reports a **blocking** `AI Review`
status check — the check fails (gating merge) when a reviewer requests changes.
Pay-per-token via OpenRouter; **$0 when no PRs**, no per-seat fee.

Pilot lives in `sifa-api`. Once tuned, it'll be promoted to an org-level reusable
workflow in `singi-labs/.github` and wired into `sifa-web` / `sifa-sdk`.

## How it works

1. **`.github/workflows/ai-review.yml`** triggers on PR **open / reopen / push
   (synchronize) / ready**, plus the `deep-review` / `re-review` labels. It
   re-reviews on each push so a flagged PR can recover after fixes (required for
   a blocking gate). Concurrency cancels superseded runs so you don't pay twice.
2. It **scopes** the PR — skips drafts, bot authors, and trivial-only PRs
   (docs, `*.md`, `.github/`, lockfiles, snapshots).
3. It picks a **mode**: `single` (one general pass) by default, or `dual`
   (general + adversarial) when the PR has the `deep-review` label or a large
   diff (>800 lines).
4. **`review.mjs`** sends the diff + PR context + project standards to OpenRouter,
   gets structured JSON findings, and renders a Markdown report.
5. The workflow **upserts one PR comment** (updated in place on re-runs) and
   sets the **blocking** `AI Review` status: `failure` on `request_changes`
   (critical/major), `success` otherwise. Skip/bot/error paths always post
   `success` so the required check never jams (fails open on reviewer error).

**Re-review:** add the `re-review` label to re-run on the latest commit (toggle
it off/on to trigger again), or `deep-review` for a dual pass.

**Make it enforce:** mark `AI Review` as a required status check on the branch.

## Reviewers

- **General** (`prompts/general.md`) — correctness, standards, tests,
  maintainability. Default model: `moonshotai/kimi-k2.7-code` (code-specialized).
- **Adversarial** (`prompts/adversarial.md`) — security, edge cases, races,
  failure modes. Tries to _break_ the PR. Default model: `z-ai/glm-5.2`.

Both are cheap, coding-specialized models. Swap via the `GENERAL_MODEL` /
`ADVERSARIAL_MODEL` env in the workflow.

## Setup

Add an org (or repo) secret **`OPENROUTER_API_KEY`** scoped to this repo.
Nothing else — no app install, no marketplace action, no npm deps (the script
uses Node's built-in `fetch`).

## Config (env consumed by `review.mjs`)

| Var                    | Default                     | Purpose                                         |
| ---------------------- | --------------------------- | ----------------------------------------------- |
| `OPENROUTER_API_KEY`   | —                           | required                                        |
| `AI_REVIEW_MODE`       | `single`                    | `single` or `dual`                              |
| `GENERAL_MODEL`        | `moonshotai/kimi-k2.7-code` | first-pass model                                |
| `ADVERSARIAL_MODEL`    | `z-ai/glm-5.2`              | second-pass model (dual only)                   |
| `DIFF_FILE`            | —                           | path to the unified diff                        |
| `STANDARDS_FILE`       | —                           | path to standards excerpt (we pass `CLAUDE.md`) |
| `PR_TITLE` / `PR_BODY` | —                           | PR context                                      |
| `MAX_DIFF_CHARS`       | `120000`                    | diff truncation cap (cost control)              |

## Cost control

- Re-reviews on each push (needed for a blocking gate), but concurrency cancels superseded runs.
- Single cheap pass by default; dual only on demand (`deep-review` label) or big diffs.
- Trivial PRs and bot PRs skipped entirely.
- Diff truncated past `MAX_DIFF_CHARS`.
- Daily spend backstopped by the OpenRouter key's own cap.

## Roadmap

- **Phase 1 (now):** blocking gate — `AI Review` fails on `request_changes`.
  Mark it required on each branch to enforce.
- **Phase 2:** wire the verdict into `singi-implement-next-prio` so the agent
  auto-iterates until the reviewers approve (the "general + adversarial,
  iterate-until-pass" loop), and promote to an org reusable workflow for web/sdk.
