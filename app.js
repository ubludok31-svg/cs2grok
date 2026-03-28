const REGULAR_DESC = 'Обычный этап · Выбирай кейс по номеру и призовой вкус · Пиши в чат.';
const EXTRA_DESC = 'Экстра этап · Выбирай кейс по номеру и призовой вкус · Пиши в чат.';

const STAGES = [
  { id: 'round-1', type: 'regular', label: 'Раунд 1', short: 'R1', description: REGULAR_DESC },
  { id: 'round-2', type: 'regular', label: 'Раунд 2', short: 'R2', description: REGULAR_DESC },
  { id: 'extra-1', type: 'extra', label: 'Экстра Раунд 1', short: 'EX1', description: EXTRA_DESC },
  { id: 'round-3', type: 'regular', label: 'Раунд 3', short: 'R3', description: REGULAR_DESC },
  { id: 'round-4', type: 'regular', label: 'Раунд 4', short: 'R4', description: REGULAR_DESC },
  { id: 'round-5', type: 'regular', label: 'Раунд 5', short: 'R5', description: REGULAR_DESC },
  { id: 'extra-2', type: 'extra', label: 'Экстра Раунд 2', short: 'EX2', description: EXTRA_DESC },
];

const CONFIG_KEY = 'stream_case_game_v15_config';
const SESSION_KEY = 'stream_case_game_v15_session';
const LEGACY_CONFIG_KEYS = ['stream_case_game_v14_config', 'stream_case_game_v13_config', 'stream_case_game_v12_config'];
const LEGACY_SESSION_KEYS = ['stream_case_game_v14_session', 'stream_case_game_v13_session', 'stream_case_game_v12_session'];

const rarityLabel = {
  consumer: 'Белая',
  industrial: 'Голубая',
  'mil-spec': 'Синяя',
  restricted: 'Фиолетовая',
  classified: 'Розовая',
  covert: 'Красная',
  rare: 'Золотая',
};

const effectLabel = {
  empty: 'Пустой вкус',
  plus: 'ПРИЗОВОЙ ВКУС',
  auto: 'АВТО +1',
  bomb: 'БОМБА',
};

const effectSubLabel = {
  empty: 'Пустой вкус',
  plus: 'Плюс одно очко',
  auto: 'Плюс одно очко',
  bomb: 'Сброс всех очков',
};

