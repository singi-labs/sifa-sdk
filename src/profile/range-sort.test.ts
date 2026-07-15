import { describe, it, expect } from 'vitest';
import { sortByActiveDateRange } from './range-sort.js';

type Proj = { rkey: string; startDate?: string; endDate?: string };

function proj(rkey: string, startDate?: string, endDate?: string): Proj {
  return { rkey, startDate, endDate };
}

describe('sortByActiveDateRange', () => {
  it('floats ongoing projects (no endDate) above completed ones', () => {
    const sorted = sortByActiveDateRange([
      proj('done', '2020-01', '2024-06'),
      proj('ongoing', '2022-01'),
    ]);
    expect(sorted.map((p) => p.rkey)).toEqual(['ongoing', 'done']);
  });

  it('orders completed projects by endDate descending', () => {
    const sorted = sortByActiveDateRange([
      proj('a', '2019-01', '2021-01'),
      proj('b', '2020-01', '2024-01'),
      proj('c', '2018-01', '2019-01'),
    ]);
    expect(sorted.map((p) => p.rkey)).toEqual(['b', 'a', 'c']);
  });

  it('breaks ongoing-vs-ongoing ties by startDate descending', () => {
    const sorted = sortByActiveDateRange([
      proj('old', '2020-01'),
      proj('new', '2024-01'),
      proj('mid', '2022-01'),
    ]);
    expect(sorted.map((p) => p.rkey)).toEqual(['new', 'mid', 'old']);
  });

  it('sinks projects with no dates to the bottom', () => {
    const sorted = sortByActiveDateRange([proj('nodate'), proj('done', '2020-01', '2024-01')]);
    expect(sorted.map((p) => p.rkey)).toEqual(['done', 'nodate']);
  });

  it('treats empty-string dates as absent (does not float to top)', () => {
    const sorted = sortByActiveDateRange([
      proj('empty', '', ''),
      proj('done', '2020-01', '2024-01'),
      proj('ongoing', '2023-01'),
    ]);
    expect(sorted.map((p) => p.rkey)).toEqual(['ongoing', 'done', 'empty']);
  });

  it('does not mutate the input array', () => {
    const input = [proj('a', '2020-01', '2024-01'), proj('b', '2022-01')];
    const snapshot = input.map((p) => p.rkey);
    sortByActiveDateRange(input);
    expect(input.map((p) => p.rkey)).toEqual(snapshot);
  });
});
