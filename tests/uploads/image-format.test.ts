import assert from "node:assert/strict";
import test from "node:test";
import { getUploadImageFormat, hasValidImageSignature } from "../../lib/uploads/image-format.ts";

test("upload image format requires matching extension and MIME type", () => {
  assert.deepEqual(getUploadImageFormat(".jpg", "image/jpeg"), { extension: ".jpg", mimeType: "image/jpeg" });
  assert.equal(getUploadImageFormat(".jpg", "image/png"), null);
  assert.equal(getUploadImageFormat(".gif", "image/gif"), null);
});

test("upload image signatures recognize JPEG, PNG, and WebP", () => {
  const jpeg = getUploadImageFormat(".jpeg", "image/jpeg")!;
  const png = getUploadImageFormat(".png", "image/png")!;
  const webp = getUploadImageFormat(".webp", "image/webp")!;

  assert.equal(hasValidImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]), jpeg), true);
  assert.equal(hasValidImageSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), png), true);
  assert.equal(hasValidImageSignature(new TextEncoder().encode("RIFF0000WEBP"), webp), true);
  assert.equal(hasValidImageSignature(new TextEncoder().encode("not an image"), jpeg), false);
});
