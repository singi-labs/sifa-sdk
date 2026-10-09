export {
  parsePresentationDuration,
  durationFromMinutes,
  parseIntendedAudiences,
  stripHtmlToText,
  normalizePresentationRole,
  normalizePresentationMode,
  presentationCsvRowToRecord,
  presentationDeliveryCsvRowToRecord,
  type CsvRow,
  type ParsedPresentation,
  type ParsedDelivery,
} from './presentation-csv.js';
export {
  validateTalksImport,
  TALKS_IMPORT_ROLE_VALUES,
  TALKS_IMPORT_MODE_VALUES,
  type TalksImportIssue,
  type TalksImportIssueCode,
  type TalksImportValidation,
} from './talks-import-validation.js';
