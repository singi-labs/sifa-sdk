/**
 * Display labels for `community.lexicon.calendar.event` mode and status tokens.
 * A presentation delivery stores the full upstream token (so it stays faithful
 * to the source event); these maps turn the token into a human label.
 */

export const CALENDAR_EVENT_MODE_LABELS: Record<string, string> = {
  'community.lexicon.calendar.event#inperson': 'In person',
  'community.lexicon.calendar.event#virtual': 'Virtual',
  'community.lexicon.calendar.event#hybrid': 'Hybrid',
};

/** Resolve a label for a calendar-event mode token. Falls back to the raw value. */
export function getCalendarEventModeLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return CALENDAR_EVENT_MODE_LABELS[value] ?? value;
}

export const CALENDAR_EVENT_STATUS_LABELS: Record<string, string> = {
  'community.lexicon.calendar.event#scheduled': 'Scheduled',
  'community.lexicon.calendar.event#cancelled': 'Cancelled',
  'community.lexicon.calendar.event#postponed': 'Postponed',
  'community.lexicon.calendar.event#rescheduled': 'Rescheduled',
  'community.lexicon.calendar.event#planned': 'Planned',
};

/** Resolve a label for a calendar-event status token. Falls back to the raw value. */
export function getCalendarEventStatusLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return CALENDAR_EVENT_STATUS_LABELS[value] ?? value;
}
