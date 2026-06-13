export type ParseErrorCode =
  | "INVALID_FORMAT"
  | "INVALID_TIMESTAMP"
  | "MISSING_TEXT"
  | "INVALID_TIME_RANGE";

export interface ParseError {
  code: ParseErrorCode;
  message: string;
  cueId?: string;
  line?: number;
  rawBlock: string;
}
