import { GAME_BY_ID, GAMES } from '../data/games.js';

const KEY = 'ps5lab.state.v1';
const listeners = new Set();

function load() {
  const fallback = {
    installed: [],
    owned: [],
    discs: [],
    wallet: 500,
    totalPlay: 0,
    lastPlayed: null,
    sessions: 0,
  };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return fallback;
    return {
      ...fallback,
      ...raw,
      installed: Array.isArray(raw.installed) ? raw.installed.filter((id) => GAME_BY_ID[id]) : [],
      owned: Array.isArray(raw.owned) ? raw.owned.filter((id) => GAME_BY_ID[id]) : [],
      discs: Array.isArray(raw.discs) ? raw.discs.filter((id) => GAME_BY_ID[id]) : [],
      wallet: typeof raw.wallet === 'number' ? raw.wallet : 500,
    };
  } catch { return fallback; }
}

export const store = {
  state: load(),
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  emit() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch {}
    listeners.forEach((fn) => fn(this.state));
  },
  isInstalled(id) { return this.state.installed.includes(id); },
  isOwned(id) { return this.state.owned.includes(id); },
  hasDisc(id) { return this.state.discs.includes(id); },
  wallet() { return this.state.wallet; },
  buy(id) {
    const game = GAME_BY_ID[id];
    if (!game || this.isOwned(id)) return { ok: true, already: true };
    if (game.price > this.state.wallet) return { ok: false, reason: 'saldo' };
    if (game.price > 0) this.state.wallet = Math.round((this.state.wallet - game.price) * 100) / 100;
    this.state.owned.push(id);
    this.emit();
    return { ok: true };
  },
  addFunds(value = 500) {
    this.state.wallet = Math.round((this.state.wallet + value) * 100) / 100;
    this.emit();
  },
  install(id, via = 'store') {
    const game = GAME_BY_ID[id];
    if (!game) return false;
    if (!this.state.owned.includes(id)) this.state.owned.push(id);
    if (!this.state.installed.includes(id)) this.state.installed.push(id);
    if (via === 'disc' && !this.state.discs.includes(id)) this.state.discs.push(id);
    this.emit();
    return true;
  },
  insertDisc(id) {
    if (!GAME_BY_ID[id]) return false;
    if (!this.state.discs.includes(id)) this.state.discs.push(id);
    this.emit();
    return true;
  },
  uninstall(id) {
    this.state.installed = this.state.installed.filter((g) => g !== id);
    this.emit();
  },
  markPlayed(id, seconds = 0) {
    this.state.lastPlayed = id;
    this.state.sessions = (this.state.sessions || 0) + 1;
    this.state.totalPlay = (this.state.totalPlay || 0) + seconds;
    this.emit();
  },
  get installedGames() { return GAMES.filter((g) => this.state.installed.includes(g.id)); },
  get uninstalledGames() { return GAMES.filter((g) => !this.state.installed.includes(g.id)); },
  reset() {
    this.state = { installed: [], owned: [], discs: [], wallet: 500, totalPlay: 0, lastPlayed: null, sessions: 0 };
    this.emit();
  },
};
