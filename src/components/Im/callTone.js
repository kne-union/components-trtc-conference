let ctx = null;
let gainNode = null;
let oscillators = [];
let timer = null;
let playing = false;

const ensureContext = () => {
  if (ctx) {
    return ctx;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    return null;
  }
  ctx = new AudioContext();
  return ctx;
};

const clearTimer = () => {
  if (timer) {
    window.clearTimeout(timer);
    timer = null;
  }
};

const ramp = value => {
  if (!ctx || !gainNode) {
    return;
  }
  const now = ctx.currentTime;
  const current = Math.max(gainNode.gain.value, 0.001);
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(current, now);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(value, 0.001), now + 0.1);
};

// coach ConnectionSounds：440Hz + 480Hz，响 1 秒、停 0.5 秒
const scheduleSilence = () => {
  timer = window.setTimeout(() => {
    if (!playing) {
      return;
    }
    ramp(0.001);
    timer = window.setTimeout(() => {
      if (!playing) {
        return;
      }
      ramp(0.1);
      scheduleSilence();
    }, 500);
  }, 1000);
};

const begin = () => {
  if (!playing || !ctx || gainNode) {
    return;
  }
  gainNode = ctx.createGain();
  gainNode.gain.value = 0.1;
  gainNode.connect(ctx.destination);
  [440, 480].forEach(frequency => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gainNode);
    osc.start();
    oscillators.push(osc);
  });
  scheduleSilence();
};

export const startCallTone = () => {
  const context = ensureContext();
  if (!context || playing) {
    return;
  }
  playing = true;
  const run = () => {
    if (playing) {
      begin();
    }
  };
  if (context.state === 'running') {
    run();
    return;
  }
  context.resume().then(run);
};

export const stopCallTone = () => {
  playing = false;
  clearTimer();
  oscillators.splice(0).forEach(osc => {
    try {
      osc.stop();
    } catch (error) {
      // already stopped
    }
  });
  if (gainNode) {
    try {
      gainNode.disconnect();
    } catch (error) {
      // already disconnected
    }
    gainNode = null;
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => {
    const context = ensureContext();
    if (context && context.state === 'suspended') {
      context.resume();
    }
  });
}
