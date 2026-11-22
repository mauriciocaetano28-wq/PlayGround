const enc = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s{2,}/g, ' '))}`;

const base = (inner, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
<defs>${defs}</defs>${inner}</svg>`;

const grain = `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".09"/></feComponentTransfer></filter>`;

function miniCover() {
  const defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#78d8ff"/><stop offset=".55" stop-color="#3c9fe8"/><stop offset="1" stop-color="#bfe9c4"/></linearGradient>
  <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#72d35f"/><stop offset="1" stop-color="#287c44"/></linearGradient>
  <linearGradient id="dirt" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a76a3f"/><stop offset="1" stop-color="#63381f"/></linearGradient>
  <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#c9ffe0"/></linearGradient>${grain}`;
  const inner = `<rect width="600" height="800" fill="url(#sky)"/>
  <circle cx="460" cy="145" r="62" fill="#fff8bd" opacity=".95"/><circle cx="460" cy="145" r="92" fill="#fff8bd" opacity=".15"/>
  <g opacity=".65" fill="#fff"><rect x="70" y="150" width="120" height="28" rx="14"/><rect x="130" y="138" width="80" height="30" rx="15"/><rect x="405" y="230" width="100" height="24" rx="12"/></g>
  <path d="M0 520 110 450 210 500 320 420 430 480 530 430 600 470V800H0Z" fill="#9be58b" opacity=".45"/>
  <g transform="translate(52 505)">
    <g transform="translate(0 80)"><path d="M0 0h120l45 40-45 40H0l-30-40Z" fill="url(#grass)"/><path d="M0 80h120l45 40-45 40H0l-30-40Z" fill="url(#dirt)"/></g>
    <g transform="translate(180 40)"><path d="M0 0h110l42 38-42 38H0L-28 38Z" fill="url(#grass)"/><path d="M0 76h110l42 38-42 38H0L-28 38Z" fill="url(#dirt)"/></g>
    <g transform="translate(335 130)"><path d="M0 0h130l50 44-50 44H0l-33-44Z" fill="url(#grass)"/><path d="M0 88h130l50 44-50 44H0l-33-44Z" fill="url(#dirt)"/></g>
  </g>
  <g transform="translate(410 400)">
    <rect x="-12" y="90" width="24" height="100" fill="#654126"/><rect x="-34" y="18" width="68" height="84" rx="5" fill="#2e9b58"/><rect x="-55" y="58" width="110" height="64" rx="5" fill="#3cbe69"/><rect x="-28" y="0" width="56" height="48" rx="4" fill="#5ce184"/>
  </g>
  <g transform="translate(155 590)">
    <rect x="0" y="30" width="56" height="54" rx="3" fill="#2d6dc4"/><rect x="8" y="38" width="40" height="38" fill="#6faef0"/>
    <rect x="8" y="0" width="40" height="38" rx="3" fill="#d8a376"/><rect x="12" y="10" width="8" height="8" fill="#1b2433"/><rect x="36" y="10" width="8" height="8" fill="#1b2433"/>
    <rect x="2" y="82" width="18" height="34" fill="#26344f"/><rect x="36" y="82" width="18" height="34" fill="#26344f"/>
    <rect x="60" y="42" width="10" height="44" rx="4" fill="#e6b984"/>
    <g transform="translate(78 10) rotate(32)"><rect x="0" y="0" width="9" height="66" fill="#7a4d29"/><path d="M-20 0h50l-10 26h-30Z" fill="#b9d2de"/></g>
  </g>
  <rect width="600" height="800" fill="url(#grain)" opacity=".5"/>
  <rect x="0" y="0" width="600" height="800" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2"/>
  <g transform="translate(48 92)"><text fill="#0c422f" font-family="Arial Black, sans-serif" font-size="17" letter-spacing="5">EXPLORE · CRIE · SOBREVIVA</text></g>
  <g transform="translate(44 668)"><text fill="url(#logo)" font-family="Arial Black, sans-serif" font-size="76" font-weight="900" letter-spacing="-5">MINICRAFT</text><text x="238" y="72" fill="#c5ffd9" font-family="Arial Black, sans-serif" font-size="44" font-weight="900" letter-spacing="-2">3D</text></g>
  <rect x="44" y="742" width="96" height="4" fill="#c8ffdd"/><text x="44" y="770" fill="#eafff1" font-family="Arial, sans-serif" font-size="14" letter-spacing="3">MUNDO DE BLOCOS INFINITO</text>`;
  return base(inner, defs);
}

