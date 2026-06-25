export function stripVTTTags(text: string): string {
  return text
    .replace(/<\d{2}:\d{2}[.:]\d{3}>/g, "")
    .replace(/<rt[^>]*>[\s\S]*?<\/rt>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/  +/g, " ")
    .trim();
}
