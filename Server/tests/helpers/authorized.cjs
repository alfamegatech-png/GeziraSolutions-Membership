// Regression fixtures assume an authenticated operator; RBAC tests inject the real authorizer.
const user = { id: 'fixture', safe_no: 2 };
const access = { user, privileges: ['reports.all_safes'], roles: [] };
class AccessError extends Error {}
module.exports = { requirePrivilege: async () => access, requireAnyPrivilege: async () => access,
  requireSafe: () => user.safe_no, assertSafe() {}, scopeSafe: (context, requested) => requested,
  safeInclude: (include) => include, scopeMemberHistory: (access, member) => member, tablePrivilege: () => 'members.view', AccessError };
