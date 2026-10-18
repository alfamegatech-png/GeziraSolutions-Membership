const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const babel = require("next/dist/compiled/babel/bundle");
const root = path.resolve(__dirname, "..");

function load(file, mocks = {}, globals = {}) {
  mocks = { "@lib/accessControl": require("./helpers/authorized.cjs"), "@lib/installmentSession": { issueInstallmentSession: async () => {} }, ...mocks };
  const filename = path.join(root, file);
  const { code } = babel.core().transformSync(fs.readFileSync(filename, "utf8"), {
    filename, babelrc: false, configFile: false,
    plugins: [babel.pluginTransformModulesCommonjs()],
  });
  const module = { exports: {} };
  const nativeRequire = createRequire(filename);
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: (id) => Object.hasOwn(mocks, id) ? mocks[id] : nativeRequire(id),
    process, Buffer, console: { error() {}, log() {}, warn() {} }, ...globals,
  }, { filename });
  return module.exports;
}

const lookup = load("lib/memberLookup.js");
function members(db = {}, extras = {}) {
  return load("components/Members/member.js", {
    "@app/api/db": db,
    "@lib/memberLookup": lookup,
    "@lib/phoneLookup": load("lib/phoneLookup.js"),
    "@lib/separationRenewalContext": load("lib/separationRenewalContext.js"),
    "@lib/newMembershipInstallmentGuards": load("lib/newMembershipInstallmentGuards.js"),
    "@lib/paymentClock": load("lib/paymentClock.js"),
    "@components/MembershipPrices/priceSettingsActions": {},
    ...extras,
  });
}

test("browser storage is safe during SSR and when access is denied", () => {
  assert.equal(load("lib/browserStorage.js").getStoredValue("clubUser"), null);
  const api = load("lib/browserStorage.js", {}, {
    window: { get localStorage() { throw new Error("denied"); } },
  });
  assert.equal(api.getStoredValue("fontSize", 42), 42);
  assert.equal(api.getStoredUser().id, undefined);
});

test("phone lookup normalizes Arabic digits, formatting and Egyptian mobile prefixes", () => {
  const { getPhoneLookupVariants } = load("lib/phoneLookup.js");
  for (const phone of ["01012345678", "1012345678", "+20 10 1234 5678", "٠١٠١٢٣٤٥٦٧٨", "(010) 1234-5678", "00201012345678"]) {
    assert.ok(getPhoneLookupVariants(phone).includes("01012345678"));
  }
  for (const phone of [null, "", "0", "12345", "010/011", "number123456", "1234567890123456"]) {
    assert.equal(getPhoneLookupVariants(phone).length, 0);
  }
});

test("phone lookup keeps exact matches fast and resolves imported multi-number fields safely", async () => {
  let rawCalls = 0, queryValues;
  const api = members({
    members: { findFirst: async ({ where, select }) => {
      if (select) return null;
      assert.equal(where.id, "phone-member");
      return { id: where.id };
    } },
    $queryRaw: async (strings, variants) => {
      rawCalls++; queryValues = variants;
      assert.ok(strings.join("").includes("regexp_split_to_table"));
      return [{ id: "phone-member" }];
    },
  });
  assert.equal(await api.getMemberByPhoneNumber("0"), null);
  assert.equal(rawCalls, 0);
  assert.equal((await api.getMemberByPhoneNumber("01012345678")).id, "phone-member");
  assert.equal(rawCalls, 1);
  assert.ok(queryValues.includes("01012345678"));
  const exact = members({ members: { findFirst: async ({ select }) => select ? { id: "exact" } : { id: "exact" } } });
  assert.equal((await exact.getMemberByPhoneNumber("01012345678")).id, "exact");
});

test("session parsing rejects corrupt JSON, missing ids and invalid safe numbers", () => {
  for (const value of ["{", "null", "[]", '{}', '{"id":"x","safe_no":"1"}']) {
    const api = load("lib/browserStorage.js", {}, { window: { localStorage: { getItem: () => value } } });
    assert.equal(api.getStoredUser().id, undefined);
  }
  const id = "\uFEFFabc";
  const api = load("lib/browserStorage.js", {}, {
    window: { localStorage: { getItem: () => JSON.stringify({ id, safe_no: 0, password: "secret" }) } },
  });
  assert.equal(api.getStoredUser().id, id);
  assert.equal(api.getStoredUser().password, undefined);
});

