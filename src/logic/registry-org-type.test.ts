import { describe, expect, it } from 'vitest';

import { ORG_TYPE_TAXONOMY } from '../jev/index.js';
import {
  WIKIDATA_ORG_TYPE_CLASSES,
  orgTypeFromRorTypes,
  orgTypeFromWikidataClasses,
} from './registry-org-type.js';

describe('orgTypeFromRorTypes', () => {
  it('maps each ROR v2 type to an org-type token', () => {
    expect(orgTypeFromRorTypes(['education'])).toBe('educational');
    expect(orgTypeFromRorTypes(['healthcare'])).toBe('healthcare_provider');
    expect(orgTypeFromRorTypes(['company'])).toBe('company');
    expect(orgTypeFromRorTypes(['government'])).toBe('government');
    expect(orgTypeFromRorTypes(['nonprofit'])).toBe('nonprofit');
    expect(orgTypeFromRorTypes(['facility'])).toBe('research_institute');
  });

  it('picks the most specific type when ROR lists several', () => {
    // A university hospital, a public university, a government lab.
    expect(orgTypeFromRorTypes(['education', 'healthcare'])).toBe('healthcare_provider');
    expect(orgTypeFromRorTypes(['government', 'education'])).toBe('educational');
    expect(orgTypeFromRorTypes(['funder', 'government'])).toBe('government');
  });

  it('returns null for types that say nothing about the form', () => {
    expect(orgTypeFromRorTypes(['funder'])).toBeNull();
    expect(orgTypeFromRorTypes(['archive'])).toBeNull();
    expect(orgTypeFromRorTypes(['other'])).toBeNull();
    expect(orgTypeFromRorTypes([])).toBeNull();
    expect(orgTypeFromRorTypes(undefined)).toBeNull();
  });

  it('ignores case and unknown values', () => {
    expect(orgTypeFromRorTypes(['Education'])).toBe('educational');
    expect(orgTypeFromRorTypes(['spaceport'])).toBeNull();
  });
});

describe('orgTypeFromWikidataClasses', () => {
  it('resolves real class sets by priority (checked against live Wikidata)', () => {
    // MIT: university, nonprofit, research institute, business, company.
    expect(
      orgTypeFromWikidataClasses(['Q163740', 'Q31855', 'Q38723', 'Q3918', 'Q4830453', 'Q783794']),
    ).toBe('educational');
    // Charité: hospital and university.
    expect(orgTypeFromWikidataClasses(['Q16917', 'Q38723', 'Q3914', 'Q4830453'])).toBe(
      'healthcare_provider',
    );
    // Pfizer.
    expect(orgTypeFromWikidataClasses(['Q4830453', 'Q783794'])).toBe('company');
    // NASA.
    expect(orgTypeFromWikidataClasses(['Q327333'])).toBe('government');
    // United Nations (intergovernmental organization).
    expect(orgTypeFromWikidataClasses(['Q245065', 'Q163740'])).toBe('government');
  });

  it('returns null when no known class matches', () => {
    expect(orgTypeFromWikidataClasses([])).toBeNull();
    expect(orgTypeFromWikidataClasses(['Q5'])).toBeNull();
  });

  it('only maps to org-type taxonomy tokens and lists each class once', () => {
    const seen = new Set<string>();
    for (const { orgType, qids } of WIKIDATA_ORG_TYPE_CLASSES) {
      expect(ORG_TYPE_TAXONOMY).toHaveProperty(orgType);
      for (const qid of qids) {
        expect(qid).toMatch(/^Q\d+$/);
        expect(seen.has(qid)).toBe(false);
        seen.add(qid);
      }
    }
  });
});
