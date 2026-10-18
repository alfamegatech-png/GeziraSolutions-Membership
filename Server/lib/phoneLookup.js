export function getPhoneLookupVariants(value) {
  if (typeof value !== "string") return [];
  const normalized = value.trim()
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
  if (!/^[+\d\s().-]+$/.test(normalized)) return [];
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return [];
  const variants = new Set([digits]);
  const mobile = digits.replace(/^(?:0020|20|0)(?=1[0125]\d{8}$)/, "");
  if (/^1[0125]\d{8}$/.test(mobile)) {
    for (const prefix of ["", "0", "20", "0020"]) variants.add(prefix + mobile);
    variants.add("+20" + mobile);
  }
  return [...variants];
}
