import { DATE_LOOKAHEAD_MONTHS, isBeyondLookahead } from '../logic/date-lookahead.js';
import {
  httpUrlOrNull,
  isValidPartialDate,
  PresentationDeliveryWriteSchema,
  PresentationWriteSchema,
} from '../schemas/write/index.js';
import {
  presentationCsvRowToRecord,
  presentationDeliveryCsvRowToRecord,
  type CsvRow,
  type ParsedDelivery,
  type ParsedPresentation,
} from './presentation-csv.js';

/**
 * Why a Talks & sessions CSV row was skipped (`error`) or imported with a
 * caveat (`warning`). Consumers map the code to translated copy.
 */
export type TalksImportIssueCode =
  /** error: a talk row has no title. */
  | 'missingTitle'
  /** error: a URL column holds something that is not an http(s) URL. */
  | 'invalidUrl'
  /** error: the date is not YYYY, YYYY-MM or a real YYYY-MM-DD day. */
  | 'invalidDate'
  /** error: the session date is further ahead than the editor allows. */
  | 'dateTooFarAhead'
  /** error: a session has no title, no event name and no linked talk. */
  | 'missingTitleOrEvent'
  /** error: the session's presentation_key names a talk row that was skipped for an error. */
  | 'linkedTalkSkipped'
  /** error: the record fails the write schema for another reason (e.g. a value too long). */
  | 'invalidRecord'
  /** warning: presentation_key matches no talk in this upload; imported as a one-off session. */
  | 'unknownPresentationKey'
  /** warning: the role is not recognised; imported without a role. */
  | 'unknownRole'
  /** warning: the mode is not recognised; imported without a mode. */
  | 'unknownMode';

export interface TalksImportIssue {
  file: 'presentations' | 'deliveries';
  /**
   * Spreadsheet row number: the header is row 1, so the first data row is 2.
   * Off for files with multi-line quoted cells, which spreadsheets rarely emit.
   */
  row: number;
  /** CSV column the problem is in, when there is one. */
  column?: string;
  /** The offending cell value, when showing it helps. */
  value?: string;
  code: TalksImportIssueCode;
  severity: 'error' | 'warning';
}

export interface TalksImportValidation {
  /** Talk rows without errors, ready to send to the import endpoint. */
  presentations: ParsedPresentation[];
  /** Session rows without errors, ready to send to the import endpoint. */
  deliveries: ParsedDelivery[];
  /** Every problem found, in file then row order. */
  issues: TalksImportIssue[];
}

const PRESENTATION_URL_COLUMNS = ['slides_url', 'recording_url', 'writeup_url'] as const;
const DELIVERY_URL_COLUMNS = ['event_url', 'recording_url'] as const;

/** Record field to CSV column, to point a write-schema failure at a cell. */
const RECORD_FIELD_COLUMNS: Record<string, string> = {
  title: 'title',
  description: 'description',
  intendedAudiences: 'intended_audiences',
  eventName: 'event_name',
  location: 'location',
};

/** CSV column of the first write-schema problem, when it maps to one. */
function schemaErrorColumn(error: { issues: { path: PropertyKey[] }[] }): string | undefined {
  const field = error.issues[0]?.path[0];
  return typeof field === 'string' ? RECORD_FIELD_COLUMNS[field] : undefined;
}

function cell(row: CsvRow, column: string): string {
  return (row[column] ?? '').trim();
}

function urlIssues(
  row: CsvRow,
  rowNumber: number,
  file: TalksImportIssue['file'],
  columns: readonly string[],
): TalksImportIssue[] {
  return columns.flatMap((column) => {
    const value = cell(row, column);
    return value && httpUrlOrNull(value) === null
      ? [{ file, row: rowNumber, column, value, code: 'invalidUrl', severity: 'error' } as const]
      : [];
  });
}

/**
 * Map and check the two Talks & sessions templates row by row, so a preview can
 * say which rows will be skipped and why instead of the whole import failing.
 * Rows with an error are left out of the returned records; rows with only a
 * warning are kept. Applies the same 12-month session-date limit as the editor
 * (`DATE_LOOKAHEAD_MONTHS.talk`). Pure; `now` is injectable for tests.
 */
