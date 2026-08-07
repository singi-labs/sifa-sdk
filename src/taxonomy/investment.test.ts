import { describe, expect, it } from 'vitest';

import {
  INVESTMENT_ROLE_OPTIONS,
  INVESTMENT_ROLE_LABELS,
  INVESTMENT_STAGE_OPTIONS,
  INVESTMENT_STATUS_OPTIONS,
  INVESTMENT_STATUS_LABELS,
  getInvestmentRoleLabel,
  getInvestmentStageLabel,
  getInvestmentStatusLabel,
} from './investment.js';

describe('investment taxonomy', () => {
  // GP is deliberately absent: running a fund is a job (already a position), and
  // offering it here would let a partner claim the fund's whole portfolio as their
  // own cheques. See decisions/2026-08-06-investment-records.md.
  it('offers angel, syndicate and LP, but never GP', () => {
    const values = INVESTMENT_ROLE_OPTIONS.map((o) => o.value);
    expect(values).toContain('id.sifa.defs#angelInvestment');
    expect(values).toContain('id.sifa.defs#syndicateInvestment');
    expect(values).toContain('id.sifa.defs#limitedPartner');
    expect(values).not.toContain('id.sifa.defs#generalPartner');
    // Grouped so the anchor binds to both alternatives, not just the second.
    expect(values.some((v) => /(?:generalPartner|#gp)$/i.test(v))).toBe(false);
  });

  it('labels every role, stage and status option', () => {
    for (const o of INVESTMENT_ROLE_OPTIONS) expect(INVESTMENT_ROLE_LABELS[o.value]).toBeTruthy();
    for (const o of INVESTMENT_STATUS_OPTIONS) {
      expect(INVESTMENT_STATUS_LABELS[o.value]).toBeTruthy();
    }
    for (const o of INVESTMENT_STAGE_OPTIONS) {
      expect(getInvestmentStageLabel(o.value)).not.toBe(o.value);
    }
  });

  // Publishing write-offs is the show-your-work move a portfolio brag page cannot
  // make, so the status has to be offerable rather than merely storable.
  it('offers a write-off status', () => {
    const values = INVESTMENT_STATUS_OPTIONS.map((o) => o.value);
    expect(values).toContain('id.sifa.defs#investmentWrittenOff');
    expect(getInvestmentStatusLabel('id.sifa.defs#investmentWrittenOff')).toMatch(/written/i);
  });

  it('every option uses the id.sifa.defs# namespace', () => {
    for (const o of [
      ...INVESTMENT_ROLE_OPTIONS,
      ...INVESTMENT_STAGE_OPTIONS,
      ...INVESTMENT_STATUS_OPTIONS,
    ]) {
      expect(o.value.startsWith('id.sifa.defs#')).toBe(true);
    }
  });

  it('falls back to the raw value for an unknown token', () => {
    expect(getInvestmentRoleLabel('id.sifa.defs#nope')).toBe('id.sifa.defs#nope');
    expect(getInvestmentRoleLabel(undefined)).toBeUndefined();
    expect(getInvestmentStatusLabel(null)).toBeUndefined();
  });

  it('orders stages from earliest to latest', () => {
    const values = INVESTMENT_STAGE_OPTIONS.map((o) => o.value);
    expect(values.indexOf('id.sifa.defs#stagePreSeed')).toBeLessThan(
      values.indexOf('id.sifa.defs#stageSeed'),
    );
    expect(values.indexOf('id.sifa.defs#stageSeed')).toBeLessThan(
      values.indexOf('id.sifa.defs#stageSeriesA'),
    );
  });
});
