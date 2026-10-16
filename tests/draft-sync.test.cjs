const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../app.js`, "utf8");
const context = vm.createContext({ titleFromBody: (body) => body, nowIso: () => "2026-10-11T00:00:00Z" });
vm.runInContext(source.slice(source.indexOf("  function draftFromRemote("), source.indexOf("  function bytesToHex(")), context);

const local = {
  id: "draft-1", body: "Old text", updated_at: "2026-10-10T00:00:00Z", synced: true,
  attachment: "cached attachment", imageData: "cached bytes", imageFilename: "photo.jpg",
  imageId: "image-1", imageDownloadUrl: "https://example.com/old.jpg",
  imageMimeType: "image/jpeg", imageSizeBytes: 12, imageChecksumSHA256: "checksum"
};
const remote = { draftId: local.id, body: "New text", updatedAt: "2026-10-11T00:00:00Z" };

test("remote image removal clears cached bytes and every image reference", () => {
  const [merged] = context.mergeDrafts([local], [remote]);
  assert.equal(merged.body, remote.body);
  for (const key of ["attachment", "imageData", "imageFilename", "imageId", "imageDownloadUrl", "imageMimeType", "imageSizeBytes", "imageChecksumSHA256"]) {
    assert.equal(merged[key], null, key);
  }
});

test("same remote image without a download URL retains its cached bytes", () => {
  const [merged] = context.mergeDrafts([local], [{ ...remote, image: { imageId: local.imageId, mimeType: local.imageMimeType, sizeBytes: 12, checksumSHA256: "checksum" } }]);
  assert.equal(merged.imageId, local.imageId);
  assert.equal(merged.imageData, local.imageData);
});

test("replacement remote image does not inherit previous image bytes or metadata", () => {
  const [merged] = context.mergeDrafts([local], [{ ...remote, image: { imageId: "image-2" } }]);
  assert.equal(merged.imageId, "image-2");
  assert.equal(merged.imageData, null);
  assert.equal(merged.imageDownloadUrl, null);
  assert.equal(merged.imageChecksumSHA256, null);
});

test("newer local edits retain their image until synchronization", () => {
  const [merged] = context.mergeDrafts([{ ...local, updated_at: "2026-10-12T00:00:00Z" }], [remote]);
  assert.equal(merged.body, local.body);
  assert.equal(merged.imageData, local.imageData);
});