const elements = {
  openAdminBtn: document.getElementById('openAdminBtn'),
  adminModal: document.getElementById('adminModal'),
  closeAdminBtn: document.getElementById('closeAdminBtn'),
  closeAdminBackdrop: document.getElementById('closeAdminBackdrop'),
  regularTabBtn: document.getElementById('regularTabBtn'),
  extraTabBtn: document.getElementById('extraTabBtn'),
  stageSelector: document.getElementById('stageSelector'),
  caseSelector: document.getElementById('caseSelector'),
  forcePickSelector: document.getElementById('forcePickSelector'),
  addItemBtn: document.getElementById('addItemBtn'),
  copyToAllBtn: document.getElementById('copyToAllBtn'),
  copyStageTypeBtn: document.getElementById('copyStageTypeBtn'),
  resetCurrentStageBtn: document.getElementById('resetCurrentStageBtn'),
  resetAllStagesBtn: document.getElementById('resetAllStagesBtn'),
  saveConfigBtn: document.getElementById('saveConfigBtn'),
  importConfigBtn: document.getElementById('importConfigBtn'),
  configInput: document.getElementById('configInput'),
  itemsEditor: document.getElementById('itemsEditor'),
  stageJumpSelect: document.getElementById('stageJumpSelect'),
  currentStageTitle: document.getElementById('currentStageTitle'),
  stageDescription: document.getElementById('stageDescription'),
  stageTypeBadge: document.getElementById('stageTypeBadge'),
  stageStrip: document.getElementById('stageStrip'),
  poolPreview: document.getElementById('poolPreview'),
  casesGrid: document.getElementById('casesGrid'),
  newGameBtn: document.getElementById('newGameBtn'),
  finishStageBtn: document.getElementById('finishStageBtn'),
  prevStageBtn: document.getElementById('prevStageBtn'),
  nextStageBtn: document.getElementById('nextStageBtn'),
  rouletteModal: document.getElementById('rouletteModal'),
  closeRouletteBackdrop: document.getElementById('closeRouletteBackdrop'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  resultCloseBtn: document.getElementById('resultCloseBtn'),
  rouletteTrack: document.getElementById('rouletteTrack'),
  resultCard: document.getElementById('resultCard'),
  modalTitle: document.getElementById('modalTitle'),
  modalHint: document.getElementById('modalHint'),
};

let config = loadConfig();
let session = loadSession();
let adminType = getCurrentStage().type;
let adminStageId = config.currentStageId;
let adminCaseId = 1;
let audioContext = null;
let spin = {
  active: false,
  stageId: '',
  caseId: 0,
  winner: null,
  timer: null,
  targetOffset: 0,
};

init();

function init() {
  bindEvents();
  renderApp();
}

function bindEvents() {
  elements.openAdminBtn.addEventListener('click', () => toggleAdmin(true));
  elements.closeAdminBtn.addEventListener('click', () => toggleAdmin(false));
  elements.closeAdminBackdrop.addEventListener('click', () => toggleAdmin(false));

  elements.regularTabBtn.addEventListener('click', () => switchAdminType('regular'));
  elements.extraTabBtn.addEventListener('click', () => switchAdminType('extra'));

  elements.stageSelector.addEventListener('change', () => {
    adminStageId = elements.stageSelector.value;
    adminCaseId = 1;
    renderAdmin();
  });
  elements.caseSelector.addEventListener('change', () => {
    adminCaseId = Number(elements.caseSelector.value || 1);
    renderItemsEditor();
  });
  elements.forcePickSelector.addEventListener('change', () => {
    const stage = getStage(adminStageId);
    if (!stage) return;
    stage.forceNext = elements.forcePickSelector.value || '';
    saveConfig();
  });

  elements.addItemBtn.addEventListener('click', addItem);
  elements.copyToAllBtn.addEventListener('click', copyCaseToAll);
  elements.copyStageTypeBtn.addEventListener('click', copyStageType);
  elements.resetCurrentStageBtn.addEventListener('click', resetOpenedForAdminStage);
  elements.resetAllStagesBtn.addEventListener('click', resetAll);
  elements.saveConfigBtn.addEventListener('click', downloadConfig);
  elements.importConfigBtn.addEventListener('click', () => elements.configInput.click());
  elements.configInput.addEventListener('change', importConfig);

  elements.stageJumpSelect.addEventListener('change', () => setCurrentStage(elements.stageJumpSelect.value));
  elements.prevStageBtn.addEventListener('click', prevStage);
  elements.nextStageBtn.addEventListener('click', nextStage);
  elements.finishStageBtn.addEventListener('click', finishStage);
  elements.newGameBtn.addEventListener('click', newGame);

  elements.closeModalBtn.addEventListener('click', onCloseSpinRequest);
  elements.resultCloseBtn.addEventListener('click', onCloseSpinRequest);
  elements.closeRouletteBackdrop.addEventListener('click', onCloseSpinRequest);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!elements.adminModal.classList.contains('hidden')) toggleAdmin(false);
      else if (!elements.rouletteModal.classList.contains('hidden')) onCloseSpinRequest();
    }
    if (event.code === 'Space' && spin.active && !elements.rouletteModal.classList.contains('hidden')) {
      event.preventDefault();
      fastForwardSpin();
    }
  });
}

function renderApp() {
  const stage = getCurrentStage();
  document.body.classList.toggle('extra-theme', stage.type === 'extra');
  renderHeader(stage);
  renderStageStrip();
  renderPool();
  renderCases();
  renderAdmin();
}

