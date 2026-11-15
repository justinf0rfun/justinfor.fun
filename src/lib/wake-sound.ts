type AudioConstructor = typeof AudioContext;

// Recreated from Bencho Wake Slider's public demo: Notch, position pitch, 28ms gap.
// https://bencho.dev/?c=wake-slider&theme=light
export function createWakeSound(Audio: AudioConstructor | undefined = globalThis.AudioContext
  ?? (globalThis as typeof globalThis & { webkitAudioContext?: AudioConstructor }).webkitAudioContext) {
  let context: AudioContext | undefined;
  let resuming: Promise<void> | undefined;
  let last = -Infinity;

  const unlock = () => {
    try {
      if (!Audio) return;
      if (!context || context.state === "closed") { context = new Audio(); last = -Infinity; }
      if (context.state !== "running" && !resuming) {
        resuming = context.resume().catch(() => {}).finally(() => { resuming = undefined; });
      }
    } catch { /* Audio support must not affect navigation or dragging. */ }
  };
  const play = (position = .5) => {
    try {
      if (!context || context.state !== "running" || context.currentTime - last < .028) return false;
      const now = context.currentTime;
      const pitch = .75 + Math.min(1, Math.max(0, position)) * .75;
      const tone = context.createOscillator(), filter = context.createBiquadFilter(), gain = context.createGain();
      tone.type = "sine"; tone.frequency.setValueAtTime(230 * pitch, now);
      filter.type = "lowpass"; filter.frequency.value = 820;
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(.048, now + .006);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .049);
      tone.connect(filter).connect(gain).connect(context.destination);
      tone.onended = () => { tone.disconnect(); filter.disconnect(); gain.disconnect(); };
      tone.start(now); tone.stop(now + .069); last = now;
      return true;
    } catch { return false; }
  };
  return { unlock, play };
}

export const wakeSound = createWakeSound();
