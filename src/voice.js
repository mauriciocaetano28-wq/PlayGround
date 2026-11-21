// Character voice director for Matteo 5 · Costa Dourada.
// Uses the device's speech synthesis voices when available (female voices for
// women, male voices for men) and falls back to an original procedural vocal
// synthesizer so every browser still has spoken dialogue.
const FEMALE_NAMES = new Set([
  'LUIZA', 'HELENA', 'DRA HELENA', 'DRA. HELENA', 'NEIDE', 'DONA NEIDE', 'VITORIA',
  'BIA', 'DUDA', 'TATI', 'JULIA', 'MILA', 'SOFIA', 'NINA', 'CRIS', 'ALINE',
  'FERNANDA', 'CAMILA', 'BEATRIZ', 'MARIA', 'LUCIANA', 'JOANA', 'SABRINA'
]);
const MALE_NAMES = new Set([
  'CARLOS', 'RUI', 'CAPITAO RUI', 'CAPITÃO RUI', 'ZECA', 'BETO', 'RAFA', 'NANDO',
  'CAIO', 'DIEGO', 'LEO', 'IGOR', 'TOM', 'VINI', 'DANIEL', 'RICARDO', 'FELIPE',
  'ANTONIO', 'PAULO', 'JOAO', 'MARCOS', 'BRUNO'
]);
const FEMALE_VOICE_HINTS = [
  'female', 'feminina', 'mulher', 'luciana', 'joana', 'maria', 'helena', 'fernanda',
  'camila', 'beatriz', 'sabrina', 'zira', 'aria', 'jenny', 'michelle', 'monica',
  'google portugues do brasil', 'google portuguese'
];
const MALE_VOICE_HINTS = [
  'male', 'masculina', 'homem', 'daniel', 'ricardo', 'felipe', 'antonio', 'paulo',
  'joao', 'marcos', 'bruno', 'jorge', 'david', 'mark', 'george', 'guy', 'fred',
  'thomas', 'alex'
];
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const FORMANTS = {
  a: [780, 1180, 2550],
  e: [500, 1780, 2600],
  i: [310, 2200, 3000],
  o: [470, 900, 2400],
  u: [330, 790, 2250]
};

const strip = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const norm = (value) => strip(value).toUpperCase().trim();
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function vowelOf(text) {
  for (let i = text.length - 1; i >= 0; i--) {
    const c = strip(text[i]).toLowerCase();
    if (VOWELS.has(c)) return c;
  }
  return 'a';
}

function splitSyllables(word) {
  const chars = [...word];
  const isVowel = (c) => VOWELS.has(strip(c).toLowerCase());
  const out = [];
  let current = '';
  for (let i = 0; i < chars.length; i++) {
    current += chars[i];
    if (!isVowel(chars[i])) continue;
    if (i + 1 < chars.length && !isVowel(chars[i + 1])) current += chars[++i];
    out.push(current);
    current = '';
  }
  if (current) {
    if (out.length) out[out.length - 1] += current;
    else out.push(current);
  }
  return out.length ? out : [word];
}

export class VoiceDirector {
  constructor(audio) {
    this.audio = audio;
    this.enabled = true;
    this.volume = .92;
    this.rate = 1;
    this.voices = [];
    this.voiceCache = new Map();
    this.currentUtterance = null;
    this._nodes = new Set();
    this._timers = new Set();
    this._token = 0;
    this._speaking = false;
    this._pollTimer = null;
    this._pollCount = 0;
    this._noise = null;
    this.onState = null;
    this.onVoices = null;
    if (window.speechSynthesis?.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', () => this.refreshVoices());
    }
    this.refreshVoices();
    this._armVoicePoll();
  }

  // ---------------- VOICE CATALOG ----------------
  refreshVoices() {
    const synth = window.speechSynthesis;
    if (!synth) { this.voices = []; return; }
    let list = [];
    try { list = synth.getVoices() || []; } catch { list = []; }
    if (list.length !== this.voices.length || list.some((v, i) => v.voiceURI !== this.voices[i]?.voiceURI)) {
      this.voices = list;
      this.voiceCache.clear();
      if (this.voices.length && this.onVoices) this.onVoices();
    }
  }

