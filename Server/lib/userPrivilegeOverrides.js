export const COMPANY_PRICE_PRIVILEGES = ["prices.manage", "prices.edit"];

export function resolvePrivileges(roleCodes, overrides = [], ownsPrices = true) {
  const result = new Set(roleCodes);
  for (const entry of overrides) {
    if (entry.effect === "allow") result.add(entry.code);
    else if (entry.effect === "deny") result.delete(entry.code);
  }
  return [...result].filter((code) => ownsPrices || !COMPANY_PRICE_PRIVILEGES.includes(code)).sort();
}

export function togglePrivilegeOverride(roleCodes, overrides, code, checked) {
  const rest = overrides.filter((entry) => entry.code !== code);
  if (roleCodes.includes(code) === checked) return rest;
  return [...rest, { code, effect: checked ? "allow" : "deny" }].sort((a, b) => a.code.localeCompare(b.code));
}
