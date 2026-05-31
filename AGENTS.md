# Sifa SDK -- Shared Client Library

<!-- Auto-generated from sifa-workspace. To propose changes, edit the source:
     https://github.com/singi-labs/sifa-workspace -->

MIT License | Part of [github.com/singi-labs](https://github.com/singi-labs)

Public TypeScript SDK consumed by `sifa-web` (Next.js) and the upcoming `sifa-app` (Expo / React Native). Holds platform-agnostic logic so both clients stay in feature parity. Also serves as the recommended way for third-party developers to build their own ATproto-based clients against the Sifa AppView.

## Tech Stack

| Component   | Technology                                         |
| ----------- | -------------------------------------------------- |
| Runtime     | Node.js 26 / TypeScript (strict)                   |
| Build       | tsup (dual ESM + CJS, .d.ts + .d.cts)              |
| Testing     | Vitest                                             |
| Linting     | ESLint (typescript-eslint, recommendedTypeChecked) |
| Versioning  | changesets                                         |
| Validation  | Zod (generated from lexicons where possible)       |
| Query layer | TanStack Query v5                                  |
| AT Protocol | @atproto/api (agent accepted as parameter)         |
| Registry    | Public npm (@singi-labs/sifa-sdk)                  |

## What This Repo Does

- Generates TypeScript types from `sifa-lexicons` via `@atproto/lex-cli`
- Exports Zod schemas mirroring lexicon constraints
- Provides TanStack Query keys, fetchers, and React hooks for calling `sifa-api`
- Wraps `@atproto/api` agent for direct PDS writes from clients
- Exports pure formatters, business logic predicates, taxonomies, design tokens

## SDK-Specific Standards

- Zero platform-specific dependencies -- no `react-dom`, `react-native`, `expo-*`, `next`, storage APIs, routers
- `@atproto/api` Agent is accepted as a parameter, never constructed by the SDK
- `fetch` is injectable so Next.js can pass its cache-enhanced version
- Subpath exports: `.` (main), `./tokens` (optional brand assets), `./schemas` (validation only)
- Design tokens documented as optional -- third-party consumers building their own brand should ignore them
- Server-side data fetching (Next.js RSC) calls `fetchers` directly; client-side uses TanStack Query `hooks`

---

## Project-Wide Standards

### About Sifa

Decentralized professional identity and career network built on the [AT Protocol](https://atproto.com/). Portable profiles, verifiable track record from real community contributions, no vendor lock-in.

- **Organization:** [github.com/singi-labs](https://github.com/singi-labs)
- **License:** MIT (sifa-sdk, sifa-lexicons) / Source-available (sifa-api, sifa-web)

### Coding Standards

1. **Strict TypeScript** -- `strict: true`, no `any`, no `@ts-ignore`.
2. **Conventional commits** -- `type(scope): description`.
3. **CI must pass** -- lint, typecheck, tests, build on every PR.
4. **Pin exact versions** -- no `^` or `~` in package.json.
5. **Named exports** -- prefer named exports over default exports.
6. **Changesets required** -- every PR that changes the published API surface adds a changeset entry.

### Git Workflow

All changes go through Pull Requests -- never commit directly to `main`. Branch naming: `type/short-description` (e.g., `feat/add-zod-schemas`, `fix/fetcher-error-handling`).

### AT Protocol Context

- The SDK does not store credentials; consumers create an authenticated `@atproto/api` Agent and pass it in
- Clients write directly to the user's PDS using the Agent -- not through `sifa-api`
- `sifa-api` reads firehose, indexes, serves aggregated views
- Trust calculations and anti-abuse logic stay in `sifa-api`; this SDK exposes display-only logic
