// ============================================================
// GTA 7 BR · 91 MISSÕES · CAMPANHA DO CAIO
// Campanha adicional. As 5 missões originais continuam intactas.
// ============================================================

const PLACES = {
  favela: ['Morro do Som', 'Sound Hill'],
  beachKiosk: ['Orla Central', 'Central Shore'],
  garage: ['Oficina do Zeca', "Zeca's Garage"],
  marina: ['Marina Azul', 'Blue Marina'],
  hospital: ['Hospital da Maré', 'Maré Hospital'],
  club: ['Clube Neon 88', 'Neon 88 Club'],
  park: ['Parque das Salinas', 'Salt Park'],
  matteoTower: ['Torre Matteo', 'Matteo Tower'],
  ferris: ['Roda-Gigante', 'Ferris Wheel'],
  pier: ['Pier de Costa', 'Costa Pier'],
  delivery: ['Boca do Morro', 'Hill Gate'],
  shop: ['Loja da Orla', 'Shore Shop'],
  bank: ['Banco Maré', 'Maré Bank'],
  police: ['Delegacia Central', 'Central Precinct'],
  mansion: ['Mansão da Serra', 'Hill Mansion'],
  port: ['Porto Maré', 'Maré Harbor'],
  airport: ['Aeroporto de Costa', 'Costa Airport'],
  home: ['Barraco do Caio', "Caio's Place"],
  lanchonete: ['Lanchonete da Praia', 'Beach Diner']
};

const PLACE_CYCLE = [
  'favela', 'beachKiosk', 'garage', 'marina', 'hospital', 'club', 'park', 'matteoTower',
  'ferris', 'pier', 'shop', 'bank', 'police', 'mansion', 'port', 'airport', 'home', 'lanchonete'
];

const CONTACTS = ['Zeca', 'Bia', 'Duda', 'Rafa', 'Dona Neide', 'Seu Nildo', 'Tia Mara', 'Nando', 'Vitória', 'Betão'];

const WARNINGS = [
  'A favela viu você chegar. Agora todo mundo quer saber o que você traz.',
  'Aqui ninguém faz favor de graça. Cada esquina cobra o seu preço.',
  'Se a polícia chegar, não olha para trás e não solta o volante.',
  'O morro tá quente hoje. Um tiro errado e a guerra começa.',
  'Tem gente grande olhando. Faz o serviço limpo e some.',
  'O dinheiro é bom, mas a fama é melhor. Não confunde os dois.',
  'A maré tá mansa, mas o fundo é cheio de pedra.',
  'Confia no plano, não na cara de quem te contratou.'
];

const RISKS = [
  'onde a polícia passa devagar e a gangue passa rindo',
  'um lugar que não aparece no mapa dos turistas',
  'com as câmeras desligadas e os portões abertos',
  'no meio do movimento, onde ninguém vê nada',
  'pela rota do porto, entre contêineres e concreto',
  'por dentro da festa, onde todo mundo finge que não conhece você'
];

const PAYOFFS = [
  'Caio bota o dinheiro no bolso e deixa a cidade falar.',
  'O nome de Caio sobe mais um degrau no morro.',
  'A favela ganha uma noite de paz. A conta chega depois.',
  'Caio olha para trás uma vez. Só uma.',
  'O bairro inteiro comenta no dia seguinte.',
  'Mais uma história para contar no baile de sábado.'
];

