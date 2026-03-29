const STAGE_DEFS = [
  { id: 'round1', type: 'regular', label: 'Раунд 1', short: 'R1', description: 'Обычный этап · Выбирай кейс по номеру и призовой вкус · Пиши в чат и получай промик.' },
  { id: 'round2', type: 'regular', label: 'Раунд 2', short: 'R2', description: 'Обычный этап · Выбирай кейс по номеру и призовой вкус · Пиши в чат и получай промик.' },
  { id: 'extra1', type: 'extra', label: 'Экстра Раунд 1', short: 'EX1', description: 'Экстра этап · Выбирай кейс по номеру и призовой вкус · Пиши в чат и получай промик.' },
  { id: 'round3', type: 'regular', label: 'Раунд 3', short: 'R3', description: 'Обычный этап · Выбирай кейс по номеру и призовой вкус · Пиши в чат и получай промик.' },
  { id: 'round4', type: 'regular', label: 'Раунд 4', short: 'R4', description: 'Обычный этап · Выбирай кейс по номеру и призовой вкус · Пиши в чат и получай промик.' },
  { id: 'round5', type: 'regular', label: 'Раунд 5', short: 'R5', description: 'Обычный этап · Выбирай кейс по номеру и призовой вкус · Пиши в чат и получай промик.' },
  { id: 'extra2', type: 'extra', label: 'Экстра Раунд 2', short: 'EX2', description: 'Экстра этап · Выбирай кейс по номеру и призовой вкус · Пиши в чат и получай промик.' },
];

const STORAGE_CONFIG = 'stream-case-game-v17-config';
const STORAGE_SESSION = 'stream-case-game-v17-session';
const DB_NAME = 'stream-case-game-v18-db';
const DB_STORE = 'kv';
const MIGRATE_CONFIG_KEYS = ['stream-case-game-v16-config', 'stream-case-game-v15-config', 'stream-case-game-v14-config'];
const MIGRATE_SESSION_KEYS = ['stream-case-game-v16-session', 'stream-case-game-v15-session', 'stream-case-game-v14-session'];

const rarityLabels = {
  consumer: 'Белая',
  industrial: 'Голубая',
  'mil-spec': 'Синяя',
  restricted: 'Фиолетовая',
  classified: 'Розовая',
  covert: 'Красная',
  rare: 'Золотая',
};

const effectLabels = {
  empty: 'Пустой вкус',
  plus: 'ПРИЗОВОЙ ВКУС',
  auto: 'ПЛЮС ОДНО ОЧКО',
  bomb: 'СБРОС ВСЕХ ОЧКОВ',
};

const resultHeadlines = {
  empty: 'ПУСТОЙ ВКУС',
  plus: 'ПРИЗОВОЙ ВКУС',
  auto: 'АВТО +1',
  bomb: 'БОМБА',
};

let config = loadConfig();
let session = loadSession();
let adminType = getCurrentStage().type;
let adminStageId = config.currentStageId;
let adminCaseId = 1;
let spinState = null;
let audioCtx = null;

const el = {
  body: document.body,
  openAdminBtn: document.getElementById('openAdminBtn'),
  adminModal: document.getElementById('adminModal'),
  closeAdminBtn: document.getElementById('closeAdminBtn'),
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
  itemsEditor: document.getElementById('itemsEditor'),
  saveConfigBtn: document.getElementById('saveConfigBtn'),
  importConfigBtn: document.getElementById('importConfigBtn'),
  configInput: document.getElementById('configInput'),
  stageBadge: document.getElementById('stageBadge'),
  stageTitle: document.getElementById('stageTitle'),
  stageDescription: document.getElementById('stageDescription'),
  newGameBtn: document.getElementById('newGameBtn'),
  finishStageBtn: document.getElementById('finishStageBtn'),
  prevStageBtn: document.getElementById('prevStageBtn'),
  nextStageBtn: document.getElementById('nextStageBtn'),
  stageJumpSelect: document.getElementById('stageJumpSelect'),
  stageStrip: document.getElementById('stageStrip'),
  poolPanel: document.querySelector('.pool-panel'),
  poolPreview: document.getElementById('poolPreview'),
  casesPanel: document.querySelector('.cases-panel'),
  casesGrid: document.getElementById('casesGrid'),
  spinModal: document.getElementById('spinModal'),
  spinTitle: document.getElementById('spinTitle'),
  spinHint: document.getElementById('spinHint'),
  closeSpinBtn: document.getElementById('closeSpinBtn'),
  skipSpinBtn: document.getElementById('skipSpinBtn'),
  rouletteTrack: document.getElementById('rouletteTrack'),
  resultCard: document.getElementById('resultCard'),
};

