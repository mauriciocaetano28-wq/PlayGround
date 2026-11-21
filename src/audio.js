// Original procedural audio for Matteo 5 · Costa Dourada.
// No external samples: ocean noise, city hum, radio pads and synthesized SFX.
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.started = false;
    this.muted = false;
    this.musicVolume = .45;
    this.sfxVolume = .75;
    this.voiceVolume = .92;
    this.engine = null;
    this.radioTimer = 0;
    this.radioStation = 0;
    this.radioEnabled = true;
    this.stations = ['MARÉ 98.5', 'RÁDIO SOL', 'NEON FM'];
    this._stepTimer = 0;
  }

  init() {
    if (this.started) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : .72;
    this.master.connect(this.ctx.destination);
    this.music = this.ctx.createGain();
    this.music.gain.value = this.musicVolume * .28;
    this.music.connect(this.master);
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = this.sfxVolume * .55;
    this.sfx.connect(this.master);
    // Dedicated bus for character voices, independent from music and SFX.
    this.voiceBus = this.ctx.createGain();
    this.voiceBus.gain.value = this.voiceVolume;
    this.voiceBus.connect(this.master);
    this.buildAmbience();
    this.buildEngine();
    this.started = true;
    this.playRadio();
  }

  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : .72, this.ctx.currentTime, .08);
  }
  setMusic(v) { this.musicVolume = v; if (this.music) this.music.gain.setTargetAtTime(v * .28, this.ctx.currentTime, .15); }
  setSfx(v) { this.sfxVolume = v; if (this.sfx) this.sfx.gain.setTargetAtTime(v * .55, this.ctx.currentTime, .15); }
  setVoiceVolume(v) { this.voiceVolume = v; if (this.voiceBus) this.voiceBus.gain.setTargetAtTime(v, this.ctx.currentTime, .1); }

  buildAmbience() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + .018 * white) / 1.018;
      data[i] = last * 2.4;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 460;
    const gain = ctx.createGain(); gain.gain.value = .12;
    const lfo = ctx.createOscillator(); lfo.frequency.value = .07;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 90;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    src.connect(filter); filter.connect(gain); gain.connect(this.music);
    src.start(); lfo.start();
    this.ambience = { gain };
  }

  buildEngine() {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth'; osc.frequency.value = 46;
    const osc2 = ctx.createOscillator();
    osc2.type = 'square'; osc2.frequency.value = 24;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 190;
    const gain = ctx.createGain(); gain.gain.value = 0;
    osc.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(this.sfx);
    osc.start(); osc2.start();
    this.engine = { osc, osc2, filter, gain };
  }

  engineOn(on) {
    if (!this.engine) return;
    this.engine.gain.gain.setTargetAtTime(on ? .08 : 0, this.ctx.currentTime, .15);
    this.engineActive = on;
  }

  updateEngine(speed, maxSpeed, throttle = 0) {
    if (!this.engine || !this.engineActive) return;
    const t = Math.min(Math.abs(speed) / Math.max(1, maxSpeed), 1);
    const freq = 38 + t * 105 + throttle * 18;
    this.engine.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, .08);
    this.engine.osc2.frequency.setTargetAtTime(freq * .5, this.ctx.currentTime, .08);
    this.engine.filter.frequency.setTargetAtTime(140 + t * 640, this.ctx.currentTime, .08);
    this.engine.gain.gain.setTargetAtTime(.025 + t * .06, this.ctx.currentTime, .12);
  }

  tone(freq, dur, type = 'sine', gain = .08, slide = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    osc.connect(g); g.connect(this.sfx); osc.start(t); osc.stop(t + dur);
  }

  noise(dur = .08, gain = .2, freq = 1200) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buffer;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = .7;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(this.sfx); src.start(t);
  }

  shoot(kind = 'pistol') {
    this.noise(.09, .3, kind === 'smg' ? 2000 : 900);
    this.tone(kind === 'smg' ? 180 : 110, .12, 'sawtooth', .12, -60);
  }
  hit() { this.tone(600, .07, 'square', .06, 200); }
  punch() { this.noise(.06, .14, 240); this.tone(95, .12, 'sine', .1, -30); }
  pickup() { this.tone(660, .12, 'sine', .06); setTimeout(() => this.tone(990, .16, 'sine', .05), 80); }
  cash() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, .15, 'triangle', .05), i * 70)); }
  click() { this.tone(320, .04, 'square', .025, 80); }
  horn() { this.tone(392, .32, 'square', .055, 24); setTimeout(() => this.tone(494, .28, 'square', .045, -18), 40); }
  error() { this.tone(140, .2, 'sawtooth', .05, -40); }
  sirenStart() { if (!this._siren) { this._siren = setInterval(() => { this.tone(740, .22, 'sine', .025, 120); setTimeout(() => this.tone(540, .22, 'sine', .022, -80), 260); }, 850); } }
  sirenStop() { if (this._siren) { clearInterval(this._siren); this._siren = null; } }
  mission() { [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, .5, 'triangle', .045), i * 95)); }
  complete() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, .45, 'sine', .06), i * 110)); }
  footstep() { this.noise(.035, .035, 380); }

  playRadio() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const chords = this.radioStation === 0
      ? [[130.81, 196, 261.63], [110, 164.81, 220], [87.31, 130.81, 174.61], [98, 146.83, 196]]
      : this.radioStation === 1
        ? [[146.83, 220, 293.66], [130.81, 196, 261.63], [174.61, 261.63, 349.23], [146.83, 220, 293.66]]
        : [[98, 146.83, 196], [116.54, 174.61, 233.08], [87.31, 130.81, 174.61], [110, 164.81, 220]];
    const chord = chords[this._chordIdx || 0];
    this._chordIdx = ((this._chordIdx || 0) + 1) % chords.length;
    const now = ctx.currentTime;
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator(); osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq * (this.radioStation === 2 ? 1 : 1);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.linearRampToValueAtTime(.035, now + 1.2);
      gain.gain.linearRampToValueAtTime(.0001, now + 5.6);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      osc.connect(f); f.connect(gain); gain.connect(this.music);
      osc.start(now); osc.stop(now + 5.8);
    });
    const bass = ctx.createOscillator(); bass.type = 'sine'; bass.frequency.value = chord[0] / 2;
    const bg = ctx.createGain(); bg.gain.setValueAtTime(.0001, now); bg.gain.linearRampToValueAtTime(.06, now + .2); bg.gain.exponentialRampToValueAtTime(.0001, now + 2.6);
    bass.connect(bg); bg.connect(this.music); bass.start(now); bass.stop(now + 2.7);
  }

  nextStation() { this.radioStation = (this.radioStation + 1) % this.stations.length; this._chordIdx = 0; this.playRadio(); return this.stations[this.radioStation]; }

  update(dt) {
    if (!this.ctx || !this.radioEnabled) return;
    this.radioTimer += dt;
    if (this.radioTimer > 5.8) { this.radioTimer = 0; this.playRadio(); }
  }
}
