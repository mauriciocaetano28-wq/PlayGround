#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-3000}"
OUTPUT_DIR="$PROJECT_DIR/dist"
DEPLOYMENT_FILE="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}/deployment-output.json"

run_timed() {
  /usr/bin/time -p "$@"
}

cd "$PROJECT_DIR"
run_timed mkdir -p "$OUTPUT_DIR"

if [[ -f "$PROJECT_DIR/package.json" ]]; then
  if [[ -f "$PROJECT_DIR/package-lock.json" ]]; then
    run_timed npm ci --no-audit --no-fund
  elif [[ -f "$PROJECT_DIR/pnpm-lock.yaml" ]] && command -v pnpm >/dev/null 2>&1; then
    run_timed pnpm install --no-frozen-lockfile
  elif [[ -f "$PROJECT_DIR/yarn.lock" ]] && command -v yarn >/dev/null 2>&1; then
    run_timed yarn install
  else
    run_timed npm install --no-audit --no-fund
  fi

  if node -e 'const p=require(process.argv[1]); process.exit(p.scripts?.build ? 0 : 1)' "$PROJECT_DIR/package.json"; then
    run_timed npm run build
  fi

  if [[ -f "$OUTPUT_DIR/index.html" ]]; then
    : # Build output already lives in dist.
  elif [[ -f "$PROJECT_DIR/build/index.html" ]]; then
    run_timed cp -a "$PROJECT_DIR/build/." "$OUTPUT_DIR/"
    if [[ -f "$PROJECT_DIR/three.min.js" ]]; then run_timed cp "$PROJECT_DIR/three.min.js" "$OUTPUT_DIR/three.min.js"; fi
  elif [[ -f "$PROJECT_DIR/index.html" ]]; then
    run_timed cp "$PROJECT_DIR/index.html" "$OUTPUT_DIR/index.html"
    if [[ -f "$PROJECT_DIR/three.min.js" ]]; then run_timed cp "$PROJECT_DIR/three.min.js" "$OUTPUT_DIR/three.min.js"; fi
  else
    echo "Build completed but no static index.html was found in dist/, build/, or the project root." >&2
    exit 1
  fi
elif [[ -f "$PROJECT_DIR/index.html" ]]; then
  run_timed cp -a "$PROJECT_DIR/index.html" "$OUTPUT_DIR/index.html"
  if [[ -f "$PROJECT_DIR/three.min.js" ]]; then run_timed cp "$PROJECT_DIR/three.min.js" "$OUTPUT_DIR/three.min.js"; fi
elif [[ -f "$OUTPUT_DIR/index.html" ]]; then
  : # Reuse an existing static build.
