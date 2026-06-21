import type { VTTCueSettings } from "../types/VTTCueSettings.js";

const VALID_ALIGN_VALUES = ["start", "center", "end", "left", "right"] as const;
const VALID_VERTICAL_VALUES = ["rl", "lr"] as const;

export function parseVTTCueSettings(raw: string): VTTCueSettings {
  const settings: VTTCueSettings = {};

  for (const part of raw.split(/\s+/)) {
    const colonIndex = part.indexOf(":");
    if (colonIndex === -1) continue;

    const key = part.slice(0, colonIndex);
    const value = part.slice(colonIndex + 1);

    if (!key || !value) continue;

    switch (key) {
      case "vertical":
        if ((VALID_VERTICAL_VALUES as readonly string[]).includes(value)) {
          settings.vertical = value as "rl" | "lr";
        }
        break;

      case "line":
        settings.line = value;
        break;
      case "position":
        settings.position = value;
        break;
      case "size":
        settings.size = value;
        break;

      case "align":
        if ((VALID_ALIGN_VALUES as readonly string[]).includes(value)) {
          settings.align = value as
            | "start"
            | "center"
            | "end"
            | "left"
            | "right";
        }
        break;
    }
  }

  return settings;
}
