const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../app.js`, "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

test("lapsed drain pushes a new draft and keeps edits and deletes queued", async () => {
  const drafts = [
    { id: "new", body: "Fresh", synced: false },
    { id: "old", body: "Edited", synced: true }
  ];
  const pushed = [];
  const context = vm.createContext({
    isDraftSyncEnabled: () => true, refreshEntitlement: async () => true,
    draftSyncAccess: { tier: "lapsed", draftLimit: 5 },
    DRAFTS_KEY: "drafts", PENDING_MUTATIONS_KEY: "pending",
    readStore: () => drafts, writeStore() {}, renderDraftTable() {}, mergeDrafts: (local) => local,
    syncDrafts: async (upserts, deletes) => { pushed.push({ upserts: upserts.map((draft) => draft.id), deletes }); return []; },
    MAX_MUTATION_RETRIES: 3, console
  });
  vm.runInContext(`let pendingMutations = [
    { upserts: ["new"], deletes: [], retries: 0 },
    { upserts: ["old"], deletes: [], retries: 0 },
    { upserts: [], deletes: ["old"], retries: 0 }
  ];
  ${section("  function hasDraftAccess()", "  function showSubscriptionOptions(")}
  ${section("  async function drainPendingMutations()", "  function savePendingMutations()")}
  function savePendingMutations() {}
  this.drain = drainPendingMutations;
  this.pending = () => pendingMutations;`, context);

  await context.drain();

  assert.equal(JSON.stringify(pushed), JSON.stringify([{ upserts: ["new"], deletes: [] }]));
  assert.equal(JSON.stringify(context.pending().map((mutation) => [mutation.upserts, mutation.deletes])), JSON.stringify([[["old"], []], [[], ["old"]]]));
});