function gtaCover() {
  const defs = `<linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#271b50"/><stop offset=".45" stop-color="#c84a6d"/><stop offset=".72" stop-color="#ff9e58"/><stop offset="1" stop-color="#1c2035"/></linearGradient>
  <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#333549"/><stop offset="1" stop-color="#0e101a"/></linearGradient>
  <linearGradient id="gtalogo" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#c8d7e8"/></linearGradient>
  <linearGradient id="gtasun" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffe0a3"/><stop offset="1" stop-color="#ff4d79"/></linearGradient>${grain}`;
  const inner = `<rect width="600" height="800" fill="url(#gsky)"/>
  <circle cx="300" cy="408" r="150" fill="url(#gtasun)" opacity=".8"/>
  <g fill="#1b1b33" opacity=".9">
    <rect x="0" y="400" width="58" height="230"/><rect x="55" y="345" width="75" height="300"/><rect x="128" y="425" width="48" height="220"/><rect x="182" y="380" width="62" height="260"/><rect x="400" y="365" width="74" height="280"/><rect x="470" y="420" width="45" height="220"/><rect x="515" y="330" width="85" height="310"/>
    <rect x="230" y="445" width="38" height="185"/><rect x="345" y="410" width="55" height="220"/>
  </g>
  <g fill="#ffd7a0" opacity=".6"><rect x="68" y="365" width="5" height="7"/><rect x="82" y="365" width="5" height="7"/><rect x="68" y="382" width="5" height="7"/><rect x="205" y="400" width="5" height="7"/><rect x="220" y="400" width="5" height="7"/><rect x="418" y="388" width="5" height="7"/><rect x="436" y="388" width="5" height="7"/><rect x="530" y="350" width="5" height="7"/><rect x="548" y="350" width="5" height="7"/><rect x="530" y="370" width="5" height="7"/></g>
  <path d="M0 600h600v200H0Z" fill="url(#road)"/>
  <path d="M240 800 300 600 360 800Z" fill="#171923"/><path d="M291 620h18l14 180h-46Z" fill="#e6b957" opacity=".65"/>
  <g transform="translate(60 530)"><rect x="0" y="0" width="14" height="110" fill="#2e1f2e"/><g fill="#121a2c"><path d="M7 0c-38 8-68 12-92 6 24 18 55 19 92 10Z"/><path d="M7 5c30 4 65 0 90-12-19 21-52 27-90 22Z"/><path d="M7 2c-18-18-45-26-60-30 8 19 27 31 60 39Z"/></g></g>
  <g transform="translate(285 530)"><path d="M0 48h175l26 30-20 40H15L-8 78Z" fill="#b23d51"/><path d="M32 18h105l22 30H12Z" fill="#d3dfeb"/><rect x="42" y="22" width="38" height="22" fill="#4d7894"/><rect x="88" y="22" width="38" height="22" fill="#4d7894"/><circle cx="35" cy="118" r="20" fill="#0c0d12"/><circle cx="148" cy="118" r="20" fill="#0c0d12"/><rect x="180" y="60" width="24" height="7" fill="#ffe9a3"/></g>
  <rect y="0" width="600" height="800" fill="url(#grain)" opacity=".55"/>
  <g transform="translate(44 60)"><text fill="#ffce7a" font-family="Arial Black, sans-serif" font-size="16" letter-spacing="4">LIBERTY CITY · 16 KM²</text></g>
  <g transform="translate(38 140)"><text fill="url(#gtalogo)" font-family="Arial Black, sans-serif" font-size="88" font-weight="900" letter-spacing="-7" font-style="italic">GRAND</text><text y="78" fill="url(#gtalogo)" font-family="Arial Black, sans-serif" font-size="88" font-weight="900" letter-spacing="-7" font-style="italic">THEFT</text><text y="156" fill="url(#gtalogo)" font-family="Arial Black, sans-serif" font-size="88" font-weight="900" letter-spacing="-7" font-style="italic">AUTO</text><text x="402" y="228" fill="#ffce7a" font-family="Arial Black, sans-serif" font-size="118" font-weight="900" font-style="italic">III</text></g>
  <g transform="translate(44 742)"><rect width="72" height="4" fill="#ffce7a"/><text y="30" fill="#ffe6bd" font-family="Arial, sans-serif" font-size="13" letter-spacing="3">TRÊS MISSÕES · POLÍCIA · MUNDO ABERTO</text></g>`;
  return base(inner, defs);
}