function renderHeader(stage) {
  elements.currentStageTitle.textContent = stage.label;
  elements.stageDescription.textContent = stage.description;
  elements.stageTypeBadge.textContent = stage.type === 'extra' ? 'Экстра этап' : 'Обычный этап';
  elements.stageJumpSelect.innerHTML = config.stages.map((s) => `<option value="${s.id}" ${s.id === config.currentStageId ? 'selected' : ''}>${escapeHtml(s.label)}</option>`).join('');
  const index = STAGES.findIndex((s) => s.id === stage.id);
  elements.prevStageBtn.disabled = index <= 0;
  elements.nextStageBtn.disabled = index >= STAGES.length - 1;
  elements.finishStageBtn.textContent = session.finished.includes(stage.id) ? 'Этап завершён' : 'Завершить этап';
}

function renderStageStrip() {
  elements.stageStrip.innerHTML = '';
  config.stages.forEach((stage) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stage-chip';
    if (stage.id === config.currentStageId) btn.classList.add('is-active');
    if (session.finished.includes(stage.id)) btn.classList.add('is-finished');
    btn.innerHTML = `
      <div class="stage-chip-top">${escapeHtml(stage.type === 'extra' ? 'Экстра' : 'Обычный')}</div>
      <div class="stage-chip-title">${escapeHtml(stage.short)} · ${escapeHtml(stage.label)}</div>
      <div class="stage-chip-meta">${session.finished.includes(stage.id) ? 'завершён' : 'в процессе'}</div>
    `;
    btn.addEventListener('click', () => setCurrentStage(stage.id));
    elements.stageStrip.appendChild(btn);
  });
}

function renderPool() {
  const items = getPreviewItems(getCurrentStage());
  elements.poolPreview.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = `pool-card rarity-${item.rarity}`;
    const effectClass = `effect-${item.effect}`;
    card.innerHTML = `
      <div class="pool-card-art"></div>
      <div class="pool-card-name">${escapeHtml(item.name)}</div>
      <div class="pool-card-rarity">${escapeHtml(rarityLabel[item.rarity] || '')}</div>
      <div class="pool-card-effect ${effectClass}">${escapeHtml(effectLabel[item.effect])}</div>
    `;
    setBg(card.querySelector('.pool-card-art'), item.image);
    elements.poolPreview.appendChild(card);
  });
}

function renderCases() {
  const stage = getCurrentStage();
  const opened = getOpened(stage.id);
  const tpl = document.getElementById('caseCardTemplate');
  elements.casesGrid.innerHTML = '';
  stage.cases.forEach((box) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const openedItem = opened[String(box.id)] || null;
    node.querySelector('.case-number').textContent = `#${box.id}`;
    node.querySelector('.case-title').textContent = box.name;
    if (openedItem) {
      node.classList.add('is-opened');
      node.querySelector('.case-status').textContent = 'ОТКРЫТ';
      node.querySelector('.case-caption').innerHTML = `Выпал:<br><strong>${escapeHtml(openedItem.name)}</strong>`;
    } else {
      node.querySelector('.case-status').textContent = stage.type === 'extra' ? 'ЭКСТРА' : 'ЗАКРЫТ';
      node.querySelector('.case-caption').textContent = `${box.items.length} предметов внутри`;
    }
    node.addEventListener('click', () => onCaseClick(stage.id, box.id));
    elements.casesGrid.appendChild(node);
  });
}

function renderAdmin() {
  elements.regularTabBtn.classList.toggle('active', adminType === 'regular');
  elements.extraTabBtn.classList.toggle('active', adminType === 'extra');

  const stageOptions = config.stages.filter((s) => s.type === adminType);
  if (!stageOptions.some((s) => s.id === adminStageId)) {
    adminStageId = stageOptions[0]?.id || config.currentStageId;
    adminCaseId = 1;
  }

  elements.stageSelector.innerHTML = stageOptions.map((s) => `<option value="${s.id}" ${s.id === adminStageId ? 'selected' : ''}>${escapeHtml(s.label)}</option>`).join('');
  const stage = getStage(adminStageId);
  if (!stage) return;

  if (!stage.cases.some((c) => c.id === adminCaseId)) adminCaseId = 1;
  elements.caseSelector.innerHTML = stage.cases.map((c) => `<option value="${c.id}" ${c.id === adminCaseId ? 'selected' : ''}>${c.id}. ${escapeHtml(c.name)}</option>`).join('');

  const previewItems = getPreviewItems(stage);
  elements.forcePickSelector.innerHTML = `<option value="">Случайно по шансам</option>` + previewItems.map((item) => {
    const sig = itemSignature(item);
    const selected = stage.forceNext === sig ? 'selected' : '';
    return `<option value="${escapeHtml(sig)}" ${selected}>${escapeHtml(item.name)} — ${escapeHtml(effectLabel[item.effect])}</option>`;
  }).join('');

  renderItemsEditor();
}

