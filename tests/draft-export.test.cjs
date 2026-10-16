const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../app.js`, "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

test("export downloads the draft zip for the connected member, whatever the tier", async () => {
  const requests = [];
  const clicked = [];
  class TestURL extends URL {
    static createObjectURL() { return "blob:zip"; }
    static revokeObjectURL() {}
  }
  const context = vm.createContext({
    API_BASE_URL: "https://api.example",
    URL: TestURL,
    draftSyncAccess: { tier: "lapsed" },
    linkedInCredential: () => ({ memberId: "m-1", accessToken: "tok" }),
    fetch: async (url, options) => {
      requests.push({ url: String(url), options });
      return { ok: true, blob: async () => "zip-bytes" };
    },
    document: { createElement: () => ({ click() { clicked.push({ href: this.href, download: this.download }); } }) },
    exportDrafts: { disabled: false },
    showToast: () => {}
  });
  vm.runInContext(section("  async function exportAllDrafts()", "  async function deleteAccountData()"), context);
  await context.exportAllDrafts();

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.example/api/drafts/export?memberId=m-1");
  assert.equal(requests[0].options.headers.Authorization, "Bearer tok");
  assert.deepEqual(clicked, [{ href: "blob:zip", download: "bloomary-drafts.zip" }]);
  assert.equal(context.exportDrafts.disabled, false);
});
