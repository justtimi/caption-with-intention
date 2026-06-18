export function parseTimestamp(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") {
    throw new Error("Invalid timestamp: empty input");
  }

  const trimmed = timeStr.trim();

  // Match: HH:MM:SS,mmm or HH:MM:SS.mmm
  const match = trimmed.match(/^(\d{2}):(\d{2}):(\d{2})[.,](\d{1,3})$/);

  if (!match) {
    throw new Error(`Invalid timestamp format: ${timeStr}`);
  }

  const hh = match[1];
  const mm = match[2];
  const ss = match[3];
  const msRaw = match[4];

  if (!hh || !mm || !ss || !msRaw) {
    throw new Error(`Invalid timestamp match: ${timeStr}`);
  }

  const hours = Number(hh);
  const minutes = Number(mm);
  const seconds = Number(ss);

  // normalize milliseconds to 3 digits
  const ms =
    msRaw.length === 1
      ? Number(msRaw) * 100
      : msRaw.length === 2
        ? Number(msRaw) * 10
        : Number(msRaw);

  if (minutes > 59 || seconds > 59 || ms > 999) {
    throw new Error(`Invalid timestamp range: ${timeStr}`);
  }

  return hours * 3600000 + minutes * 60000 + seconds * 1000 + ms;
}