function renderItemsEditor() {
  const box = getAdminCase();
  if (!box) return;
  const tpl = document.getElementById('editorItemTemplate');
  elements.itemsEditor.innerHTML = '';

  box.items.forEach((item) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const thumb = node.querySelector('.editor-thumb');
    const nameEl = node.querySelector('.editor-preview-name');
    const effectEl = node.querySelector('.editor-preview-effect');
    setBg(thumb, item.image);
    nameEl.textContent = item.name;
    effectEl.textContent = effectLabel[item.effect];

    node.querySelectorAll('[data-field]').forEach((field) => {
      const key = field.dataset.field;
      if (key === 'file') {
        field.addEventListener('change', async () => {
          const file = field.files?.[0];
          if (!file) return;
          item.image = await fileToDataUrl(file);
          saveConfig();
          setBg(thumb, item.image);
          renderPool();
          renderCases();
          renderAdmin();
        });
        return;
      }

      field.value = item[key];
      const ev = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(ev, () => {
        let value = field.value;
        if (key === 'weight') value = Math.max(1, Number(value) || 1);
        if (key === 'rarity') value = normalizeRarity(value);
        if (key === 'effect') value = normalizeEffect(value);
        item[key] = value;
        saveConfig();
        if (key === 'image') setBg(thumb, item.image);
        if (key === 'name') nameEl.textContent = item.name;
        if (key === 'effect') effectEl.textContent = effectLabel[item.effect];
        renderPool();
        renderCases();
        refreshForcePickOptions();
      });
    });

    node.querySelector('.remove-item-btn').addEventListener('click', () => {
      const items = getAdminCase().items;
      const idx = items.findIndex((x) => x.id === item.id);
      if (idx >= 0) items.splice(idx, 1);
      if (!items.length) items.push(defaultItem('Новый предмет'));
      saveConfig();
      renderAdmin();
      renderPool();
      renderCases();
    });

    elements.itemsEditor.appendChild(node);
  });
}

function refreshForcePickOptions() {
  const stage = getStage(adminStageId);
  if (!stage) return;
  const current = stage.forceNext || '';
  renderAdmin();
  elements.forcePickSelector.value = current;
}

function switchAdminType(type) {
  adminType = type;
  const first = config.stages.find((s) => s.type === type);
  if (first) adminStageId = first.id;
  adminCaseId = 1;
  renderAdmin();
}

function toggleAdmin(open) {
  elements.adminModal.classList.toggle('hidden', !open);
  elements.adminModal.setAttribute('aria-hidden', String(!open));
}

function setCurrentStage(stageId) {
  if (spin.active) return;
  const stage = getStage(stageId);
  if (!stage) return;
  config.currentStageId = stageId;
  adminType = stage.type;
  adminStageId = stageId;
  adminCaseId = 1;
  saveConfig();
  closeSpin(true);
  renderApp();
}

function prevStage() {
  if (spin.active) return;
  const idx = STAGES.findIndex((s) => s.id === config.currentStageId);
  if (idx > 0) setCurrentStage(STAGES[idx - 1].id);
}

function nextStage() {
  if (spin.active) return;
  const idx = STAGES.findIndex((s) => s.id === config.currentStageId);
  if (idx < STAGES.length - 1) {
    finishStage(false);
    setCurrentStage(STAGES[idx + 1].id);
  }
}

