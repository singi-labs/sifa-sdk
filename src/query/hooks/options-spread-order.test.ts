import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Object spread decides whether cache invalidation survives (#453).
 *
 * With `...options` spread LAST, a consumer-supplied `onSuccess` replaces the
 * hook's own handler outright, so `invalidateQueries` never runs and the
 * forwarding call to `options.onSuccess` -- which lives inside the function being
 * overwritten -- never runs either. Nothing throws. The UI just shows stale data
 * after a successful write.
 *
 * This is a source-shape assertion rather than a behavioural one on purpose: the
 * bug is invisible unless a test happens to pass its own callback, and it reached
 * 52 mutation blocks across 22 files before anyone noticed.
 */
const HOOKS_DIR = import.meta.dirname;

function stripComments(text: string): string {
  return text
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
}

/** Every `useMutation({ ... })` object literal in a file. */
function mutationBlocks(source: string): string[] {
  return [...source.matchAll(/useMutation\(\{.*?\n {2}\}\);/gs)].map((m) => m[0]);
}

const files = readdirSync(HOOKS_DIR).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));

describe('mutation hooks spread options before their own handlers', () => {
  it('finds mutation blocks to check', () => {
    const blocks = files.flatMap((f) => mutationBlocks(readFileSync(join(HOOKS_DIR, f), 'utf-8')));
    expect(blocks.length).toBeGreaterThan(20);
  });

  it.each(files)('%s spreads options before onSuccess / onError', (file) => {
    const source = readFileSync(join(HOOKS_DIR, file), 'utf-8');
    const offenders: string[] = [];

    for (const raw of mutationBlocks(source)) {
      const block = stripComments(raw);
      const spread = block.indexOf('...options');
      if (spread === -1) continue;

      for (const handler of ['onSuccess', 'onError'] as const) {
        const at = block.indexOf(`${handler}:`);
        if (at !== -1 && spread > at) {
          offenders.push(`${handler} in ${block.split('\n')[1]?.trim() ?? file}`);
        }
      }
    }

    expect(
      offenders,
      `${file}: \`...options\` is spread after a handler, which overwrites it and drops cache invalidation. Move \`...options\` to the top of the useMutation object.`,
    ).toEqual([]);
  });
});
