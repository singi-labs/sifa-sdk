import type { AgentRef } from '../schemas/shared.js';

/**
 * The legacy flat organization fields a record carried before it adopted the
 * shared `agentRef` shape. Field NAMES differ per record (company, institution,
 * authority, issuer, organization, via, upstream), so callers pass the values
 * positionally; this helper is name-agnostic.
 */
export interface AgentRefFlat {
  name?: string | null;
  did?: string | null;
  entityRef?: string | null;
}

function clean(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalize(name: string, did?: string | null, entityRef?: string | null): AgentRef {
  const out: AgentRef = { name };
  const d = clean(did);
  const e = clean(entityRef);
  if (d) out.did = d;
  if (e) out.entityRef = e;
  return out;
}

/**
 * Resolve the effective organization/person reference for a record during the
 * flat-to-agentRef migration, with object-level precedence: a nested `agentRef`
 * that carries a name wins wholesale, otherwise fall back to the legacy flat
 * fields. Empty or absent anchors are dropped so the result never carries a
 * null `did`/`entityRef`. Returns `undefined` when neither side names anything
 * (a free-text-less / self-employed entry).
 *
 * During the migration records dual-write both shapes in sync, so the two agree;
 * this precedence is what keeps legacy (flat-only) and new (both) records
 * readable through one path.
 */
export function resolveAgentRef(
  nested: AgentRef | null | undefined,
  flat: AgentRefFlat | null | undefined,
): AgentRef | undefined {
  const nestedName = clean(nested?.name);
  if (nestedName) return normalize(nestedName, nested?.did, nested?.entityRef);

  const flatName = clean(flat?.name);
  if (flatName) return normalize(flatName, flat?.did, flat?.entityRef);

  return undefined;
}