  _armVoicePoll() {
    if (this.voices.length || this._pollTimer || this._pollCount >= 18) return;
    this._pollTimer = setTimeout(() => {
      this._pollTimer = null;
      this._pollCount++;
      this.refreshVoices();
      if (!this.voices.length) this._armVoicePoll();
    }, 700);
  }

  _voiceGender(voice) {
    const name = norm(`${voice.name} ${voice.voiceURI || ''}`).toLowerCase();
    if (FEMALE_VOICE_HINTS.some(hint => name.includes(hint))) return 'female';
    if (MALE_VOICE_HINTS.some(hint => name.includes(hint))) return 'male';
    return null;
  }

  resolveVoice(gender, language = 'pt') {
    const key = `${gender}:${language}:${this.voices.length}`;
    if (this.voiceCache.has(key)) return this.voiceCache.get(key);
    if (!this.voices.length) { this.voiceCache.set(key, null); return null; }
    const pt = language !== 'en';
    const target = pt ? 'pt' : 'en';
    const exact = pt ? /^pt[-_]br/i : /^en[-_]us/i;
    let best = null;
    let bestScore = -Infinity;
    for (const voice of this.voices) {
      const lang = String(voice.lang || '').toLowerCase();
      let score = 0;
      if (!lang.startsWith(target)) score -= 120;
      if (exact.test(lang)) score += 30;
      else if (lang.startsWith(target)) score += 12;
      const hint = this._voiceGender(voice);
      if (hint === gender) score += 70;
      else if (hint && hint !== gender) score -= 80;
      if (voice.localService) score += 5;
      if (voice.default) score += 3;
      if (score > bestScore) { bestScore = score; best = voice; }
    }
    this.voiceCache.set(key, best);
    return best;
  }

  genderFor(line = {}) {
    if (line.gender === 'female' || line.gender === 'male') return line.gender;
    if (line.portrait === 'carlos') return 'male';
    if (line.portrait === 'luiza') return 'female';
    const full = norm(line.name);
    if (FEMALE_NAMES.has(full)) return 'female';
    if (MALE_NAMES.has(full)) return 'male';
    const first = norm(full.replace(/^(DRA?\.?|DONA|CAPITAO|SENHOR|SENHORA)\s+/, '').split(/\s+/)[0]);
    if (FEMALE_NAMES.has(first)) return 'female';
    if (MALE_NAMES.has(first)) return 'male';
    if (/A$/.test(first) && !/^(RAFA|JOA|NOA)$/.test(first)) return 'female';
    return 'male';
  }

  status(language = 'pt') {
    const pt = language !== 'en';
    if (!window.speechSynthesis) {
      return { mode: 'fallback', label: pt ? 'Síntese vocal local ativa' : 'Local vocal synth active' };
    }
    this.refreshVoices();
    const langVoices = this.voices.filter(v => String(v.lang || '').toLowerCase().startsWith(pt ? 'pt' : 'en'));
    if (!this.voices.length) {
      return { mode: 'fallback', label: pt ? 'Sem vozes instaladas · síntese local ativa' : 'No voices installed · local synth active' };
    }
    const female = this.resolveVoice('female', language);
    const male = this.resolveVoice('male', language);
    const distinct = female && male && female.voiceURI !== male.voiceURI;
    const count = langVoices.length || this.voices.length;
    return {
      mode: 'device',
      count,
      female: female?.name || '',
      male: male?.name || '',
      label: distinct
        ? (pt ? `${count} vozes IA no dispositivo · F / M` : `${count} AI voices on device · F / M`)
        : (pt ? 'Voz IA do dispositivo · tom F / M' : 'Device AI voice · F / M pitch')
    };
  }

  configure(settings = {}) {
    this.enabled = settings.voiceEnabled !== false;
    this.volume = clamp(Number(settings.voiceVolume ?? this.volume), 0, 1);
    if (!this.enabled) this.stop();
  }

