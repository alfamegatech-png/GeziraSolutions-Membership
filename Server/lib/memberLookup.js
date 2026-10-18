export function decodeMemberId(id) {
  if (typeof id !== "string" || !id) return null;
  try {
    // Preserve imported BOM prefixes: these are part of existing primary keys.
    return decodeURIComponent(id);
  } catch {
    return null;
  }
}
