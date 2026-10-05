import { readFileSync } from 'node:fs';

import type { Plugin } from 'esbuild';
import { defineConfig, type Options } from 'tsup';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

// Public entry points (one per `exports` subpath).
const publicEntries = [
  'src/index.ts',
  'src/schemas/index.ts',
  'src/schemas/write/index.ts',
  'src/query/index.ts',
  'src/query/fetchers/index.ts',
  'src/query/hooks/index.ts',
  'src/atproto/index.ts',
  'src/tokens/index.ts',
  'src/publishing/index.ts',
  'src/flags/index.ts',
  'src/badge/index.ts',
  'src/jsonld/index.ts',
  'src/resume/index.ts',
  'src/jev/index.ts',
  'src/jev/issue.ts',
  'src/jev/error.ts',
  'src/rpg/index.ts',
];

// Keeps imports between source modules as imports, so each module is its own
// output file. JSON imports are still inlined.
const keepModulesSeparate: Plugin = {
  name: 'keep-modules-separate',
  setup(build) {
    build.onResolve({ filter: /^\.{1,2}\// }, (args) => {
      if (args.kind === 'entry-point' || args.path.endsWith('.json')) return undefined;
      return { path: args.path, external: true };
    });
  },
};

const shared: Options = {
  loader: {
    '.json': 'json',
  },
  sourcemap: true,
  // `pnpm build` empties dist/ first; the two builds below run concurrently.
  clean: false,
  target: 'es2022',
  minify: false,
  external: ['react', '@tanstack/react-query'],
  define: {
    __SIFA_SDK_VERSION__: JSON.stringify(pkg.version),
  },
};

export default defineConfig([
  // ESM: one output file per source module. Together with `sideEffects` in
  // package.json, this lets bundlers drop the modules a consumer never
  // imports, e.g. zod schemas behind a formatter import from the main entry.
  {
    ...shared,
    entry: ['src/**/*.ts', 'src/**/*.tsx', '!src/**/*.test.ts', '!src/**/*.test.tsx'],
    format: ['esm'],
    esbuildPlugins: [keepModulesSeparate],
    dts: { entry: publicEntries },
    splitting: false,
    treeshake: false,
  },
  // CJS: one bundled file per public entry, as before.
  {
    ...shared,
    entry: publicEntries,
    format: ['cjs'],
    dts: true,
    splitting: false,
    treeshake: true,
  },
]);
