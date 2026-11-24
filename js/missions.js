import { LANDMARKS } from './world.js';

/* ============================================================
   GTA 7 BR — 91 MISSÕES ORIGINAIS
   Campanha de Caio BR: favela, São Paulo, praia, funk e o
   confronto final pelo controle da cidade.
   Cada missão guarda nome, história (5 linhas), objetivo,
   mapa, recompensa, carro e arma.
   ============================================================ */

const CATEGORIES = {
  tutorial: { label: 'TUTORIAL / FAVELA', color: '#2ee6c8' },
  favela:   { label: 'FAVELA / CIDADE',   color: '#ffd166' },
  assalto:  { label: 'CIDADE / ASSALTO',  color: '#ff7a66' },
  praia:    { label: 'PRAIA / IATE / FESTA', color: '#5cc8ff' },
  guerra:   { label: 'CHEFÃO FINAL / GUERRA', color: '#ef476f' },
  final:    { label: 'FINAL SECRETA', color: '#ffcf5c' }
};

const VILLAINS = ['Comando do Morro', 'Milícia da Zona Sul', 'Máfia do Porto', 'Batalhão de Choque', 'Cartel de Vega'];
const FRIENDS = ['Biel', 'Duda', 'Larissa', 'Zeca', 'Dona Rosa', 'Tico'];
const CARS = {
  moto: 'Moto CG 160', motoSport: 'Moto XRE 300', sedan: 'Gol G5', hatch: 'Uno Attractive',
  sports: 'Ferrari 488', luxury: 'Lamborghini Urus', suv: 'Troller 4x4', pickup: 'Hilux',
  heli: 'Helicóptero Águia', boat: 'Lancha Bela Vista', jetski: 'Jetski Turbo',
  police: 'Viatura da PM', ambulance: 'Ambulância', truck: 'Caminhão Scania', bus: 'Ônibus SP'
};
const WEAPONS = ['Nenhuma', 'Pistola .40', 'Soco inglês', 'Fuzil AK-47', 'Escopeta', 'Submetralhadora', 'Sniper', 'Lançador de granadas'];

function vehicleType(car) {
  const c = String(car || '').toLowerCase();
  if (c.includes('jetski')) return 'jetski';
  if (c.includes('lancha') || c.includes('barco') || c.includes('iate')) return 'boat';
  if (c.includes('helic')) return 'heli';
  if (c.includes('moto')) return 'moto';
  if (c.includes('lamborghini') || c.includes('ferrari') || c.includes('luxo')) return 'sports';
  if (c.includes('troller') || c.includes('hilux') || c.includes('suv')) return 'suv';
  if (c.includes('ônibus') || c.includes('onibus')) return 'bus';
  if (c.includes('caminhão') || c.includes('caminhao') || c.includes('tanque')) return 'truck';
  if (c.includes('ambul')) return 'ambulance';
  if (c.includes('táxi') || c.includes('taxi') || c.includes('uber')) return 'taxi';
  if (c.includes('viatura') || c.includes('polícia') || c.includes('policia')) return 'police';
  if (c.includes('uno') || c.includes('celta')) return 'hatch';
  return 'sedan';
}

