/* ============================================================
   Procedural audio — original synthesis, no external samples
   ============================================================ */
export class AudioSystem {
  constructor(settings = {}) {
    this.settings = settings;
    this.ctx = null;
    this.ready = false;
    this.enabled = true;
    this.musicOn = true;
    this.nextChord = 0;
    this.chordIndex = 0;
    this.time = 0;
    this.engineLevel = 0;
    this.sirenLevel = 0;
    this.muted = false;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(c.destination);
      this.musicGain = c.createGain(); this.musicGain.gain.value = 0.55; this.musicGain.connect(this.master);
      this.sfxGain = c.createGain(); this.sfxGain.gain.value = 0.8; this.sfxGain.connect(this.master);
      this.engineGain = c.createGain(); this.engineGain.gain.value = 0.65; this.engineGain.connect(this.master);
      this.voiceGain = c.createGain(); this.voiceGain.gain.value = 0.9; this.voiceGain.connect(this.master);

      this.noiseBuffer = this._makeNoise(2.0);
      this._startOcean();
      this._startEngine();
      this._startSiren();
      this.ready = true;
      this.nextChord = c.currentTime + 0.6;
      this.setVolumes(this.settings);
    } catch (e) {
      console.warn('Audio unavailable', e);
    }
  }

  _makeNoise(seconds = 1) {
    const c = this.ctx;
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.96 + white * 0.04;
      d[i] = last * 2.4;
    }
    return buf;
  }

  _startOcean() {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.4;
    const g = c.createGain(); g.gain.value = 0.055;
    src.connect(lp); lp.connect(g); g.connect(this.sfxGain);
    src.start();
    // gentle swell
    const lfo = c.createOscillator(); lfo.frequency.value = 0.08;
    const lg = c.createGain(); lg.gain.value = 0.022;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    this.oceanGain = g;
  }

  _startEngine() {
    const c = this.ctx;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 50;
    const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 100;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 2;
    const g = c.createGain(); g.gain.value = 0;
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.engineGain);
    o1.start(); o2.start();
    this.engineOsc1 = o1; this.engineOsc2 = o2; this.engineFilter = lp; this.engineVol = g;
    // tyre/road noise
    const ns = c.createBufferSource(); ns.buffer = this.noiseBuffer; ns.loop = true;
    const nf = c.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 900; nf.Q.value = 0.8;
    const ng = c.createGain(); ng.gain.value = 0;
    ns.connect(nf); nf.connect(ng); ng.connect(this.engineGain);
    ns.start();
    this.roadNoise = ng;
  }

  _startSiren() {
    const c = this.ctx;
    const o1 = c.createOscillator(); o1.type = 'square'; o1.frequency.value = 680;
    const o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 910;
    const g = c.createGain(); g.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1600;
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.sfxGain);
    o1.start(); o2.start();
    this.sirenOsc1 = o1; this.sirenOsc2 = o2; this.sirenVol = g;
  }

  setVolumes(s) {
    if (!this.ready) return;
    this.settings = s;
    const v = this.muted ? 0 : 1;
    this.master.gain.setTargetAtTime((s.volMaster ?? 80) / 100 * v, this.ctx.currentTime, 0.05);
    this.musicGain.gain.setTargetAtTime((s.volMusic ?? 55) / 100, this.ctx.currentTime, 0.05);
    this.sfxGain.gain.setTargetAtTime((s.volSfx ?? 80) / 100, this.ctx.currentTime, 0.05);
    this.engineGain.gain.setTargetAtTime((s.volEngine ?? 65) / 100, this.ctx.currentTime, 0.05);
    this.voiceGain.gain.setTargetAtTime((s.volVoice ?? 90) / 100, this.ctx.currentTime, 0.05);
  }

  toggleMute() {
    this.muted = !this.muted;
    this.setVolumes(this.settings);
    return this.muted;
  }

  _env(g, t0, a, d, peak = 0.2) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  tone(freq, dur = 0.15, type = 'sine', vol = 0.12, slide = 0, dest = null) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    const g = c.createGain();
    this._env(g, t, 0.008, dur, vol);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  noise(dur = 0.1, vol = 0.2, freq = 1200, q = 0.8, dest = null) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noiseBuffer;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); this._env(g, t, 0.005, dur, vol);
    src.connect(f); f.connect(g); g.connect(dest || this.sfxGain);
    src.start(t); src.stop(t + dur + 0.05);
  }

  play(name, opts = {}) {
    if (!this.ready) return;
    switch (name) {
      case 'ui': this.tone(520, 0.05, 'sine', 0.06, 120); break;
      case 'ui-back': this.tone(380, 0.06, 'sine', 0.05, -100); break;
      case 'gun':
        this.noise(0.16, 0.5, 900, 0.5);
        this.tone(95, 0.14, 'sine', 0.32, -50);
        this.noise(0.05, 0.2, 3200, 0.7);
        break;
      case 'silenced':
        this.noise(0.06, 0.18, 2200, 1.2);
        this.tone(140, 0.06, 'sine', 0.1, -40);
        break;
      case 'punch': this.tone(80, 0.12, 'sine', 0.3, -30); this.noise(0.08, 0.15, 400, 0.7); break;
      case 'hit': this.noise(0.07, 0.2, 1800, 1); this.tone(320, 0.05, 'square', 0.05, -120); break;
      case 'hurt': this.tone(150, 0.18, 'sawtooth', 0.08, -70); break;
      case 'reload': this.noise(0.05, 0.15, 2500, 1); this.tone(280, 0.05, 'square', 0.04, 80); break;
      case 'horn':
        this.tone(392, 0.4, 'square', 0.07);
        this.tone(494, 0.4, 'square', 0.06);
        break;
      case 'cash':
        [880, 1108, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, 'triangle', 0.08), i * 75));
        break;
      case 'pickup': this.tone(660, 0.08, 'triangle', 0.07); setTimeout(() => this.tone(990, 0.12, 'triangle', 0.07), 70); break;
      case 'wanted': this.tone(220, 0.25, 'sawtooth', 0.1, -80); this.tone(110, 0.3, 'sine', 0.14); break;
      case 'unwanted': this.tone(440, 0.12, 'sine', 0.06); setTimeout(() => this.tone(660, 0.2, 'sine', 0.06), 100); break;
      case 'mission': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.1), i * 130)); break;
      case 'fail': [330, 277, 220].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.08), i * 160)); break;
      case 'checkpoint': this.tone(880, 0.1, 'sine', 0.08); setTimeout(() => this.tone(1320, 0.18, 'sine', 0.08), 90); break;
      case 'enter': this.noise(0.08, 0.08, 700, 0.6); break;
      case 'switch': this.tone(300, 0.1, 'sine', 0.06, 400); this.noise(0.2, 0.05, 1200, 0.4); break;
      case 'splash': this.noise(0.35, 0.16, 700, 0.4); break;
      case 'engine-start': this.tone(60, 0.4, 'sawtooth', 0.1, 60); break;
      case 'boat': this.tone(70, 0.5, 'triangle', 0.06, 30); break;
      case 'objective': this.tone(740, 0.1, 'triangle', 0.07); setTimeout(() => this.tone(988, 0.16, 'triangle', 0.06), 90); break;
      default: this.tone(440, 0.08, 'sine', 0.05);
    }
  }

  update(dt, state = {}) {
    if (!this.ready) return;
    this.time += dt;
    const c = this.ctx;
    // Engine
    const speed = state.speed || 0;
    const driving = !!state.driving;
    const target = driving ? Math.min(1, 0.28 + speed / 160) : 0;
    this.engineLevel += (target - this.engineLevel) * Math.min(1, dt * 5);
    const t = c.currentTime;
    this.engineVol.gain.setTargetAtTime(this.engineLevel * 0.16, t, 0.08);
    this.roadNoise.gain.setTargetAtTime(this.engineLevel * (0.03 + Math.min(0.09, speed / 2400)), t, 0.1);
    const f = 44 + Math.min(1, speed / 130) * 150;
    this.engineOsc1.frequency.setTargetAtTime(f, t, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(f * 2.02, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(260 + speed * 4.2, t, 0.1);

    // Siren
    const siren = state.siren || 0;
    this.sirenLevel += (siren - this.sirenLevel) * Math.min(1, dt * 3);
    const wob = Math.sin(this.time * 5.2) * 0.5 + 0.5;
    this.sirenOsc1.frequency.setTargetAtTime(620 + wob * 280, t, 0.03);
    this.sirenOsc2.frequency.setTargetAtTime(880 + wob * 340, t, 0.03);
    this.sirenVol.gain.setTargetAtTime(this.sirenLevel * 0.045, t, 0.1);

    // Music (menu + free roam) — sparse original bossa/lofi progression
    if (this.musicOn && state.music !== false && this.nextChord < t + 0.8) {
      this._scheduleChord(this.nextChord);
      this.nextChord += 2.7;
    }
  }

  _scheduleChord(at) {
    const c = this.ctx;
    const progressions = [
      [50, 57, 60, 65],   // Dm9
      [43, 50, 53, 59],   // G13
      [48, 55, 59, 64],   // Cmaj9
      [45, 52, 55, 61]    // A7
    ];
    const chord = progressions[this.chordIndex % progressions.length];
    this.chordIndex++;
    chord.forEach((midi, i) => {
      const f = 440 * Math.pow(2, (midi - 69) / 12);
      const o = c.createOscillator(); o.type = i === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.018 - i * 0.002, at + 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 2.4);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
      o.connect(lp); lp.connect(g); g.connect(this.musicGain);
      o.start(at); o.stop(at + 2.6);
    });
    // soft shaker
    const src = c.createBufferSource(); src.buffer = this.noiseBuffer;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at + 0.55);
    g.gain.exponentialRampToValueAtTime(0.008, at + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.72);
    src.connect(f); f.connect(g); g.connect(this.musicGain);
    src.start(at + 0.55); src.stop(at + 0.8);
  }
}
