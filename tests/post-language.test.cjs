const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../app.js`, "utf8");
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));

function load() {
  const context = vm.createContext({ SAME_AS_DRAFT: "same" });
  vm.runInContext(section("  function naturalizePrompt(", "  function renderAISettings()"), context);
  return context;
}

test("translates any draft into the chosen language", () => {
  const prompt = load().naturalizePrompt("German");
  assert.match(prompt, /Write the result in German\./);
  assert.match(prompt, /translate it into natural German/);
});

test("keeps the draft language when asked", () => {
  const prompt = load().naturalizePrompt("same");
  assert.match(prompt, /same language as the draft/);
});
