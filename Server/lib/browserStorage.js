export function getStoredValue(key, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function getStoredUser() {
  try {
    const user = JSON.parse(getStoredValue("clubUser", "null"));
    if (!user || typeof user.id !== "string" || !user.id.trim()) return {};
    if (!Number.isInteger(user.safe_no) || user.safe_no < 0) return {};
    return { id: user.id, fullname: user.fullname || "", safe_no: user.safe_no };
  } catch {
    return {};
  }
}
