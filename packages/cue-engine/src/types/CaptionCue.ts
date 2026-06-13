export interface CaptionCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  metadata?: Record<string, any>;
}
