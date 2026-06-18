export function parseTimestamp(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") {
    throw new Error("Invalid timestamp: empty input");
  }

  const trimmed = timeStr.trim();

  // Match: HH:MM:SS,mmm or HH:MM:SS.mmm (SRT + VTT with hours)
  //    or:    MM:SS.mmm or MM:SS,mmm     (VTT without hours)
  const match = trimmed.match(/^(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{1,3})$/);

  if (!match) {
    throw new Error(`Invalid timestamp format: ${timeStr}`);
  }

  const hhRaw = match[1];
  const mm = match[2];
  const ss = match[3];
  const msRaw = match[4];

  if (!mm || !ss || !msRaw) {
    throw new Error(`Invalid timestamp match: ${timeStr}`);
  }

  const hours = hhRaw !== undefined ? Number(hhRaw) : 0;
  const minutes = Number(mm);
  const seconds = Number(ss);

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
