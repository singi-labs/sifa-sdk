import { describe, expect, it } from 'vitest';

import {
  TERM_MAPPINGS,
  VOCABULARIES,
  expandCurie,
  isDeliberatelyUnmapped,
  mappingsForLexicon,
} from './terms.js';

describe('VOCABULARIES', () => {
  it('every namespace ends in a delimiter so CURIE expansion concatenates cleanly', () => {
    for (const [prefix, iri] of Object.entries(VOCABULARIES)) {
      expect(/[/#]$/.test(iri), `${prefix} -> ${iri}`).toBe(true);
    }
  });

  it('every namespace is an absolute http(s) IRI', () => {
    for (const iri of Object.values(VOCABULARIES)) {
      expect(iri).toMatch(/^https?:\/\//);
    }
  });
});

describe('TERM_MAPPINGS integrity', () => {
  it('every CURIE uses a declared prefix and expands', () => {
    for (const mapping of TERM_MAPPINGS) {
      for (const curie of mapping.terms) {
        expect(
          expandCurie(curie),
          `${mapping.lexicon}.${mapping.field ?? '(record)'}: ${curie}`,
        ).not.toBeNull();
      }
    }
  });

  it('a noMatch entry declares no terms and always gives a reason', () => {
    for (const mapping of TERM_MAPPINGS.filter((m) => m.match === 'noMatch')) {
      expect(mapping.terms).toHaveLength(0);
      expect(mapping.note, `${mapping.lexicon}.${mapping.field ?? '(record)'}`).toBeDefined();
      expect(mapping.note!.length).toBeGreaterThan(0);
    }
  });

  it('a mapping that is not noMatch declares at least one term', () => {
    for (const mapping of TERM_MAPPINGS.filter((m) => m.match !== 'noMatch')) {
      expect(
        mapping.terms.length,
        `${mapping.lexicon}.${mapping.field ?? '(record)'}`,
      ).toBeGreaterThan(0);
    }
  });

  it('no duplicate lexicon+field entries', () => {
    const seen = new Set<string>();
    for (const mapping of TERM_MAPPINGS) {
      const key = `${mapping.lexicon}#${mapping.field ?? ''}`;
      expect(seen.has(key), `duplicate ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it('every lexicon NSID is in the id.sifa namespace', () => {
    for (const mapping of TERM_MAPPINGS) {
      expect(mapping.lexicon).toMatch(/^id\.sifa\./);
    }
  });
});

describe('deliberate non-mappings', () => {
  // These are load bearing. An approximate mapping would let a consumer draw a
  // conclusion the underlying record does not support, so a future change that
  // quietly maps one of them should fail here first.
  it.each([
    'id.sifa.confirmation',
    'id.sifa.endorsement',
    'id.sifa.graph.connection',
    'id.sifa.graph.follow',
    'id.sifa.meeting',
  ])('%s stays unmapped', (nsid) => {
    expect(isDeliberatelyUnmapped(nsid)).toBe(true);
    expect(mappingsForLexicon(nsid).every((m) => m.match === 'noMatch')).toBe(true);
  });

  it('does not map connections to foaf:knows', () => {
    const allTerms = TERM_MAPPINGS.flatMap((m) => m.terms);
    expect(allTerms).not.toContain('foaf:knows');
  });
});

describe('expandCurie', () => {
  it('expands a known prefix', () => {
    expect(expandCurie('dcterms:title')).toBe('http://purl.org/dc/terms/title');
    expect(expandCurie('bibo:Slideshow')).toBe('http://purl.org/ontology/bibo/Slideshow');
    expect(expandCurie('skos:exactMatch')).toBe('http://www.w3.org/2004/02/skos/core#exactMatch');
  });

  it('returns null rather than guessing for an unknown prefix', () => {
    expect(expandCurie('wibble:thing')).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(expandCurie('nocolon')).toBeNull();
    expect(expandCurie(':leading')).toBeNull();
    expect(expandCurie('dcterms:')).toBeNull();
  });

  it('does not treat inherited Object properties as prefixes', () => {
    expect(expandCurie('constructor:x')).toBeNull();
    expect(expandCurie('toString:x')).toBeNull();
  });
});

describe('mappingsForLexicon', () => {
  it('returns record-level and field-level entries together', () => {
    const found = mappingsForLexicon('id.sifa.profile.presentation');
    expect(found.some((m) => m.field === undefined)).toBe(true);
    expect(found.some((m) => m.field === 'title')).toBe(true);
  });

  it('returns an empty list for an unknown NSID', () => {
    expect(mappingsForLexicon('id.sifa.nope')).toHaveLength(0);
  });
});

describe('mappings that record a known-exact alignment', () => {
  // These two were already one-to-one with schema.org through
  // community.lexicon.calendar.event before the reconciliation existed. If the
  // lexicon known values ever drift, this is where it should surface.
  it('presentationDelivery mode and status are exact schema.org matches', () => {
    const delivery = mappingsForLexicon('id.sifa.profile.presentationDelivery');
    const mode = delivery.find((m) => m.field === 'mode');
    const status = delivery.find((m) => m.field === 'status');
    expect(mode?.match).toBe('exactMatch');
    expect(mode?.terms).toContain('schema:eventAttendanceMode');
    expect(status?.match).toBe('exactMatch');
    expect(status?.terms).toContain('schema:eventStatus');
  });
});
