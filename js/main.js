/* GTA 5 BR — inicialização do console PS5 e do mundo aberto */
import { AudioEngine } from './audio.js';
import { PS5System } from './ps5.js';
import { Game } from './game.js';

const audio = new AudioEngine();
let game = null;
let booting = false;

function fatal(error) {
  console.error(error);
  let box = document.getElementById('fatal-error');
  if (!box) {
    box = document.createElement('div');
    box.id = 'fatal-error';
    box.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:32px;background:#050816;color:#fff;font-family:system-ui,sans-serif;text-align:center';
    box.innerHTML = '<h1 style="font-size:22px;color:#ff6b7a">Não foi possível iniciar o jogo</h1>' +
      '<p style="max-width:640px;font-size:13px;color:#a9bdd8">Atualize a página. Se o erro continuar, abra o console do navegador para ver os detalhes.</p>' +
      '<pre id="fatal-detail" style="max-width:90vw;max-height:40vh;overflow:auto;padding:14px;border-radius:10px;background:#0d1730;color:#ffb3bd;font-size:11px;text-align:left"></pre>';
    document.body.appendChild(box);
  }
  const detail = document.getElementById('fatal-detail');
  if (detail) detail.textContent = String(error && (error.stack || error.message) || error);
}

function startGame(profile) {
  if (booting) return;
  booting = true;
  try {
    audio.init();
    audio.setVolume((ps5.settings.volume ?? 65) / 100);
    if (game) { game.dispose(); game = null; }
    game = new Game(audio, ps5, { ...ps5.settings });
    game.profile = profile || ps5.profile;
    game.enter();
    window.app.game = game;
    const box = document.getElementById('fatal-error');
    if (box) box.remove();
  } catch (error) {
    fatal(error);
  } finally {
    booting = false;
  }
}

const ps5 = new PS5System(audio, startGame);

// O console também liga pelo teclado ou por um toque em qualquer lugar da tela de boot.
addEventListener('keydown', event => {
  const boot = document.getElementById('boot-screen');
  if (!boot?.classList.contains('active') || !['Enter', 'Space', 'KeyX', 'NumpadEnter'].includes(event.code)) return;
  event.preventDefault();
  ps5.boot();
});

document.getElementById('boot-screen')?.addEventListener('click', event => {
  if (event.target.closest('#powerBtn')) return;
  ps5.boot();
});

// Mantém o jogo sincronizado com as configurações do sistema PS5.
addEventListener('gta-settings', event => {
  if (game && event.detail) game.applySettings({ ...event.detail });
});

// Só reporta falhas fatais durante a inicialização; durante o gameplay erros não devem derrubar a UI.
addEventListener('error', event => {
  if (booting) fatal(event.error || event.message);
});

window.app = { audio, ps5, game: null };
