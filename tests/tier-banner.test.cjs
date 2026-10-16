const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../app.js`, "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const lapsedAt = "2026-10-01T12:00:00Z";
const date = new Date(lapsedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

function setup({ tier = "lapsed", subscriptionSource = "trial", credential = { memberId: "m" }, schedules = [] } = {}) {
  const element = () => ({ hidden: true, textContent: "" });
  const context = vm.createContext({
    Date,
    draftSyncAccess: { tier, subscriptionSource, accessUntil: lapsedAt },
    linkedInCredential: () => credential,
    scheduledPosts: schedules,
    tierNotice: null,
    tierBanner: element(), tierBannerText: element(), tierBannerNote: element(), tierBannerAction: element()
  });
  vm.runInContext(section("  function tierBannerContent()", "  function showTierNotice("), context);
  context.renderTierBanner();
  return context;
}

test("trial ended shows the persistent read-only banner with the end date", () => {
  const context = setup();
  assert.equal(context.tierBanner.hidden, false);
  assert.equal(context.tierBannerText.textContent, `Your 14-day trial ended on ${date}. Your drafts are read-only.`);
  assert.equal(context.tierBannerAction.textContent, "See plans");
});

test("subscription ended shows the subscription copy", () => {
  const context = setup({ subscriptionSource: "paddle" });
  assert.equal(context.tierBannerText.textContent, `Your subscription ended on ${date}. Your drafts are read-only.`);
});

test("posts scheduled before the lapse are announced", () => {
  const context = setup({ schedules: [{ draftId: "d", scheduledAt: "2999-01-01T00:00:00Z" }] });
  assert.equal(context.tierBannerNote.hidden, false);
  assert.equal(context.tierBannerNote.textContent, `Posts you scheduled before ${date} will still publish.`);
});

test("no LinkedIn credential asks to connect in any state", () => {
  const context = setup({ tier: "pro", credential: null });
  assert.equal(context.tierBanner.hidden, false);
  assert.equal(context.tierBannerText.textContent, "Connect LinkedIn to open your drafts.");
  assert.equal(context.tierBannerAction.textContent, "Connect");
});

test("trial and pro show no banner", () => {
  for (const tier of ["trial", "pro"]) assert.equal(setup({ tier }).tierBanner.hidden, true);
});

test("an action notice replaces the message and keeps See plans", () => {
  const context = setup({ tier: "lapsed" });
  context.tierNotice = "Publishing needs an active plan.";
  context.renderTierBanner();
  assert.equal(context.tierBannerText.textContent, "Publishing needs an active plan.");
  assert.equal(context.tierBannerAction.textContent, "See plans");
});
