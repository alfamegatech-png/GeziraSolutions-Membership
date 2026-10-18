import { DEFAULT_PRICE_SETTINGS_MAP } from "./priceSettingsConfig";

export async function fetchMembershipPricesData() {
  const response = await fetch("/api/membership-prices", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load membership prices");
  }

  return response.json();
}

export async function saveMembershipPricesData(payload) {
  const response = await fetch("/api/membership-prices", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to save membership prices");
  }

  return response.json();
}

export async function fetchMembershipPriceSettingsMap() {
  try {
    const response = await fetch("/api/membership-prices?mode=calculation", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load calculation prices");
    return { ...DEFAULT_PRICE_SETTINGS_MAP, ...await response.json() };
  } catch (error) {
    console.error("Error loading membership price settings:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    return { ...DEFAULT_PRICE_SETTINGS_MAP };
  }
}
