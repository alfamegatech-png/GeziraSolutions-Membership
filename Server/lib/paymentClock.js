export function getPaymentClock(now = new Date()) {
  const instant = new Date(now);
  if (Number.isNaN(instant.getTime())) throw new Error("Invalid payment instant");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(instant);
  const part = (type) => parts.find((item) => item.type === type).value;
  // Prisma maps SQL DATE to UTC midnight; the calendar day itself is Cairo's.
  const receiptDate = new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00.000Z`);
  return { instant, receiptDate };
}