init();

async function init() {
  bindEvents();
  await hydrateState();
  renderAll();
  updateStickyPool();
}

async function hydrateState() {
  try {
    const [dbConfig, dbSession] = await Promise.all([idbGet(STORAGE_CONFIG), idbGet(STORAGE_SESSION)]);
    config = dbConfig ? normalizeConfig(dbConfig) : loadConfig();
    session = dbSession ? normalizeSession(dbSession) : loadSession();
    if (!dbConfig) await idbSet(STORAGE_CONFIG, config);
    if (!dbSession) await idbSet(STORAGE_SESSION, session);
  } catch (error) {
    console.error(error);
    config = loadConfig();
    session = loadSession();
  }
  adminType = getCurrentStage().type;
  adminStageId = config.currentStageId;
  adminCaseId = 1;
}

function bindEvents() {
  el.openAdminBtn.addEventListener('click', () => toggleAdmin(true));
  el.closeAdminBtn.addEventListener('click', () => toggleAdmin(false));
  el.adminModal.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeAdmin) toggleAdmin(false);
  });

  el.regularTabBtn.addEventListener('click', () => switchAdminType('regular'));
  el.extraTabBtn.addEventListener('click', () => switchAdminType('extra'));
  el.stageSelector.addEventListener('change', () => {
    adminStageId = el.stageSelector.value;
    adminCaseId = 1;
    renderAdmin();
  });
  el.caseSelector.addEventListener('change', () => {
    adminCaseId = Number(el.caseSelector.value || 1);
    renderItemsEditor();
  });
  el.forcePickSelector.addEventListener('change', () => {
    const stage = getStage(adminStageId);
    if (!stage) return;
    stage.forceNext = String(el.forcePickSelector.value || '');
    saveConfig();
  });

  el.addItemBtn.addEventListener('click', addItem);
  el.copyToAllBtn.addEventListener('click', copyCaseToAll);
  el.copyStageTypeBtn.addEventListener('click', copyStageType);
  el.resetCurrentStageBtn.addEventListener('click', resetCurrentStageOpened);
  el.resetAllStagesBtn.addEventListener('click', resetAll);
  el.saveConfigBtn.addEventListener('click', downloadConfig);
  el.importConfigBtn.addEventListener('click', () => el.configInput.click());
  el.configInput.addEventListener('change', importConfig);

  el.stageJumpSelect.addEventListener('change', () => setCurrentStage(el.stageJumpSelect.value));
  el.newGameBtn.addEventListener('click', newGame);
  el.finishStageBtn.addEventListener('click', () => finishStage(true));
  el.prevStageBtn.addEventListener('click', prevStage);
  el.nextStageBtn.addEventListener('click', nextStage);

  el.closeSpinBtn.addEventListener('click', onSpinCloseRequest);
  el.skipSpinBtn.addEventListener('click', onSpinCloseRequest);
  el.spinModal.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.closeSpin) onSpinCloseRequest();
  });


  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!el.adminModal.classList.contains('hidden')) toggleAdmin(false);
      if (!el.spinModal.classList.contains('hidden')) onSpinCloseRequest();
    }
    if (event.code === 'Space' && spinState && !el.spinModal.classList.contains('hidden')) {
      event.preventDefault();
      skipSpin();
    }
  });
}

function renderAll() {
  renderHeader();
  renderStageStrip();
  renderPool();
  renderCases();
  renderAdmin();
  updateStickyPool();
}