test("login selects only public session fields and uses explicit outcomes", async () => {
  let options;
  const api = load("app/login/login.js", { "@app/api/db": { users: {
    findFirst: async (query) => { options = query; return { id: "x", fullname: "Test", safe_no: 1 }; },
  } } });
  const result = await api.login("test", "secret");
  assert.equal(result.status, "success");
  assert.equal(Object.keys(options.select).sort().join(","), "fullname,id,safe_no");
  assert.equal(options.select.password, undefined);
  assert.equal((await api.login("", "")).status, "invalid");
});

test("invalid login and database failure never produce a usable session", async () => {
  for (const query of [async () => null, async () => { throw new Error("secret connection string"); }]) {
    const api = load("app/login/login.js", { "@app/api/db": { users: { findFirst: query } } });
    const result = await api.login("x", "y");
    assert.notEqual(result.status, "success");
    assert.equal(result.user, null);
    assert.equal(JSON.stringify(result).includes("secret"), false);
  }
});

test("encoded imported member ids preserve the BOM primary key", async () => {
  const id = "\uFEFF001091bf-1255-489d-97b2-11d5df2ea3c7";
  let requested;
  const api = members({ members: { findUnique: async ({ where }) => { requested = where.id; return { id }; } } });
  await api.getMember(encodeURIComponent(id));
  assert.equal(requested, id);
  assert.equal(lookup.decodeMemberId("%broken"), null);
  assert.equal(await api.getMember(undefined), null);
});

test("missing member codes do not trigger unfiltered database reads", async () => {
  const api = members();
  for (const value of [undefined, null, 0, "4", NaN]) {
    assert.equal((await api.getMembershipsCreatedTodayByMemberCode(value)).data.length, 0);
    assert.equal(await api.getMemberByMemberCode(value), null);
    assert.equal((await api.hasPendingLockerBooking(value)).data.length, 0);
  }
});

test("missing member photo AND missing fallback return an embeddable image", async () => {
  const api = members({}, { fs: { readFile: (_file, _encoding, callback) => callback(Object.assign(new Error("missing"), { code: "ENOENT" })) } });
  const image = await api.getImage("members", "234272");
  assert.match(image, /^data:image\/png;base64,/);
  const { PDFDocument } = require("pdf-lib");
  const doc = await PDFDocument.create();
  const embedded = await doc.embedPng(Buffer.from(image.split(",")[1], "base64"));
  assert.ok(embedded.width > 0);
  assert.equal(await api.getImage("../", "secret"), image);
});

test("report batches dependent reads and preserves all financial fields", async () => {
  let calls = 0;
  const rows = Array.from({ length: 502 }, (_, index) => ({
    ref_member_id: `ref-${index}`, total_amount: 150, renew_fee: 0, canceled: index % 2,
  }));
  const api = load("components/LazyTable/report.js", { "@app/api/db": {
    memberships: { findMany: async () => rows },
    members_ref: { findMany: async ({ where }) => {
      calls++;
      assert.ok(where.id.in.length <= 500);
      return where.id.in.map((id) => ({ id, birth_date: new Date("2000-01-01"), rel_ref: { code: 2 } }));
    } },
  } });
  const result = await api.getReportData({ rows: 10, first: 0 }, {}, {}, {});
  assert.equal(calls, 2);
  assert.equal(result.length, rows.length);
  assert.equal(result[0].refType, 2);
  assert.equal(result[0].refAge, new Date().getFullYear() - 2000);
  assert.equal(result.reduce((sum, row) => sum + row.total_amount, 0), 75300);
  result.forEach((row, index) => assert.equal(row.canceled, rows[index].canceled));
});

test("app sources parse and contain no active credential or record debug logging", () => {
  const parser = babel.parser();
  let count = 0;
  function walk(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) { walk(file); continue; }
      if (!/\.jsx?$/.test(file)) continue;
      const ast = parser.parse(fs.readFileSync(file, "utf8"), { sourceType: "module", plugins: ["jsx"] });
      count++;
      function visit(node) {
        if (!node || typeof node !== "object") return;
        if (node.type === "CallExpression" && node.callee.type === "MemberExpression" && node.callee.object.name === "console") {
          assert.ok(!["log", "debug", "info"].includes(node.callee.property.name), file);
          assert.equal(node.arguments[0]?.type, "StringLiteral", file);
        }
        for (const [key, value] of Object.entries(node)) {
          if (["loc", "comments", "tokens"].includes(key)) continue;
          if (Array.isArray(value)) value.forEach(visit);
          else if (value && typeof value === "object") visit(value);
        }
      }
      visit(ast);
    }
  }
  walk(path.join(root, "app"));
  walk(path.join(root, "components"));
  assert.ok(count > 50);
});