function finishStage(showAlert = true) {
  const id = config.currentStageId;
  if (!session.finished.includes(id)) session.finished.push(id);
  saveSession();
  renderHeader(getCurrentStage());
  renderStageStrip();
  if (showAlert) alert('Этап отмечен как завершённый.');
}

function newGame() {
  session = makeSession();
  config.currentStageId = STAGES[0].id;
  saveSession();
  saveConfig();
  closeSpin(true);
  renderApp();
}

function onCaseClick(stageId, caseId) {
  if (spin.active) return;
  const stage = getStage(stageId);
  const box = getCase(stage, caseId);
  if (!stage || !box) return;
  const opened = getOpened(stageId)[String(caseId)];
  if (opened) {
    openSpinModal(`${stage.label} · ${box.name}`);
    showResult(opened, true);
    return;
  }
  startSpin(stage, box);
}

function startSpin(stage, box) {
  const winner = resolveWinner(stage, box);
  spin = { active: true, stageId: stage.id, caseId: box.id, winner, timer: null, targetOffset: 0 };
  openSpinModal(`${stage.label} · ${box.name}`);
  elements.modalHint.textContent = 'Пробел, крестик или кнопка ниже сразу докручивают до результата.';
  elements.resultCloseBtn.textContent = 'Пропустить';
  elements.resultCard.className = 'result-card hidden';
  elements.resultCard.innerHTML = '';
  elements.rouletteTrack.style.transition = 'none';
  elements.rouletteTrack.style.transform = 'translateX(0px)';
  populateTrack(box, winner);
  playSpinSound();

  requestAnimationFrame(() => {
    const wrapper = elements.rouletteTrack.parentElement;
    const cardWidth = 182;
    const winnerIndex = 38;
    const center = (wrapper.clientWidth || 960) / 2;
    spin.targetOffset = (winnerIndex * cardWidth) - center + (cardWidth / 2) + rand(-12, 12);
    elements.rouletteTrack.style.transition = 'transform 6.2s cubic-bezier(0.07, 0.78, 0.16, 1)';
    elements.rouletteTrack.style.transform = `translateX(-${spin.targetOffset}px)`;
    spin.timer = window.setTimeout(() => finalizeSpin(false), 6250);
  });
}

function populateTrack(box, winner) {
  elements.rouletteTrack.innerHTML = '';
  const total = 46;
  const winnerIndex = 38;
  for (let i = 0; i < total; i += 1) {
    const item = i === winnerIndex ? winner : weightedPick(box.items);
    const card = document.createElement('div');
    card.className = `roulette-item rarity-${item.rarity}`;
    card.innerHTML = `
      <div class="roulette-art"></div>
      <div class="roulette-name">${escapeHtml(item.name)}</div>
      <div class="roulette-line">${escapeHtml(effectLabel[item.effect])}</div>
    `;
    setBg(card.querySelector('.roulette-art'), item.image);
    elements.rouletteTrack.appendChild(card);
  }
}

function fastForwardSpin() {
  if (!spin.active) return;
  window.clearTimeout(spin.timer);
  elements.rouletteTrack.style.transition = 'transform 0.18s ease-out';
  elements.rouletteTrack.style.transform = `translateX(-${spin.targetOffset}px)`;
  spin.timer = window.setTimeout(() => finalizeSpin(true), 190);
}

function finalizeSpin() {
  if (!spin.active || !spin.winner) return;
  window.clearTimeout(spin.timer);
  const stageId = spin.stageId;
  const caseId = spin.caseId;
  const winner = cloneItem(spin.winner);
  spin.active = false;
  getOpened(stageId)[String(caseId)] = winner;
  saveSession();
  renderCases();
  showResult(winner, false);
}

