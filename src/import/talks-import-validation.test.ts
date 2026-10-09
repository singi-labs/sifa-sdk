import { describe, expect, it } from 'vitest';
import { validateTalksImport } from './talks-import-validation.js';

const NOW = new Date('2026-10-09T10:00:00.000Z');

describe('validateTalksImport', () => {
  it('passes valid rows through as records with no issues', () => {
    const result = validateTalksImport(
      {
        presentationRows: [{ presentation_key: 'pg', title: 'Scaling Postgres' }],
        deliveryRows: [
          { presentation_key: 'pg', event_name: 'PGConf', date: '2026-03-01', role: 'speaker' },
        ],
      },
      NOW,
    );
    expect(result.issues).toEqual([]);
    expect(result.presentations).toEqual([{ key: 'pg', record: { title: 'Scaling Postgres' } }]);
    expect(result.deliveries).toHaveLength(1);
    expect(result.deliveries[0]?.presentationKey).toBe('pg');
  });

  it('skips a talk with no title and keeps the valid one (#668)', () => {
    const result = validateTalksImport(
      { presentationRows: [{ title: 'Good talk' }, { title: '  ' }], deliveryRows: [] },
      NOW,
    );
    expect(result.presentations.map((p) => p.record.title)).toEqual(['Good talk']);
    expect(result.issues).toEqual([
      { file: 'presentations', row: 3, column: 'title', code: 'missingTitle', severity: 'error' },
    ]);
  });

  it('skips a talk with an invalid URL and names the column (#668)', () => {
    const result = validateTalksImport(
      { presentationRows: [{ title: 'Talk', slides_url: 'not a url' }], deliveryRows: [] },
      NOW,
    );
    expect(result.presentations).toEqual([]);
    expect(result.issues).toEqual([
      {
        file: 'presentations',
        row: 2,
        column: 'slides_url',
        value: 'not a url',
        code: 'invalidUrl',
        severity: 'error',
      },
    ]);
  });

  it('skips a session with an impossible or free-text date (#668)', () => {
    const result = validateTalksImport(
      {
        presentationRows: [],
        deliveryRows: [
          { title: 'A', date: '2025-13-45' },
          { title: 'B', date: 'next Tuesday' },
        ],
      },
      NOW,
    );
    expect(result.deliveries).toEqual([]);
    expect(result.issues.map((i) => [i.row, i.code, i.column])).toEqual([
      [2, 'invalidDate', 'date'],
      [3, 'invalidDate', 'date'],
    ]);
  });

  it('skips a session with an invalid event or recording URL', () => {
    const result = validateTalksImport(
      {
        presentationRows: [],
        deliveryRows: [{ title: 'A', event_url: 'javascript:alert(1)' }],
      },
      NOW,
    );
    expect(result.deliveries).toEqual([]);
    expect(result.issues[0]).toMatchObject({ column: 'event_url', code: 'invalidUrl' });
  });

  it('skips a session dated more than 12 months ahead, like the editor (#669)', () => {
    const result = validateTalksImport(
      {
        presentationRows: [],
        deliveryRows: [
          { title: 'Next year', date: '2027-10-01' },
          { title: 'Too far', date: '2027-11-15' },
          { title: 'Way too far', date: '2095-12-31' },
        ],
      },
      NOW,
    );
    expect(result.deliveries.map((d) => d.record.title)).toEqual(['Next year']);
    expect(result.issues.map((i) => [i.row, i.code])).toEqual([
      [3, 'dateTooFarAhead'],
      [4, 'dateTooFarAhead'],
    ]);
  });

  it('skips a session with no title, no event name and no linked talk (#672)', () => {
    const result = validateTalksImport(
      { presentationRows: [], deliveryRows: [{ date: '2025-02-10' }] },
      NOW,
    );
    expect(result.deliveries).toEqual([]);
    expect(result.issues).toEqual([
      { file: 'deliveries', row: 2, code: 'missingTitleOrEvent', severity: 'error' },
    ]);
  });

  it('accepts a session whose only name comes from its linked talk', () => {
    const result = validateTalksImport(
      {
        presentationRows: [{ presentation_key: 'pg', title: 'Scaling Postgres' }],
        deliveryRows: [{ presentation_key: 'pg', date: '2025-02-10' }],
      },
      NOW,
    );
    expect(result.issues).toEqual([]);
    expect(result.deliveries).toHaveLength(1);
  });

  it('warns but imports a session whose presentation_key matches no talk (#670)', () => {
    const result = validateTalksImport(
      {
        presentationRows: [{ presentation_key: 'pg', title: 'Scaling Postgres' }],
        deliveryRows: [{ presentation_key: 'qa-nonexistent', event_name: 'Meetup' }],
      },
      NOW,
    );
    expect(result.deliveries).toHaveLength(1);
    expect(result.issues).toEqual([
      {
        file: 'deliveries',
        row: 2,
        column: 'presentation_key',
        value: 'qa-nonexistent',
        code: 'unknownPresentationKey',
        severity: 'warning',
      },
    ]);
  });

  it('skips sessions whose linked talk was skipped, so they are not orphaned', () => {
    const result = validateTalksImport(
      {
        presentationRows: [{ presentation_key: 'pg', title: 'Talk', slides_url: 'nope' }],
        deliveryRows: [
          { presentation_key: 'pg', event_name: 'PGConf' },
          { presentation_key: 'pg' },
        ],
      },
      NOW,
    );
    expect(result.presentations).toEqual([]);
    expect(result.deliveries).toEqual([]);
    expect(result.issues.map((i) => [i.file, i.row, i.code])).toEqual([
      ['presentations', 2, 'invalidUrl'],
      ['deliveries', 2, 'linkedTalkSkipped'],
      ['deliveries', 3, 'linkedTalkSkipped'],
    ]);
  });

  it('names the column when only the write schema catches the problem', () => {
    const result = validateTalksImport(
      { presentationRows: [], deliveryRows: [{ title: 'A', location: 'x'.repeat(3000) }] },
      NOW,
    );
    expect(result.deliveries).toEqual([]);
    expect(result.issues).toEqual([
      { file: 'deliveries', row: 2, column: 'location', code: 'invalidRecord', severity: 'error' },
    ]);
  });

  it('warns but imports a session with an unknown role or mode (#671)', () => {
    const result = validateTalksImport(
      {
        presentationRows: [],
        deliveryRows: [
          { title: 'A', role: 'wizard', mode: 'in person' },
          { title: 'B', role: 'speaker', mode: 'teleport' },
        ],
      },
      NOW,
    );
    expect(result.deliveries).toHaveLength(2);
    expect(result.deliveries[0]?.record.role).toBeUndefined();
    expect(result.deliveries[1]?.record.mode).toBeUndefined();
    expect(result.issues).toEqual([
      {
        file: 'deliveries',
        row: 2,
        column: 'role',
        value: 'wizard',
        code: 'unknownRole',
        severity: 'warning',
      },
      {
        file: 'deliveries',
        row: 3,
        column: 'mode',
        value: 'teleport',
        code: 'unknownMode',
        severity: 'warning',
      },
    ]);
  });

  it('accepts the template example rows without issues', () => {
    const result = validateTalksImport(
      {
        presentationRows: [
          {
            presentation_key: 'scaling-postgres',
            title: 'Scaling Postgres to 10M rows',
            duration: '30-45 min',
            slides_url: 'https://example.com/slides',
          },
        ],
        deliveryRows: [
          {
            presentation_key: 'scaling-postgres',
            event_name: 'PGConf EU',
            date: '2023-12-12',
            role: 'speaker',
            mode: 'inPerson',
            event_url: 'https://example.com/pgconf',
          },
        ],
      },
      NOW,
    );
    expect(result.issues).toEqual([]);
  });
});
