import { describe, expect, it } from 'vitest';
import { agentRefSchema } from './shared.js';

describe('agentRefSchema', () => {
  it('accepts a name-only reference (bare label / free text)', () => {
    const r = agentRefSchema.safeParse({ name: 'Spryker Systems GmbH' });
    expect(r.success).toBe(true);
  });

  it('rejects an empty object (name is required, so {} is not a no-op)', () => {
    expect(agentRefSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a missing/blank name', () => {
    expect(agentRefSchema.safeParse({ did: 'did:plc:abc' }).success).toBe(false);
    expect(agentRefSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('accepts an optional did and entityRef', () => {
    const r = agentRefSchema.safeParse({
      name: 'Spryker',
      did: 'did:plc:3ye7kdb6ajbchm2qsv4nqtss',
      entityRef: 'https://sifa.id/company/XtXLVXXTXxTJ75Jnsynzi',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a malformed did and a non-uri entityRef', () => {
    expect(agentRefSchema.safeParse({ name: 'X', did: 'not-a-did' }).success).toBe(false);
    expect(agentRefSchema.safeParse({ name: 'X', entityRef: 'not a uri' }).success).toBe(false);
  });

  it('preserves unknown future fields (passthrough, forward-compat for co-writers)', () => {
    const r = agentRefSchema.safeParse({ name: 'X', futureField: 'keep me' });
    expect(r.success).toBe(true);
    expect(r.success && (r.data as Record<string, unknown>).futureField).toBe('keep me');
  });
});