function bloxCover() {
  const defs = `<linearGradient id="bsky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#24105c"/><stop offset=".5" stop-color="#5422b8"/><stop offset="1" stop-color="#0b8fb1"/></linearGradient>
  <linearGradient id="blogo" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff"/><stop offset=".6" stop-color="#83f7ff"/><stop offset="1" stop-color="#ffd4ff"/></linearGradient>
  <filter id="glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>${grain}`;
  const inner = `<rect width="600" height="800" fill="url(#bsky)"/>
  <g opacity=".25" stroke="#a8f7ff"><path d="M0 120h600M0 240h600M0 360h600M0 480h600M0 600h600M0 720h600M100 0v800M200 0v800M300 0v800M400 0v800M500 0v800"/></g>
  <g transform="translate(0 500)"><path d="M0 300V90l150-70 150 70 150-70 150 70v210Z" fill="#101638"/><path d="M0 90 150 20 300 90 450 20 600 90v70L450 90 300 160 150 90 0 160Z" fill="#38d8d0"/></g>
  <g transform="translate(106 230) rotate(-9)"><rect width="110" height="150" rx="8" fill="#ff5fa2"/><rect x="12" y="12" width="86" height="86" fill="#ffe6f1"/><rect x="24" y="24" width="24" height="24" fill="#27113c"/><rect x="62" y="24" width="24" height="24" fill="#27113c"/><rect x="36" y="62" width="38" height="12" fill="#27113c"/><rect x="18" y="108" width="74" height="26" rx="4" fill="#b72d70"/></g>
  <g transform="translate(362 300) rotate(8)"><rect width="130" height="180" rx="8" fill="#5de8ff"/><rect x="14" y="14" width="102" height="104" fill="#e5feff"/><rect x="28" y="28" width="28" height="28" fill="#0d2741"/><rect x="74" y="28" width="28" height="28" fill="#0d2741"/><rect x="42" y="76" width="46" height="12" fill="#0d2741"/><rect x="22" y="130" width="86" height="30" rx="4" fill="#1b8eb4"/></g>
  <g transform="translate(238 120) rotate(6)"><rect width="130" height="130" rx="7" fill="#ffd84f"/><rect x="14" y="14" width="102" height="102" fill="#fff7d2"/><rect x="28" y="34" width="26" height="26" fill="#3c2406"/><rect x="76" y="34" width="26" height="26" fill="#3c2406"/><path d="M42 82h46" stroke="#3c2406" stroke-width="12"/></g>
  <g filter="url(#glow)" opacity=".55"><circle cx="150" cy="540" r="6" fill="#74ffff"/><circle cx="470" cy="470" r="4" fill="#ff70c7"/><circle cx="80" cy="330" r="3" fill="#fff"/><circle cx="530" cy="200" r="5" fill="#fff"/></g>
  <rect y="0" width="600" height="800" fill="url(#grain)" opacity=".45"/>
  <g transform="translate(38 56)"><rect width="168" height="30" rx="15" fill="rgba(0,0,0,.25)" stroke="#74ffff"/><circle cx="17" cy="15" r="5" fill="#4dffa6"/><text x="30" y="20" fill="#d8ffff" font-family="Arial, sans-serif" font-size="12" letter-spacing="2">12.482 ONLINE</text></g>
  <g transform="translate(36 646)"><text fill="url(#blogo)" font-family="Arial Black, sans-serif" font-size="91" font-weight="900" letter-spacing="-7">BLOXTITY</text><text x="442" y="62" fill="#ffd84f" font-family="Arial Black, sans-serif" font-size="42" font-weight="900" letter-spacing="-3">.IO</text></g>
  <g transform="translate(40 730)"><rect width="112" height="32" rx="16" fill="#ff5fa2"/><text x="18" y="21" fill="#2a0a1d" font-family="Arial Black, sans-serif" font-size="12" letter-spacing="1">JOGAR AGORA</text><text x="130" y="21" fill="#c9d7ff" font-family="Arial, sans-serif" font-size="12" letter-spacing="2">ARENA MULTIPLAYER</text></g>`;
  return base(inner, defs);
}

