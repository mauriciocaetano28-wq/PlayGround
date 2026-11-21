// Settings panel renderer — shared by the Matteo 5 shell and the in-game pause menu.
import { loadSettings, saveSettings, dispatchSettings, applyPreset, QUALITY_LABELS } from './game/settings.js';
import { makeT } from './game/i18n.js';

const fmtPct = (v) => `${Math.round(v * 100)}%`;
const val = (n) => n;

export function createSettingsUI(container, options = {}) {
  let tab = options.tab || 'graphics';
  let settings = loadSettings();
  const t = () => makeT(loadSettings().language);
  const onChange = options.onChange || (() => {});
  const getSaveInfo = options.getSaveInfo || (() => null);

  const qualityLabel = (key) => {
    const lang = settings.language;
    return QUALITY_LABELS[lang === 'en' ? 'en' : 'pt'][key] || key;
  };

  const row = (label, desc, control, disabled = false) => `
    <div class="setting-row ${disabled ? 'disabled' : ''}">
      <div class="setting-label"><b>${label}</b>${desc ? `<small>${desc}</small>` : ''}</div>
      <div class="setting-control">${control}</div>
    </div>`;

  const segmented = (key, items, value = settings[key], warm = false) => `
    <div class="segmented ${warm ? 'warm' : ''}" role="group">
      ${items.map(([v, label]) => `<button data-set="${key}" data-value="${v}" class="${String(v) === String(value) ? 'active' : ''}">${label}</button>`).join('')}
    </div>`;

  const toggle = (key) => `
    <button class="toggle ${settings[key] ? 'on' : ''}" data-toggle="${key}" aria-pressed="${!!settings[key]}" aria-label="${key}"></button>`;

  const range = (key, min, max, step, label, format = fmtPct, disabled = false) => {
    const v = settings[key];
    const pct = ((v - min) / (max - min)) * 100;
    return `<div class="range-wrap"><input type="range" data-range="${key}" min="${min}" max="${max}" step="${step}" value="${v}" ${disabled ? 'disabled' : ''} style="--fill:${pct}%" /><output>${format(v)}</output></div>
      ${label ? `<span style="font-size:9px;color:var(--muted-2)">${label}</span>` : ''}`;
  };

  const select = (key, items) => `
    <select class="setting-select" data-select="${key}">
      ${items.map(([v, l]) => `<option value="${v}" ${String(settings[key]) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}
    </select>`;

  function render() {
    settings = loadSettings();
    const tr = t();
    const presetName = settings.quality;
    const isPresetAuto = presetName === 'auto';
    let html = '';

    if (tab === 'graphics') {
      html = `
      <div class="settings-page">
        <div class="settings-group">
          <h3>${tr('presets')}</h3>
          ${row(tr('presets'), tr('settingsHint') || 'Escolha um preset ou ajuste cada opção.',
            segmented('quality', [
              ['auto', tr('autoQ')], ['low', tr('low')], ['medium', tr('mediumQ')], ['high', tr('high')], ['ultra', tr('ultraQ')]
            ], presetName, true))}
        </div>
        <div class="settings-group">
          <h3>${tr('graphics')}</h3>
          ${row(tr('resolution'), 'Custo alto · afeta todos os elementos', range('resolution', 0.5, 1.5, 0.05, fmtPct))}
          ${row(tr('shadows'), 'Desative para ganhar desempenho em celulares', segmented('shadows', [['off', tr('off')], ['low', tr('low')], ['high', tr('high')]], settings.shadows))}
          ${row(tr('waterQ'), 'Ondas, espuma e reflexos do oceano', segmented('water', [['low', tr('low')], ['high', tr('high')]], settings.water))}
          ${row(tr('drawDist'), 'Névoa, montanhas e ilhas distantes', range('drawDistance', 0.5, 1.4, 0.05, fmtPct))}
          ${row(tr('crowd'), 'Pedestres, trânsito e densidade da orla', segmented('crowd', [['low', tr('low')], ['medium', tr('mediumQ')], ['high', tr('high')]], settings.crowd))}
        </div>
        <div class="settings-group">
          <h3>${tr('controls')}</h3>
          ${row(tr('showFps'), 'Mostra o contador no canto do HUD', toggle('showFps'))}
          ${row(tr('adaptive'), 'Reduz a resolução automaticamente para manter o alvo', toggle('adaptive'))}
        </div>
        <p class="fineprint">${settings.language === 'en' ? 'Target: 60 FPS on compatible hardware. On weaker devices the low preset disables shadows and raises resolution adaptivity.' : 'Alvo: 60 FPS em hardware compatível. Em aparelhos modestos, o preset baixo desliga sombras e aumenta a adaptatividade da resolução.'}</p>
      </div>`;
    }

    if (tab === 'controls') {
      const touch = matchMedia('(pointer: coarse)').matches;
      html = `
      <div class="settings-page">
        <div class="settings-group">
          <h3>${tr('camera')}</h3>
          ${row(tr('sensitivity'), '', range('sensitivity', 0.3, 2.2, 0.05, (v) => `${v.toFixed(2)}x`))}
          ${row(tr('invertY'), settings.language === 'en' ? 'Classic inverted camera' : 'Câmera clássica invertida', toggle('invertY'))}
          ${row(tr('aimAssist'), settings.language === 'en' ? 'Gentle snap when aiming with a gamepad or touch' : 'Ajuda suave ao mirar com controle ou toque', toggle('aimAssist'))}
        </div>
        <div class="settings-group">
          <h3>${tr('controls')}</h3>
          ${row(tr('vibration'), settings.language === 'en' ? 'Haptic feedback where supported' : 'Retorno háptico quando disponível', toggle('vibration'))}
          ${row(tr('mobileT'), settings.language === 'en' ? 'Show virtual controls on touch devices' : 'Mostrar controles virtuais em dispositivos touch', segmented('mobileControls', [['auto', tr('auto')], ['always', tr('always')], ['never', tr('never')]], settings.mobileControls))}
          ${row(settings.language === 'en' ? 'Control style' : 'Estilo do controle', settings.language === 'en' ? 'PS5 or Xbox button layout' : 'Disposição dos botões PS5 ou Xbox', segmented('controlStyle', [['ps5', 'PS5'], ['xbox', 'Xbox']], settings.controlStyle))}
          ${row(tr('controlSize'), '', range('controlScale', 0.75, 1.35, 0.05, fmtPct), settings.mobileControls === 'never' && !touch)}
          ${row(tr('controlOpacity'), '', range('controlOpacity', 0.35, 1, 0.05, fmtPct), settings.mobileControls === 'never' && !touch)}
          ${row(tr('leftHanded'), settings.language === 'en' ? 'Mirrors sticks and face buttons' : 'Espelha analógicos e botões', toggle('leftHanded'))}
        </div>
        <div class="settings-group">
          <h3>${tr('map')} & ${tr('interface')}</h3>
          ${row(tr('minimapSize'), '', range('minimapScale', 0.8, 1.5, 0.05, (v) => `${v.toFixed(2)}x`))}
          ${row(tr('minimapShape'), '', segmented('minimapShape', [['circle', tr('circle')], ['square', tr('square')]], settings.minimapShape))}
        </div>
        <p class="fineprint">${settings.language === 'en' ? 'Keyboard: WASD move · Shift sprint · Space jump · E vehicle · F talk/punch · RMB aim · LMB fire · R reload · T switch · M map · P phone · Esc pause.' : 'Teclado: WASD mover · Shift correr · Espaço pular · E veículo · F conversar/golpe · botão direito mirar · esquerdo atirar · R recarregar · T trocar · M mapa · P telefone · Esc pausa.'}</p>
      </div>`;
    }

    if (tab === 'interface') {
      html = `
      <div class="settings-page">
        <div class="settings-group">
          <h3>${tr('language')}</h3>
          ${row(tr('languageS'), 'Português (Brasil) · English', segmented('language', [['pt', 'PT-BR'], ['en', 'EN-US']], settings.language))}
          ${row(tr('dualSubs'), settings.language === 'en' ? 'Show the other language under each line' : 'Mostra o outro idioma sob cada fala', toggle('dualSubtitles'))}
        </div>
        <div class="settings-group">
          <h3>${tr('interface')}</h3>
          ${row(tr('hudOpacity'), '', range('hudOpacity', 0.5, 1, 0.05, fmtPct))}
          ${row(tr('hudSize'), '', range('hudScale', 0.85, 1.3, 0.05, fmtPct))}
          ${row(tr('dialogueSpeed'), '', range('dialogueSpeed', 0.5, 2, 0.05, (v) => `${v.toFixed(2)}x`))}
          ${row(tr('showHints'), settings.language === 'en' ? 'Contextual controls and mission tips' : 'Controles contextuais e dicas de missão', toggle('tips'))}
        </div>
        <div class="settings-group">
          <h3>${tr('map')}</h3>
          ${row(tr('minimapSize'), '', range('minimapScale', 0.8, 1.5, 0.05, (v) => `${v.toFixed(2)}x`))}
          ${row(tr('minimapShape'), '', segmented('minimapShape', [['circle', tr('circle')], ['square', tr('square')]], settings.minimapShape))}
        </div>
      </div>`;
    }

    if (tab === 'audio') {
      html = `
      <div class="settings-page">
        <div class="settings-group">
          <h3>${tr('audio')}</h3>
          ${row(tr('volume'), '', range('master', 0, 1, 0.05, fmtPct))}
          ${row(tr('music'), settings.language === 'en' ? 'Original procedural Baía FM' : 'Baía FM procedural original', range('music', 0, 1, 0.05, fmtPct))}
          ${row(tr('sfx'), settings.language === 'en' ? 'Ocean, engines, weapons, sirens' : 'Mar, motores, armas e sirenes', range('sfx', 0, 1, 0.05, fmtPct))}
          ${row(tr('mute'), '', toggle('muted'))}
        </div>
        <p class="fineprint">${settings.language === 'en' ? 'All audio is synthesized in the browser with Web Audio. Starting playback requires a user gesture.' : 'Todo o áudio é sintetizado no navegador com Web Audio. O início da reprodução exige um toque ou clique.'}</p>
      </div>`;
    }

    if (tab === 'system') {
      const info = getSaveInfo();
      html = `
      <div class="settings-page">
        <div class="settings-group">
          <h3>${tr('about')}</h3>
          ${row('Matteo 5', 'Sistema de entretenimento fictício · edição Baía', '<span style="font-family:var(--font-h);font-size:11px;color:var(--teal)">v5.0.4</span>')}
          ${row('GTA 6 BR', 'Baía Dourada · build 1.0.4 · Three.js + WebGL2', '<span style="font-family:var(--font-h);font-size:11px;color:var(--gold)">8,4 GB</span>')}
          ${row(tr('storage'), 'localStorage do navegador', '<span style="font-size:10px;color:var(--muted)">Perfil local</span>')}
          ${info ? row(tr('saveFound'), `${info.mode === 'rp' ? 'Roleplay' : tr('story')} · ${info.detail || ''}`, `<span style="font-size:10px;color:var(--green)">${info.updated || ''}</span>`) : row(tr('noSave'), tr('newGame'), '')}
        </div>
        <div class="settings-group">
          <h3>${tr('system')}</h3>
          <div class="setting-row">
            <div class="setting-label"><b>${tr('saveGame')}</b><small>${settings.language === 'en' ? 'Write the current run to this browser' : 'Grava a partida atual neste navegador'}</small></div>
            <div class="setting-control"><button class="btn btn-ghost btn-sm" data-action="save-game"><span class="btn-label"><b>${tr('saveGame')}</b></span></button></div>
          </div>
          <div class="setting-row">
            <div class="setting-label"><b>${tr('resetGame')}</b><small>${settings.language === 'en' ? 'Deletes story progress, RP and character data' : 'Apaga capítulos, RP e dados dos personagens'}</small></div>
            <div class="setting-control"><button class="danger-btn" data-action="clear-save">${tr('resetGame')}</button></div>
          </div>
          <div class="setting-row">
            <div class="setting-label"><b>${tr('settings')}</b><small>${tr('settingsHint')}</small></div>
            <div class="setting-control"><button class="danger-btn" data-action="settings-reset">${tr('resetSettings')}</button></div>
          </div>
        </div>
        <p class="fineprint">${settings.language === 'en' ? 'Original fiction. Not affiliated with Rockstar Games or Sony. No copyrighted game assets are used.' : 'Ficção original. Sem afiliação com Rockstar Games ou Sony. Nenhum ativo de jogo protegido é utilizado.'}</p>
      </div>`;
    }

    container.innerHTML = html;
    container.scrollTop = 0;
  }

  function commit(key, value, rerender = false) {
    const current = loadSettings();
    const next = { ...current, [key]: value };
    const gfxKeys = ['resolution', 'shadows', 'water', 'drawDistance', 'crowd'];
    if (gfxKeys.includes(key)) next.quality = 'custom';
    saveSettings(next);
    dispatchSettings(next);
    settings = next;
    onChange(key, value);
    if (rerender) render();
    else {
      // Update segmented visuals without full re-render.
      if (container.querySelector(`[data-set="${key}"]`)) {
        container.querySelectorAll(`[data-set="${key}"]`).forEach((b) => {
          b.classList.toggle('active', b.dataset.value === String(value));
        });
      }
      const tg = container.querySelector(`[data-toggle="${key}"]`);
      if (tg) { tg.classList.toggle('on', !!value); tg.setAttribute('aria-pressed', String(!!value)); }
    }
  }

  container.addEventListener('click', (e) => {
    const setBtn = e.target.closest('[data-set]');
    if (setBtn) {
      const key = setBtn.dataset.set;
      const raw = setBtn.dataset.value;
      let value = raw;
      if (['shadows', 'water', 'crowd', 'quality', 'language', 'mobileControls', 'controlStyle', 'minimapShape'].includes(key)) value = raw;
      else if (raw === 'true' || raw === 'false') value = raw === 'true';
      else if (!isNaN(Number(raw))) value = Number(raw);
      if (key === 'quality') {
        const next = applyPreset(loadSettings(), raw);
        saveSettings(next);
        dispatchSettings(next);
        settings = next;
        onChange(key, raw);
        render();
        return;
      }
      commit(key, value, true);
      return;
    }
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      const key = tg.dataset.toggle;
      commit(key, !loadSettings()[key], false);
      return;
    }
    const reset = e.target.closest('[data-action="settings-reset"]');
    if (reset) {
      const { resetSettings } = window.__matteoSettingsApi || {};
      if (resetSettings) resetSettings();
      settings = loadSettings();
      render();
      return;
    }
    const save = e.target.closest('[data-action="save-game"]');
    if (save) {
      window.__matteoGame?.saveAll?.();
      window.dispatchEvent(new CustomEvent('matteo:toast', { detail: { text: t()('saved'), tone: 'ok' } }));
      return;
    }
    const clear = e.target.closest('[data-action="clear-save"]');
    if (clear) {
      if (confirm(t()('resetGameConfirm'))) {
        localStorage.removeItem('matteo5.game.v1');
        window.__matteoGame?.reloadProgress?.();
        window.dispatchEvent(new CustomEvent('matteo:toast', { detail: { text: t()('resetGame'), tone: 'warn' } }));
        render();
      }
    }
  });

  container.addEventListener('input', (e) => {
    const rangeEl = e.target.closest('[data-range]');
    if (!rangeEl) return;
    const key = rangeEl.dataset.range;
    const value = Number(rangeEl.value);
    const pct = ((value - Number(rangeEl.min)) / (Number(rangeEl.max) - Number(rangeEl.min))) * 100;
    rangeEl.style.setProperty('--fill', `${pct}%`);
    const out = rangeEl.parentElement.querySelector('output');
    if (out) {
      const mult = ['sensitivity', 'minimapScale', 'controlScale', 'dialogueSpeed'].includes(key);
      out.textContent = mult ? `${value.toFixed(2)}x` : `${Math.round(value * 100)}%`;
    }
    commit(key, value, false);
  });

  container.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-select]');
    if (sel) commit(sel.dataset.select, sel.value, false);
  });

  function setTab(next) {
    tab = next;
    render();
    document.querySelectorAll('#settingsNav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  }

  document.querySelectorAll('#settingsNav button').forEach((b) => {
    b.addEventListener('click', () => setTab(b.dataset.tab));
  });

  return { render, setTab, get tab() { return tab; } };
}
