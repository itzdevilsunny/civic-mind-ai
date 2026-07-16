/**
 * AI Walkie-Talkie Radio Dispatch audio synthesizer
 * Uses browser Web Audio API to programmatically synthesize retro radio chirps,
 * white noise static, bandpass filters, and squelch tails.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generates white noise buffer
function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/**
 * Synthesizes a dual-tone preamble walkie-talkie chirp
 */
function playStartChirp(ctx, destination, onDone) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(950, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(1450, ctx.currentTime + 0.12);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(700, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);

  gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(destination);

  osc1.start(ctx.currentTime);
  osc2.start(ctx.currentTime);

  osc1.stop(ctx.currentTime + 0.16);
  osc2.stop(ctx.currentTime + 0.16);

  setTimeout(onDone, 160);
}

/**
 * Synthesizes a burst of white noise for the radio off squelch tail
 */
function playEndSquelch(ctx, destination, onDone) {
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = createNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1200;
  filter.Q.value = 1.0;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

  noiseSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);

  noiseSource.start();
  noiseSource.stop(ctx.currentTime + 0.25);

  setTimeout(onDone, 250);
}

/**
 * Speaks text and overlays walkie-talkie static noise and filtering
 */
export function playRadioDispatch(text, onWaveformUpdate, onDone) {
  if (!window.speechSynthesis) {
    if (onDone) onDone();
    return;
  }

  const ctx = getAudioContext();
  
  // Set up analyser for visualizer
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.connect(ctx.destination);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let animationFrameId = null;

  // Animation frame loop to push frequency data to UI
  const updateWaveform = () => {
    analyser.getByteTimeDomainData(dataArray);
    if (onWaveformUpdate) {
      onWaveformUpdate(Array.from(dataArray));
    }
    animationFrameId = requestAnimationFrame(updateWaveform);
  };

  // Start visualizer loop
  updateWaveform();

  // Create background static noise during speech
  const staticSource = ctx.createBufferSource();
  staticSource.buffer = createNoiseBuffer(ctx);
  staticSource.loop = true;

  const staticFilter = ctx.createBiquadFilter();
  staticFilter.type = 'bandpass';
  staticFilter.frequency.value = 1000;
  staticFilter.Q.value = 0.5;

  const staticGain = ctx.createGain();
  staticGain.gain.setValueAtTime(0.015, ctx.currentTime);

  staticSource.connect(staticFilter);
  staticFilter.connect(staticGain);
  staticGain.connect(analyser);

  // Play flow
  playStartChirp(ctx, analyser, () => {
    // Start background static noise
    staticSource.start();

    // Trigger TTS
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.85; // slightly lower pitch for radio feel

    utterance.onend = () => {
      // Stop background static noise
      try {
        staticSource.stop();
      } catch (e) {}

      // Play end squelch
      playEndSquelch(ctx, analyser, () => {
        // Stop visualizer
        cancelAnimationFrame(animationFrameId);
        if (onWaveformUpdate) {
          onWaveformUpdate([]); // clear
        }
        if (onDone) onDone();
      });
    };

    utterance.onerror = () => {
      try { staticSource.stop(); } catch (e) {}
      cancelAnimationFrame(animationFrameId);
      if (onWaveformUpdate) onWaveformUpdate([]);
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
  });
}