// [título, local, tipo, objetivo, veículo, arma, nível de procurado]
const DATA = [
  ['Chegada na Favela', 'favela', 'tutorial', 'Chegue ao Morro do Som e encontre Zeca.', 'Moto CG 160', 'Pistola'],
  ['Primeira Moto', 'favela', 'tutorial', 'Pegue a moto do Zeca e fuja da polícia com 1 estrela.', 'Moto de trilha', 'Pistola', 1],
  ['Primeira Entrega', 'delivery', 'delivery', 'Entregue o pedido de iFood de moto e ganhe R$ 500.', 'Moto CG 160', 'Pistola'],
  ['Aprendendo a Atirar', 'favela', 'tutorial', 'Treine tiro no morro e acerte os alvos de lata.', 'Nenhum', 'Pistola'],
  ['Fuga da Favela', 'favela', 'chase', 'Fuja da polícia com 2 estrelas pelas vielas.', 'Gol rebaixado', 'Pistola', 2],
  ['Roubar o Primeiro Carro', 'garage', 'heist', 'Roube um Gol e leve para a oficina sem ser pego.', 'Gol', 'Pistola', 1],
  ['Conhecendo a Praia', 'beachKiosk', 'tutorial', 'Vá à praia e conheça Bia, a namorada de Caio.', 'Nenhum', 'Pistola'],
  ['Briga no Baile Funk', 'favela', 'chase', 'Defenda Zeca no baile funk e ganhe respeito.', 'Nenhum', 'Pistola', 1],
  ['Comprando Roupa', 'shop', 'tutorial', 'Compre boné, camisa e tatuagem na loja da orla.', 'Nenhum', 'Pistola'],
  ['Primeira Casa', 'home', 'tutorial', 'Compre o barraco no morro e durma para salvar.', 'Nenhum', 'Pistola'],
  ['Entrega Perigosa', 'port', 'delivery', 'Leve a encomenda do porto até a praia sem abrir o pacote.', 'Fiorino', 'Pistola', 1],
  ['Roubo de Moto', 'garage', 'heist', 'Roube a moto de trilha da oficina rival.', 'Moto de trilha', 'Pistola', 2],
  ['Assalto na Padaria', 'shop', 'heist', 'Assalte a padaria da esquina antes que a polícia chegue.', 'Uno', 'Pistola', 2],
  ['Corrida de Moto no Morro', 'favela', 'race', 'Vença a corrida de moto pelas vielas do morro.', 'Moto de rua', 'Pistola'],
  ['Salvar o Amigo Preso', 'police', 'chase', 'Invada a delegacia e tire Zeca da cela.', 'Viatura', 'Pistola', 3],
  ['Fuga de Helicóptero', 'airport', 'chase', 'Roube o helicóptero e fuja com 3 estrelas.', 'Helicóptero', 'Pistola', 3],
  ['Roubar Joalheria Pequena', 'shop', 'heist', 'Roube a joalheria e saia pelo beco dos fundos.', 'Moto de rua', 'Pistola', 2],
  ['Briga com Gangue Rival', 'favela', 'heist', 'Enfrente a gangue rival e defenda o território.', 'Nenhum', 'Pistola', 2],
  ['Táxi / Uber BR', 'beachKiosk', 'delivery', 'Faça corridas de táxi pela orla e ganhe gorjeta.', 'Táxi', 'Pistola'],
  ['Entrega de Encomenda Secreta', 'port', 'delivery', 'Entregue a encomenda secreta no centro sem olhar dentro.', 'Fiorino', 'Pistola', 1],
  ['Roubar Carro de Luxo', 'mansion', 'heist', 'Roube o carro de luxo da mansão e leve para o porto.', 'Lamborghini', 'Pistola', 2],
  ['Explosão no Posto', 'garage', 'heist', 'Plante a carga no posto e saia antes da explosão.', 'Celta', 'Pistola', 3],
  ['Perseguição 3 Estrelas', 'matteoTower', 'chase', 'Sobreviva à perseguição de 3 estrelas pelo centro.', 'Carro esportivo', 'SMG', 3],
  ['Salvar a Mãe', 'favela', 'chase', 'Resgate Dona Neide e leve-a para o hospital.', 'Gol', 'Pistola', 2],
  ['Assalto ao Banco do Centro', 'bank', 'heist', 'Assalte o banco do centro e fuja com o dinheiro.', 'Carro blindado', 'SMG', 3],
  ['Fuga com 4 Estrelas', 'port', 'chase', 'Fuja da polícia com 4 estrelas até o porto.', 'Carro blindado', 'SMG', 4],
  ['Corrida de Rua no Centro', 'matteoTower', 'race', 'Vença a corrida de rua no centro da cidade.', 'Ferrari', 'Pistola'],
  ['Comprar Apartamento', 'mansion', 'tutorial', 'Compre o apartamento na cobertura e salve o jogo.', 'Nenhum', 'Pistola'],
  ['Festa na Laje', 'favela', 'tutorial', 'Organize a festa na laje e fale com Bia.', 'Nenhum', 'Pistola'],
  ['Virar Chefe da Favela', 'favela', 'finale', 'Enfrente os chefes do morro e assuma o controle.', 'Moto de trilha', 'SMG', 3],
  ['Assalto ao Carro-Forte', 'bank', 'heist', 'Pare o carro-forte e leve os malotes.', 'Caminhão', 'SMG', 3],
  ['Roubar Helicóptero', 'airport', 'heist', 'Roube o helicóptero do aeroporto e decole.', 'Helicóptero', 'SMG', 3],
  ['Fuga da Prisão', 'police', 'chase', 'Liberte o irmão e fuja da delegacia.', 'Viatura', 'SMG', 4],
  ['Salvar o Irmão', 'hospital', 'chase', 'Resgate o irmão no hospital e leve-o para casa.', 'Ambulância', 'Pistola', 3],
  ['Corrida de Carro 300km/h', 'matteoTower', 'race', 'Acelere até 300 km/h e vença a corrida.', 'Lamborghini', 'Pistola'],
  ['Roubar Loja de Roupa', 'shop', 'heist', 'Roube a loja de roupa e fuja de moto.', 'Moto de rua', 'Pistola', 2],
  ['Invasão na Mansão', 'mansion', 'heist', 'Invada a mansão e pegue o cofre do milionário.', 'Ferrari', 'SMG', 4],
  ['Tiroteio no Shopping', 'shop', 'heist', 'Sobreviva ao tiroteio no shopping e saia pelo estacionamento.', 'SUV', 'SMG', 4],
  ['Fuga de Barco', 'marina', 'water', 'Roube a lancha e fuja pela costa.', 'Lancha', 'Pistola', 3],
  ['Assalto ao Cassino', 'club', 'heist', 'Assalte o cassino e leve o dinheiro da mesa.', 'Carro esportivo', 'SMG', 4],
  ['Sequestro do Chefão Rival', 'mansion', 'heist', 'Sequestre o chefão rival e entregue no porto.', 'Van', 'SMG', 4],
  ['Explosão na Ponte', 'port', 'chase', 'Plante a carga na ponte e fuja com 4 estrelas.', 'Carro blindado', 'SMG', 4],
  ['Perseguição 5 Estrelas', 'matteoTower', 'chase', 'Sobreviva à perseguição de 5 estrelas, igual ao vídeo.', 'Ferrari', 'SMG', 5],
  ['Salvar a Namorada', 'beachKiosk', 'chase', 'Resgate Bia na praia e leve-a para o morro.', 'SUV', 'SMG', 4],
  ['Roubar Banco Gigante', 'bank', 'heist', 'Assalte o banco gigante do centro com o time.', 'Carro blindado', 'Fuzil', 5],
  ['Guerra de Gangue', 'favela', 'heist', 'Comande a guerra de gangue e defenda o morro.', 'Moto de trilha', 'Fuzil', 5],
  ['Comprar Mansão', 'mansion', 'tutorial', 'Compre a mansão da serra e guarde o carro dourado.', 'Nenhum', 'Pistola'],
  ['Festa no Iate', 'marina', 'water', 'Invada a festa no iate e saia com o convidado.', 'Lancha', 'SMG', 2],
  ['Corrida de Lancha', 'marina', 'race', 'Vença a corrida de lancha pela baía.', 'Lancha', 'Pistola'],
  ['Virar Rei da Cidade', 'matteoTower', 'finale', 'Domine o centro e vire rei da cidade.', 'Ferrari', 'Fuzil', 4],
  ['Festa na Praia', 'beachKiosk', 'tutorial', 'Curta a festa na praia e encontre Bia.', 'Nenhum', 'Pistola'],
  ['Roubar Lancha', 'marina', 'water', 'Roube a lancha do milionário no marina.', 'Lancha', 'Pistola', 2],
  ['Mergulho do Tesouro', 'pier', 'water', 'Mergulhe no pier e recupere o tesouro afundado.', 'Jetski', 'Pistola'],
  ['Salvar Afogado', 'pier', 'water', 'Salve o turista que está se afogando na correnteza.', 'Jetski', 'Pistola'],
  ['Corrida de Jetski', 'pier', 'race', 'Vença a corrida de jetski na costa.', 'Jetski', 'Pistola'],
  ['Assalto no Porto', 'port', 'heist', 'Assalte o contêiner do porto e fuja de lancha.', 'Lancha', 'SMG', 3],
  ['Fuga de Lancha da Polícia', 'marina', 'water', 'Fuja da polícia pela água com 3 estrelas.', 'Lancha', 'SMG', 3],
  ['Show de Funk', 'favela', 'tutorial', 'Produza o show de funk e libere a área.', 'Nenhum', 'Pistola'],
  ['Roubar Iate de Milionário', 'marina', 'water', 'Roube o iate e leve para o porto.', 'Iate', 'SMG', 4],
  ['Explosão no Porto', 'port', 'heist', 'Exploda o galpão do porto e fuja com a carga.', 'Caminhão', 'Fuzil', 4],
  ['Perseguição de Helicóptero na Praia', 'beachKiosk', 'chase', 'Fuja do helicóptero da polícia pela praia.', 'Carro esportivo', 'SMG', 4],
  ['Salvar Turista', 'beachKiosk', 'chase', 'Resgate o turista perdido na favela.', 'Moto de rua', 'Pistola', 2],
  ['Comprar Cobertura', 'mansion', 'tutorial', 'Compre a cobertura na orla e salve o jogo.', 'Nenhum', 'Pistola'],
  ['Casamento no Morro', 'favela', 'tutorial', 'Leve Bia ao casamento no morro e proteja a festa.', 'Nenhum', 'Pistola', 1],
  ['Guerra na Praia', 'beachKiosk', 'heist', 'Defenda a praia da invasão rival.', 'SUV', 'Fuzil', 4],
  ['Roubar Avião Pequeno', 'airport', 'heist', 'Roube o avião pequeno e decole do aeroporto.', 'Avião', 'SMG', 4],
  ['Pular de Paraquedas', 'airport', 'race', 'Salte de paraquedas e pouse na praia.', 'Avião', 'Pistola'],
  ['Corrida de Carro na Orla', 'beachKiosk', 'race', 'Vença a corrida na orla com drift.', 'Lamborghini', 'Pistola'],
  ['Festa de Aniversário do Caio', 'club', 'tutorial', 'Comemore o aniversário de Caio no clube.', 'Nenhum', 'Pistola'],
  ['Virar Lenda do Brasil', 'matteoTower', 'finale', 'Faça seu nome ecoar pelo Brasil inteiro.', 'Ferrari', 'Fuzil', 4],
  ['O Retorno do Inimigo', 'favela', 'chase', 'O inimigo voltou. Proteja o morro e a família.', 'Moto de trilha', 'Fuzil', 4],
  ['Invasão do Morro Rival', 'favela', 'heist', 'Invada o morro rival e tome o território.', 'Carro blindado', 'Fuzil', 5],
  ['Assalto ao Banco Central', 'bank', 'heist', 'Assalte o Banco Central e fuja com o ouro.', 'Caminhão', 'Fuzil', 5],
  ['Roubar Tanque de Guerra', 'airport', 'heist', 'Roube o tanque do exército e saia da base.', 'Tanque', 'Fuzil', 6],
  ['Fuga com Exército', 'airport', 'chase', 'Fuja do exército com 6 estrelas.', 'Tanque', 'Fuzil', 6],
  ['Salvar a Favela Inteira', 'favela', 'finale', 'Defenda a favela inteira do cerco final.', 'Moto de trilha', 'Fuzil', 6],
  ['Explosão na Favela', 'favela', 'heist', 'Desarme a bomba e salve as casas do morro.', 'Nenhum', 'Fuzil', 5],
  ['Guerra Final no Centro', 'matteoTower', 'finale', 'Comande a guerra final no centro de São Paulo.', 'Carro blindado', 'Fuzil', 6],
  ['Perseguição com 6 Estrelas', 'matteoTower', 'chase', 'Sobreviva à perseguição impossível de 6 estrelas.', 'Lamborghini', 'Fuzil', 6],
  ['Roubar Ouro do Banco', 'bank', 'heist', 'Roube o ouro do banco e escape pelo metrô.', 'Van', 'Fuzil', 6],
  ['Salvar a Família', 'home', 'chase', 'Resgate a família de Caio no morro.', 'SUV', 'Fuzil', 6],
  ['Corrida Final', 'beachKiosk', 'race', 'Vença a corrida final na orla ao amanhecer.', 'Lamborghini', 'Pistola'],
  ['Luta com Chefão 1', 'club', 'finale', 'Enfrente o primeiro chefão no clube.', 'Nenhum', 'Fuzil', 4],
  ['Luta com Chefão 2', 'port', 'finale', 'Enfrente o segundo chefão no porto.', 'Caminhão', 'Fuzil', 5],
  ['Invasão da Base Inimiga', 'airport', 'finale', 'Invada a base inimiga e destrua o comando.', 'Tanque', 'Fuzil', 6],
  ['Fuga de Avião', 'airport', 'chase', 'Roube o avião e fuja da base antes da explosão.', 'Avião', 'Fuzil', 6],
  ['Explosão Final', 'port', 'finale', 'Exploda o porto e feche o cerco.', 'Lancha', 'Fuzil', 6],
  ['Salvar São Paulo', 'matteoTower', 'finale', 'Salve São Paulo da guerra e vire herói.', 'Carro blindado', 'Fuzil', 6],
  ['Última Fuga', 'matteoTower', 'chase', 'Fuja da cidade com 6 estrelas e o dinheiro.', 'Ferrari', 'Fuzil', 6],
  ['O Rei do Brasil', 'mansion', 'finale', 'Tome a mansão e seja coroado Rei do Brasil.', 'Lamborghini', 'Fuzil', 5],
  ['O CHEFÃO FINAL', 'mansion', 'finale', 'Enfrente o chefão final na cobertura e salve a cidade.', 'Carro Dourado', 'Fuzil', 6]
];

