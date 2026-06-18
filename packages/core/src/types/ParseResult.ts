import { type CaptionCue } from "./CaptionCue.js";
import { type ParseError } from "./ParseError.js";

export interface ParseResult {
  cues: CaptionCue[];
  errors: ParseError[];
}