export function validateTalksImport(
  input: { presentationRows: CsvRow[]; deliveryRows: CsvRow[] },
  now: Date = new Date(),
): TalksImportValidation {
  const issues: TalksImportIssue[] = [];
  const presentations: ParsedPresentation[] = [];
  const deliveries: ParsedDelivery[] = [];
  const validKeys = new Set<string>();
  const skippedKeys = new Set<string>();

  input.presentationRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowIssues: TalksImportIssue[] = [];
    const parsed = presentationCsvRowToRecord(row);
    if (!parsed.record.title) {
      rowIssues.push({
        file: 'presentations',
        row: rowNumber,
        column: 'title',
        code: 'missingTitle',
        severity: 'error',
      });
    }
    rowIssues.push(...urlIssues(row, rowNumber, 'presentations', PRESENTATION_URL_COLUMNS));
    const schema = rowIssues.length === 0 ? PresentationWriteSchema.safeParse(parsed.record) : null;
    if (schema && !schema.success) {
      const column = schemaErrorColumn(schema.error);
      rowIssues.push({
        file: 'presentations',
        row: rowNumber,
        ...(column ? { column } : {}),
        code: 'invalidRecord',
        severity: 'error',
      });
    }
    issues.push(...rowIssues);
    if (rowIssues.length > 0) {
      if (parsed.key) skippedKeys.add(parsed.key);
      return;
    }
    presentations.push(parsed);
    if (parsed.key) validKeys.add(parsed.key);
  });

  input.deliveryRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowIssues: TalksImportIssue[] = [];
    const parsed = presentationDeliveryCsvRowToRecord(row);
    const { record, presentationKey } = parsed;

    const linked = presentationKey !== undefined && validKeys.has(presentationKey);
    if (presentationKey !== undefined && skippedKeys.has(presentationKey) && !linked) {
      // Importing it as a one-off would cut it off from its talk for good.
      rowIssues.push({
        file: 'deliveries',
        row: rowNumber,
        column: 'presentation_key',
        value: presentationKey,
        code: 'linkedTalkSkipped',
        severity: 'error',
      });
    } else if (presentationKey !== undefined && !linked) {
      rowIssues.push({
        file: 'deliveries',
        row: rowNumber,
        column: 'presentation_key',
        value: presentationKey,
        code: 'unknownPresentationKey',
        severity: 'warning',
      });
    }
    if (!record.title && !record.eventName && !linked && !skippedKeys.has(presentationKey ?? '')) {
      rowIssues.push({
        file: 'deliveries',
        row: rowNumber,
        code: 'missingTitleOrEvent',
        severity: 'error',
      });
    }
    if (record.date && !isValidPartialDate(record.date)) {
      rowIssues.push({
        file: 'deliveries',
        row: rowNumber,
        column: 'date',
        value: record.date,
        code: 'invalidDate',
        severity: 'error',
      });
    } else if (record.date && isBeyondLookahead(record.date, DATE_LOOKAHEAD_MONTHS.talk, now)) {
      rowIssues.push({
        file: 'deliveries',
        row: rowNumber,
        column: 'date',
        value: record.date,
        code: 'dateTooFarAhead',
        severity: 'error',
      });
    }
    rowIssues.push(...urlIssues(row, rowNumber, 'deliveries', DELIVERY_URL_COLUMNS));
    // The mapper drops a value it doesn't recognise, so a filled cell with no
    // field on the record was unknown.
    const role = cell(row, 'role');
    if (role && !record.role) {
      rowIssues.push({
        file: 'deliveries',
        row: rowNumber,
        column: 'role',
        value: role,
        code: 'unknownRole',
        severity: 'warning',
      });
    }
    const mode = cell(row, 'mode');
    if (mode && !record.mode) {
      rowIssues.push({
        file: 'deliveries',
        row: rowNumber,
        column: 'mode',
        value: mode,
        code: 'unknownMode',
        severity: 'warning',
      });
    }

    let hasError = rowIssues.some((i) => i.severity === 'error');
    const schema = hasError ? null : PresentationDeliveryWriteSchema.safeParse(record);
    if (schema && !schema.success) {
      const column = schemaErrorColumn(schema.error);
      rowIssues.push({
        file: 'deliveries',
        row: rowNumber,
        ...(column ? { column } : {}),
        code: 'invalidRecord',
        severity: 'error',
      });
      hasError = true;
    }
    issues.push(...rowIssues);
    if (!hasError) deliveries.push(parsed);
  });

  return { presentations, deliveries, issues };
}
