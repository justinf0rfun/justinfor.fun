import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { hasText, isEmailAddress, MAX_EMAIL_LENGTH, MAX_MESSAGE_LENGTH, MAX_SUBJECT_LENGTH } from "../src/lib/email-composer.ts";

test("composer validation preserves the source's address and invisible-text checks", () => {
  for (const address of ["hello@example.com", "user+note@sub.example.com"]) assert.equal(isEmailAddress(address), true);
  for (const address of ["hello", "a@example", "a b@example.com", "a@b@example.com", "a\n@example.com", 'Name <a@example.com>', `${"a".repeat(255)}@example.com`]) assert.equal(isEmailAddress(address), false);
  for (const message of ["", " \n\t", "\u200b\u200d\u2028"]) assert.equal(hasText(message), false);
  assert.equal(hasText("Hello 👋"), true);
  assert.equal(MAX_EMAIL_LENGTH, 254); assert.equal(MAX_SUBJECT_LENGTH, 150); assert.equal(MAX_MESSAGE_LENGTH, 5000);
});

test("Dock email opens the preview without retaining clipboard or delivery actions", () => {
  const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
  const dock = read("../src/components/HomeDock.astro"), composer = read("../src/components/HomeEmail.tsx"), send = read("../src/components/email-composer/SendButton.tsx");
  assert.match(dock, /data-home-email-trigger/);
  assert.match(dock, /aria-controls="home-email"/);
  assert.doesNotMatch(dock, /data-copy-email|clipboard\.writeText/);
  assert.doesNotMatch(composer + send, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|mailto:|\/api\/contact/);
  assert.match(composer, /event\.preventDefault\(\)/);
  assert.match(composer, /Preview complete\. No email was sent\./);
  assert.doesNotMatch(composer, /form\.current\?\.reset\(\)/);
  assert.match(send, /Preview complete/);
  assert.doesNotMatch(send, />\s*Email sent\s*</);
});
