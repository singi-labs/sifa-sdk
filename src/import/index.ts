export {
  parsePresentationDuration,
  durationFromMinutes,
  parseIntendedAudiences,
  stripHtmlToText,
  normalizePresentationRole,
  normalizePresentationMode,
  presentationCsvRowToRecord,
  presentationDeliveryCsvRowToRecord,
  PRESENTATION_ROLE_VALUES,
  PRESENTATION_MODE_VALUES,
  type CsvRow,
  type ParsedPresentation,
  type ParsedDelivery,
} from './presentation-csv.js';
export {
  validateTalksImport,
  type TalksImportIssue,
  type TalksImportIssueCode,
  type TalksImportValidation,
} from './talks-import-validation.js';
