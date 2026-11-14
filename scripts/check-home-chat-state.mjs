import assert from "node:assert/strict";
import test from "node:test";
import { chatReducer, FOLLOW_UPS, initialChatState } from "../src/lib/home-chat.ts";

const act = (state, ...types) => types.reduce((current, type) => chatReducer(current, { type }), state);

test("closing voice preserves its visible mode until hidden; reopening starts in text", () => {
  for (const phase of [[], ["voice-start"], ["voice-start", "voice-think", "voice-reply"]]) {
    const voice = act(initialChatState, "open", "voice-enter", ...phase);
    for (const close of ["close", "toggle"]) {
      const closed = act(voice, close);
      assert.equal(closed.open, false);
      assert.equal(closed.mode, "voice", "do not reveal text chat during the closing fade");
      assert.equal(closed.phase, "idle");
      assert.equal(closed.messages, voice.messages);
      assert.equal(act(closed, "voice-think", "voice-reply", "voice-finish"), closed);
      for (const reopen of ["open", "toggle"]) {
        const reopened = act(closed, reopen);
        assert.equal(reopened.open, true);
        assert.equal(reopened.mode, "text");
        assert.equal(reopened.messages, voice.messages);
      }
    }
  }
});

test("guided open is idempotent and does not reset an existing voice conversation", () => {
  const opened = act(initialChatState, "open");
  assert.equal(opened.open, true);
  assert.equal(act(opened, "open"), opened);
  const voice = act(opened, "voice-enter", "voice-start", "voice-think", "voice-reply");
  assert.equal(act(voice, "open"), voice);
  const reopened = act(voice, "close", "open");
  assert.equal(reopened.open, true);
  assert.equal(reopened.mode, "text");
  assert.equal(reopened.messages, voice.messages);
});

test("three preset text turns complete once; duplicate and exhausted sends do nothing", () => {
  assert.equal(act(initialChatState, "send"), initialChatState);
  let state = act(initialChatState, "toggle");
  for (const turn of FOLLOW_UPS) {
    state = act(state, "send");
    assert.equal(state.messages.at(-1).text, turn.ask);
    assert.equal(act(state, "send", "voice-enter"), state);
    state = act(state, "text-reply");
    assert.equal(state.messages.at(-1).text, turn.reply);
    assert.equal(act(state, "text-reply"), state);
  }
  assert.equal(state.step, 3);
  assert.equal(state.messages.length, 7);
  assert.equal(act(state, "send"), state);
  const voice = act(state, "voice-enter");
  assert.equal(act(voice, "voice-start"), voice);
});

test("a pending text reply can finish while closed and survives reopening", () => {
  const pending = act(initialChatState, "toggle", "send", "close");
  assert.equal(pending.open, false);
  assert.equal(pending.replying, true);
  const complete = act(pending, "text-reply", "toggle");
  assert.equal(complete.open, true);
  assert.equal(complete.mode, "text");
  assert.equal(complete.step, 1);
  assert.equal(complete.messages.length, 3);
});

test("voice replies join the same conversation; leaving voice does not close chat", () => {
  let state = act(initialChatState, "toggle", "voice-enter", "voice-start");
  assert.equal(act(state, "voice-start", "send", "voice-enter"), state);
  state = act(state, "voice-think", "voice-reply");
  assert.equal(state.phase, "speaking");
  assert.equal(state.step, 1);
  assert.deepEqual(state.messages.slice(1), [
    { mine: true, text: FOLLOW_UPS[0].ask }, { mine: false, text: FOLLOW_UPS[0].reply },
  ]);
  assert.equal(act(state, "voice-reply"), state);
  state = act(state, "voice-finish");
  assert.equal(state.phase, "idle");
  assert.equal(state.voiceTurn, 0);
  const text = act(state, "voice-exit");
  assert.equal(text.open, true);
  assert.equal(text.mode, "text");
  assert.equal(text.messages, state.messages);
  assert.equal(act(text, "close").open, false);
});

test("exiting or closing cancels listening and thinking without orphan questions", () => {
  for (const phase of [[], ["voice-think"]]) {
    const pending = act(initialChatState, "toggle", "voice-enter", "voice-start", ...phase);
    for (const cancel of ["voice-exit", "close", "toggle"]) {
      const cancelled = act(pending, cancel);
      assert.equal(cancelled.phase, "idle");
      assert.equal(cancelled.voiceTurn, null);
      assert.equal(cancelled.step, 0);
      assert.equal(cancelled.messages.length, 1);
      assert.equal(act(cancelled, "voice-think", "voice-reply", "voice-finish"), cancelled);
    }
  }
});

test("stopping an unfinished voice turn is retryable; stopping a completed one keeps its reply", () => {
  const stopped = act(initialChatState, "toggle", "voice-enter", "voice-start", "voice-think", "voice-stop");
  assert.equal(stopped.mode, "voice");
  assert.equal(stopped.phase, "idle");
  assert.equal(stopped.voiceTurn, null);
  assert.equal(stopped.messages.length, 1);
  assert.equal(act(stopped, "voice-reply"), stopped);
  const completed = act(stopped, "voice-start", "voice-think", "voice-reply", "voice-stop");
  assert.equal(completed.step, 1);
  assert.equal(completed.phase, "idle");
  assert.equal(completed.voiceTurn, 0);
  assert.equal(completed.messages.length, 3);
});

test("mixed text and voice turns share progress and reopen in text mode", () => {
  const state = act(initialChatState, "toggle", "send", "text-reply", "voice-enter", "voice-start", "voice-think", "voice-reply", "close", "toggle", "send", "text-reply");
  assert.equal(state.open, true);
  assert.equal(state.mode, "text");
  assert.equal(state.step, 3);
  assert.deepEqual(state.messages.slice(1).map(message => message.text), FOLLOW_UPS.flatMap(turn => [turn.ask, turn.reply]));
});