function neonCover() {
  const defs = `<linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#09041e"/><stop offset=".45" stop-color="#3b0e5f"/><stop offset=".7" stop-color="#f43f8e"/><stop offset=".86" stop-color="#ff9c5b"/><stop offset="1" stop-color="#09041e"/></linearGradient>
  <linearGradient id="nsun" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff4a8"/><stop offset=".45" stop-color="#ffb44d"/><stop offset="1" stop-color="#ff2d8e"/></linearGradient>
  <linearGradient id="nlogo" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff"/><stop offset=".5" stop-color="#ffb3de"/><stop offset="1" stop-color="#71e9ff"/></linearGradient>
  <filter id="nglow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>${grain}`;
  const inner = `<rect width="600" height="800" fill="url(#nsky)"/>
  <g fill="#fff" opacity=".75"><circle cx="60" cy="90" r="2"/><circle cx="140" cy="150" r="1.5"/><circle cx="470" cy="80" r="2"/><circle cx="530" cy="200" r="1.5"/><circle cx="360" cy="140" r="1"/><circle cx="240" cy="60" r="1.5"/><circle cx="90" cy="260" r="1"/></g>
  <g transform="translate(300 400)"><circle r="150" fill="url(#nsun)" opacity=".9"/><g stroke="#3b0e5f" stroke-width="9"><path d="M-160 26h320"/><path d="M-152 56h304"/><path d="M-142 86h284"/><path d="M-126 116h252"/><path d="M-104 146h208"/></g></g>
  <g fill="#0b0620"><rect x="0" y="430" width="40" height="200"/><rect x="42" y="390" width="58" height="240"/><rect x="106" y="450" width="45" height="180"/><rect x="452" y="410" width="52" height="220"/><rect x="508" y="370" width="70" height="260"/><rect x="398" y="455" width="45" height="175"/></g>
  <g opacity=".85" stroke="#ff4fa3" stroke-width="2" fill="none"><path d="M0 610h600M0 660h600M0 720h600M0 800h600M50 610 0 800M150 610 100 800M250 610 200 800M350 610 300 800M450 610 400 800M550 610 500 800"/></g>
  <g filter="url(#nglow)" fill="#5df3ff"><rect x="0" y="608" width="600" height="4"/></g>
  <g transform="translate(255 520)"><path d="M0 90h150l25 30-12 34H10L-8 120Z" fill="#17112f"/><path d="M25 46h90l20 46H8Z" fill="#37e8ff"/><rect x="36" y="52" width="32" height="26" fill="#16223e"/><rect x="78" y="52" width="26" height="26" fill="#16223e"/><circle cx="30" cy="158" r="20" fill="#05030d"/><circle cx="132" cy="158" r="20" fill="#05030d"/><rect x="152" y="94" width="22" height="8" fill="#ffea7a"/><rect x="-5" y="94" width="18" height="8" fill="#ff3a72"/></g>
  <g filter="url(#nglow)"><path d="M150 690h300" stroke="#ff4fa3" stroke-width="3"/><path d="M130 710h340" stroke="#5df3ff" stroke-width="2" opacity=".7"/></g>
  <rect y="0" width="600" height="800" fill="url(#grain)" opacity=".4"/>
  <g transform="translate(40 58)"><text fill="#ffb3de" font-family="Arial Black, sans-serif" font-size="15" letter-spacing="5">ARCADE RACING · SYNTHWAVE</text></g>
  <g transform="translate(36 646)"><text fill="url(#nlogo)" font-family="Arial Black, sans-serif" font-size="92" font-weight="900" letter-spacing="-7">NEON</text><text y="82" fill="url(#nlogo)" font-family="Arial Black, sans-serif" font-size="92" font-weight="900" letter-spacing="-7">DRIFT</text></g>
  <g transform="translate(40 754)"><rect width="98" height="4" fill="#5df3ff"/><text x="114" y="9" fill="#ffd1eb" font-family="Arial, sans-serif" font-size="13" letter-spacing="3">3 VOLTAS · 2 RIVAIS</text></g>`;
  return base(inner, defs);
}