/* [num, título, categoria, início, fim, recompensa, carro, arma, objetivo, opções] */
const SPECS = [
  [1,  'Chegada na Favela', 'tutorial', 'favela', 'laje', 500, CARS.moto, WEAPONS[0], 'Chegue ao morro e encontre Biel.', { talk: 1 }],
  [2,  'Primeira Moto', 'tutorial', 'laje', 'oficina', 700, CARS.motoSport, WEAPONS[0], 'Pegue a moto e fuja da polícia com 1 estrela.', { steal: true, escape: 1 }],
  [3,  'Primeira Entrega', 'tutorial', 'kiosk', 'shop', 500, CARS.moto, WEAPONS[0], 'Entregue o iFood de moto antes do tempo acabar.', { timeLimit: 180 }],
  [4,  'Aprendendo a Atirar', 'tutorial', 'escola', 'escola', 800, CARS.sedan, WEAPONS[1], 'Treine tiro no morro e acerte os alvos.', { combat: 3 }],
  [5,  'Fuga da Favela', 'tutorial', 'favela', 'mooca', 1000, CARS.sedan, WEAPONS[1], 'Fuja da favela com 2 estrelas de procurado.', { escape: 2 }],
  [6,  'Roubar o Primeiro Carro', 'tutorial', 'centro', 'oficina', 1200, CARS.sedan, WEAPONS[0], 'Roube um Gol e leve até a oficina.', { steal: true, escape: 1 }],
  [7,  'Conhecendo a Praia', 'tutorial', 'praia', 'kiosk', 900, CARS.sedan, WEAPONS[0], 'Vá à praia e conheça Larissa.', { talk: 1 }],
  [8,  'Briga no Baile Funk', 'tutorial', 'laje', 'laje', 1500, CARS.sedan, WEAPONS[2], 'Brigue no baile e defenda Biel.', { combat: 4 }],
  [9,  'Comprando Roupa', 'tutorial', 'shop', 'shop', 600, CARS.sedan, WEAPONS[0], 'Compre boné, tatuagem e roupa BR.', { talk: 1 }],
  [10, 'Primeira Casa', 'tutorial', 'laje', 'safehouse', 2000, CARS.sedan, WEAPONS[1], 'Compre o barraco na favela e salve o jogo.', { talk: 1 }],

  [11, 'Entrega Perigosa', 'favela', 'kiosk', 'porto', 2400, CARS.moto, WEAPONS[1], 'Leve a encomenda perigosa até o Porto de Santos.', { escape: 2 }],
  [12, 'Roubo de Moto', 'favela', 'centro', 'oficina', 2600, CARS.motoSport, WEAPONS[1], 'Roube a moto do entregador rival e leve à oficina.', { steal: true, escape: 2 }],
  [13, 'Assalto na Padaria', 'favela', 'shop', 'favela', 2800, CARS.sedan, WEAPONS[1], 'Assalte a padaria e volte para a favela.', { combat: 3, escape: 2 }],
  [14, 'Corrida de Moto no Morro', 'favela', 'favela', 'laje', 3000, CARS.motoSport, WEAPONS[0], 'Vença a corrida de moto pelas ruas do morro.', { race: true }],
  [15, 'Salvar o Amigo Preso', 'favela', 'delegacia', 'favela', 3200, CARS.sedan, WEAPONS[1], 'Invada a delegacia e salve Biel.', { combat: 4, escape: 3 }],
  [16, 'Fuga de Helicóptero', 'favela', 'aeroporto', 'praia', 3400, CARS.heli, WEAPONS[2], 'Roube o helicóptero e fuja pela orla.', { steal: true, escape: 3 }],
  [17, 'Roubar Joalheria Pequena', 'favela', 'shop', 'centro', 3600, CARS.sedan, WEAPONS[1], 'Roube a joalheria e suma no centro.', { combat: 3, escape: 2 }],
  [18, 'Briga com Gangue Rival', 'favela', 'morroRival', 'favela', 3800, CARS.suv, WEAPONS[2], 'Enfrente a gangue rival e defenda o território.', { combat: 5, escape: 2 }],
  [19, 'Táxi / Uber BR', 'favela', 'centro', 'aeroporto', 4000, CARS.taxi, WEAPONS[0], 'Faça corridas de táxi e leve o passageiro ao aeroporto.', { timeLimit: 200 }],
  [20, 'Entrega de Encomenda Secreta', 'favela', 'porto', 'warehouse', 4200, CARS.pickup, WEAPONS[1], 'Entregue a encomenda secreta no galpão da Mooca.', { chase: true, escape: 2 }],
  [21, 'Roubar Carro de Luxo', 'favela', 'mansion', 'oficina', 4500, CARS.luxury, WEAPONS[1], 'Roube o carro de luxo da mansão e leve à oficina.', { steal: true, escape: 3 }],
  [22, 'Explosão no Posto', 'favela', 'garage', 'porto', 4800, CARS.pickup, WEAPONS[3], 'Exploda o posto rival e fuja pelo porto.', { combat: 4, escape: 3 }],
  [23, 'Perseguição 3 Estrelas', 'favela', 'centro', 'ponte', 5000, CARS.sports, WEAPONS[1], 'Fuja da polícia com 3 estrelas até a ponte.', { escape: 3 }],
  [24, 'Salvar a Mãe', 'favela', 'favela', 'hospital', 5200, CARS.sedan, WEAPONS[1], 'Leve Dona Rosa ao hospital antes que seja tarde.', { timeLimit: 150, escape: 2 }],
  [25, 'Assalto ao Banco do Centro', 'favela', 'bank', 'centro', 5500, CARS.sedan, WEAPONS[3], 'Assalte o Banco Central e saia pelo centro.', { combat: 5, escape: 3 }],
  [26, 'Fuga com 4 Estrelas', 'favela', 'bank', 'mooca', 5800, CARS.sports, WEAPONS[3], 'Fuja com 4 estrelas depois do assalto.', { escape: 4 }],
  [27, 'Corrida de Rua no Centro', 'favela', 'centro', 'centro', 6000, CARS.sports, WEAPONS[0], 'Vença a corrida de rua no centro de São Paulo.', { race: true }],
  [28, 'Comprar Apartamento', 'favela', 'safehouse', 'safehouse', 6200, CARS.sedan, WEAPONS[0], 'Compre o apartamento e guarde o dinheiro.', { talk: 1 }],
  [29, 'Festa na Laje', 'favela', 'laje', 'laje', 6500, CARS.sedan, WEAPONS[0], 'Organize a festa na laje e ganhe respeito.', { talk: 1 }],
  [30, 'Virar Chefe da Favela', 'favela', 'favela', 'laje', 7000, CARS.suv, WEAPONS[3], 'Sobreviva ao cerco e vire chefe da favela.', { combat: 5, defend: 40, wanted: 3 }],

  [31, 'Assalto ao Carro-Forte', 'assalto', 'bank', 'ponte', 7600, CARS.pickup, WEAPONS[3], 'Pare o carro-forte e roube o malote.', { combat: 4, chase: true, escape: 3 }],
  [32, 'Roubar Helicóptero', 'assalto', 'aeroporto', 'iate', 8000, CARS.heli, WEAPONS[3], 'Roube o helicóptero e leve ao iate.', { steal: true, escape: 3 }],
  [33, 'Fuga da Prisão', 'assalto', 'delegacia', 'favela', 8400, CARS.sedan, WEAPONS[3], 'Liberte os presos e fuja para a favela.', { combat: 6, escape: 4 }],
  [34, 'Salvar o Irmão', 'assalto', 'hospital', 'morroRival', 8800, CARS.suv, WEAPONS[3], 'Resgate o irmão no morro rival.', { combat: 5, escape: 3 }],
  [35, 'Corrida de Carro 300km/h', 'assalto', 'ponte', 'aeroporto', 9200, CARS.sports, WEAPONS[0], 'Corra a 300 km/h e vença na ponte.', { race: true, timeLimit: 120 }],
  [36, 'Roubar Loja de Roupa', 'assalto', 'shop', 'oficina', 9600, CARS.sedan, WEAPONS[2], 'Roube a loja de roupa e leve os pacotes.', { combat: 3, escape: 2 }],
  [37, 'Invasão na Mansão', 'assalto', 'mansion', 'mansion', 10000, CARS.luxury, WEAPONS[3], 'Invada a mansão dos Jardins e pegue o cofre.', { combat: 6, escape: 4 }],
  [38, 'Tiroteio no Shopping', 'assalto', 'shop', 'centro', 10400, CARS.suv, WEAPONS[3], 'Sobreviva ao tiroteio no shopping.', { combat: 6, escape: 4 }],
  [39, 'Fuga de Barco', 'assalto', 'porto', 'iate', 10800, CARS.boat, WEAPONS[2], 'Fuja de barco pelo porto até o iate.', { boat: true, escape: 3 }],
  [40, 'Assalto ao Cassino', 'assalto', 'casino', 'centro', 11200, CARS.sports, WEAPONS[3], 'Assalte o Cassino Bela Vista e limpe o cofre.', { combat: 6, escape: 4 }],
  [41, 'Sequestro do Chefão Rival', 'assalto', 'morroRival', 'porto', 11600, CARS.suv, WEAPONS[3], 'Sequestre o chefão rival e leve ao porto.', { combat: 5, chase: true, escape: 4 }],
  [42, 'Explosão na Ponte', 'assalto', 'ponte', 'centro', 12000, CARS.pickup, WEAPONS[7], 'Exploda a ponte e bloqueie a polícia.', { combat: 4, escape: 4 }],
  [43, 'Perseguição 5 Estrelas', 'assalto', 'centro', 'ponte', 12500, CARS.sports, WEAPONS[3], 'Fuja com 5 estrelas, igual ao vídeo.', { escape: 5 }],
  [44, 'Salvar a Namorada', 'assalto', 'praia', 'mansion', 13000, CARS.sports, WEAPONS[3], 'Salve Larissa e leve-a para a mansão.', { combat: 5, chase: true, escape: 4 }],
  [45, 'Roubar Banco Gigante', 'assalto', 'bank', 'porto', 13500, CARS.truck, WEAPONS[3], 'Roube o banco gigante e fuja de caminhão.', { combat: 7, escape: 5 }],
  [46, 'Guerra de Gangue', 'assalto', 'morroRival', 'favela', 14000, CARS.suv, WEAPONS[3], 'Comande a guerra de gangue e domine o morro.', { combat: 7, defend: 45, wanted: 4 }],
  [47, 'Comprar Mansão', 'assalto', 'mansion', 'mansion', 14500, CARS.luxury, WEAPONS[0], 'Compre a mansão dos Jardins.', { talk: 1 }],
  [48, 'Festa no Iate', 'assalto', 'iate', 'iate', 15000, CARS.boat, WEAPONS[0], 'Domine a festa no iate e faça contatos.', { talk: 1, boat: true }],
  [49, 'Corrida de Lancha', 'assalto', 'iate', 'marina', 15500, CARS.boat, WEAPONS[0], 'Vença a corrida de lancha pela baía.', { boat: true, race: true }],
  [50, 'Virar Rei da Cidade', 'assalto', 'monument', 'monument', 16000, CARS.luxury, WEAPONS[3], 'Defenda o mirante e vire rei da cidade.', { combat: 6, defend: 50, wanted: 4 }],

  [51, 'Festa na Praia', 'praia', 'praia', 'praia', 16800, CARS.sedan, WEAPONS[0], 'Curta a festa na praia e proteja Larissa.', { talk: 1 }],
  [52, 'Roubar Lancha', 'praia', 'marina', 'iate', 17600, CARS.boat, WEAPONS[1], 'Roube a lancha do milionário.', { steal: true, boat: true, escape: 3 }],
  [53, 'Mergulho do Tesouro', 'praia', 'ilha', 'ilha', 18400, CARS.boat, WEAPONS[0], 'Mergulhe e recupere o tesouro da ilha.', { boat: true }],
  [54, 'Salvar Afogado', 'praia', 'praia', 'ilha', 19200, CARS.boat, WEAPONS[0], 'Salve o turista que está se afogando.', { boat: true, timeLimit: 140 }],
  [55, 'Corrida de Jetski', 'praia', 'marina', 'praia', 20000, CARS.jetski, WEAPONS[0], 'Vença a corrida de jetski na orla.', { boat: true, race: true }],
  [56, 'Assalto no Porto', 'praia', 'porto', 'porto', 20800, CARS.truck, WEAPONS[3], 'Assalte o porto e carregue o contêiner.', { combat: 6, escape: 4 }],
  [57, 'Fuga de Lancha da Polícia', 'praia', 'iate', 'marina', 21600, CARS.boat, WEAPONS[2], 'Fuja da polícia de lancha pela costa.', { boat: true, escape: 4 }],
  [58, 'Show de Funk', 'praia', 'laje', 'laje', 22400, CARS.sedan, WEAPONS[0], 'Produza o show de funk e mantenha a paz.', { combat: 4, defend: 35 }],
  [59, 'Roubar Iate de Milionário', 'praia', 'iate', 'iate', 23200, CARS.boat, WEAPONS[3], 'Roube o iate de milionário e zarpe.', { boat: true, combat: 4, escape: 4 }],
  [60, 'Explosão no Porto', 'praia', 'porto', 'porto', 24000, CARS.pickup, WEAPONS[7], 'Exploda o porto e destrua a carga rival.', { combat: 5, escape: 5 }],
  [61, 'Perseguição de Helicóptero na Praia', 'praia', 'praia', 'ilha', 24800, CARS.heli, WEAPONS[3], 'Pilote o helicóptero e persiga o alvo na praia.', { steal: true, chase: true, escape: 4 }],
  [62, 'Salvar Turista', 'praia', 'praia', 'hospital', 25600, CARS.ambulance, WEAPONS[0], 'Resgate o turista e leve ao hospital.', { timeLimit: 130, escape: 2 }],
  [63, 'Comprar Cobertura', 'praia', 'mansion', 'mansion', 26400, CARS.luxury, WEAPONS[0], 'Compre a cobertura mais alta de São Paulo.', { talk: 1 }],
  [64, 'Casamento no Morro', 'praia', 'laje', 'laje', 27200, CARS.sedan, WEAPONS[0], 'Proteja o casamento no morro.', { combat: 5, defend: 40 }],
  [65, 'Guerra na Praia', 'praia', 'praia', 'praia', 28000, CARS.suv, WEAPONS[3], 'Vença a guerra na praia.', { combat: 7, defend: 45, wanted: 4 }],
  [66, 'Roubar Avião Pequeno', 'praia', 'aeroporto', 'aeroporto', 28800, CARS.heli, WEAPONS[3], 'Roube o avião pequeno do aeroporto.', { steal: true, escape: 4 }],
  [67, 'Pular de Paraquedas', 'praia', 'aeroporto', 'praia', 29600, CARS.heli, WEAPONS[0], 'Salte de paraquedas e pouse na praia.', { timeLimit: 150 }],
  [68, 'Corrida de Carro na Orla', 'praia', 'praia', 'praiao', 30400, CARS.sports, WEAPONS[0], 'Vença a corrida na orla.', { race: true, timeLimit: 120 }],
  [69, 'Festa de Aniversário do Caio', 'praia', 'mansion', 'mansion', 31200, CARS.luxury, WEAPONS[0], 'Sobreviva à festa de aniversário do Caio.', { combat: 4, defend: 35 }],
  [70, 'Virar Lenda do Brasil', 'praia', 'monument', 'monument', 32000, CARS.sports, WEAPONS[3], 'Vire lenda do Brasil no mirante.', { combat: 6, defend: 50, wanted: 5 }],

  [71, 'O Retorno do Inimigo', 'guerra', 'mansion', 'mansion', 34000, CARS.suv, WEAPONS[3], 'O inimigo voltou. Defenda a mansão.', { combat: 7, defend: 50, wanted: 4 }],
  [72, 'Invasão do Morro Rival', 'guerra', 'morroRival', 'morroRival', 36000, CARS.suv, WEAPONS[3], 'Invada o morro rival e tome o território.', { combat: 8, escape: 4 }],
  [73, 'Assalto ao Banco Central', 'guerra', 'bank', 'bank', 38000, CARS.truck, WEAPONS[3], 'Assalte o Banco Central de São Paulo.', { combat: 8, escape: 5 }],
  [74, 'Roubar Tanque de Guerra', 'guerra', 'delegacia', 'centro', 40000, CARS.truck, WEAPONS[7], 'Roube o tanque de guerra do exército.', { steal: true, combat: 6, escape: 5 }],
  [75, 'Fuga com Exército', 'guerra', 'centro', 'ponte', 42000, CARS.sports, WEAPONS[3], 'Fuja do exército com 6 estrelas.', { escape: 6 }],
  [76, 'Salvar a Favela Inteira', 'guerra', 'favela', 'favela', 44000, CARS.suv, WEAPONS[3], 'Defenda a favela inteira do cerco.', { combat: 8, defend: 55, wanted: 5 }],
  [77, 'Explosão na Favela', 'guerra', 'favela', 'laje', 46000, CARS.pickup, WEAPONS[7], 'Exploda o quartel rival na favela.', { combat: 6, escape: 5 }],
  [78, 'Guerra Final no Centro', 'guerra', 'centro', 'centro', 48000, CARS.suv, WEAPONS[3], 'Comande a guerra final no centro.', { combat: 9, defend: 55, wanted: 5 }],
  [79, 'Perseguição com 6 Estrelas', 'guerra', 'centro', 'ponte', 50000, CARS.sports, WEAPONS[3], 'Sobreviva à perseguição com 6 estrelas.', { escape: 6 }],
  [80, 'Roubar Ouro do Banco', 'guerra', 'bank', 'porto', 52000, CARS.truck, WEAPONS[3], 'Roube o ouro do banco e leve ao porto.', { combat: 8, escape: 6 }],
  [81, 'Salvar a Família', 'guerra', 'hospital', 'mansion', 54000, CARS.ambulance, WEAPONS[3], 'Salve a família de Caio e leve para a mansão.', { combat: 7, escape: 5 }],
  [82, 'Corrida Final', 'guerra', 'aeroporto', 'aeroporto', 56000, CARS.sports, WEAPONS[0], 'Vença a corrida final pela cidade.', { race: true, timeLimit: 120 }],
  [83, 'Luta com Chefão 1', 'guerra', 'mansion', 'mansion', 58000, CARS.suv, WEAPONS[3], 'Enfrente o primeiro chefão na mansão.', { combat: 9, wanted: 4 }],
  [84, 'Luta com Chefão 2', 'guerra', 'morroRival', 'morroRival', 60000, CARS.suv, WEAPONS[3], 'Enfrente o segundo chefão no morro rival.', { combat: 10, wanted: 5 }],
  [85, 'Invasão da Base Inimiga', 'guerra', 'porto', 'porto', 62000, CARS.truck, WEAPONS[3], 'Invada a base inimiga no porto.', { combat: 10, escape: 5 }],
  [86, 'Fuga de Avião', 'guerra', 'aeroporto', 'praia', 64000, CARS.heli, WEAPONS[3], 'Fuja de avião e pouse na praia.', { steal: true, escape: 6 }],
  [87, 'Explosão Final', 'guerra', 'ponte', 'centro', 66000, CARS.pickup, WEAPONS[7], 'Exploda a ponte e feche o cerco.', { combat: 8, escape: 6 }],
  [88, 'Salvar São Paulo', 'guerra', 'monument', 'monument', 68000, CARS.suv, WEAPONS[3], 'Defenda São Paulo no mirante.', { combat: 10, defend: 60, wanted: 6 }],
  [89, 'Última Fuga', 'guerra', 'centro', 'aeroporto', 70000, CARS.sports, WEAPONS[3], 'Faça a última fuga com 6 estrelas.', { escape: 6 }],
  [90, 'O Rei do Brasil', 'guerra', 'monument', 'monument', 80000, CARS.luxury, WEAPONS[3], 'Derrote o exército e seja o Rei do Brasil.', { combat: 10, defend: 60, wanted: 6 }],

  [91, 'O CHEFÃO FINAL', 'final', 'mansion', 'monument', 100000, 'Lamborghini Dourada', WEAPONS[7], 'Enfrente o Chefão Final na cobertura, salve a cidade e vire o Rei do GTA 7 BR.', { combat: 12, chase: true, defend: 60, escape: 6, final: true }]
];

