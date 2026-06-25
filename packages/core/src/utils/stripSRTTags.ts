export function stripSRTTags(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/  +/g, " ")
    .trim();
}