function showResult(item, openedAlready) {
  const rarity = rarityLabel[item.rarity] || '';
  const headline = openedAlready ? 'УЖЕ ОТКРЫТ' : effectLabel[item.effect];
  elements.resultCard.className = `result-card effect-${item.effect}`;
  elements.resultCard.classList.remove('hidden');
  elements.resultCard.innerHTML = `
    <div class="result-inner rarity-${item.rarity}">
      <div class="result-art"></div>
      <div class="result-copy">
        <div class="result-headline">${escapeHtml(headline)}</div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="result-effect">${escapeHtml(effectSubLabel[item.effect])}</div>
        <div class="result-rarity">Редкость: ${escapeHtml(rarity)}</div>
      </div>
    </div>
  `;
  setBg(elements.resultCard.querySelector('.result-art'), item.image);
  elements.resultCloseBtn.textContent = 'Закрыть';
  if (!openedAlready) playResultSound(item.effect);
}

function onCloseSpinRequest() {
  if (spin.active) {
    fastForwardSpin();
    return;
  }
  closeSpin(true);
}

function openSpinModal(title) {
  elements.modalTitle.textContent = title;
  elements.rouletteModal.classList.remove('hidden');
  elements.rouletteModal.setAttribute('aria-hidden', 'false');
}

function closeSpin(force = false) {
  if (spin.active && !force) return;
  if (spin.timer) window.clearTimeout(spin.timer);
  spin.timer = null;
  spin.active = false;
  elements.rouletteModal.classList.add('hidden');
  elements.rouletteModal.setAttribute('aria-hidden', 'true');
}

function addItem() {
  const box = getAdminCase();
  if (!box) return;
  box.items.push(defaultItem('Новый предмет'));
  saveConfig();
  renderAdmin();
  renderPool();
  renderCases();
  requestAnimationFrame(() => {
    const input = elements.itemsEditor.querySelector('.editor-card:last-child input[data-field="name"]');
    if (input) input.focus();
  });
}

function copyCaseToAll() {
  const stage = getStage(adminStageId);
  const source = getAdminCase();
  if (!stage || !source) return;
  stage.cases.forEach((box) => {
    box.items = source.items.map(cloneItem);
  });
  saveConfig();
  renderAdmin();
  renderPool();
  renderCases();
}

function copyStageType() {
  const source = getStage(adminStageId);
  if (!source) return;
  const payload = source.cases.map((box) => ({ id: box.id, name: box.name, items: box.items.map(cloneItem) }));
  config.stages.filter((s) => s.type === source.type).forEach((stage) => {
    stage.cases = payload.map((box) => ({ id: box.id, name: box.name, items: box.items.map(cloneItem) }));
  });
  saveConfig();
  renderApp();
}

function resetOpenedForAdminStage() {
  session.openedByStage[adminStageId] = {};
  saveSession();
  if (adminStageId === config.currentStageId) renderCases();
}

function resetAll() {
  if (!confirm('Сбросить всю игру и вернуть базовые настройки?')) return;
  config = makeConfig();
  session = makeSession();
  adminType = 'regular';
  adminStageId = config.currentStageId;
  adminCaseId = 1;
  saveConfig();
  saveSession();
  closeSpin(true);
  renderApp();
}

function downloadConfig() {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'config.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function importConfig(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    config = normalizeConfig(JSON.parse(await file.text()));
    saveConfig();
    renderApp();
  } catch {
    alert('Не удалось импортировать config.json');
  } finally {
    event.target.value = '';
  }
}

function resolveWinner(stage, box) {
  if (stage.forceNext) {
    const forced = box.items.find((item) => itemSignature(item) === stage.forceNext);
    if (forced) {
      stage.forceNext = '';
      saveConfig();
      return cloneItem(forced);
    }
  }
  return weightedPick(box.items);
}

function weightedPick(items) {
  const list = items.map(cloneItem);
  const total = list.reduce((sum, item) => sum + Math.max(1, Number(item.weight) || 1), 0);
  let roll = Math.random() * total;
  for (const item of list) {
    roll -= Math.max(1, Number(item.weight) || 1);
    if (roll <= 0) return item;
  }
  return list[list.length - 1];
}

