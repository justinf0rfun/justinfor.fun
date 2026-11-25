import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { emailPaperPose, hasEmailDraft, hasText, isEmailAddress, MAX_EMAIL_LENGTH, MAX_MESSAGE_LENGTH, MAX_SUBJECT_LENGTH } from "../src/lib/email-composer.ts";

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
  assert.match(send, /status === "sent" && stage === "waiting"\) notifyReceipt\(\)/);
  assert.doesNotMatch(send, />\s*Email sent\s*</);
});

test("the draft indicator follows actual text without persisting or clearing the draft", () => {
  assert.equal(hasEmailDraft("", " ", "\u200b"), false);
  assert.equal(hasEmailDraft("reader@example.com", "", ""), true);
  assert.equal(hasEmailDraft("", "A note", ""), true);
  assert.equal(hasEmailDraft("", "", "Hello 👋"), true);
});

test("the paper closes exactly onto the native Dock button without stretching text", () => {
  const paper = { left: 300, top: 250, width: 384, height: 400 };
  const button = { left: 560, top: 700, width: 118, height: 44 };
  const pose = emailPaperPose(paper, button);
  assert.equal(paper.left + pose.left, button.left);
  assert.equal(paper.width - pose.left - pose.right, button.width);
  assert.equal(paper.height - pose.top, button.height);
  assert.equal(paper.top + pose.top + pose.travel, button.top);
  const edge = emailPaperPose(paper, { ...button, left: -10, width: 500 });
  assert.ok(edge.left >= 0 && edge.right >= 0 && edge.top >= 0);
});

test("the preview receipt uses the composer’s populated fields and preserves the form", () => {
  const composer = readFileSync(new URL("../src/components/HomeEmail.tsx", import.meta.url), "utf8");
  assert.match(composer, /ref=\{panel\} hidden=\{Boolean\(receipt\)\}/);
  assert.match(composer, /trigger\.current\?\.querySelector\("\.email-icons"\)/);
  assert.match(composer, /<EmailReceipt recipient=\{recipient\} subject=\{receipt\.subject\}/);
  assert.match(composer, /<p>No email was sent\.<\/p>/);
});
