// Bencho Step / schedule, MIT © 2026 Lorenzo Cabra. See components/bencho/LICENSE.
// https://github.com/cabralorenzo/bencho/blob/main/sounds/sounds.ts
type AudioConstructor = typeof AudioContext;

export function createStepSound(Audio: AudioConstructor | undefined = globalThis.AudioContext
  ?? (globalThis as typeof globalThis & { webkitAudioContext?: AudioConstructor }).webkitAudioContext) {
  let context: AudioContext | undefined, resuming: Promise<void> | undefined;
  let last = -Infinity;
  let active: { tone: OscillatorNode; gain: GainNode } | undefined;
  const stop = () => {
    if (!active || !context) return;
    const voice = active; active = undefined;
    voice.gain.gain.cancelAndHoldAtTime(context.currentTime);
    voice.gain.gain.setTargetAtTime(.0001, context.currentTime, .004);
    voice.tone.stop(context.currentTime + .02);
  };
  const unlock = () => {
    try {
      if (!Audio) return;
      if (!context || context.state === "closed") { context = new Audio(); last = -Infinity; active = undefined; }
      if (context.state !== "running" && !resuming) resuming = context.resume().catch(() => {}).finally(() => { resuming = undefined; });
    } catch { /* Unavailable audio must not affect card navigation. */ }
  };
  const play = () => {
    try {
      if (!context || context.state !== "running" || context.currentTime - last < .06) return false;
      stop();
      const start = context.currentTime + .005, end = start + .311;
      const tone = context.createOscillator(), filter = context.createBiquadFilter(), gain = context.createGain();
      tone.type = "sine";
      tone.frequency.setValueAtTime(227, start);
      tone.frequency.exponentialRampToValueAtTime(114, end);
      filter.type = "lowpass"; filter.frequency.value = 820;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.051, start + .09);
      gain.gain.exponentialRampToValueAtTime(.0001, end);
      tone.connect(filter).connect(gain).connect(context.destination);
      const voice = { tone, gain }; active = voice;
      tone.onended = () => { tone.disconnect(); filter.disconnect(); gain.disconnect(); if (active === voice) active = undefined; };
      tone.start(start); tone.stop(end + .02); last = context.currentTime;
      return true;
    } catch { return false; }
  };
  return { unlock, play, stop };
}

export const stepSound = createStepSound();
