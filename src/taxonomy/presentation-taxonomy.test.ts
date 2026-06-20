import { describe, expect, it } from 'vitest';

import { getCalendarEventModeLabel, getCalendarEventStatusLabel } from './calendar-event.js';
import { getPresentationLinkTypeLabel } from './presentation-link-type.js';
import { getPresentationRoleLabel } from './presentation-role.js';

describe('presentation taxonomy labels', () => {
  it('maps role tokens to labels and falls back to the raw value', () => {
    expect(getPresentationRoleLabel('id.sifa.defs#keynote')).toBe('Keynote');
    expect(getPresentationRoleLabel('id.sifa.defs#unknown')).toBe('id.sifa.defs#unknown');
    expect(getPresentationRoleLabel(undefined)).toBeUndefined();
  });

  it('maps link-type tokens to labels', () => {
    expect(getPresentationLinkTypeLabel('id.sifa.defs#linkSlides')).toBe('Slides');
    expect(getPresentationLinkTypeLabel('id.sifa.defs#linkRecording')).toBe('Recording');
  });

  it('maps calendar-event mode and status tokens to labels', () => {
    expect(getCalendarEventModeLabel('community.lexicon.calendar.event#virtual')).toBe('Virtual');
    expect(getCalendarEventStatusLabel('community.lexicon.calendar.event#cancelled')).toBe(
      'Cancelled',
    );
  });
});