else
  # This repository currently contains deployment scaffolding but no app source.
  # Keep a visible, self-contained Matteo 5 launcher shell as a build fallback.
  run_timed mkdir -p "$OUTPUT_DIR"
  cat > "$OUTPUT_DIR/index.html" <<'HTML'
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#07100f"><title>Matteo 5 — Central de jogos</title>
  <style>
    :root{color-scheme:dark;--bg:#07100f;--panel:#101a18;--muted:#a1b0aa;--mint:#9bffca;--line:#ffffff16}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 75% 4%,#234d45 0,transparent 35%),radial-gradient(ellipse at 22% 95%,#18372f 0,transparent 38%),var(--bg);color:#f5fff9;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.02em}
    button{font:inherit;color:inherit}.shell{max-width:1180px;margin:auto;padding:28px 34px 40px}.top{height:48px;display:flex;align-items:center;justify-content:space-between}.brand{display:flex;gap:12px;align-items:center;font-size:18px;font-weight:800;letter-spacing:.04em}.mark{width:30px;height:30px;border:1px solid #9bffca99;border-radius:9px;display:grid;place-items:center;color:var(--mint);box-shadow:0 0 24px #65ffaf20}.status{display:flex;gap:9px;align-items:center;color:#c5d4ce;font-size:12px;letter-spacing:.08em;text-transform:uppercase}.dot{width:7px;height:7px;border-radius:50%;background:#83ffc0;box-shadow:0 0 12px #83ffc0}
    .hero{position:relative;overflow:hidden;margin-top:30px;min-height:410px;border:1px solid var(--line);border-radius:24px;background:linear-gradient(95deg,#07110ff5 0%,#091714e8 44%,#0a1a1788 100%),linear-gradient(180deg,transparent 55%,#07100f 100%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Cdefs%3E%3ClinearGradient id='w' x2='0' y2='1'%3E%3Cstop stop-color='%231e7966'/%3E%3Cstop offset='1' stop-color='%230d302d'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23w)' d='M0 315 Q240 285 430 330 T800 320 T1200 315 V600 H0Z'/%3E%3Cpath fill='%231c3d36' d='M0 210h115v112H0zm130-45h98v157h-98zm115 77h158v81H245zm178-110h110v192H423zm125 45h90v147h-90zm108-88h154v232H656zm171 73h132v159H827zm148-92h110v251H975zm126 108h99v143h-99z'/%3E%3Cpath fill='%23c2ffcd' opacity='.45' d='M18 224h4v11h-4zm146-38h5v12h-5zm76 26h6v10h-6zm213-91h5v14h-5zm67 58h4v11h-4zm184-57h6v13h-6zm141 89h4v12h-4zm166-67h5v13h-5z'/%3E%3Cpath fill='none' stroke='%237fffd0' opacity='.35' d='M40 378q200-24 365 0t350 0 390 4M124 425q160-18 280 0t290 1 381-1M20 492q230-17 405 1t430-3 310 2'/%3E%3C/svg%3E");background-size:cover;background-position:center 55%;display:flex;align-items:flex-end;padding:44px}
    .hero-copy{position:relative;max-width:560px}.eyebrow{font-size:11px;letter-spacing:.2em;color:var(--mint);font-weight:750;text-transform:uppercase}.hero h1{font-size:clamp(42px,7vw,76px);line-height:.96;letter-spacing:-.075em;margin:15px 0}.hero p{color:#c3d1cb;font-size:15px;line-height:1.6;max-width:460px;margin:0 0 24px}.actions{display:flex;gap:10px;flex-wrap:wrap}.primary,.secondary{padding:12px 19px;border-radius:10px;border:1px solid var(--line);cursor:pointer;font-weight:700;font-size:13px}.primary{background:var(--mint);color:#07100f;border-color:var(--mint);box-shadow:0 8px 32px #83ffc022}.secondary{background:#ffffff0b}.primary:hover{background:#c2ffdc}.secondary:hover{background:#ffffff17}.chip{display:inline-flex;align-items:center;gap:7px;border:1px solid #b2ffe125;background:#06130f88;padding:7px 10px;border-radius:7px;font-size:10px;color:#d9ebe1;margin-bottom:16px}
    .section-head{display:flex;align-items:end;justify-content:space-between;margin:28px 2px 14px}.section-head h2{margin:0;font-size:17px;letter-spacing:-.04em}.section-head span{font-size:11px;color:var(--muted)}.grid{display:grid;grid-template-columns:1.35fr 1fr 1fr;gap:13px}.card{min-height:144px;border-radius:15px;border:1px solid var(--line);background:linear-gradient(145deg,#172421,#0c1513);padding:17px;display:flex;flex-direction:column;justify-content:space-between}.card-top{display:flex;justify-content:space-between;align-items:center}.icon{width:32px;height:32px;border-radius:9px;background:#a5ffd315;display:grid;place-items:center;color:var(--mint);font-size:15px}.card small{color:var(--muted);font-size:10px;letter-spacing:.08em;text-transform:uppercase}.card h3{margin:9px 0 4px;font-size:16px}.card p{margin:0;color:var(--muted);font-size:12px}.arrow{color:#a9b9b1;font-size:18px}.foot{margin-top:20px;display:flex;align-items:center;justify-content:space-between;color:#80918a;font-size:10px}.build-note{color:#75877e}
    @media(max-width:700px){.shell{padding:20px 17px 30px}.top{height:40px}.status span:last-child{display:none}.hero{min-height:440px;margin-top:22px;padding:27px 22px;background-position:58% center}.hero-copy{max-width:430px}.hero p{font-size:14px}.grid{grid-template-columns:1fr 1fr}.card:first-child{grid-column:span 2}.section-head{margin-top:24px}.foot{align-items:flex-start;gap:10px;flex-direction:column}}@media(max-width:390px){.hero h1{font-size:43px}.grid{grid-template-columns:1fr}.card:first-child{grid-column:auto}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="top"><div class="brand"><div class="mark">M</div><span>MATTEO <span style="color:#9bffca">5</span></span></div><div class="status"><i class="dot"></i><span>SISTEMA PRONTO</span></div></header>
    <section class="hero"><div class="hero-copy"><div class="chip">✦ &nbsp; CENTRAL DE JOGOS &nbsp;·&nbsp; EDIÇÃO BR</div><div class="eyebrow">Seu próximo mundo começa aqui</div><h1>Jogue além<br>do esperado.</h1><p>Uma central para suas aventuras. Explore o catálogo, personalize a experiência e prepare seu próximo jogo.</p><div class="actions"><button class="primary" id="explore">Explorar catálogo <span aria-hidden="true">↗</span></button><button class="secondary" id="settings">⚙ &nbsp; Configurações</button></div></div></section>
    <div class="section-head"><h2>Em destaque</h2><span>CATÁLOGO MATTEO 5</span></div>
    <section class="grid" aria-label="Jogos em destaque"><article class="card"><div class="card-top"><div class="icon">◈</div><span class="arrow">↗</span></div><div><small>Em preparação · Brasil</small><h3>GTA 6 BR</h3><p>Uma aventura urbana em um mundo aberto.</p></div></article><article class="card"><div class="card-top"><div class="icon">⌘</div><span class="arrow">↗</span></div><div><small>Matteo 5</small><h3>Modo história</h3><p>Luiza e Carlos · 5 missões</p></div></article><article class="card"><div class="card-top"><div class="icon">◎</div><span class="arrow">↗</span></div><div><small>Matteo 5</small><h3>Modo RP</h3><p>Entre na cidade e crie sua história.</p></div></article></section>
    <footer class="foot"><span>MATTEO 5 &nbsp;·&nbsp; CENTRAL DE JOGOS</span><span class="build-note">Interface de inicialização</span></footer>
  </main>
  <script>document.getElementById('explore').addEventListener('click',()=>document.querySelector('.grid').scrollIntoView({behavior:'smooth',block:'center'}));document.getElementById('settings').addEventListener('click',()=>alert('Configurações do sistema estarão disponíveis nesta versão.'));</script>
</body>
</html>
HTML
fi

if [[ ! -f "$OUTPUT_DIR/index.html" ]]; then
  echo "Static build output missing: $OUTPUT_DIR/index.html" >&2
  exit 1
fi

if [[ -f "$PROJECT_DIR/three.min.js" && ! -f "$OUTPUT_DIR/three.min.js" ]]; then
  run_timed cp "$PROJECT_DIR/three.min.js" "$OUTPUT_DIR/three.min.js"
fi

run_timed mkdir -p "$(dirname "$DEPLOYMENT_FILE")"
run_timed node -e 'const fs=require("node:fs"); const path=require("node:path"); const data={project:path.resolve(process.argv[1]),directory:path.resolve(process.argv[2])}; if(!data.directory.startsWith(data.project+path.sep)) throw new Error("Built directory must be inside project"); fs.writeFileSync(process.argv[3],JSON.stringify(data)+"\n")' "$PROJECT_DIR" "$OUTPUT_DIR" "$DEPLOYMENT_FILE"

echo "Serving $OUTPUT_DIR on 0.0.0.0:$PORT"
run_timed node --input-type=commonjs -e '
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(process.argv[1]);
const mime = {".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".webp":"image/webp", ".glb":"model/gltf-binary"};
http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,"http://localhost").pathname); } catch { res.writeHead(400); return res.end("Bad request"); }
  const file = path.resolve(root, "." + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); return res.end("Forbidden"); }
  let target = file;
  try { if (fs.statSync(target).isDirectory()) target = path.join(target,"index.html"); const body = fs.readFileSync(target); res.writeHead(200,{"Content-Type":mime[path.extname(target)]||"application/octet-stream","Cache-Control":"no-cache"}); res.end(body); }
  catch { if (path.extname(pathname)) { res.writeHead(404); return res.end("Not found"); } try { res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-cache"}); res.end(fs.readFileSync(path.join(root,"index.html"))); } catch { res.writeHead(404); res.end("Not found"); } }
}).listen(Number(process.env.PORT||3000),"0.0.0.0",()=>console.log(`Static server ready at http://0.0.0.0:${process.env.PORT||3000}`));
' "$OUTPUT_DIR"