function updateStickyPool() {
  if (!el.poolPanel) return;
  el.poolPanel.classList.add('is-sticky-active');
}

function renderHeader() {
  const stage = getCurrentStage();
  el.body.classList.toggle('extra-theme', stage.type === 'extra');
  el.stageBadge.textContent = stage.type === 'extra' ? 'ЭКСТРА ЭТАП' : 'ОБЫЧНЫЙ ЭТАП';
  el.stageTitle.textContent = stage.label;
  el.stageDescription.textContent = stage.description;
  el.stageJumpSelect.innerHTML = STAGE_DEFS.map((stageDef) => `<option value="${stageDef.id}" ${stageDef.id === config.currentStageId ? 'selected' : ''}>${escapeHtml(stageDef.label)}</option>`).join('');
  const idx = stageIndex(config.currentStageId);
  el.prevStageBtn.disabled = idx <= 0;
  el.nextStageBtn.disabled = idx >= STAGE_DEFS.length - 1;
  el.finishStageBtn.textContent = session.finished.includes(stage.id) ? 'Этап завершён' : 'Завершить этап';
}

function renderStageStrip() {
  el.stageStrip.innerHTML = '';
  STAGE_DEFS.forEach((def) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stage-chip';
    if (def.id === config.currentStageId) button.classList.add('is-active');
    if (session.finished.includes(def.id)) button.classList.add('is-finished');
    button.innerHTML = `
      <div class="stage-chip-top">${escapeHtml(def.type === 'extra' ? 'Экстра' : 'Обычный')}</div>
      <div class="stage-chip-title">${escapeHtml(def.short)} · ${escapeHtml(def.label)}</div>
      <div class="stage-chip-meta">${session.finished.includes(def.id) ? 'завершён' : 'в процессе'}</div>
    `;
    button.addEventListener('click', () => setCurrentStage(def.id));
    el.stageStrip.appendChild(button);
  });
}

function renderPool() {
  const items = getPreviewItems(getCurrentStage());
  el.poolPreview.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = `pool-card effect-${item.effect} rarity-${item.rarity}`;
    const subtitle = maybeRarityText(item);
    card.innerHTML = `
      <div class="pool-art"></div>
      <div class="pool-name">${escapeHtml(item.name)}</div>
      <div class="pool-rarity">${escapeHtml(subtitle)}</div>
      <div class="pool-effect">${escapeHtml(effectLabels[item.effect])}</div>
    `;
    setBg(card.querySelector('.pool-art'), item.image);
    el.poolPreview.appendChild(card);
  });
}

function renderCases() {
  const stage = getCurrentStage();
  const opened = getOpened(stage.id);
  const tpl = document.getElementById('caseTemplate');
  el.casesGrid.innerHTML = '';
  stage.cases.forEach((box) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const openedItem = opened[String(box.id)] || null;
    node.querySelector('.case-num').textContent = `#${box.id}`;
    node.querySelector('.case-name').textContent = box.name;
    if (openedItem) {
      node.classList.add('is-opened');
      node.querySelector('.case-state').textContent = 'ОТКРЫТ';
      node.querySelector('.case-text').innerHTML = `Выпал:<br><strong>${escapeHtml(openedItem.name)}</strong>`;
    } else {
      node.querySelector('.case-state').textContent = stage.type === 'extra' ? 'ЭКСТРА' : 'ЗАКРЫТ';
      node.querySelector('.case-text').textContent = `${box.items.length} предметов внутри`;
    }
    node.addEventListener('click', () => onCaseClick(box.id));
    el.casesGrid.appendChild(node);
  });
}

