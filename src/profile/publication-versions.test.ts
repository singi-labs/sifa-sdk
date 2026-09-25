import { describe, it, expect } from 'vitest';
import { groupPublicationVersions } from './publication-versions.js';

type Pub = {
  rkey: string;
  doi?: string;
  type?: string;
  date?: string;
  primary?: boolean;
  source?: 'sifa' | 'standard' | 'orcid';
  relatedIdentifiers?: { identifier: string; identifierType?: string; relationType: string }[];
};

const leads = (groups: ReturnType<typeof groupPublicationVersions<Pub>>) =>
  groups.map((g) => [g.lead.rkey, ...g.versions.map((v) => `${v.pub.rkey}:${v.kind}`)]);

describe('groupPublicationVersions (#590)', () => {
  it('leaves unrelated publications as their own groups, in order', () => {
    const pubs: Pub[] = [{ rkey: 'a' }, { rkey: 'b', doi: '10.1/b' }];
    expect(leads(groupPublicationVersions(pubs))).toEqual([['a'], ['b']]);
  });

  it('folds a preprint under the published version it IsPublishedIn (DataCite)', () => {
    const pubs: Pub[] = [
      {
        rkey: 'pre',
        doi: '10.5281/zenodo.17369779',
        type: 'preprint',
        relatedIdentifiers: [
          { identifier: '10.1162/99608f92.29efa129', relationType: 'IsPublishedIn' },
        ],
      },
      { rkey: 'pub', doi: '10.1162/99608F92.29EFA129', type: 'journal-article' },
    ];
    expect(leads(groupPublicationVersions(pubs))).toEqual([['pub', 'pre:preprint']]);
  });

  it('folds via HasPreprint declared on the published version (Crossref), matching DOI case-insensitively', () => {
    const pubs: Pub[] = [
      {
        rkey: 'sdata',
        doi: '10.1038/sdata.2018.110',
        type: 'journal-article',
        relatedIdentifiers: [
          { identifier: 'https://doi.org/10.1101/172684', relationType: 'HasPreprint' },
        ],
      },
      { rkey: 'biorxiv', doi: '10.1101/172684' },
    ];
    expect(leads(groupPublicationVersions(pubs))).toEqual([['sdata', 'biorxiv:preprint']]);
  });

  it('treats an arXiv IsVersionOf a journal article as its preprint', () => {
    const pubs: Pub[] = [
      {
        rkey: 'arxiv',
        doi: '10.48550/arxiv.2309.05768',
        type: 'journal-article',
        relatedIdentifiers: [{ identifier: '10.1162/imag_a_00103', relationType: 'IsVersionOf' }],
      },
      { rkey: 'journal', doi: '10.1162/imag_a_00103', type: 'journal-article' },
    ];
    expect(leads(groupPublicationVersions(pubs))).toEqual([['journal', 'arxiv:version']]);
  });

  it('groups software versions and leads with the newest', () => {
    const pubs: Pub[] = [
      {
        rkey: 'concept',
        doi: '10.5281/zenodo.10175845',
        type: 'software',
        date: '2023-11',
        relatedIdentifiers: [{ identifier: '10.5281/zenodo.13754678', relationType: 'HasVersion' }],
      },
      { rkey: 'v2', doi: '10.5281/zenodo.13754678', type: 'software', date: '2024-09' },
    ];
    expect(leads(groupPublicationVersions(pubs))).toEqual([['v2', 'concept:version']]);
  });

  it('groups two versions that share an IsVersionOf target not on the profile', () => {
    const rel = [{ identifier: '10.5281/zenodo.1', relationType: 'IsVersionOf' }];
    const pubs: Pub[] = [
      { rkey: 'old', doi: '10.5281/zenodo.2', date: '2020', relatedIdentifiers: rel },
      { rkey: 'new', doi: '10.5281/zenodo.3', date: '2022', relatedIdentifiers: rel },
    ];
    expect(leads(groupPublicationVersions(pubs))).toEqual([['new', 'old:version']]);
  });

  it('resolves an AT-URI relation to a Sifa-authored publication of the owner', () => {
    const pubs: Pub[] = [
      {
        rkey: 'pre',
        source: 'sifa',
        type: 'preprint',
        relatedIdentifiers: [
          {
            identifier: 'at://did:plc:me/id.sifa.profile.publication/pub',
            identifierType: 'AT-URI',
            relationType: 'IsPreprintOf',
          },
        ],
      },
      { rkey: 'pub', source: 'sifa', type: 'journal-article' },
    ];
    expect(leads(groupPublicationVersions(pubs, { ownerDid: 'did:plc:me' }))).toEqual([
      ['pub', 'pre:preprint'],
    ]);
  });

  it('keeps the primary publication as the lead when it is a version', () => {
    const pubs: Pub[] = [
      {
        rkey: 'a',
        doi: '10.1/a',
        date: '2020',
        primary: true,
        relatedIdentifiers: [{ identifier: '10.1/b', relationType: 'IsPreviousVersionOf' }],
      },
      { rkey: 'b', doi: '10.1/b', date: '2022' },
    ];
    expect(leads(groupPublicationVersions(pubs))).toEqual([['a', 'b:version']]);
  });

  it('ignores relations to works that are not on the profile', () => {
    const pubs: Pub[] = [
      {
        rkey: 'a',
        doi: '10.1/a',
        relatedIdentifiers: [{ identifier: '10.9/elsewhere', relationType: 'IsPreprintOf' }],
      },
    ];
    expect(leads(groupPublicationVersions(pubs))).toEqual([['a']]);
  });
});