  // ---------------- SPEECH ----------------
  speak(line, language = 'pt') {
    this._speakLine(line, language, false);
  }

  _speakLine(line, language, force) {
    if (!line) return;
    const text = (language === 'en' ? line.en : line.pt) || line.en || line.pt;
    if (!text) return;
    this.stop();
    if ((!force && !this.enabled) || this.volume <= 0 || this.audio?.muted) return;
    const gender = this.genderFor(line);
    this._last = { text, gender, language };
    if (this._canUseNative()) this._speakNative(text, gender, language);
    else this._speakFallback(text, gender, language);
  }

  test(gender, language = 'pt') {
    const line = gender === 'female'
      ? {
          name: 'LUIZA', gender: 'female',
          pt: 'A maré muda, mas a gente não. Segura firme.',
          en: 'The tide changes, but we do not. Hold steady.'
        }
      : {
          name: 'CARLOS', gender: 'male', portrait: 'carlos',
          pt: 'A cidade cobra caro. Mas hoje quem cobra somos nós.',
          en: 'The city charges a lot. But today we do the charging.'
        };
    this._speakLine(line, language, true);
  }

  stop() {
    this._token++;
    this.currentUtterance = null;
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    for (const id of this._timers) clearTimeout(id);
    this._timers.clear();
    for (const node of this._nodes) {
      try { node.disconnect?.(); } catch {}
    }
    this._nodes.clear();
    this._setSpeaking(false);
  }

  _setSpeaking(value) {
    if (this._speaking === value) return;
    this._speaking = value;
    if (this.onState) this.onState(value);
  }

  _later(fn, ms) {
    const id = setTimeout(() => {
      this._timers.delete(id);
      fn();
    }, ms);
    this._timers.add(id);
    return id;
  }

  _canUseNative() {
    return !!(window.speechSynthesis && window.SpeechSynthesisUtterance && this.voices.length);
  }