function pname(key, en = false) {
  const p = PLACES[key] || PLACES.favela;
  return en ? p[1] : p[0];
}

function buildStory(n, title, place, alt, objective, contact, reward) {
  const warn = WARNINGS[(n - 1) % WARNINGS.length];
  const risk = RISKS[(n - 1) % RISKS.length];
  const payoff = PAYOFFS[(n - 1) % PAYOFFS.length];
  const pt = [
    `Caio chega a ${pname(place)} e recebe o chamado de ${contact}. A missão "${title}" começa agora.`,
    `${contact} avisa: "${warn}"`,
    `Objetivo: ${objective}`,
    `O caminho passa por ${pname(alt)}, ${risk}.`,
    `Recompensa: R$ ${reward.toLocaleString('pt-BR')}. ${payoff}`
  ];
  const en = [
    `Caio arrives at ${pname(place, true)} and gets the call from ${contact}. Mission "${title}" begins now.`,
    `${contact} warns: "The hill is watching. Keep it clean."`,
    `Objective: ${objective}`,
    `The route crosses ${pname(alt, true)}, a place with no room for mistakes.`,
    `Reward: R$ ${reward.toLocaleString('pt-BR')}. The city will remember this one.`
  ];
  return { pt, en };
}

function targetFn(key) {
  return (game) => game.world.locations[key] || game.world.locations.beachKiosk;
}

