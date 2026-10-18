export function buildMemberWhere(filters = {}, base = {}) {
  const clauses = [];
  for (const [field, entry] of Object.entries(filters || {})) {
    const value = entry?.value;
    if (value === null || value === undefined || String(value).trim() === "") continue;
    if (["member_code", "member_type", "nationality", "job"].includes(field)) {
      const number = Number(String(value).replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660)));
      clauses.push(Number.isSafeInteger(number) && number >= 0 ? { [field]: number } : { id: "" });
    } else if (field === "name") {
      clauses.push({ name: { contains: String(value).trim(), mode: "insensitive" } });
    } else if (["birth_date", "join_date"].includes(field)) {
      const date = new Date(value);
      clauses.push(Number.isNaN(date.getTime()) ? { id: "" } : {
        [field]: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
      });
    }
  }
  return clauses.length ? { AND: [base || {}, ...clauses] } : (base || {});
}
