function e({root:e,game:t,controls:n,onExit:r,onPauseChange:i,subtitle:a=`PS5 EMULATOR`}){e.innerHTML=`
    <div class="game-canvas-wrap"></div>
    <div class="game-hud"></div>
    <div class="game-topbar">
      <span class="game-title-chip">${t.shortTitle||t.title}</span>
      <button class="game-icon-btn" data-game-pause title="Pausar" aria-label="Pausar">
        <svg viewBox="0 0 24 24"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z"/></svg>
      </button>
      <button class="game-icon-btn" data-game-home title="Sair para o PS5" aria-label="Sair">
        <svg viewBox="0 0 24 24"><path d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3L12 3Z"/></svg>
      </button>
    </div>
    <div class="game-pause">
      <div class="pause-card">
        <span class="eyebrow-mini">${a}</span>
        <h2>${t.title}</h2>
        <p>O jogo está pausado. Continue de onde parou ou volte para a biblioteca do console.</p>
        <div class="pause-actions">
          <button class="pause-btn primary" data-game-resume>Continuar jogando</button>
          <button class="pause-btn" data-game-home>Salvar e sair para o PS5</button>
        </div>
        <div class="pause-controls">${n||``}</div>
      </div>
    </div>`;let o=e.querySelector(`.game-pause`),s=e.querySelector(`.game-hud`),c=e.querySelector(`.game-canvas-wrap`),l=!1,u=!1,d=(e,t=!1)=>{l=e,o.classList.toggle(`open`,l),t||i?.(l)},f=()=>{if(!u){u=!0;try{document.exitPointerLock?.()}catch{}r?.()}};e.querySelectorAll(`[data-game-pause]`).forEach(e=>e.addEventListener(`click`,()=>d(!l))),e.querySelectorAll(`[data-game-resume]`).forEach(e=>e.addEventListener(`click`,()=>d(!1))),e.querySelectorAll(`[data-game-home]`).forEach(e=>e.addEventListener(`click`,f));let p=e=>{if(e.code===`Escape`){if(document.pointerLockElement)return;e.preventDefault(),d(!l)}};return window.addEventListener(`keydown`,p),{root:e,hud:s,canvasWrap:c,pauseEl:o,get paused(){return l},setPaused:d,exit:f,destroy(){u=!0,window.removeEventListener(`keydown`,p),e.innerHTML=``}}}function t(){return window.matchMedia(`(pointer: coarse)`).matches||navigator.maxTouchPoints>0}function n(e){let t={x:0,y:0,active:!1},n=e.querySelector(`i`),r=null,i=r=>{let i=e.getBoundingClientRect(),a=i.left+i.width/2,o=i.top+i.height/2,s=r.clientX-a,c=r.clientY-o,l=i.width*.35,u=Math.hypot(s,c);u>l&&(s=s/u*l,c=c/u*l),t.x=s/l,t.y=c/l,n&&(n.style.transform=`translate(calc(-50% + ${s}px), calc(-50% + ${c}px))`)},a=()=>{r=null,t.active=!1,t.x=0,t.y=0,n&&(n.style.transform=`translate(-50%,-50%)`)};return e.addEventListener(`pointerdown`,n=>{n.preventDefault(),r=n.pointerId,t.active=!0,e.setPointerCapture(r),i(n)}),e.addEventListener(`pointermove`,e=>{r===e.pointerId&&i(e)}),e.addEventListener(`pointerup`,a),e.addEventListener(`pointercancel`,a),t}function r(e,t){let n=!1,r=e=>{e.preventDefault(),n=!0,t(!0)},i=e=>{n&&(e.preventDefault(),n=!1,t(!1))};return e.addEventListener(`pointerdown`,r),e.addEventListener(`pointerup`,i),e.addEventListener(`pointercancel`,i),e.addEventListener(`pointerleave`,e=>{e.buttons&&i(e)}),{get active(){return n}}}function i(e,t){if(!e)return;let n=null,r=0,i=0;e.addEventListener(`pointerdown`,t=>{t.target.closest(`button`)||(n=t.pointerId,r=t.clientX,i=t.clientY,e.setPointerCapture?.(n))}),e.addEventListener(`pointermove`,e=>{if(n!==e.pointerId)return;let a=e.clientX-r,o=e.clientY-i;r=e.clientX,i=e.clientY,t(a,o)});let a=()=>{n=null};e.addEventListener(`pointerup`,a),e.addEventListener(`pointercancel`,a)}var a=(e,t,n)=>Math.max(t,Math.min(n,e));export{n as a,e as i,i as n,t as o,a as r,r as t};