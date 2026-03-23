/**
 * Minimal HTML sanitizer for server-side use.
 * Strips all HTML tags and normalizes whitespace.
 * Used to prevent XSS in user-submitted text fields before storing them.
 */

const HTML_TAG_RE = /<[^>]*>/g;
const NULL_BYTE_RE = /\0/g;

export function stripHtml(value: string): string {
  return value
    .replace(NULL_BYTE_RE, "")
    .replace(HTML_TAG_RE, "")
    .trim();
}

/**
 * Sanitize all string values in an object, stripping HTML tags.
 * Only processes plain string fields — arrays and nested objects are left untouched.
 */
export function sanitizeStrings<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj } as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    if (typeof result[key] === "string") {
      result[key] = stripHtml(result[key] as string);
    }
  }
  return result as T;
}
