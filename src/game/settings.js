// Matteo 5 — shared settings store (localStorage, live updates)
const KEY = 'matteo5.settings.v1';

export const DEFAULT_SETTINGS = {
  quality: 'auto',
  resolution: 1,
  shadows: 'high',
  water: 'high',
  drawDistance: 1,
  crowd: 'high',
  showFps: false,
  adaptive: true,
  pixelRatioCap: 1.5,

  sensitivity: 1,
  invertY: false,
  vibration: true,
  aimAssist: true,
  mobileControls: 'auto',
  controlStyle: 'ps5',
  controlScale: 1,
  controlOpacity: 1,
  leftHanded: false,
  minimapScale: 1,

  language: 'pt',
  dualSubtitles: true,
  hudOpacity: 1,
  hudScale: 1,
  dialogueSpeed: 1,
  minimapShape: 'circle',

  master: 0.8,
  music: 0.55,
  sfx: 0.85,
  muted: false,

  tips: true,
};

export const PRESETS = {
  low: { resolution: 0.7, shadows: 'off', water: 'low', drawDistance: 0.65, crowd: 'low', adaptive: true, pixelRatioCap: 1 },
  medium: { resolution: 0.9, shadows: 'low', water: 'high', drawDistance: 0.85, crowd: 'medium', adaptive: true, pixelRatioCap: 1.25 },
  high: { resolution: 1, shadows: 'high', water: 'high', drawDistance: 1, crowd: 'high', adaptive: false, pixelRatioCap: 1.5 },
  ultra: { resolution: 1.25, shadows: 'high', water: 'high', drawDistance: 1.2, crowd: 'high', adaptive: false, pixelRatioCap: 2 },
};

const QUALITY_TO_PRESET = { low: 'low', medium: 'medium', high: 'high', ultra: 'ultra' };

export function loadSettings() {
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { data = {}; }
  const s = { ...DEFAULT_SETTINGS, ...data };
  // Normalize saved values.
  if (!['auto', 'low', 'medium', 'high', 'ultra', 'custom'].includes(s.quality)) s.quality = 'auto';
  if (!['off', 'low', 'high'].includes(s.shadows)) s.shadows = 'high';
  if (!['low', 'high'].includes(s.water)) s.water = 'high';
  if (s.language !== 'en') s.language = 'pt';
  if (!['ps5', 'xbox'].includes(s.controlStyle)) s.controlStyle = 'ps5';
  if (!['auto', 'always', 'never'].includes(s.mobileControls)) s.mobileControls = 'auto';
  return s;
}

export function saveSettings(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ }
}

export function applyPreset(settings, preset) {
  const next = { ...settings, quality: preset };
  if (preset !== 'auto') Object.assign(next, PRESETS[preset]);
  return next;
}

export function presetForQuality(quality) {
  return QUALITY_TO_PRESET[quality] || null;
}

export function setSetting(key, value) {
  const s = loadSettings();
  s[key] = value;
  if (key === 'quality' && value !== 'auto') Object.assign(s, PRESETS[value]);
  saveSettings(s);
  dispatchSettings(s);
  return s;
}

export function resetSettings() {
  const s = { ...DEFAULT_SETTINGS };
  saveSettings(s);
  dispatchSettings(s);
  return s;
}

export function dispatchSettings(settings = loadSettings()) {
  window.dispatchEvent(new CustomEvent('matteo:settings', { detail: settings }));
}

export function detectQuality() {
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (coarse || cores <= 4 || mem <= 4) return 'low';
  if (cores <= 8 || mem <= 8) return 'medium';
  return 'high';
}

export function effectiveGraphics(settings) {
  let g = { ...settings };
  if (settings.quality === 'auto') {
    const base = PRESETS[detectQuality()] || PRESETS.medium;
    g = { ...g, ...base, quality: 'auto' };
  }
  return g;
}

export const QUALITY_LABELS = {
  pt: { auto: 'Automático', low: 'Baixo', medium: 'Médio', high: 'Alto', ultra: 'Ultra', custom: 'Personalizado' },
  en: { auto: 'Auto', low: 'Low', medium: 'Medium', high: 'High', ultra: 'Ultra', custom: 'Custom' },
};