function getPreviewItems(stage) {
  const out = [];
  const seen = new Set();
  stage.cases.forEach((box) => {
    box.items.forEach((item) => {
      const key = itemSignature(item);
      if (seen.has(key)) return;
      seen.add(key);
      out.push(cloneItem(item));
    });
  });
  return out;
}

function getCurrentStage() {
  return getStage(config.currentStageId);
}

function getStage(id) {
  return config.stages.find((s) => s.id === id);
}

function getCase(stage, caseId) {
  return stage?.cases.find((c) => c.id === Number(caseId)) || null;
}

function getAdminCase() {
  return getCase(getStage(adminStageId), adminCaseId);
}

function getOpened(stageId) {
  if (!session.openedByStage[stageId]) session.openedByStage[stageId] = {};
  return session.openedByStage[stageId];
}

function makeConfig() {
  return {
    currentStageId: STAGES[0].id,
    stages: STAGES.map((stage) => ({
      id: stage.id,
      type: stage.type,
      label: stage.label,
      short: stage.short,
      description: stage.description,
      forceNext: '',
      cases: Array.from({ length: 16 }, (_, i) => ({
        id: i + 1,
        name: `Кейс ${String(i + 1).padStart(2, '0')}`,
        items: defaultItems(stage.type).map(cloneItem),
      })),
    })),
  };
}

function makeSession() {
  return {
    finished: [],
    openedByStage: Object.fromEntries(STAGES.map((s) => [s.id, {}])),
  };
}

function defaultItems(type) {
  if (type === 'extra') {
    return [
      defaultItem('Манго Экстра', 'plus', 'rare'),
      defaultItem('Лайм Экстра', 'plus', 'rare'),
      defaultItem('АВТО +1', 'auto', 'rare'),
      defaultItem('Арбуз Экстра', 'empty', 'classified'),
      defaultItem('Гранат Экстра', 'empty', 'restricted'),
    ];
  }
  return [
    defaultItem('Манго', 'plus', 'restricted'),
    defaultItem('Клубника', 'empty', 'industrial'),
    defaultItem('АВТО +1', 'auto', 'rare'),
    defaultItem('Бомба', 'bomb', 'covert'),
    defaultItem('Виноград', 'empty', 'mil-spec'),
  ];
}

function defaultItem(name, effect = 'empty', rarity = 'consumer') {
  return {
    id: makeId(),
    name,
    image: placeholderImage(name, effect),
    weight: 1,
    rarity,
    effect,
  };
}

function cloneItem(item) {
  return {
    id: String(item?.id || makeId()),
    name: String(item?.name || 'Предмет'),
    image: String(item?.image || placeholderImage('Предмет', 'empty')),
    weight: Math.max(1, Number(item?.weight) || 1),
    rarity: normalizeRarity(item?.rarity),
    effect: normalizeEffect(item?.effect),
  };
}

function normalizeConfig(raw) {
  const base = makeConfig();
  const currentStageId = STAGES.some((s) => s.id === raw?.currentStageId) ? raw.currentStageId : base.currentStageId;
  const stages = STAGES.map((def) => {
    const source = Array.isArray(raw?.stages) ? raw.stages.find((s) => s?.id === def.id) : null;
    const sourceCases = Array.isArray(source?.cases) ? source.cases : [];
    return {
      id: def.id,
      type: def.type,
      label: def.label,
      short: def.short,
      description: def.description,
      forceNext: String(source?.forceNext || source?.forcedNextItemSignature || ''),
      cases: Array.from({ length: 16 }, (_, idx) => {
        const fromList = sourceCases.find((c) => Number(c?.id) === idx + 1) || sourceCases[idx] || {};
        const items = Array.isArray(fromList.items) && fromList.items.length ? fromList.items.map(cloneItem) : defaultItems(def.type).map(cloneItem);
        return {
          id: idx + 1,
          name: String(fromList.name || `Кейс ${String(idx + 1).padStart(2, '0')}`),
          items,
        };
      }),
    };
  });
  return { currentStageId, stages };
}

