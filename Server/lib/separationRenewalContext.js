export async function getSeparationRenewalContext(db, member) {
  if (!member || !Array.isArray(member.membership)) return null;
  const hasOwnRenewal = member.membership.some((row) =>
    row.canceled === 0 && row.secondary === 0 && row.start_date && row.end_date &&
    !Number.isNaN(new Date(row.end_date).getTime()));
  if (hasOwnRenewal) return null;

  const former = await db.members_ref.findUnique({
    where: { id: member.id }, select: { member_code: true, deleted: true },
  });
  if (!former || former.deleted !== 1 || !Number.isInteger(former.member_code) || former.member_code <= 0 || former.member_code === member.member_code) return null;
  const history = await db.history.findFirst({
    where: { member_id: member.id, action: "create_member" },
    orderBy: { time: "asc" }, select: { time: true, last_values: true },
  });
  const snapshot = history?.last_values?.find((entry) => entry.field === "separation_renewal_context")?.value?.to;
  if (snapshot && snapshot.sourceMemberCode === former.member_code) return snapshot;

  // Older separations retain the original parent code; use its renewal history as of separation.
  const source = await db.memberships.findFirst({
    where: {
      member_code: former.member_code, canceled: 0, secondary: 0,
      start_date: { not: null }, end_date: { not: null },
      ...(history?.time ? { OR: [
        { member_order_time: { lte: history.time } },
        { member_order_time: null, member_order_date: { lte: history.time } },
      ] } : {}),
    },
    orderBy: [{ end_date: "desc" }, { member_order_time: "desc" }],
    select: { end_date: true },
  });
  return {
    sourceMemberCode: former.member_code,
    lastMembershipEndDate: source?.end_date ? new Date(source.end_date).toISOString() : null,
  };
}
