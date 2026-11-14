type AudioConstructor = typeof AudioContext;
const webAudio = () => globalThis.AudioContext
  ?? (globalThis as typeof globalThis & { webkitAudioContext?: AudioConstructor }).webkitAudioContext;

// Reference: ehsandesigns.com/app.js, Web Audio click synth (2026-11-14).
export function createReturnSound(Audio: AudioConstructor | undefined = webAudio()) {
  let context: AudioContext | undefined;
  let compressor: DynamicsCompressorNode;
  let noiseBuffer: AudioBuffer;
  let last = -Infinity;
  let resuming: Promise<void> | undefined;

  return async (): Promise<boolean> => {
    try {
      if (!Audio) return false;
      if (!context || context.state === "closed") {
        context = new Audio();
        compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.ratio.value = 6;
        compressor.connect(context.destination);
        noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.03), context.sampleRate);
        const noise = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
        last = -Infinity;
      }
      if (context.state !== "running") {
        resuming ??= context.resume().finally(() => { resuming = undefined; });
        await resuming;
      }
      if (context.state !== "running" || context.currentTime - last < 0.03) return false;
      const now = context.currentTime;
      last = now;
      const pitch = 1 + (Math.random() - 0.5) * 0.12;
      const pan = context.createStereoPanner();
      pan.pan.value = 0;
      pan.connect(compressor);

      const tone = context.createOscillator();
      tone.type = "sine";
      tone.frequency.setValueAtTime(170 * pitch, now);
      tone.frequency.exponentialRampToValueAtTime(110 * pitch, now + 0.04);
      const toneGain = context.createGain();
      toneGain.gain.setValueAtTime(0.0001, now);
      toneGain.gain.exponentialRampToValueAtTime(0.4, now + 0.004);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      tone.connect(toneGain).connect(pan);

      const noise = context.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.playbackRate.value = pitch;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200 * pitch;
      filter.Q.value = 0.8;
      const noiseGain = context.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
      noise.connect(filter).connect(noiseGain).connect(pan);
      tone.onended = () => { for (const node of [tone, toneGain, noise, filter, noiseGain, pan]) node.disconnect(); };
      tone.start(now);
      tone.stop(now + 0.08);
      noise.start(now);
      return true;
    } catch {
      return false;
    }
  };
}