function renderAdmin() {
  const visibleStages = config.stages.filter((s) => s.type === adminType);
  if (!visibleStages.some((s) => s.id === adminStageId)) adminStageId = visibleStages[0]?.id || config.currentStageId;
  const stage = getStage(adminStageId);
  if (!stage) return;
  if (!stage.cases.some((c) => c.id === adminCaseId)) adminCaseId = 1;

  el.regularTabBtn.classList.toggle('active', adminType === 'regular');
  el.extraTabBtn.classList.toggle('active', adminType === 'extra');
  el.stageSelector.innerHTML = visibleStages.map((s) => `<option value="${s.id}" ${s.id === adminStageId ? 'selected' : ''}>${escapeHtml(s.label)}</option>`).join('');
  el.caseSelector.innerHTML = stage.cases.map((c) => `<option value="${c.id}" ${c.id === adminCaseId ? 'selected' : ''}>${c.id}. ${escapeHtml(c.name)}</option>`).join('');
  updateForcePickOptions();
  renderItemsEditor();
}

function renderItemsEditor() {
  const box = getAdminCase();
  if (!box) return;
  el.itemsEditor.innerHTML = '';
  const tpl = document.getElementById('editorItemTemplate');

  box.items.forEach((item) => {
    const card = tpl.content.firstElementChild.cloneNode(true);
    const thumb = card.querySelector('.editor-thumb');
    const nameCopy = card.querySelector('.editor-preview-name');
    const effectCopy = card.querySelector('.editor-preview-effect');
    syncEditorPreview(item, thumb, nameCopy, effectCopy);

    card.querySelectorAll('[data-field]').forEach((field) => {
      const key = field.dataset.field;
      if (key === 'file') {
        field.addEventListener('change', async () => {
          const file = field.files?.[0];
          if (!file) return;
          item.image = await fileToDataUrl(file);
          syncEditorPreview(item, thumb, nameCopy, effectCopy);
          await saveConfig();
          renderPool();
          renderCases();
          updateForcePickOptions();
        });
        return;
      }

      field.value = String(item[key] ?? '');
      const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, () => {
        if (key === 'weight') item.weight = Math.max(1, Number(field.value) || 1);
        else if (key === 'rarity') item.rarity = normalizeRarity(field.value);
        else if (key === 'effect') item.effect = normalizeEffect(field.value);
        else item[key] = field.value;
        syncEditorPreview(item, thumb, nameCopy, effectCopy);
        saveConfig();
        renderPool();
        renderCases();
        updateForcePickOptions();
      });
    });

    card.querySelector('.remove-item-btn').addEventListener('click', () => {
      const targetBox = getAdminCase();
      const idx = targetBox.items.findIndex((x) => x.id === item.id);
      if (idx >= 0) targetBox.items.splice(idx, 1);
      if (!targetBox.items.length) targetBox.items.push(defaultItem('Новый предмет'));
      saveConfig();
      renderAdmin();
      renderPool();
      renderCases();
    });

    el.itemsEditor.appendChild(card);
  });
}

function syncEditorPreview(item, thumb, nameCopy, effectCopy) {
  setBg(thumb, item.image);
  nameCopy.textContent = item.name;
  effectCopy.textContent = effectLabels[item.effect];
}

function updateForcePickOptions() {
  const stage = getStage(adminStageId);
  if (!stage) return;
  const current = stage.forceNext;
  const items = getPreviewItems(stage);
  el.forcePickSelector.innerHTML = `<option value="">Случайно по шансам</option>` + items.map((item) => {
    const sig = itemSignature(item);
    return `<option value="${escapeHtml(sig)}" ${current === sig ? 'selected' : ''}>${escapeHtml(item.name)} — ${escapeHtml(effectLabels[item.effect])}</option>`;
  }).join('');
}

function switchAdminType(type) {
  adminType = type;
  adminStageId = config.stages.find((s) => s.type === type)?.id || config.currentStageId;
  adminCaseId = 1;
  renderAdmin();
}

function toggleAdmin(open) {
  el.adminModal.classList.toggle('hidden', !open);
  el.adminModal.setAttribute('aria-hidden', String(!open));
}

function onCaseClick(caseId) {
  if (spinState && spinState.active) return;
  const stage = getCurrentStage();
  const box = getCase(stage, caseId);
  const already = getOpened(stage.id)[String(caseId)];
  if (already) {
    openSpinModal(stage.label + ' · ' + box.name);
    showResult(already, true);
    return;
  }
  startSpin(stage, box);
}