const TIMES = ['06:10', '08:25', '10:40', '12:15', '14:30', '16:45', '18:42', '20:05', '22:30', '23:50'];

function mapKey(key) {
  return LANDMARKS[key] ? key : 'favela';
}
function posOf(key) {
  return LANDMARKS[mapKey(key)];
}
function locName(key) {
  return posOf(key).name;
}

function storyFor(m) {
  const villain = VILLAINS[m.num % VILLAINS.length];
  const friend = FRIENDS[m.num % FRIENDS.length];
  const place = locName(m.startKey);
  const end = locName(m.endKey);
  const cat = CATEGORIES[m.category].label;
  const first = {
    tutorial: `Caio BR desce do ônibus em ${place} com vinte reais no bolso e o boné virado para trás.`,
    favela: `A favela acordou com sirene. ${villain} quer tomar a boca de ${place} antes do sol nascer.`,
    assalto: `O plano de ${m.title.toLowerCase()} está na mesa: dinheiro grande, risco maior ainda.`,
    praia: `O mar de ${place} está calmo demais. É sinal de que alguém vai quebrar a paz.`,
    guerra: `São Paulo virou campo de guerra. ${villain} reuniu todo mundo para o confronto final.`,
    final: `A cidade inteira prende a respiração. O Chefão Final desceu na cobertura e quer tudo ou nada.`
  }[m.category];
  return [
    first,
    `${friend} avisa que ${m.objective.toLowerCase()} e que o caminho até ${end} está vigiado.`,
    `Caio responde: "Então a gente vai de ${m.car.toLowerCase()}. Se der errado, a gente improvisa."`,
    `${villain} manda recado: se Caio cruzar a linha, a resposta vem com ${m.weapon.toLowerCase()}.`,
    `Dando certo, Caio embolsa R$ ${m.reward.toLocaleString('pt-BR')} e sobe mais um degrau na ${cat.toLowerCase()}.`
  ];
}