function astroCover() {
  const defs = `<linearGradient id="asky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#050a2c"/><stop offset=".5" stop-color="#151b62"/><stop offset="1" stop-color="#431268"/></linearGradient>
  <radialGradient id="aplanet" cx=".35" cy=".3" r=".75"><stop stop-color="#8ef4ff"/><stop offset=".45" stop-color="#3f86ff"/><stop offset="1" stop-color="#4720a9"/></radialGradient>
  <linearGradient id="alogo" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff"/><stop offset=".55" stop-color="#bde9ff"/><stop offset="1" stop-color="#ffc7f4"/></linearGradient>
  <filter id="aglow"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>${grain}`;
  const inner = `<rect width="600" height="800" fill="url(#asky)"/>
  <g fill="#fff"><circle cx="70" cy="90" r="2"/><circle cx="520" cy="130" r="2.5"/><circle cx="430" cy="60" r="1.5"/><circle cx="160" cy="210" r="1.5"/><circle cx="540" cy="320" r="1.5"/><circle cx="90" cy="390" r="2"/><circle cx="310" cy="90" r="1"/><circle cx="470" cy="250" r="1"/><circle cx="260" cy="180" r="1.5"/><circle cx="570" cy="430" r="1"/></g>
  <g transform="translate(445 170)"><circle r="110" fill="url(#aplanet)"/><ellipse rx="170" ry="30" fill="none" stroke="#ffb5f2" stroke-width="8" opacity=".75" transform="rotate(-18)"/></g>
  <g fill="#ffd45c"><path d="m120 150 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z"/><path d="m495 380 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z"/></g>
  <g transform="translate(100 510)"><path d="M0 90 70 45l95 22 54 52-46 55-110-8Z" fill="#7b5cff"/><path d="M0 90 70 45l95 22-42 48Z" fill="#b29aff"/><path d="M14 116 46 94l20 24-30 20Z" fill="#3d2899"/></g>
  <g transform="translate(350 490)"><path d="M0 65 64 20l80 30 18 64-74 34-72-20Z" fill="#2ccfb2"/><path d="M0 65 64 20l80 30-62 28Z" fill="#8dffe4"/></g>
  <g transform="translate(238 250)">
    <ellipse cx="70" cy="250" rx="55" ry="14" fill="#000" opacity=".35"/>
    <rect x="32" y="160" width="76" height="80" rx="26" fill="#eef8ff"/>
    <rect x="18" y="116" width="104" height="78" rx="30" fill="#fff"/><rect x="28" y="132" width="84" height="42" rx="18" fill="#13284d"/>
    <circle cx="54" cy="153" r="9" fill="#6ff6ff"/><circle cx="86" cy="153" r="9" fill="#6ff6ff"/><path d="M52 168h36" stroke="#6ff6ff" stroke-width="5" stroke-linecap="round"/>
    <rect x="40" y="188" width="18" height="40" rx="9" fill="#d5e6f5"/><rect x="82" y="188" width="18" height="40" rx="9" fill="#d5e6f5"/>
    <rect x="38" y="238" width="28" height="20" rx="9" fill="#c5d9e9"/><rect x="74" y="238" width="28" height="20" rx="9" fill="#c5d9e9"/>
    <path d="M70 116V82" stroke="#d9edff" stroke-width="5"/><circle cx="70" cy="74" r="10" fill="#69e5ff" filter="url(#aglow)"/>
    <path d="M32 138 4 120" stroke="#d9edff" stroke-width="9" stroke-linecap="round"/><circle cx="0" cy="118" r="10" fill="#eef8ff"/>
    <path d="M108 138 136 120" stroke="#d9edff" stroke-width="9" stroke-linecap="round"/><circle cx="140" cy="118" r="10" fill="#eef8ff"/>
    <g transform="translate(106 76)"><path d="m0 0 6 18 18 6-18 6-6 18-6-18-18-6 18-6Z" fill="#ffe063"/></g>
  </g>
  <rect y="0" width="600" height="800" fill="url(#grain)" opacity=".45"/>
  <g transform="translate(42 58)"><text fill="#9feaff" font-family="Arial Black, sans-serif" font-size="15" letter-spacing="5">PLATAFORMA · ESPAÇO · ESTRELAS</text></g>
  <g transform="translate(38 652)"><text fill="url(#alogo)" font-family="Arial Black, sans-serif" font-size="91" font-weight="900" letter-spacing="-7">ASTRO</text><text y="82" fill="url(#alogo)" font-family="Arial Black, sans-serif" font-size="91" font-weight="900" letter-spacing="-7">DASH</text></g>
  <g transform="translate(42 756)"><rect width="90" height="4" fill="#ffe063"/><text x="106" y="9" fill="#d7e8ff" font-family="Arial, sans-serif" font-size="13" letter-spacing="3">COLETE 10 ESTRELAS</text></g>`;
  return base(inner, defs);
}

