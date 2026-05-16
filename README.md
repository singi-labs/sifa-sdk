<div align="center">

# Sifa SDK

**Public client library for the Sifa AppView on AT Protocol.**

[![Status: Alpha](https://img.shields.io/badge/status-alpha-orange)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/singi-labs/sifa-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/singi-labs/sifa-sdk/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@singi-labs/sifa-sdk.svg)](https://www.npmjs.com/package/@singi-labs/sifa-sdk)
[![Node.js](https://img.shields.io/badge/node-25-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)

</div>

---

## Overview

Shared TypeScript SDK consumed by [`sifa-web`](https://github.com/singi-labs/sifa-web) (Next.js) and the upcoming `sifa-app` (Expo / React Native). Holds platform-agnostic logic so both clients stay in feature parity without duplicating code.

Published publicly so third-party developers can build their own AT Protocol clients against the Sifa AppView. Trust and reputation logic stays server-side in `sifa-api`; the SDK exposes only what is safe to publish.

> Pre-1.0 software. The public API is unstable and may change in any minor release.

---

## What this package contains

| Area        | What it provides                                                                      |
| ----------- | ------------------------------------------------------------------------------------- |
| Types       | TypeScript types for Sifa data structures, generated from `sifa-lexicons`             |
| Schemas     | Zod schemas mirroring lexicon constraints for runtime validation                      |
| Query layer | TanStack Query keys, fetchers, and React hooks for calling `sifa-api`                 |
| ATproto     | Wrapper around `@atproto/api` that accepts an authenticated agent                     |
| Format      | Pure formatters for dates, locations, profile completeness                            |
| Logic       | Business-logic predicates (display-only; server-side trust logic lives in `sifa-api`) |
| Taxonomy    | Constants and enums (continents, industries, skill categories, etc.)                  |
| Tokens      | Sifa-brand design tokens, exported via `@singi-labs/sifa-sdk/tokens` (optional)       |

---

## Quick Start

```bash
pnpm add @singi-labs/sifa-sdk
```

```ts
import { SIFA_SDK_VERSION } from '@singi-labs/sifa-sdk';

console.log(SIFA_SDK_VERSION);
```

Optional design tokens (skip if you have your own brand):

```ts
import { colors, spacing } from '@singi-labs/sifa-sdk/tokens';
```

---

## For third-party developers

This SDK is the recommended way to build clients against the Sifa AppView. It does not depend on `react-dom`, `react-native`, `next`, or any browser/Node-only storage API -- it runs anywhere TypeScript runs.

If you have a use case the current public surface does not cover, open an issue on [`singi-labs/sifa-workspace`](https://github.com/singi-labs/sifa-workspace/issues).

---

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

Standards:

- Strict TypeScript -- `strict: true`, no `any`
- Pinned exact dependency versions
- Conventional commits enforced by `commitlint`
- Every published-API change requires a changeset (`pnpm changeset`)

All changes go through Pull Requests. CI must pass before merge.

---

## Related Repositories

| Repository                                                                | Description                            | License          |
| ------------------------------------------------------------------------- | -------------------------------------- | ---------------- |
| [singi-labs/sifa-api](https://github.com/singi-labs/sifa-api)             | AppView backend that this SDK consumes | Source-available |
| [singi-labs/sifa-web](https://github.com/singi-labs/sifa-web)             | Next.js web client (consumes this SDK) | Source-available |
| [singi-labs/sifa-lexicons](https://github.com/singi-labs/sifa-lexicons)   | AT Protocol lexicon schemas            | MIT              |
| [singi-labs/sifa-workspace](https://github.com/singi-labs/sifa-workspace) | Project coordination, issues, roadmap  | Public           |

---

## Community

- **Website:** [sifa.id](https://sifa.id)
- **Bluesky:** [@sifa.id](https://bsky.app/profile/sifa.id)
- **Issues:** [Report bugs](https://github.com/singi-labs/sifa-sdk/issues)

---

## License

**MIT** -- permissive, so that third-party developers can build their own ATproto-based professional profile clients on top of this SDK.

See [LICENSE](LICENSE) for full terms.

---

(c) 2026 Sifa
