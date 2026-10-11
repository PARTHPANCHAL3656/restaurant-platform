// Kitchen chime helpers, shared by the Order Management board and Settings.
// The on/off choice is saved per device (localStorage). Nothing here touches
// the browser at import time, and every browser call is guarded, because the
// Cloudflare build pre-renders in Node.

const KEY = 'kdsSound';

// On unless someone has switched it off on this device. Staff logins cannot
// open Settings, so a kitchen screen has to chime without anyone enabling it.
export function isKitchenSoundOn() {
  try {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(KEY) !== 'off';
  } catch (e) {
    return false;
  }
}

export function setKitchenSound(on) {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch (e) { /* storage blocked, nothing to do */ }
}

let audioCtx = null;

export function getKitchenAudio() {
  try {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* no audio available */ }
  return audioCtx;
}

export function playKitchenChime() {
  const ctx = getKitchenAudio();
  if (!ctx) return;
  [660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime + i * 0.18;
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  });
}