function normalizeSession(raw) {
  const base = makeSession();
  if (Array.isArray(raw?.finished)) base.finished = raw.finished.filter((id) => STAGES.some((s) => s.id === id));
  if (Array.isArray(raw?.finishedStageIds)) base.finished = raw.finishedStageIds.filter((id) => STAGES.some((s) => s.id === id));
  const source = raw?.openedByStage && typeof raw.openedByStage === 'object' ? raw.openedByStage : {};
  STAGES.forEach((stage) => {
    const opened = source[stage.id];
    if (!opened || typeof opened !== 'object') return;
    const normalized = {};
    Object.entries(opened).forEach(([caseId, item]) => {
      normalized[String(caseId)] = cloneItem(item);
    });
    base.openedByStage[stage.id] = normalized;
  });
  return base;
}

function loadConfig() {
  const values = [localStorage.getItem(CONFIG_KEY), ...LEGACY_CONFIG_KEYS.map((k) => localStorage.getItem(k))].filter(Boolean);
  for (const raw of values) {
    try {
      const cfg = normalizeConfig(JSON.parse(raw));
      localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
      return cfg;
    } catch {}
  }
  return makeConfig();
}

function loadSession() {
  const values = [sessionStorage.getItem(SESSION_KEY), ...LEGACY_SESSION_KEYS.map((k) => sessionStorage.getItem(k))].filter(Boolean);
  for (const raw of values) {
    try {
      const data = normalizeSession(JSON.parse(raw));
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      return data;
    } catch {}
  }
  return makeSession();
}

function saveConfig() {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function normalizeRarity(value) {
  return ['consumer', 'industrial', 'mil-spec', 'restricted', 'classified', 'covert', 'rare'].includes(value) ? value : 'consumer';
}

function normalizeEffect(value) {
  return ['empty', 'plus', 'auto', 'bomb'].includes(value) ? value : 'empty';
}

function itemSignature(item) {
  const x = cloneItem(item);
  return `${x.name}__${x.effect}__${x.image}`;
}

function setBg(node, image) {
  node.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.34)), url("${escapeCss(image)}")`;
}

function placeholderImage(label, effect) {
  const bg = { empty: '1c273b', plus: '5b4314', auto: '5c520d', bomb: '5a1620' }[effect] || '1c273b';
  const fg = { empty: 'd8e8ff', plus: 'ffd86a', auto: 'fff1b7', bomb: 'ff9cad' }[effect] || 'ffffff';
  const safe = String(label || 'Item').replace(/[&<>]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#${bg}"/><stop offset="100%" stop-color="#0b1220"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="256" cy="170" r="110" fill="#${fg}" fill-opacity="0.14"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#${fg}" font-size="44" font-family="Arial,sans-serif" font-weight="700">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getCtx() {
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function playTone(freq, duration, type = 'triangle', volume = 0.04, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  const end = start + duration;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.03);
}

function playSpinSound() {
  playTone(320, 0.08, 'triangle', 0.03, 0);
  playTone(420, 0.08, 'triangle', 0.03, 0.08);
}

function playResultSound(effect) {
  if (effect === 'plus') {
    playTone(523, 0.16, 'triangle', 0.05, 0);
    playTone(659, 0.16, 'triangle', 0.05, 0.12);
    playTone(784, 0.22, 'triangle', 0.055, 0.25);
  } else if (effect === 'auto') {
    playTone(392, 0.14, 'sawtooth', 0.05, 0);
    playTone(587, 0.18, 'triangle', 0.05, 0.12);
    playTone(784, 0.2, 'triangle', 0.055, 0.28);
    playTone(988, 0.24, 'triangle', 0.05, 0.4);
  } else if (effect === 'bomb') {
    playTone(220, 0.18, 'sawtooth', 0.055, 0);
    playTone(150, 0.24, 'square', 0.055, 0.13);
  } else {
    playTone(340, 0.12, 'sine', 0.038, 0);
    playTone(286, 0.14, 'sine', 0.03, 0.12);
  }
}

function makeId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCss(value) {
  return String(value).replace(/"/g, '\\"');
}
