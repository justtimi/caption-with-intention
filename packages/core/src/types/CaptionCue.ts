import type { VTTCueSettings } from "./VTTCueSettings.js";

export type CaptionCue = {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  settings?: VTTCueSettings;
}
