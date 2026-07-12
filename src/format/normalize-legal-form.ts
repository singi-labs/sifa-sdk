import { hasNonAsciiLetter } from './company-name.js';

/**
 * Canonical casing for common legal-form designators, keyed by the token with
 * its dots stripped and lowercased (`n.v.` and `nv` both key to `nv`). The value
 * is the canonical LETTER sequence only -- dots are re-applied from the input, so
 * `n.v.` -> `N.V.` and `nv` -> `NV` from the single `nv` entry.
 *
 * Deliberately conservative. Designators whose canonical casing genuinely
 * depends on the dot style (Italian `srl`/`S.r.l.`, `spa`/`S.p.A.`) are OMITTED
 * rather than guessed -- see the module doc on `normalizeLegalForm`. Multi-word
 * forms (`Sp. z o.o.`, `Pty Ltd`) are out of scope for this single-token pass.
 */
const CANONICAL_LEGAL_FORMS: Readonly<Record<string, string>> = {
  llc: 'LLC',
  inc: 'Inc',
  ltd: 'Ltd',
  ltda: 'Ltda',
  corp: 'Corp',
  co: 'Co',
  plc: 'PLC',
  llp: 'LLP',
  lp: 'LP',
  gmbh: 'GmbH',
  ag: 'AG',
  ab: 'AB',
  as: 'AS',
  aps: 'ApS',
  oy: 'Oy',
  oyj: 'Oyj',
  nv: 'NV',
  bv: 'BV',
  sa: 'SA',
  sas: 'SAS',
  sarl: 'SARL',
  kk: 'KK',
  sl: 'SL',
  pty: 'Pty',
};

/**
 * Designator keys that are also common English words. These are normalized only
 * when they TRAIL the name; at the START they are far more likely the English
 * word than the legal form ("As You Wish Ltd" must not become "AS You Wish Ltd").
 */
const AMBIGUOUS_WHEN_LEADING = new Set(['as']);

/**
 * Re-apply `canonical`'s casing onto `token`, letter by letter, keeping every
 * non-letter character (the dots) exactly where the input had them. `token` is
 * guaranteed ASCII (the caller bailed on non-ASCII names) and its letter count
 * equals `canonical.length`, so the index never runs past the end.
 */
function recase(token: string, canonical: string): string {
  let li = 0;
  let out = '';
  for (const ch of token) {
    if (/[A-Za-z]/.test(ch)) {
      out += canonical.charAt(li);
      li += 1;
    } else {
      out += ch;
    }
  }
  return out;
}

/** Normalize one candidate token, or return it unchanged if it isn't a designator. */
function normalizeToken(token: string, isLeading: boolean): string {
  // Strip dots only; a clean designator token is then a pure ASCII-letter run.
  // A hyphen, comma, paren, or digit means it isn't a bare designator -> skip.
  const letters = token.replace(/\./g, '');
  if (!/^[A-Za-z]+$/.test(letters)) return token;

  const key = letters.toLowerCase();
  const canonical = CANONICAL_LEGAL_FORMS[key];
  // Require a string value, not merely truthy: a bare `map[key]` lookup resolves
  // inherited Object.prototype members, so a token like "Constructor" (key
  // `constructor`) or "__proto__" returns a function/object that is truthy but
  // not a string, and `recase` would then throw on `.charAt`. This also narrows
  // away the `undefined` from a missing key.
  if (typeof canonical !== 'string') return token;
  if (isLeading && AMBIGUOUS_WHEN_LEADING.has(key)) return token;

  return recase(token, canonical);
}

/**
 * Normalize the letter-case of a legal-form designator (GmbH, LLC, N.V., B.V.,
 * S.A., ...) appearing as the leading or trailing whole-word token of a company
 * name. Only that one token is touched; the company name itself is never
 * recased, since brand-wordmark casing is not deterministic (see
 * sifa-workspace#235, deliberately distinct from this pass).
 *
 * The input's dot and spacing style is preserved verbatim -- dotted vs undotted
 * (`N.V.` vs `NV`) is a style choice, so the function never adds, removes, or
 * reorders dots. It only maps `gmbh`/`Gmbh`/`GMBH` -> `GmbH`, `nv` -> `NV`,
 * `n.v.` -> `N.V.`, and so on.
 *
 * Scoped to ASCII-Latin (decision D8, matching `formatCompanyName`): any name
 * containing a non-ASCII letter is returned unchanged, because locale-dependent
 * casing (Turkish i/İ) makes naive upper/lower unsafe. Idempotent: normalizing
 * an already-correct name is a no-op.
 */
export function normalizeLegalForm(name: string): string {
  if (!name || hasNonAsciiLetter(name)) return name;

  // Split into words and whitespace runs, keeping the separators so the exact
  // original spacing (including leading/trailing) survives the round-trip.
  const parts = name.split(/(\s+)/);
  const wordIndices: number[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (part !== undefined && part.length > 0 && !/^\s+$/.test(part)) wordIndices.push(i);
  }
  if (wordIndices.length === 0) return name;

  const firstIdx = wordIndices[0];
  const lastIdx = wordIndices[wordIndices.length - 1];
  if (firstIdx === undefined || lastIdx === undefined) return name;
  // Leading and trailing tokens are the only candidates (deduped when the name
  // is a single word, where the token is treated as leading).
  const candidateIndices = firstIdx === lastIdx ? [firstIdx] : [firstIdx, lastIdx];

  let changed = false;
  for (const idx of candidateIndices) {
    const original = parts[idx];
    if (original === undefined) continue;
    const rewritten = normalizeToken(original, idx === firstIdx);
    if (rewritten !== original) {
      parts[idx] = rewritten;
      changed = true;
    }
  }

  return changed ? parts.join('') : name;
}
