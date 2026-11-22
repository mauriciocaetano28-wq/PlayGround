/* Áudio 100% procedural — funk, rap, sertanejo, pagode, sirene, motor e efeitos */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.engineGain = null;
    this.engineOsc = null;
    this.engineOsc2 = null;
    this.noiseBuffer = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.genre = 'funk';
    this.musicOn = true;
    this.sirenNodes = null;
    this.volume = .65;
    this.engineOn = false;
    this._lastFoot = 0;
  }

  init() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = .22;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = .6;
    this.sfxGain.connect(this.master);
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineGain.connect(this.master);
    this.noiseBuffer = this.makeNoise(2);
    this.ambient();
  }

  makeNoise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, .08);
  }

  tone(freq, dur = .1, type = 'sine', gain = .2, delay = 0, slide = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + .008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + .03);
  }

  noise(dur = .2, gain = .2, filter = 1200, delay = 0, q = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = filter; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t); src.stop(t + dur + .02);
  }

  click() { this.tone(920, .04, 'square', .05, 0, 600); }
  hover() { this.tone(520, .025, 'sine', .025); }
  boot() {
    this.tone(110, 2.2, 'sine', .18, 0, 220);
    this.tone(220, 1.6, 'triangle', .08, .2, 440);
    this.tone(330, 1.2, 'sine', .05, .55, 660);
    this.tone(880, .5, 'sine', .04, 1.1, 1320);
    this.noise(1.2, .025, 3000, .1, .7);
  }
  powerOff() { this.tone(420, .6, 'sine', .08, 0, 80); this.noise(.4, .03, 600); }
  cash() { [880, 1100, 1320].forEach((f, i) => this.tone(f, .15, 'triangle', .07, i * .06)); }
  uiError() { this.tone(180, .18, 'sawtooth', .06, 0, 110); }
  gunshot() {
    this.noise(.12, .55, 900, 0, .6);
    this.noise(.05, .4, 3200, .01, 1);
    this.tone(70, .18, 'sine', .25, 0, 40);
  }
  suppressed() { this.noise(.06, .2, 1700); this.tone(180, .05, 'sine', .06, 0, 90); }
  punch() { this.noise(.08, .28, 220, 0, .8); this.tone(90, .12, 'sine', .2, 0, 50); }
  hit() { this.noise(.09, .22, 480); this.tone(130, .1, 'square', .08, 0, 70); }
  jump() { this.tone(300, .12, 'sine', .06, 0, 500); }
  footstep(run = false) {
    const now = performance.now();
    if (now - this._lastFoot < (run ? 210 : 340)) return;
    this._lastFoot = now;
    this.noise(run ? .06 : .04, run ? .07 : .04, run ? 280 : 190, 0, .9);
  }
  horn() {
    this.tone(390, .35, 'sawtooth', .1);
    this.tone(490, .35, 'sawtooth', .07);
  }
  sirenStart() {
    if (!this.ctx || this.sirenNodes) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lg = this.ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = 720;
    lfo.frequency.value = 2.2; lg.gain.value = 280;
    lfo.connect(lg); lg.connect(o.frequency);
    g.gain.value = .035;
    o.connect(g); g.connect(this.sfxGain);
    o.start(); lfo.start();
    this.sirenNodes = { o, lfo, g };
  }
  sirenStop() {
    if (!this.sirenNodes) return;
    const { o, lfo, g } = this.sirenNodes;
    g.gain.setTargetAtTime(0, this.ctx.currentTime, .15);
    setTimeout(() => { try { o.stop(); lfo.stop(); } catch {} }, 500);
    this.sirenNodes = null;
  }
  explosion() {
    this.noise(1.3, .8, 160, 0, .5);
    this.noise(.7, .5, 800, .05, .4);
    this.tone(45, 1.1, 'sine', .5, 0, 22);
  }
  thunder() {
    this.noise(1.8, .35, 180, 0, .4);
    this.noise(.8, .2, 600, .1, .5);
    this.tone(40, 1.5, 'sine', .18, 0, 25);
  }
  splash() { this.noise(.35, .18, 1000, 0, .5); }
  crash() { this.noise(.35, .35, 500, 0, .4); this.tone(60, .3, 'square', .18, 0, 35); }
  reload() { this.tone(500, .05, 'square', .06); this.tone(320, .05, 'square', .06, .18); this.tone(600, .04, 'square', .05, .32); }
  carDoor() { this.noise(.12, .18, 300, 0, .6); this.tone(110, .12, 'sine', .08, 0, 70); }
  whistle() { this.tone(1400, .2, 'sine', .05, 0, 1900); }

  ambient() {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 280;
    const g = this.ctx.createGain(); g.gain.value = .025;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start();
  }

  startEngine() {
    if (!this.ctx || this.engineOn) return;
    this.engineOn = true;
    const o = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = 55;
    o2.type = 'square'; o2.frequency.value = 28;
    f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 2;
    g.gain.value = .0001;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.master);
    o.start(); o2.start();
    g.gain.setTargetAtTime(.07, this.ctx.currentTime, .2);
    this.engineOsc = o; this.engineOsc2 = o2; this.engineGain = g;
  }
  updateEngine(speed, rpm, throttle) {
    if (!this.ctx || !this.engineOsc) return;
    const base = 42 + rpm * .09 + speed * .12;
    this.engineOsc.frequency.setTargetAtTime(base, this.ctx.currentTime, .06);
    this.engineOsc2.frequency.setTargetAtTime(base * .5, this.ctx.currentTime, .06);
    if (this.engineGain) this.engineGain.gain.setTargetAtTime(.035 + throttle * .045, this.ctx.currentTime, .08);
  }
  stopEngine() {
    if (!this.ctx || !this.engineOn) return;
    this.engineOn = false;
    try {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, .12);
      this.engineOsc.stop(this.ctx.currentTime + .5);
      this.engineOsc2.stop(this.ctx.currentTime + .5);
    } catch {}
    this.engineOsc = null;
  }

  setGenre(genre) {
    this.genre = genre;
    if (!this.musicOn) return;
    if (!this.musicTimer) this.startMusic();
  }
  startMusic() {
    if (!this.ctx) return;
    if (this.musicTimer) return;
    this.musicStep = 0;
    const tick = () => {
      if (!this.musicOn || !this.ctx) return;
      this.playStep(this.genre, this.musicStep++);
    };
    this.musicTimer = setInterval(tick, 150);
    tick();
  }
  stopMusic() { if (this.musicTimer) clearInterval(this.musicTimer); this.musicTimer = null; }
  toggleMusic(on) { this.musicOn = on; if (on) this.startMusic(); else this.stopMusic(); }

  playStep(genre, step) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = step % 16;
    const play = (freq, dur, type, gain) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(this.musicGain);
      o.start(t); o.stop(t + dur + .02);
    };
    const kick = (gain = .22) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .16);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + .18);
      o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + .2);
    };
    const snare = () => this.noise(.08, .08, 2200, 0, .7);
    const bass = (freq) => play(freq, .18, 'triangle', .13);

    if (genre === 'funk') {
      if ([0, 3, 6, 10, 12].includes(s)) kick();
      if ([4, 12].includes(s)) snare();
      if ([2, 7, 10, 14].includes(s)) play(1400, .035, 'square', .025);
      const bassNotes = [55, 55, 65, 73, 55, 82, 73, 65];
      if ([0, 3, 6, 8, 11, 14].includes(s)) bass(bassNotes[(step / 2 | 0) % 8]);
      if (s === 0) play(220, .12, 'sawtooth', .02);
    } else if (genre === 'rap') {
      if ([0, 4, 8, 12].includes(s)) kick(.26);
      if ([4, 12].includes(s)) snare();
      if (s % 2 === 0) this.noise(.025, .02, 6000, 0, 1);
      if ([0, 6, 10].includes(s)) bass(43.65);
      if ([2, 5, 8, 14].includes(s)) play(110, .4, 'sine', .025);
    } else if (genre === 'sertanejo') {
      if ([0, 4, 8, 12].includes(s)) kick(.16);
      if ([4, 12].includes(s)) snare();
      if ([0, 2, 4, 6, 8, 10, 12, 14].includes(s)) {
        const notes = [196, 247, 294, 330, 294, 247, 220, 196];
        play(notes[(step / 2 | 0) % 8], .12, 'triangle', .05);
      }
      if ([0, 8].includes(s)) bass(98);
      if (s === 7 || s === 15) play(392, .1, 'sine', .03);
    } else {
      if ([0, 3, 8, 11].includes(s)) kick(.15);
      if ([4, 12].includes(s)) snare();
      if ([0, 2, 4, 7, 9, 12, 14].includes(s)) {
        const notes = [262, 330, 392, 440, 392, 330, 294, 262];
        play(notes[(step / 3 | 0) % 8], .16, 'sine', .045);
      }
      if ([0, 6, 10].includes(s)) bass(65);
      if (s % 4 === 2) this.noise(.03, .015, 5000, 0, 1);
    }
  }

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR'; u.rate = 1.04; u.pitch = .92; u.volume = .8;
      const voices = speechSynthesis.getVoices();
      const pt = voices.find(v => v.lang?.toLowerCase().startsWith('pt-br')) || voices.find(v => v.lang?.toLowerCase().startsWith('pt'));
      if (pt) u.voice = pt;
      speechSynthesis.speak(u);
    } catch {}
  }
}