function stepGoto(key, radius, text) {
  return { type: 'goto', target: targetFn(key), radius, textPt: text, textEn: text };
}

function stepTalk(name, key, lines, text) {
  return { type: 'talk', npc: { name, kind: 'npc' }, target: targetFn(key), radius: 7, lines, textPt: text, textEn: text };
}

function stepFight(count, key, wanted, text) {
  return { type: 'fight', spawn: { kind: 'gang', count, spread: 12 }, target: targetFn(key), wanted, textPt: text, textEn: text };
}

function stepCollect(key, radius, text) {
  return { type: 'collect', target: targetFn(key), radius, textPt: text, textEn: text };
}

function stepEscape(text) {
  return { type: 'escape', textPt: text, textEn: text };
}

function buildSteps(kind, n, place, alt, third, contact, objective) {
  const talkLines = [
    { name: contact.toUpperCase(), pt: `Caio, ${objective.toLowerCase()}`, en: `Caio, ${objective.toLowerCase()}` },
    { name: 'CAIO', pt: 'Tá na mão. Só me diz onde e quando.', en: 'I got it. Just tell me where and when.' }
  ];
  if (kind === 'tutorial') {
    return [
      stepGoto(place, 10, objective),
      stepTalk(contact, place, talkLines, `Fale com ${contact}.`),
      stepGoto(alt, 12, 'Siga para o próximo ponto e confirme a entrega.'),
      stepCollect(alt, 5, 'Pegue o item e guarde antes que alguém veja.'),
      stepEscape('Despiste qualquer testemunha e volte para casa.')
    ];
  }
  if (kind === 'delivery') {
    return [
      stepGoto(place, 10, 'Chegue ao ponto de coleta.'),
      stepCollect(place, 4, 'Pegue a encomenda.'),
      stepGoto(alt, 12, objective),
      stepCollect(alt, 5, 'Entregue a encomenda e receba o pagamento.'),
      stepEscape('Saia da área antes que a polícia feche o cerco.')
    ];
  }
  if (kind === 'race') {
    return [
      stepGoto(place, 12, 'Vá para a largada.'),
      stepGoto(alt, 16, 'Acelere e mantenha a liderança.'),
      stepGoto(third, 14, 'Cruze a linha final e vença a corrida.'),
      stepEscape('Desacelere e suma antes que a polícia chegue.')
    ];
  }
  if (kind === 'water') {
    return [
      stepGoto(place, 12, 'Chegue à água e prepare o veículo.'),
      stepCollect(place, 5, 'Pegue a chave e o combustível.'),
      stepGoto(alt, 14, objective),
      stepCollect(alt, 6, 'Recupere a carga e volte para a costa.'),
      stepEscape('Fuja pela água e desapareça na maré.')
    ];
  }
  if (kind === 'chase') {
    return [
      stepGoto(place, 10, 'Encontre o alvo.'),
      stepFight(3 + (n % 3), place, 0, 'Elimine a escolta e abra caminho.'),
      stepGoto(alt, 12, objective),
      stepFight(3 + (n % 4), alt, 0, 'Sobreviva à emboscada.'),
      stepEscape('Despiste a polícia e volte para o morro.')
    ];
  }
  if (kind === 'finale') {
    return [
      stepGoto(place, 12, objective),
      stepFight(5 + (n % 4), place, Math.min(6, 4 + (n % 3)), 'Enfrente o chefão e a segurança.'),
      stepCollect(place, 5, 'Pegue o troféu e o dinheiro.'),
      stepGoto(alt, 12, 'Saia antes que o lugar exploda.'),
      stepEscape('Desapareça com 6 estrelas e salve a cidade.')
    ];
  }
  // heist
  return [
    stepGoto(place, 10, objective),
    stepFight(3 + (n % 4), place, 2 + (n % 3), 'Neutralize a segurança e abra o cofre.'),
    stepCollect(place, 4, 'Pegue o dinheiro e o item valioso.'),
    stepGoto(alt, 12, 'Fuja para o ponto seguro.'),
    stepEscape('Despiste a polícia e comemore a fuga.')
  ];
}

export function buildGta7Missions(startIndex = 5) {
  return DATA.map((row, i) => {
    const n = i + 1;
    const [title, place, kind, objective, vehicle, weapon, wanted = 0] = row;
    const alt = PLACE_CYCLE[(i * 5 + 3) % PLACE_CYCLE.length];
    const third = PLACE_CYCLE[(i * 7 + 11) % PLACE_CYCLE.length];
    const contact = CONTACTS[i % CONTACTS.length];
    const reward = Math.round(500 + Math.pow(n, 1.52) * 180);
    const story = buildStory(n, title, place, alt, objective, contact, reward);
    return {
      index: startIndex + i,
      gta7Index: n,
      campaign: 'gta7',
      protag: 'Caio',
      title: { pt: title, en: title },
      objective,
      descPt: story.pt[0],
      descEn: story.en[0],
      story: story.pt,
      storyEn: story.en,
      reward,
      vehicle,
      weapon,
      place,
      placeName: pname(place),
      spawnKey: place,
      spawnDistance: 28,
      heading: (n * 1.7) % (Math.PI * 2),
      wanted,
      steps: buildSteps(kind, n, place, alt, third, contact, objective)
    };
  });
}