function startSpin(stage, box) {
  const winner = resolveWinner(stage, box);
  const winnerIndex = 24;
  const items = buildTrackItems(box.items, winner, winnerIndex);
  spinState = {
    active: true,
    stageId: stage.id,
    caseId: box.id,
    winner: cloneItem(winner),
    winnerIndex,
    targetX: 0,
    timer: null,
    fallbackTimer: null,
  };

  openSpinModal(stage.label + ' · ' + box.name);
  el.resultCard.className = 'result-card hidden';
  el.resultCard.innerHTML = '';
  el.skipSpinBtn.textContent = 'Пропустить';
  el.spinHint.textContent = 'Пробел или кнопка ниже — сразу показать результат.';
  populateTrack(items);
  playSound('spin');

  requestAnimationFrame(() => {
    const nodes = [...el.rouletteTrack.querySelectorAll('.roulette-item')];
    const winnerNode = nodes[winnerIndex];
    const wrap = el.rouletteTrack.parentElement;
    if (!winnerNode || !wrap) return finalizeSpin();
    const gap = Number.parseFloat(getComputedStyle(el.rouletteTrack).gap || '14') || 14;
    const itemWidth = winnerNode.getBoundingClientRect().width;
    const trackPaddingLeft = Number.parseFloat(getComputedStyle(el.rouletteTrack).paddingLeft || '24') || 24;
    const center = wrap.clientWidth / 2;
    const offset = trackPaddingLeft + winnerIndex * (itemWidth + gap) - center + itemWidth / 2;
    spinState.targetX = Math.max(0, offset);
    el.rouletteTrack.style.transition = 'transform 4.4s cubic-bezier(0.08, 0.78, 0.18, 1)';
    el.rouletteTrack.style.transform = `translateX(-${spinState.targetX}px)`;
    clearTimeout(spinState.timer);
    clearTimeout(spinState.fallbackTimer);
    spinState.timer = setTimeout(finalizeSpin, 4440);
    spinState.fallbackTimer = setTimeout(finalizeSpin, 4900);
  });
}

function buildTrackItems(sourceItems, winner, winnerIndex) {
  const arr = [];
  for (let i = 0; i < 32; i += 1) arr.push(i === winnerIndex ? cloneItem(winner) : weightedPick(sourceItems));
  return arr;
}

function populateTrack(items) {
  el.rouletteTrack.innerHTML = '';
  el.rouletteTrack.style.transition = 'none';
  el.rouletteTrack.style.transform = 'translateX(0px)';
  items.forEach((item) => {
    const node = document.createElement('div');
    node.className = `roulette-item rarity-${item.rarity}`;
    node.innerHTML = `
      <div class="roulette-item-art"></div>
      <div class="roulette-item-name">${escapeHtml(item.name)}</div>
      <div class="roulette-item-line">${escapeHtml(effectLabels[item.effect])}</div>
    `;
    setBg(node.querySelector('.roulette-item-art'), item.image);
    el.rouletteTrack.appendChild(node);
  });
}

function skipSpin() {
  if (!spinState) return;
  clearTimeout(spinState.timer);
  clearTimeout(spinState.fallbackTimer);
  el.rouletteTrack.style.transition = 'transform 0.18s ease-out';
  el.rouletteTrack.style.transform = `translateX(-${spinState.targetX}px)`;
  spinState.timer = setTimeout(finalizeSpin, 200);
}

function finalizeSpin() {
  if (!spinState) return;
  clearTimeout(spinState.timer);
  clearTimeout(spinState.fallbackTimer);
  const current = spinState;
  if (!current.active) return;
  current.active = false;
  getOpened(current.stageId)[String(current.caseId)] = cloneItem(current.winner);
  saveSession();
  renderCases();
  showResult(current.winner, false);
}