function landscape(coverSvg, shift = 'center') {
  return coverSvg.replace('width="600" height="800" viewBox="0 0 600 800"', 'width="1200" height="700" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice"');
}

const coverMap = {
  minicraft: miniCover(),
  gta: gtaCover(),
  bloxtity: bloxCover(),
  neon: neonCover(),
  astro: astroCover(),
};

export const GAMES = [
  {
    id: 'minicraft',
    title: 'Minicraft 3D',
    shortTitle: 'MINICRAFT 3D',
    kicker: 'AVENTURA · MUNDO ABERTO',
    genre: 'Aventura / Sandbox',
    tag: 'MUNDO DE BLOCOS',
    description: 'Um mundo inteiro feito de blocos. Minere, colete madeira, crie ferramentas e construa seu portal para voltar para casa.',
    long: 'Explore colinas, florestas e cavernas de um mundo voxel vivo. Quebre blocos, colete recursos, crie sua picareta e erga um portal dimensional. Um mini universo com ciclo de dia e noite, clima e construção livre.',
    price: 89.9,
    size: '3.1 GB',
    players: '1 jogador',
    rating: 4.8,
    accent: '#5ce184',
    accent2: '#2d8cff',
    tags: ['Sandbox', 'Voxel', 'Construção'],
    controls: 'WASD mover · Mouse olhar · Clique esquerdo minerar · Direito colocar · 1-5 hotbar · Espaço pular',
    cover: enc(coverMap.minicraft),
    hero: enc(landscape(coverMap.minicraft)),
  },
  {
    id: 'gta',
    title: 'GTA III: Liberty City',
    shortTitle: 'GTA III',
    kicker: 'AÇÃO · MUNDO ABERTO',
    genre: 'Ação / Aventura',
    tag: '16 KM² DE LIBERDADE',
    description: 'Roube carros, enfrente a polícia e cumpra três missões em uma cidade aberta de 16 km² com sistema de estrelas.',
    long: 'Liberty City nunca dorme. Assuma o controle de Marco, roube qualquer carro e sobreviva a uma cidade que reage a cada crime. Três missões, cinco níveis de procurado, minimapa em tempo real e 16 km² de ruas, prédios e perseguições.',
    price: 149.9,
    size: '8.4 GB',
    players: '1 jogador',
    rating: 4.9,
    accent: '#ff9e58',
    accent2: '#ff4d79',
    tags: ['Mundo aberto', 'Crime', 'Direção'],
    controls: 'WASD mover · Mouse arrastar câmera · E entrar/sair do carro · Shift correr · M mapa · Esc pausar',
    cover: enc(coverMap.gta),
    hero: enc(landscape(coverMap.gta)),
  },
  {
    id: 'bloxtity',
    title: 'Bloxtity.io',
    shortTitle: 'BLOXTITY.IO',
    kicker: 'MULTIPLAYER · ARENA',
    genre: 'Shooter / .io',
    tag: 'SITE + JOGO ONLINE',
    description: 'Entre em bloxtity.io, o site de arena blocky mais acessado do momento, e dispute com bots em partidas de 2 minutos.',
    long: 'Um site dentro do seu console. Acesse bloxtity.io, escolha seu avatar e caia em uma arena flutuante com power-ups, rampas e adversários controlados por IA. Placar ao vivo, respawn instantâneo e partidas rápidas.',
    price: 0,
    size: '1.2 GB',
    players: '1 jogador + bots',
    rating: 4.6,
    accent: '#5de8ff',
    accent2: '#ff5fa2',
    tags: ['Multiplayer', 'Arena', 'Grátis'],
    controls: 'WASD mover · Mouse mirar · Clique atirar · Espaço pular · Shift dash · Esc pausar',
    cover: enc(coverMap.bloxtity),
    hero: enc(landscape(coverMap.bloxtity)),
  },
  {
    id: 'neon',
    title: 'Neon Drift',
    shortTitle: 'NEON DRIFT',
    kicker: 'CORRIDA · ARCADE',
    genre: 'Corrida / Arcade',
    tag: 'SYNTHWAVE RACING',
    description: 'Derrape por uma pista neon ao pôr do sol, dispute três voltas contra dois rivais e domine o asfalto de Liberty.',
    long: 'Velocidade, néon e drifts perfeitos. Escolha o traçado, acelere ao limite e use o boost para ultrapassar rivais em uma pista inspirada nos anos 80. HUD com velocímetro, voltas, posição e minimapa.',
    price: 119.9,
    size: '4.7 GB',
    players: '1 jogador + 2 rivais',
    rating: 4.7,
    accent: '#ff4fa3',
    accent2: '#5df3ff',
    tags: ['Corrida', 'Arcade', 'Synthwave'],
    controls: 'W acelerar · S frear · A/D virar · Espaço drift · Shift boost · R reiniciar · Esc pausar',
    cover: enc(coverMap.neon),
    hero: enc(landscape(coverMap.neon)),
  },
  {
    id: 'astro',
    title: 'Astro Dash',
    shortTitle: 'ASTRO DASH',
    kicker: 'PLATAFORMA · ESPAÇO',
    genre: 'Plataforma 3D',
    tag: 'UMA AVENTURA ESTELAR',
    description: 'Salte entre planetas flutuantes, desvie de obstáculos e colete 10 estrelas com o pequeno robô Astro.',
    long: 'O robô Astro acordou perdido em uma galáxia de plataformas. Corra, salte e use o impulso duplo para coletar 10 estrelas antes que o tempo acabe. Cores, música e plataformas 3D em uma aventura para toda a família.',
    price: 99.9,
    size: '2.6 GB',
    players: '1 jogador',
    rating: 4.8,
    accent: '#8ef4ff',
    accent2: '#9b6bff',
    tags: ['Plataforma', 'Família', 'Espaço'],
    controls: 'WASD mover · Mouse arrastar câmera · Espaço pular (duplo) · Shift correr · R reiniciar · Esc pausar',
    cover: enc(coverMap.astro),
    hero: enc(landscape(coverMap.astro)),
  },
];

export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));
export const formatBRL = (value) => value === 0 ? 'GRÁTIS' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
