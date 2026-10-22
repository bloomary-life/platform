const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../app.js`, "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const credential = { memberId: "m", accessToken: "t" };

test("publishing an open draft sends its draftId", async () => {
  // Verifies: WEB-001
  const sent = [];
  const context = vm.createContext({
    LINKEDIN_PUBLISHING_ENABLED: true, LINKEDIN_TOKEN_KEY: "k", API_BASE_URL: "https://api.test",
    activeDraftId: "draft-1", pendingPostAttachment: null, postAttachment: { files: [] },
    publishLinkedIn: {}, FormData: class { constructor() { this.values = {}; } set(k, v) { this.values[k] = v; } },
    readStore: () => ({ accessToken: "t", profile: {} }), linkedInMemberId: () => "m", cleanText: () => "Hello",
    hasLinkedInToken: () => true, hasPostScope: () => true, requireDraftAccess: async () => true,
    setButtonLabel: () => {}, showToast: () => {}, refreshScheduledPosts: async () => {},
    fetch: async (_url, init) => { sent.push(init.body.values); return { ok: true, json: async () => ({}) }; }
  });
  vm.runInContext(section("  async function publishToLinkedIn()", "  let profileRefreshInFlight"), context);
  await context.publishToLinkedIn();
  assert.equal(sent[0].draftId, "draft-1");
});

test("unschedule sends DELETE for the draft and reloads schedules", async () => {
  // Verifies: WEB-002
  const calls = [];
  let refreshed = false;
  const context = vm.createContext({
    URL, API_BASE_URL: "https://api.test", linkedInCredential: () => credential,
    refreshScheduledPosts: async () => { refreshed = true; },
    fetch: async (url, init) => { calls.push({ url: String(url), method: init.method }); return { ok: true }; }
  });
  vm.runInContext(section("  async function unscheduleDraft(", "  // The editor URL names"), context);
  await context.unscheduleDraft("draft-1");
  assert.deepEqual(calls, [{ url: "https://api.test/api/linkedin/schedule?memberId=m&draftId=draft-1", method: "DELETE" }]);
  assert.equal(refreshed, true);
});

test("editor URL names the open draft and opens a linked draft", async () => {
  // Verifies: WEB-003
  let opened = null;
  const context = vm.createContext({
    URLSearchParams, VIEW_PATHS: { editor: "/editor" }, activeDraftId: null, DRAFTS_KEY: "d",
    window: { location: { search: "?draft=DRAFT-1" } },
    readStore: () => [{ id: "draft-1" }], confirmDiscardEditor: () => true,
    openDraft: async (draft) => { opened = draft; }
  });
  vm.runInContext(section("  // The editor URL names", "  function viewFromPath()") + "; this.setActive = (id) => { activeDraftId = id; };", context);
  assert.equal(context.editorPath(), "/editor");
  context.setActive("draft-1");
  assert.equal(context.editorPath(), "/editor?draft=draft-1");
  context.setActive(null);
  await context.openDraftFromURL();
  assert.equal(opened.id, "draft-1");
});