function showResult(item, wasOpened) {
  el.resultCard.className = `result-card effect-${item.effect}`;
  el.resultCard.classList.remove('hidden');
  const rarity = rarityLabels[item.rarity] || '';
  el.resultCard.innerHTML = `
    <div class="result-inner rarity-${item.rarity}">
      <div class="result-art"></div>
      <div class="result-copy">
        <div class="result-headline">${escapeHtml(wasOpened ? 'УЖЕ ОТКРЫТ' : resultHeadlines[item.effect])}</div>
        <h3>${escapeHtml(item.name)}</h3>
        <div class="result-effect">${escapeHtml(effectLabels[item.effect])}</div>
        <div class="result-rarity">Редкость: ${escapeHtml(rarity)}</div>
      </div>
    </div>
  `;
  setBg(el.resultCard.querySelector('.result-art'), item.image);
  el.skipSpinBtn.textContent = 'Закрыть';
  el.spinHint.textContent = 'Нажми кнопку ниже или крестик, чтобы закрыть окно.';
  if (!wasOpened) playSound(item.effect);
}

function onSpinCloseRequest() {
  if (spinState && spinState.active) {
    skipSpin();
    return;
  }
  closeSpinModal();
}

function openSpinModal(title) {
  el.spinTitle.textContent = title;
  el.spinModal.classList.remove('hidden');
  el.spinModal.setAttribute('aria-hidden', 'false');
}

function closeSpinModal() {
  if (spinState) {
    clearTimeout(spinState.timer);
    clearTimeout(spinState.fallbackTimer);
  }
  spinState = null;
  el.spinModal.classList.add('hidden');
  el.spinModal.setAttribute('aria-hidden', 'true');
  el.rouletteTrack.style.transition = 'none';
  el.rouletteTrack.style.transform = 'translateX(0px)';
}

function setCurrentStage(stageId) {
  const stage = getStage(stageId);
  if (!stage) return;
  config.currentStageId = stage.id;
  adminType = stage.type;
  adminStageId = stage.id;
  adminCaseId = 1;
  saveConfig();
  renderAll();
}

function prevStage() {
  const idx = stageIndex(config.currentStageId);
  if (idx > 0) setCurrentStage(STAGE_DEFS[idx - 1].id);
}

function nextStage() {
  const idx = stageIndex(config.currentStageId);
  if (idx < STAGE_DEFS.length - 1) {
    markStageFinished(config.currentStageId);
    setCurrentStage(STAGE_DEFS[idx + 1].id);
  }
}

function finishStage(showAlert) {
  markStageFinished(config.currentStageId);
  renderHeader();
  renderStageStrip();
  if (showAlert) alert('Этап отмечен как завершённый.');
}

function markStageFinished(stageId) {
  if (!session.finished.includes(stageId)) session.finished.push(stageId);
  saveSession();
}

async function newGame() {
  localStorage.removeItem(STORAGE_SESSION);
  session = makeSession();
  config.currentStageId = STAGE_DEFS[0].id;
  await saveConfig();
  await saveSession();
  location.reload();
}

function addItem() {
  const box = getAdminCase();
  if (!box) return;
  box.items.push(defaultItem('Новый предмет'));
  saveConfig();
  renderAdmin();
  renderPool();
  renderCases();
}

function copyCaseToAll() {
  const stage = getStage(adminStageId);
  const box = getAdminCase();
  if (!stage || !box) return;
  stage.cases.forEach((c) => {
    c.items = box.items.map(cloneItem);
  });
  saveConfig();
  renderAdmin();
  renderPool();
  renderCases();
}

function copyStageType() {
  const sourceStage = getStage(adminStageId);
  if (!sourceStage) return;
  const payload = sourceStage.cases.map((box) => ({ id: box.id, name: box.name, items: box.items.map(cloneItem) }));
  config.stages.filter((s) => s.type === sourceStage.type).forEach((stage) => {
    stage.cases = payload.map((box) => ({ id: box.id, name: box.name, items: box.items.map(cloneItem) }));
  });
  saveConfig();
  renderAll();
}

function resetCurrentStageOpened() {
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
  renderAll();
}

