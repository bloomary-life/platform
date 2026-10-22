const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../app.js`, "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const expired = { tier: "lapsed", isPro: false, subscriptionSource: "trial", accessUntil: "2000-01-01", draftLimit: 5 };

function lockable() {
  const classes = new Set();
  return { classList: { toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)), contains: (name) => classes.has(name) } };
}

function setup(entitlement = expired, reachable = true) {
  const events = [];
  const drafts = [{ id: "saved", body: "Original draft" }];
  const context = vm.createContext({
    Date, draftSyncAccess: entitlement, linkedInCredential: () => ({ memberId: "member" }),
    refreshEntitlement: async () => reachable,
    showView: (view) => events.push(view), showToast: (message) => events.push(message), showTierNotice: (message) => events.push(message),
    renderPaddleBilling() {},
    syncEditorURL() {},
    paddleBillingBox: { hidden: false },
    planSheet: { open: false, showModal() { this.open = true; events.push("plan-sheet"); } },
    planSheetBody: { append() {} }, planSheetTitle: { textContent: "" },
    paddleSubscribe: { focus: () => events.push("purchase") },
    activeDraftId: null, editor: { value: "Unsaved text", readOnly: false }, draftToSchedule: drafts[0],
    closeDraftScheduleDialog: () => events.push("close-dialog"),
    window: { confirm: () => { events.push("delete-confirm"); return true; } },
    DRAFTS_KEY: "drafts", readStore: () => drafts,
    writeStore: () => events.push("write"), renderDraftTable: () => context.updateSaveDraftButton(), syncAndMergeDrafts: async () => {},
    cleanText: () => "Unsaved text", titleFromBody: (body) => body,
    draftAttachmentPayload: async () => null, keepRemoteImage: false,
    nowIso: () => new Date().toISOString(), crypto: { randomUUID: () => "new" },
    restoreDraftAttachment: async () => {}, placeCursorAtEnd() {}, renderPreview() {},
    document: { getElementById: (id) => controls[id], querySelectorAll: () => formatControls }, publishLinkedIn: lockable()
  });
  const formatControls = [{ id: "blockFormat", disabled: false }, { id: "naturalizeEnglish", disabled: false }, { id: "openEmojiPicker", disabled: false }, { id: "showPreview", disabled: false }];
  const controls = { saveDraft: lockable(), scheduleMenu: { querySelector: () => controls.scheduleSummary }, scheduleSummary: lockable() };
  vm.runInContext([
    section("  function shouldBlockNewDraft()", "  let imageEditorImage"),
    section("  function hasDraftAccess()", "  async function syncDrafts("),
    section("  async function saveDraft(", "  function defaultScheduleDate()"),
    section("  async function scheduleCurrentDraft()", "  function openImageEditor()"),
    section("  async function confirmDraftSchedule()", "  async function refreshScheduledPosts()")
  ].join("\n"), context);
  const deleteListener = section('      deleteButton.addEventListener("click",', "      actions.append(");
  context.deleteButton = { addEventListener: (_, callback) => { context.deleteDraft = callback; } };
  context.draft = drafts[0];
  vm.runInContext(deleteListener, context);
  return { context, events, drafts, formatControls };
}

for (const action of ["deleteDraft", "scheduleCurrentDraft", "confirmDraftSchedule"]) {
  test(`lapsed ${action} opens the plan sheet in place without changing drafts`, async () => {
    const { context, events, drafts } = setup();
    await context[action](action === "deleteDraft" ? { stopPropagation() {} } : drafts[0]);
    assert(events.includes("purchase"));
    assert(events.includes("plan-sheet"));
    assert(!events.includes("settings"));
    assert(!events.includes("write"));
    assert(!events.includes("delete-confirm"));
    assert.equal(context.editor.value, "Unsaved text");
    assert.equal(context.activeDraftId, null);
    assert.equal(drafts.length, 1);
  });
}

for (const entitlement of [
  { ...expired, tier: "trial", accessUntil: "2999-01-01", draftLimit: 50 },
  { ...expired, tier: "pro", isPro: true, subscriptionSource: "paddle", draftLimit: 50 },
  { ...expired, tier: "pro", isPro: true, subscriptionSource: "apple", draftLimit: 50 }
]) {
  test(`active ${entitlement.subscriptionSource} can save, edit, and delete`, async () => {
    const { context, events, drafts } = setup(entitlement);
    assert.equal(await context.saveDraft(), true);
    await context.openDraft(drafts[0]);
    assert.equal(context.activeDraftId, "new");
    assert.equal(await context.saveDraft(), true);
    await context.deleteDraft({ stopPropagation() {} });
    assert(events.includes("write"));
    assert(events.includes("delete-confirm"));
    assert(!events.includes("purchase"));
    assert.equal(await context.requireDraftAccess(true), true);
  });
}

test("subscription lookup failure keeps text and does not request payment", async () => {
  const { context, events } = setup(expired, false);
  assert.equal(await context.saveDraft(), false);
  assert(!events.includes("purchase"));
  assert(!events.includes("write"));
  assert.equal(context.editor.value, "Unsaved text");
  assert(events.some((event) => event.includes("Please try again")));
});

test("lapsed draft limit opens purchase options without saving another draft", async () => {
  const { context, events, drafts } = setup({ ...expired, draftLimit: 1 });
  assert.equal(await context.saveDraft(), false);
  assert(events.includes("purchase"));
  assert(!events.includes("write"));
  assert.equal(drafts.length, 1);
});

test("trial or pro draft limit does not ask to buy again", async () => {
  const { context, events } = setup({ ...expired, tier: "trial", draftLimit: 1 });
  assert.equal(await context.saveDraft(), false);
  assert(!events.includes("purchase"));
  assert(!events.includes("write"));
});

test("tier is rendered from the server, not derived from isPro or accessUntil", async () => {
  const { context } = setup({ ...expired, tier: "trial", isPro: false, accessUntil: "" });
  assert.equal(context.hasDraftAccess(), true);
  context.draftSyncAccess = { ...expired, tier: "lapsed", isPro: true, accessUntil: "2999-01-01" };
  assert.equal(context.hasDraftAccess(), false);
});

test("plan box stays visible with a buy path when Paddle is unavailable", () => {
  const el = () => ({ hidden: true, disabled: false, textContent: "", style: {}, parentElement: {} });
  const context = vm.createContext({
    Date, CONFIG: {}, window: {}, linkedInCredential: () => ({ memberId: "member" }),
    draftSyncAccess: expired, renderTierBanner() {},
    paddleBillingBox: el(), paddleSubscribe: el(), paddleSubscribeYearly: el(), paddleManage: el(),
    paddleBillingTitle: el(), paddleBillingStatus: el(), trialProgress: el()
  });
  vm.runInContext(section("  function renderPaddleBilling()", "  function initializePaddle()"), context);
  context.renderPaddleBilling();
  assert.equal(context.paddleBillingBox.hidden, false);
  assert.equal(context.paddleSubscribe.hidden, false);
});

test("lapsed opens a saved draft read-only without asking to buy", async () => {
  const { context, events, drafts } = setup();
  await context.openDraft(drafts[0]);
  assert.equal(context.activeDraftId, "saved");
  assert.equal(context.editor.value, "Original draft");
  assert.equal(context.editor.readOnly, true);
  assert(!events.includes("plan-sheet"));
  assert(context.publishLinkedIn.classList.contains("is-locked"));
});

test("lapsed saves a new draft under 5, then it is frozen and Save opens the plan sheet", async () => {
  const { context, events, drafts } = setup();
  assert.equal(await context.saveDraft(), true);
  assert.equal(drafts.length, 2);
  assert(events.includes("Saved. Without a plan, drafts can't be edited, deleted, or published."));
  assert.equal(context.editor.readOnly, true);
  assert.equal(await context.saveDraft(), false);
  assert(events.includes("plan-sheet"));
  assert.equal(drafts.length, 2);
});

test("lapsed read-only draft disables text-changing controls; a new draft stays editable", async () => {
  const { context, drafts, formatControls } = setup();
  await context.openDraft(drafts[0]);
  const disabled = () => Object.fromEntries(formatControls.map((control) => [control.id, control.disabled]));
  assert.equal(JSON.stringify(disabled()), JSON.stringify({ blockFormat: true, naturalizeEnglish: true, openEmojiPicker: true, showPreview: false }));
  context.activeDraftId = null;
  context.updateSaveDraftButton();
  assert(formatControls.every((control) => !control.disabled));
  assert.equal(context.editor.readOnly, false);
});

test("plan box title follows the server tier", () => {
  const el = () => ({ hidden: true, disabled: false, textContent: "", style: {}, parentElement: {} });
  for (const [entitlement, title] of [
    [{ ...expired, tier: "trial", accessUntil: "2999-01-01" }, "Trial"],
    [{ ...expired, tier: "pro", isPro: true, subscriptionSource: "paddle" }, "Pro"],
    [expired, "No active plan"],
    [{ ...expired, subscriptionSource: "paddle", accessUntil: "" }, "No active plan"]
  ]) {
    const context = vm.createContext({
      Date, CONFIG: {}, window: {}, linkedInCredential: () => ({ memberId: "member" }),
      draftSyncAccess: entitlement, renderTierBanner() {},
      paddleBillingBox: el(), paddleSubscribe: el(), paddleSubscribeYearly: el(), paddleManage: el(),
      paddleBillingTitle: el(), paddleBillingStatus: el(), trialProgress: el()
    });
    vm.runInContext(section("  function renderPaddleBilling()", "  function initializePaddle()"), context);
    context.renderPaddleBilling();
    assert.equal(context.paddleBillingTitle.textContent, title);
  }
});
