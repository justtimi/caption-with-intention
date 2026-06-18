export type ParseErrorCode =
  | "INVALID_FORMAT"
  | "INVALID_TIMESTAMP"
  | "MISSING_TEXT"
  | "INVALID_TIME_RANGE"
  | "INVALID_CUE_ID"
  | "OUT_OF_ORDER";

export interface ParseError {
  code: ParseErrorCode;
  message: string;
  cueId?: string | undefined;
  line?: number | undefined;
  severity: "warning" | "error" | "fatal";
  rawBlock?: string | undefined;
}
