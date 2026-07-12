import { describe, it, expect } from 'vitest';
import { normalizeLegalForm } from './normalize-legal-form.js';

describe('normalizeLegalForm', () => {
  it('normalizes GmbH casing regardless of input case, keeping the rest untouched', () => {
    expect(normalizeLegalForm('spryker systems gmbh')).toBe('spryker systems GmbH');
    expect(normalizeLegalForm('Spryker Systems Gmbh')).toBe('Spryker Systems GmbH');
    expect(normalizeLegalForm('Spryker Systems GMBH')).toBe('Spryker Systems GmbH');
  });

  it('preserves the input dot pattern for dotted designators', () => {
    expect(normalizeLegalForm('Acme n.v.')).toBe('Acme N.V.');
    expect(normalizeLegalForm('Acme N.v.')).toBe('Acme N.V.');
    expect(normalizeLegalForm('Acme b.v.')).toBe('Acme B.V.');
    expect(normalizeLegalForm('Acme s.a.')).toBe('Acme S.A.');
  });

  it('preserves the undotted style for undotted designators (no dots added)', () => {
    expect(normalizeLegalForm('Acme nv')).toBe('Acme NV');
    expect(normalizeLegalForm('Acme bv')).toBe('Acme BV');
    expect(normalizeLegalForm('acme llc')).toBe('acme LLC');
  });

  it('normalizes a range of single-token designators', () => {
    expect(normalizeLegalForm('acme inc')).toBe('acme Inc');
    expect(normalizeLegalForm('acme ltd')).toBe('acme Ltd');
    expect(normalizeLegalForm('acme corp')).toBe('acme Corp');
    expect(normalizeLegalForm('acme llp')).toBe('acme LLP');
    expect(normalizeLegalForm('acme ag')).toBe('acme AG');
    expect(normalizeLegalForm('acme aps')).toBe('acme ApS');
    expect(normalizeLegalForm('acme sarl')).toBe('acme SARL');
    expect(normalizeLegalForm('acme oy')).toBe('acme Oy');
  });

  it('normalizes a designator at the START of the name', () => {
    expect(normalizeLegalForm('gmbh holding partners')).toBe('GmbH holding partners');
  });

  it('leaves a name with no legal-form token unchanged', () => {
    expect(normalizeLegalForm('Acme Industries')).toBe('Acme Industries');
    expect(normalizeLegalForm('bank of the west')).toBe('bank of the west');
  });

  it('does not touch a legal-form token in the MIDDLE of the name', () => {
    // "gmbh" is neither the first nor the last whitespace token here.
    expect(normalizeLegalForm('acme gmbh systems')).toBe('acme gmbh systems');
  });

  it('is idempotent (an already-correct name is unchanged)', () => {
    expect(normalizeLegalForm('Spryker Systems GmbH')).toBe('Spryker Systems GmbH');
    expect(normalizeLegalForm('Acme N.V.')).toBe('Acme N.V.');
    expect(normalizeLegalForm('Acme LLC')).toBe('Acme LLC');
  });

  it('leaves names containing any non-ASCII letter unchanged (D8 scoping)', () => {
    // Bail on non-ASCII even when the designator itself is ASCII.
    expect(normalizeLegalForm('Société gmbh')).toBe('Société gmbh');
    expect(normalizeLegalForm('株式会社 gmbh')).toBe('株式会社 gmbh');
  });

  it('skips ambiguous designators whose canonical casing we cannot resolve confidently', () => {
    // Italian S.r.l. / SRL and S.p.A. / SPA casing is genuinely dot-style
    // dependent; leave them alone rather than guess.
    expect(normalizeLegalForm('Rossi srl')).toBe('Rossi srl');
    expect(normalizeLegalForm('Rossi s.r.l.')).toBe('Rossi s.r.l.');
    expect(normalizeLegalForm('Rossi spa')).toBe('Rossi spa');
  });

  it('does not treat a punctuation-attached token as a bare designator', () => {
    // A trailing comma means it is not a clean whole-word designator token.
    expect(normalizeLegalForm('Acme, gmbh inc')).toBe('Acme, gmbh Inc');
  });

  it('does not rewrite a leading English homograph "As" to the Norwegian AS form', () => {
    // "As You Wish Ltd": leading "As" is the English word, not a legal form.
    expect(normalizeLegalForm('As You Wish ltd')).toBe('As You Wish Ltd');
    expect(normalizeLegalForm('as you wish ltd')).toBe('as you wish Ltd');
  });

  it('still normalizes a TRAILING Norwegian AS designator', () => {
    expect(normalizeLegalForm('Equinor as')).toBe('Equinor AS');
  });

  it('returns empty / blank input unchanged', () => {
    expect(normalizeLegalForm('')).toBe('');
    expect(normalizeLegalForm('   ')).toBe('   ');
  });

  it('preserves surrounding whitespace, only recasing the designator token', () => {
    expect(normalizeLegalForm('  acme gmbh  ')).toBe('  acme GmbH  ');
  });

  it('leaves a token matching an Object.prototype member untouched (no proto lookup)', () => {
    // A bare `map[key]` lookup would resolve inherited members: "constructor"
    // returns the Object constructor, "__proto__" the prototype -- both truthy
    // but not strings, which used to crash the recaser. They are not designators.
    expect(normalizeLegalForm('Elite Constructor')).toBe('Elite Constructor');
    expect(normalizeLegalForm('constructor')).toBe('constructor');
    expect(normalizeLegalForm('Acme constructor')).toBe('Acme constructor');
    expect(normalizeLegalForm('__proto__')).toBe('__proto__');
    expect(normalizeLegalForm('Widgets toString')).toBe('Widgets toString');
    expect(normalizeLegalForm('valueof hasownproperty')).toBe('valueof hasownproperty');
  });
});