  _speakNative(text, gender, language) {
    const token = this._token;
    const voice = this.resolveVoice(gender, language);
    const hint = voice ? this._voiceGender(voice) : null;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice || null;
    utterance.lang = voice?.lang || (language === 'en' ? 'en-US' : 'pt-BR');
    utterance.volume = this.volume;
    utterance.rate = this.rate * (gender === 'female' ? 1.02 : .96);
    // Let the installed voice keep its natural pitch. Only shift the tone when
    // the device has a single generic voice instead of separate F/M voices.
    utterance.pitch = hint === gender ? 1 : (gender === 'female' ? 1.18 : .78);
    let started = false;
    utterance.onstart = () => { if (token === this._token) { started = true; this._setSpeaking(true); } };
    utterance.onend = () => { if (token === this._token) this._setSpeaking(false); };
    utterance.onerror = () => { if (token === this._token) this._setSpeaking(false); };
    this.currentUtterance = utterance;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume?.();
      window.speechSynthesis.speak(utterance);
      // Some embedded browsers expose an empty/broken speech engine. If the
      // utterance never starts, fall back to the procedural voice.
      this._later(() => {
        if (token === this._token && !started && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          try { window.speechSynthesis.cancel(); } catch {}
          this._speakFallback(text, gender, language);
        }
      }, 1400);
    } catch {
      this._speakFallback(text, gender, language);
    }
  }

  _speakFallback(text, gender, language) {
    const audio = this.audio;
    if (!audio) return;
    if (!audio.ctx) audio.init?.();
    const ctx = audio.ctx;
    if (!ctx) return;
    audio.resume?.();
    const bus = audio.voiceBus || audio.sfx || audio.master;
    if (!bus) return;

    const token = this._token;
    const words = String(text).split(/\s+/).filter(Boolean);
    const tokens = [];
    for (const raw of words) {
      const clean = raw.replace(/[^\p{L}\p{N}]+/gu, '');
      if (!clean) { tokens.push({ pause: .12 }); continue; }
      const syllables = splitSyllables(clean).slice(0, 7);
      for (const syllable of syllables) {
        const duration = clamp(.072 + syllable.length * .022 + Math.random() * .02, .085, .19);
        tokens.push({ syllable, duration });
        if (tokens.length >= 68) break;
      }
      if (tokens.length >= 68) break;
      if (/[,;:!?.]$/.test(raw)) tokens.push({ pause: .13 });
    }
    if (!tokens.length) return;

    const scale = clamp(5.9 / tokens.reduce((sum, t) => sum + (t.pause || t.duration + .038), 0), .72, 1.25);
    const t0 = ctx.currentTime + .045;
    const base = gender === 'female' ? 236 : 120;
    const formantScale = gender === 'female' ? 1.12 : .9;
    const question = /\?\s*$/.test(text);
    let cursor = 0;

    const voiceChain = ctx.createGain();
    voiceChain.gain.value = .92;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = gender === 'female' ? 3600 : 3100;
    voiceChain.connect(tone); tone.connect(bus);
    this._nodes.add(voiceChain); this._nodes.add(tone);

    const noise = this._noiseBuffer(ctx);
    let spoken = 0;
    const total = tokens.length;

    for (const item of tokens) {
      if (item.pause) { cursor += item.pause * scale; continue; }
      const duration = item.duration * scale;
      const start = t0 + cursor;
      const end = start + duration;
      const ratio = spoken / Math.max(1, total - 1);
      const rise = question && ratio > .72 ? .22 * ((ratio - .72) / .28) : 0;
      const contour = 1 - ratio * .11 + rise;
      const pitch = base * contour * (.94 + Math.random() * .12);
      const vowel = vowelOf(item.syllable);
      const formants = FORMANTS[vowel] || FORMANTS.a;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, start);
      osc.frequency.linearRampToValueAtTime(pitch * (1 + (Math.random() - .5) * .06), end);
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 4.8 + Math.random() * 1.8;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = gender === 'female' ? 2.8 : 2.1;
      vibrato.connect(vibratoGain); vibratoGain.connect(osc.frequency);

      const env = ctx.createGain();
      const amp = .075 + Math.random() * .025;
      env.gain.setValueAtTime(.0001, start);
      env.gain.linearRampToValueAtTime(amp, start + .016);
      env.gain.linearRampToValueAtTime(amp * .72, start + duration * .62);
      env.gain.exponentialRampToValueAtTime(.0001, end);
      osc.connect(env);

      for (let i = 0; i < 2; i++) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = formants[i] * formantScale;
        filter.Q.value = i === 0 ? 5.5 : 8;
        env.connect(filter); filter.connect(voiceChain);
        this._nodes.add(filter);
      }

      if (/^[bcdfghjklmnpqrstvwxyz]/i.test(item.syllable) && noise) {
        const src = ctx.createBufferSource();
        src.buffer = noise;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 1700 + Math.random() * 1500; f.Q.value = .7;
        const g = ctx.createGain();
        g.gain.setValueAtTime(.028, start);
        g.gain.exponentialRampToValueAtTime(.0001, start + .032);
        src.connect(f); f.connect(g); g.connect(voiceChain);
        src.start(start); src.stop(start + .045);
        this._nodes.add(src); this._nodes.add(f); this._nodes.add(g);
      }

      osc.start(start); osc.stop(end + .02);
      vibrato.start(start); vibrato.stop(end + .02);
      this._nodes.add(osc); this._nodes.add(vibrato); this._nodes.add(vibratoGain);
      this._nodes.add(env);
      cursor += duration + .032 + Math.random() * .022;
      spoken++;
    }

    if (token !== this._token) return;
    this._setSpeaking(true);
    this._later(() => {
      if (token !== this._token) return;
      this._setSpeaking(false);
      for (const node of this._nodes) {
        try { node.disconnect?.(); } catch {}
      }
      this._nodes.clear();
    }, (cursor + .15) * 1000);
  }

  _noiseBuffer(ctx) {
    if (this._noise && this._noise.sampleRate === ctx.sampleRate) return this._noise;
    const length = Math.floor(ctx.sampleRate * .06);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    this._noise = buffer;
    return buffer;
  }
}