function storyLines(m) {
  return storyFor(m).map((pt, i) => ({
    who: i === 0 || i === 2 || i === 4 ? 'CAIO' : (i === 1 ? FRIENDS[m.num % FRIENDS.length] : VILLAINS[m.num % VILLAINS.length]),
    pt,
    en: pt
  }));
}

function makeRacePoints(startKey, endKey, count = 4) {
  const a = posOf(startKey), b = posOf(endKey);
  const pts = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const wobble = Math.sin((i + 1) * 2.1 + a.x * 0.01) * 45;
    pts.push({ x: a.x + (b.x - a.x) * t + wobble, z: a.z + (b.z - a.z) * t - wobble * 0.6 });
  }
  return pts;
}

function makeSteps(m) {
  const o = m.opts || {};
  const start = posOf(m.startKey);
  const end = posOf(m.endKey);
  const steps = [];
  steps.push({
    type: 'goto', pos: start, r: 9,
    desc: `Vá até ${locName(m.startKey)} e prepare o plano`,
    descEn: `Go to ${locName(m.startKey)} and prepare the plan`
  });

  if (o.talk) {
    steps.push({
      type: 'goto', pos: { x: start.x + 5, z: start.z + 5 }, r: 7,
      desc: `Converse com ${FRIENDS[m.num % FRIENDS.length]} em ${locName(m.startKey)}`,
      descEn: 'Talk to your contact'
    });
  }

  if (o.steal) {
    steps.push({
      type: 'steal', pos: start, r: 12, vehicle: vehicleType(m.car),
      color: m.category === 'praia' ? 0x1f7f8f : 0xffc46b,
      desc: `Roube o veículo: ${m.car}`,
      descEn: `Steal the vehicle: ${m.car}`
    });
  }

  if (o.boat) {
    steps.push({ type: 'enterBoat', desc: 'Entre na lancha e prepare o motor', descEn: 'Board the boat and start the engine' });
  }

  if (o.race) {
    steps.push({
      type: 'race', points: makeRacePoints(m.startKey, m.endKey, 4),
      desc: `Passe por todos os checkpoints da corrida`,
      descEn: 'Pass every race checkpoint'
    });
  }

  if (o.combat) {
    steps.push({
      type: 'combat', count: o.combat,
      wantedOnDone: o.escape ? Math.min(6, o.escape) : 0,
      desc: `Elimine ${o.combat} inimigos de ${VILLAINS[m.num % VILLAINS.length]}`,
      descEn: `Take down ${o.combat} enemies`
    });
  }

  if (o.chase) {
    const t = { x: end.x, z: end.z, type: vehicleType(m.car), color: 0xff7a59, name: VILLAINS[m.num % VILLAINS.length].toUpperCase() };
    steps.push({
      type: 'chase', target: t,
      desc: `Persiga o alvo até ${locName(m.endKey)}`,
      descEn: `Chase the target to ${locName(m.endKey)}`
    });
  }

  steps.push({
    type: 'goto', pos: end, r: 10,
    desc: m.objective,
    descEn: m.objective
  });

  if (o.defend) {
    steps.push({
      type: 'defend', seconds: o.defend, wanted: o.wanted || 4, spawnEnemies: 'gang',
      desc: `Defenda a posição por ${o.defend} segundos`,
      descEn: `Hold the position for ${o.defend} seconds`
    });
  }

  if (o.escape) {
    steps.push({
      type: 'escape', wanted: o.escape, clearWanted: true,
      desc: `Fuja da polícia com ${o.escape} estrela${o.escape > 1 ? 's' : ''}`,
      descEn: `Escape the police at ${o.escape} star${o.escape > 1 ? 's' : ''}`
    });
  }

  if (o.final) {
    steps.push({
      type: 'goto', pos: posOf('monument'), r: 12,
      desc: 'Chegue ao Mirante do Vale e salve São Paulo',
      descEn: 'Reach Mirante do Vale and save São Paulo'
    });
  }
  return steps;
}

export const MISSIONS = SPECS.map(([num, title, category, startKey, endKey, reward, car, weapon, objective, opts]) => {
  const base = {
    id: 'm' + num, num, title, category, char: 'caio',
    location: locName(startKey).toUpperCase(),
    time: TIMES[num % TIMES.length],
    start: posOf(startKey),
    startKey, endKey,
    reward, car, weapon, objective,
    trophy: 'trophy-' + String(num).padStart(2, '0'),
    opts: opts || {}
  };
  base.sub = storyFor(base)[0];
  base.story = storyFor(base);
  base.storyLines = storyLines(base);
  base.steps = makeSteps(base);
  if (opts && opts.timeLimit) base.timeLimit = opts.timeLimit;
  if (opts && opts.repReward) base.repReward = opts.repReward;
  return base;
});

export { CATEGORIES, vehicleType };
