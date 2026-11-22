let ctx = null;
let master = null;
let muted = false;
try { muted = localStorage.getItem('ps5lab.muted') === '1'; } catch {}

function ensure() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
  return ctx;
}

function tone(freq, dur = 0.08, type = 'sine', gain = 0.12, when = 0, slide = 0) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur = 0.1, gain = 0.05) {
  const c = ensure();
  if (!c) return;
  const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buffer;
  g.gain.value = gain;
  src.connect(g).connect(master);
  src.start();
}

export const audio = {
  get muted() { return muted; },
  init() { ensure(); },
  toggle() {
    muted = !muted;
    try { localStorage.setItem('ps5lab.muted', muted ? '1' : '0'); } catch {}
    if (master) master.gain.value = muted ? 0 : 0.5;
    if (!muted) audio.click();
    return muted;
  },
  click() { tone(620, 0.05, 'sine', 0.07); },
  hover() { tone(900, 0.025, 'sine', 0.018); },
  back() { tone(420, 0.08, 'sine', 0.07, 0, -120); },
  success() { [523, 659, 784].forEach((f, i) => tone(f, 0.16, 'sine', 0.09, i * 0.08)); },
  error() { tone(180, 0.18, 'sawtooth', 0.05); },
  install() { tone(340, 0.08, 'triangle', 0.05); tone(510, 0.12, 'sine', 0.04, 0.07); },
  boot() {
    ensure();
    tone(261.6, 0.5, 'sine', 0.1);
    tone(392, 0.55, 'sine', 0.08, 0.12);
    tone(523.2, 0.65, 'sine', 0.07, 0.24);
    tone(784, 0.9, 'sine', 0.055, 0.38);
    tone(1046, 1.2, 'sine', 0.025, 0.5);
    noise(0.5, 0.012);
  },
  launch() {
    ensure();
    tone(180, 0.5, 'triangle', 0.05, 0, 220);
    tone(440, 0.8, 'sine', 0.05, 0.2);
    tone(660, 0.8, 'sine', 0.035, 0.32);
  },
  shoot() { tone(900, 0.05, 'square', 0.03, 0, -500); },
  hit() { tone(120, 0.1, 'sawtooth', 0.05, 0, -40); noise(0.06, 0.03); },
  jump() { tone(360, 0.12, 'sine', 0.05, 0, 240); },
  pickup() { tone(880, 0.09, 'sine', 0.06); tone(1320, 0.13, 'sine', 0.045, 0.06); },
  engine() { /* reserved for game engines */ },
  siren() {
    ensure();
    tone(720, 0.18, 'square', 0.022);
    tone(520, 0.18, 'square', 0.022, 0.19);
  },
  crash() { noise(0.22, 0.12); tone(70, 0.25, 'sawtooth', 0.09); },
  countdown(go = false) {
    if (go) { tone(880, 0.35, 'square', 0.07); tone(1320, 0.4, 'sine', 0.05, 0.02); }
    else tone(440, 0.16, 'square', 0.06);
  },
};
