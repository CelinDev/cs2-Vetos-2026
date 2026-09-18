// Estados da Aplicação
const state = {
  team1: "Time 1",
  team2: "Time 2",
  maps: ["Ancient", "Anubis", "Cache", "Dust2", "Inferno", "Mirage", "Nuke"],
  vetoHistory: [],
  picks: [],
  currentTurn: 0, // 0 a 5
  winnerFlip: null,
  finalPicks: { 1: null, 2: null }, // Mapeia turno para mapa
  currentPicker: null
};

// Ordem dos vetos MD3: BAN, BAN, PICK, PICK, BAN, BAN
const sequence = ['BAN', 'BAN', 'PICK', 'PICK', 'BAN', 'BAN'];

// Elementos DOM
const elements = {
  screens: document.querySelectorAll('.screen-section'),
  mapsGrid: document.getElementById('maps-grid'),
  btnStartFlip: document.getElementById('btn-start-coinflip'),
  btnFlip: document.getElementById('btn-flip'),
  btnProceed: document.getElementById('btn-proceed-veto'),
  modal: document.getElementById('side-pick-modal')
};

// Funções de Inicialização
function init() {
  renderMaps();
  elements.btnStartFlip.onclick = () => showScreen('step-coinflip');
  elements.btnFlip.onclick = performCoinflip;
  elements.btnProceed.onclick = () => showScreen('step-veto');
  
  // Handlers dos botões de lado
  document.querySelectorAll('.side-choice-btn').forEach(btn => {
    btn.onclick = (e) => handleSidePick(e.currentTarget.dataset.side);
  });
}

function showScreen(id) {
  elements.screens.forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function renderMaps() {
  const container = document.getElementById('maps-grid');
  container.innerHTML = '';
  state.maps.forEach(map => {
    const div = document.createElement('div');
    div.className = 'map-card';
    div.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.72)), url("maps/${map.toLowerCase()}.png")`;
    div.innerHTML = `
      <h3 class="map-name">${map}</h3>
    `;
    div.onclick = () => handleMapClick(map, div);
    container.appendChild(div);
  });
}

function performCoinflip() {
  state.team1 = document.getElementById('team1-name').value;
  state.team2 = document.getElementById('team2-name').value;
  
  // Atualiza os nomes nas faces da moeda
  document.getElementById('coin-team1-label').innerText = state.team1;
  document.getElementById('coin-team2-label').innerText = state.team2;
  
  const coin = document.getElementById('coin');
  const winner = Math.random() > 0.5 ? state.team1 : state.team2;
  state.winnerFlip = winner;

  // Animação
  coin.classList.remove('flipping');
  void coin.offsetWidth; // Trigger reflow
  coin.classList.add('flipping');

  // Ajusta o lado final da moeda baseado no vencedor
  // Se T1 vence, paramos em Y:0 (frente), se T2 vence Y:180 (costas)
  const rotation = (winner === state.team1) ? 0 : 180;
  setTimeout(() => {
    coin.style.transform = `rotateY(${rotation}deg)`;
    document.getElementById('coin-winner-name').innerText = winner;
    document.getElementById('coin-winner-action').innerText = winner;
    document.getElementById('coin-result-box').classList.remove('hidden');
    document.getElementById('btn-proceed-veto').classList.remove('hidden');
  }, 2000);
}

function handleMapClick(map, el) {
  if (state.currentTurn >= sequence.length || el.classList.contains('banned') || el.classList.contains('picked')) return;
  
  const action = sequence[state.currentTurn];
  const activeTeam = (state.currentTurn % 2 === 0) ? state.winnerFlip : (state.winnerFlip === state.team1 ? state.team2 : state.team1);

  if (action === 'PICK') {
    state.currentPicker = activeTeam;
    document.getElementById('modal-map-name').innerText = map;
    document.getElementById('modal-picker-team').innerText = activeTeam;
    document.getElementById('modal-choosing-team').innerText = (activeTeam === state.team1 ? state.team2 : state.team1);
    
    // Armazena o elemento para quando escolher o lado
    window.lastSelectedMapElement = el; 
    
    elements.modal.style.display = 'flex';
  } else {
    processVeto(map, el, 'BAN', activeTeam);
  }
}

function handleSidePick(side) {
  const map = document.getElementById('modal-map-name').innerText;
  const picker = state.currentPicker;
  const chooser = (picker === state.team1 ? state.team2 : state.team1);
  
  // Usa o elemento guardado
  const el = window.lastSelectedMapElement;
  if(el) {
    el.classList.add('picked');
    const infoDiv = document.createElement('div');
    infoDiv.className = 'map-info';
    infoDiv.innerHTML = `<strong>PICK: ${picker}</strong><br>${chooser}: ${side}`;
    el.appendChild(infoDiv);
  }
  
  processVeto(map, null, `PICK`, picker);
  state.vetoHistory.push(`${picker} PICK ${map} (${chooser}: ${side})`);
  state.picks.push({ map, picker, chooser, side });
  
  elements.modal.style.display = 'none';
}

function processVeto(map, el, action, team) {
  if (el) {
    el.classList.add(action === 'BAN' ? 'banned' : 'picked');
    const infoDiv = document.createElement('div');
    infoDiv.className = 'map-info';
    infoDiv.innerHTML = `<strong>${action}: ${team}</strong>`;
    el.appendChild(infoDiv);
  }
  
  if (action === 'BAN') state.vetoHistory.push(`${team} BAN ${map}`);
  state.currentTurn++;
  
  updateUI();
  if (state.currentTurn === sequence.length) finishVeto();
}

function updateUI() {
  if (state.currentTurn < sequence.length) {
    const activeTeam = (state.currentTurn % 2 === 0) ? state.winnerFlip : (state.winnerFlip === state.team1 ? state.team2 : state.team1);
    const actionLabel = sequence[state.currentTurn] === 'BAN' ? 'BANIR' : 'PICKAR';
    document.getElementById('turn-team-name').innerText = activeTeam;
    document.getElementById('turn-action-type').innerText = actionLabel;
  }
}

function finishVeto() {
  const usedMaps = state.vetoHistory.map(entry => entry.split(' ')[2]);
  const decider = state.maps.find(map => !usedMaps.includes(map));
  const report = document.getElementById('veto-report');

  state.picks.forEach((pick, index) => {
    const mapNumber = index + 1;
    document.getElementById(`report-map-${mapNumber}`).textContent =
      `${pick.map}, ${pick.picker} escolheu; ${pick.chooser}: ${pick.side}`;
  });

  document.getElementById('report-map-3').textContent =
    `${decider || 'Não identificado'}, decidido na faca`;
  report.classList.remove('hidden');
}

init();