function importConfig(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  file.text().then((text) => {
    config = normalizeConfig(JSON.parse(text));
    adminType = getCurrentStage().type;
    adminStageId = config.currentStageId;
    adminCaseId = 1;
    saveConfig();
    renderAll();
  }).catch(() => alert('Не удалось импортировать config.json')).finally(() => {
    event.target.value = '';
  });
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

function getPreviewItems(stage) {
  const out = [];
  const seen = new Set();
  stage.cases.forEach((box) => {
    box.items.forEach((item) => {
      const sig = itemSignature(item);
      if (seen.has(sig)) return;
      seen.add(sig);
      out.push(cloneItem(item));
    });
  });
  return out;
}

function weightedPick(items) {
  const list = items.map(cloneItem);
  const total = list.reduce((sum, item) => sum + Math.max(1, Number(item.weight) || 1), 0);
  let roll = Math.random() * total;
  for (const item of list) {
    roll -= Math.max(1, Number(item.weight) || 1);
    if (roll <= 0) return item;
  }
  return cloneItem(list[list.length - 1]);
}

function stageIndex(stageId) {
  return STAGE_DEFS.findIndex((s) => s.id === stageId);
}

function getCurrentStage() {
  return getStage(config.currentStageId) || config.stages[0];
}

function getStage(id) {
  return config.stages.find((s) => s.id === id) || null;
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

function loadConfig() {
  const candidates = [localStorage.getItem(STORAGE_CONFIG), ...MIGRATE_CONFIG_KEYS.map((key) => localStorage.getItem(key))];
  for (const rawText of candidates) {
    if (!rawText) continue;
    try { return normalizeConfig(JSON.parse(rawText)); } catch {}
  }
  return makeConfig();
}

function loadSession() {
  const candidates = [localStorage.getItem(STORAGE_SESSION), ...MIGRATE_SESSION_KEYS.map((key) => localStorage.getItem(key))];
  for (const rawText of candidates) {
    if (!rawText) continue;
    try { return normalizeSession(JSON.parse(rawText)); } catch {}
  }
  return makeSession();
}

async function saveConfig() {
  return persistState(STORAGE_CONFIG, config);
}

async function saveSession() {
  return persistState(STORAGE_SESSION, session);
}

async function persistState(key, value) {
  if ('indexedDB' in window) {
    try {
      await idbSet(key, value);
      return;
    } catch (error) {
      console.error(error);
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // localStorage is only a fallback when IndexedDB is unavailable
  }
}

function makeConfig() {
  return {
    currentStageId: STAGE_DEFS[0].id,
    stages: STAGE_DEFS.map((stage) => ({
      id: stage.id,
      type: stage.type,
      label: stage.label,
      short: stage.short,
      description: stage.description,
      forceNext: '',
      cases: Array.from({ length: 16 }, (_, idx) => ({
        id: idx + 1,
        name: `Кейс ${String(idx + 1).padStart(2, '0')}`,
        items: defaultItems(stage.type).map(cloneItem),
      })),
    })),
  };
}

function makeSession() {
  return {
    finished: [],
    openedByStage: Object.fromEntries(STAGE_DEFS.map((stage) => [stage.id, {}])),
  };
}

function normalizeConfig(raw) {
  const base = makeConfig();
  const currentStageId = STAGE_DEFS.some((s) => s.id === raw?.currentStageId) ? raw.currentStageId : base.currentStageId;
  const stages = STAGE_DEFS.map((def) => {
    const sourceStage = Array.isArray(raw?.stages) ? raw.stages.find((s) => s?.id === def.id) : null;
    const sourceCases = Array.isArray(sourceStage?.cases) ? sourceStage.cases : [];
    return {
      id: def.id,
      type: def.type,
      label: def.label,
      short: def.short,
      description: def.description,
      forceNext: String(sourceStage?.forceNext || ''),
      cases: Array.from({ length: 16 }, (_, idx) => {
        const sourceCase = sourceCases.find((c) => Number(c?.id) === idx + 1) || sourceCases[idx] || {};
        const items = Array.isArray(sourceCase.items) && sourceCase.items.length ? sourceCase.items.map(cloneItem) : defaultItems(def.type).map(cloneItem);
        return {
          id: idx + 1,
          name: String(sourceCase.name || `Кейс ${String(idx + 1).padStart(2, '0')}`),
          items,
        };
      }),
    };
  });
  return { currentStageId, stages };
}

function normalizeSession(raw) {
  const base = makeSession();
  if (Array.isArray(raw?.finished)) base.finished = raw.finished.filter((id) => STAGE_DEFS.some((s) => s.id === id));
  if (raw?.openedByStage && typeof raw.openedByStage === 'object') {
    STAGE_DEFS.forEach((stage) => {
      const sourceOpened = raw.openedByStage[stage.id];
      if (!sourceOpened || typeof sourceOpened !== 'object') return;
      base.openedByStage[stage.id] = {};
      Object.entries(sourceOpened).forEach(([key, value]) => {
        base.openedByStage[stage.id][key] = cloneItem(value);
      });
    });
  }
  return base;
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
  const image = typeof item?.image === 'string' && item.image.trim() ? item.image : placeholderImage(item?.name || 'Предмет', item?.effect || 'empty');
  return {
    id: String(item?.id || makeId()),
    name: String(item?.name || 'Предмет'),
    image,
    weight: Math.max(1, Number(item?.weight) || 1),
    rarity: normalizeRarity(item?.rarity),
    effect: normalizeEffect(item?.effect),
  };
}

function normalizeRarity(value) {
  return rarityLabels[value] ? value : 'consumer';
}

function normalizeEffect(value) {
  return effectLabels[value] ? value : 'empty';
}

function maybeRarityText(item) {
  const label = rarityLabels[item.rarity] || '';
  if (!label) return '';
  const lowerName = String(item.name || '').toLowerCase();
  if (lowerName.includes(label.toLowerCase())) return '';
  return label;
}

function itemSignature(item) {
  return [item.name, item.image, item.rarity, item.effect, item.weight].join('::');
}

function setBg(node, image) {
  if (!node) return;
  if (image) {
    node.style.backgroundImage = `linear-gradient(135deg, rgba(50, 76, 120, 0.12), rgba(20, 30, 47, 0.28)), url("${escapeAttr(image)}")`;
  } else {
    node.style.backgroundImage = 'linear-gradient(135deg, rgba(67,98,156,0.55), rgba(22,33,55,0.92))';
  }
}

function placeholderImage(text, effect) {
  const bg = effect === 'bomb' ? '#7d1724' : effect === 'auto' ? '#77610a' : effect === 'plus' ? '#7a5514' : '#20334e';
  const fg = effect === 'bomb' ? '#ffdce1' : '#fff6c0';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${bg}" />
          <stop offset="1" stop-color="#08111a" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="40" fill="url(#g)" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${fg}" font-family="Arial, sans-serif" font-size="54" font-weight="900">${escapeSvg(String(text).slice(0, 14))}</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function fileToDataUrl(file) {
  if (typeof createImageBitmap === 'function' && file.type.startsWith('image/')) {
    try {
      const bitmap = await createImageBitmap(file);
      const maxSide = 360;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.64);
    } catch {}
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


function idbOpen() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(key) {
  if (!('indexedDB' in window)) return null;
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function idbSet(key, value) {
  if (!('indexedDB' in window)) return;
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return String(value).replace(/"/g, '&quot;');
}

function escapeSvg(value) {
  return String(value).replace(/[&<>"']/g, '');
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function playSound(kind) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const settings = {
      spin: [[440, 0.03], [520, 0.03], [620, 0.03]],
      plus: [[620, 0.08], [740, 0.08], [900, 0.14]],
      auto: [[560, 0.08], [760, 0.08], [980, 0.14], [1240, 0.18]],
      bomb: [[240, 0.14], [160, 0.2]],
      empty: [[360, 0.08], [300, 0.08]],
    }[kind] || [[420, 0.05]];
    settings.forEach(([freq, len], index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = kind === 'bomb' ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + index * 0.06);
      gain.gain.exponentialRampToValueAtTime(kind === 'spin' ? 0.18 : 0.48, now + index * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.06 + len);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + index * 0.06);
      osc.stop(now + index * 0.06 + len + 0.02);
    });
  } catch {}
}
