import { readFileSync } from 'node:fs';

import { defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/schemas/index.ts',
    'src/query/index.ts',
    'src/query/fetchers/index.ts',
    'src/tokens/index.ts',
    'src/publishing/index.ts',
    'src/flags/index.ts',
  ],
  loader: {
    '.json': 'json',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2022',
  minify: false,
  external: ['react', '@tanstack/react-query'],
  define: {
    __SIFA_SDK_VERSION__: JSON.stringify(pkg.version),
  },
});
