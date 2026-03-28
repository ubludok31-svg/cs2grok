const BASE_REGULAR_DESCRIPTION = 'Обычный этап · Выбирай кейс по номеру и призовой вкус. Пиши в чат и получай промик.';
const BASE_EXTRA_DESCRIPTION = 'Экстра этап · Выбирай кейс по номеру и призовой вкус. Пиши в чат и получай промик.';

const STAGE_DEFS = [
  { id: 'round-1', type: 'regular', label: 'Раунд 1', shortLabel: 'R1', description: BASE_REGULAR_DESCRIPTION },
  { id: 'round-2', type: 'regular', label: 'Раунд 2', shortLabel: 'R2', description: BASE_REGULAR_DESCRIPTION },
  { id: 'extra-1', type: 'extra', label: 'Экстра Раунд 1', shortLabel: 'EX1', description: BASE_EXTRA_DESCRIPTION },
  { id: 'round-3', type: 'regular', label: 'Раунд 3', shortLabel: 'R3', description: BASE_REGULAR_DESCRIPTION },
  { id: 'round-4', type: 'regular', label: 'Раунд 4', shortLabel: 'R4', description: BASE_REGULAR_DESCRIPTION },
  { id: 'round-5', type: 'regular', label: 'Раунд 5', shortLabel: 'R5', description: BASE_REGULAR_DESCRIPTION },
  { id: 'extra-2', type: 'extra', label: 'Экстра Раунд 2', shortLabel: 'EX2', description: BASE_EXTRA_DESCRIPTION },
];

const PERSIST_KEY = 'stream_case_game_v14_config';
const SESSION_KEY = 'stream_case_game_v14_session';
const LEGACY_CONFIG_KEYS = [
  'stream_case_game_v13_config',
  'stream_case_game_v12_config',
  'stream_case_game_v11_config',
  'stream_case_game_v10_config',
  'stream_case_game_v9_config',
  'stream_case_game_v8_config',
  'stream_case_game_v7_config',
];
const LEGACY_SESSION_KEYS = [
  'stream_case_game_v13_session',
  'stream_case_game_v12_session',
  'stream_case_game_v11_session',
  'stream_case_game_v10_session',
];

const rarityLabelMap = {
  consumer: 'Белая',
  industrial: 'Голубая',
  'mil-spec': 'Синяя',
  restricted: 'Фиолетовая',
  classified: 'Розовая',
  covert: 'Красная',
  rare: 'Золотая',
};

const effectSelectLabelMap = {
  empty: 'Пустой вкус',
  plus: 'Призовой вкус',
  auto: 'АВТО +1',
  bomb: 'Бомба',
};

const effectPreviewLineMap = {
  empty: 'Пустой вкус',
  plus: 'ПРИЗОВОЙ ВКУС',
  auto: 'ПЛЮС ОДНО ОЧКО',
  bomb: 'СБРОС ВСЕХ ОЧКОВ',
};

const effectResultLineMap = {
  empty: 'Нет победы',
  plus: 'Плюс одно очко',
  auto: 'Плюс одно очко',
  bomb: 'Сброс всех очков',
};

const effectHeadlineMap = {
  empty: 'ПУСТОЙ ВКУС',
  plus: 'ПРИЗОВОЙ ВКУС',
  auto: 'АВТО +1',
  bomb: 'БОМБА',
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
  stageCounter: document.getElementById('stageCounter'),
  stageDescription: document.getElementById('stageDescription'),
  stageTypeBadge: document.getElementById('stageTypeBadge'),
  stageStrip: document.getElementById('stageStrip'),
  poolPreview: document.getElementById('poolPreview'),
  poolNote: document.getElementById('poolNote'),
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

let configState = loadConfigState();
let sessionState = loadSessionState();
let adminStageType = getCurrentStage().type;
let selectedStageId = configState.currentStageId;
let selectedCaseId = 1;
let audioContext = null;
let spinState = {
  active: false,
  stageId: '',
  caseId: 0,
  winningItem: null,
  timerId: null,
  targetOffset: 0,
};

init();

function init() {
  bindEvents();
  renderAll();
}

function bindEvents() {
  elements.openAdminBtn.addEventListener('click', openAdminModal);
  elements.closeAdminBtn.addEventListener('click', closeAdminModal);
  elements.closeAdminBackdrop.addEventListener('click', closeAdminModal);

  elements.regularTabBtn.addEventListener('click', () => switchAdminTab('regular'));
  elements.extraTabBtn.addEventListener('click', () => switchAdminTab('extra'));

  elements.stageSelector.addEventListener('change', (event) => {
    selectedStageId = event.target.value;
    selectedCaseId = 1;
    adminStageType = getStageById(selectedStageId).type;
    renderAdmin();
  });

  elements.caseSelector.addEventListener('change', (event) => {
    selectedCaseId = Number(event.target.value || 1);
    renderItemsEditor();
  });

  elements.forcePickSelector.addEventListener('change', (event) => {
    const stage = getStageById(selectedStageId);
    if (!stage) return;
    stage.forcedNextItemSignature = String(event.target.value || '');
    saveConfigState();
  });

  elements.addItemBtn.addEventListener('click', addItemToSelectedCase);
  elements.copyToAllBtn.addEventListener('click', copyCaseToAllCases);
  elements.copyStageTypeBtn.addEventListener('click', copyStageToAllSameTypeStages);
  elements.resetCurrentStageBtn.addEventListener('click', resetOpenedCasesForSelectedStage);
  elements.resetAllStagesBtn.addEventListener('click', resetEverything);
  elements.saveConfigBtn.addEventListener('click', downloadConfig);
  elements.importConfigBtn.addEventListener('click', () => elements.configInput.click());
  elements.configInput.addEventListener('change', importConfig);

  elements.stageJumpSelect.addEventListener('change', (event) => setCurrentStage(event.target.value));
  elements.prevStageBtn.addEventListener('click', goToPrevStage);
  elements.nextStageBtn.addEventListener('click', goToNextStage);
  elements.finishStageBtn.addEventListener('click', () => finishCurrentStage(true));
  elements.newGameBtn.addEventListener('click', startNewGame);

  elements.closeModalBtn.addEventListener('click', handleRouletteCloseButton);
  elements.resultCloseBtn.addEventListener('click', handleRouletteCloseButton);
  elements.closeRouletteBackdrop.addEventListener('click', handleRouletteCloseButton);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!elements.adminModal.classList.contains('hidden')) {
        closeAdminModal();
      } else if (!elements.rouletteModal.classList.contains('hidden')) {
        handleRouletteCloseButton();
      }
      return;
    }
    if (event.code === 'Space' && spinState.active && !elements.rouletteModal.classList.contains('hidden')) {
      event.preventDefault();
      fastForwardSpin();
    }
  });
}

function renderAll() {
  updateBodyTheme();
  renderRoundPanel();
  renderStageStrip();
  renderPoolPreview();
  renderCasesGrid();
  renderAdmin();
}

function renderRoundPanel() {
  const stage = getCurrentStage();
  const stageIndex = STAGE_DEFS.findIndex((entry) => entry.id === stage.id);
  elements.currentStageTitle.textContent = stage.label;
  elements.stageCounter.textContent = `${stageIndex + 1} / ${STAGE_DEFS.length}`;
  elements.stageDescription.textContent = stage.description;
  elements.stageTypeBadge.textContent = stage.type === 'extra' ? 'Экстра этап' : 'Обычный этап';
  elements.poolNote.textContent = 'Для получения промика нужно собрать 2 очка в течение одного раунда.';
  elements.prevStageBtn.disabled = stageIndex === 0;
  elements.nextStageBtn.disabled = stageIndex === STAGE_DEFS.length - 1;
  elements.finishStageBtn.textContent = sessionState.finishedStageIds.includes(stage.id) ? 'Этап завершён' : 'Завершить этап';
  elements.stageJumpSelect.value = stage.id;
  renderStageJump();
}

function renderStageJump() {
  elements.stageJumpSelect.innerHTML = '';
  configState.stages.forEach((stage) => {
    const option = document.createElement('option');
    option.value = stage.id;
    option.textContent = stage.label;
    option.selected = stage.id === configState.currentStageId;
    elements.stageJumpSelect.appendChild(option);
  });
}

function renderStageStrip() {
  elements.stageStrip.innerHTML = '';
  configState.stages.forEach((stage) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stage-chip';
    if (stage.id === configState.currentStageId) button.classList.add('is-active');
    if (sessionState.finishedStageIds.includes(stage.id)) button.classList.add('is-finished');
    button.innerHTML = `
      <div class="stage-chip-top">${escapeHtml(stage.type === 'extra' ? 'Экстра' : 'Обычный')}</div>
      <div class="stage-chip-title">${escapeHtml(stage.shortLabel)} · ${escapeHtml(stage.label)}</div>
      <div class="stage-chip-meta">${sessionState.finishedStageIds.includes(stage.id) ? 'завершён' : 'в процессе'}</div>
    `;
    button.addEventListener('click', () => setCurrentStage(stage.id));
    elements.stageStrip.appendChild(button);
  });
}

function renderPoolPreview() {
  const stage = getCurrentStage();
  const previewItems = getUniquePreviewItems(stage);
  elements.poolPreview.innerHTML = '';
  previewItems.forEach((item) => {
    const card = document.createElement('div');
    card.className = `pool-card rarity-${item.rarity}`;
    card.innerHTML = `
      <div class="pool-thumb"></div>
      <div class="pool-name">${escapeHtml(item.name)}</div>
      <div class="pool-effect effect-${item.effect}">${escapeHtml(effectPreviewLineMap[item.effect])}</div>
    `;
    setArtBackground(card.querySelector('.pool-thumb'), item.image);
    elements.poolPreview.appendChild(card);
  });
}

function renderCasesGrid() {
  const stage = getCurrentStage();
  const openedMap = getOpenedStageMap(stage.id);
  const template = document.getElementById('caseCardTemplate');
  elements.casesGrid.innerHTML = '';

  stage.cases.forEach((caseData) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const openedItem = openedMap[String(caseData.id)];
    const badge = node.querySelector('.case-badge');
    const name = node.querySelector('.case-name');
    const meta = node.querySelector('.case-meta');

    name.textContent = caseData.name;
    if (openedItem) {
      node.classList.add('is-opened');
      badge.textContent = 'ОТКРЫТ';
      meta.innerHTML = `Выпал:<br><strong>${escapeHtml(openedItem.name)}</strong>`;
    } else {
      badge.textContent = stage.type === 'extra' ? 'ЭКСТРА' : 'ЗАКРЫТ';
      meta.textContent = `${caseData.items.length} предметов внутри`;
    }

    node.addEventListener('click', () => handleCaseClick(stage.id, caseData.id));
    elements.casesGrid.appendChild(node);
  });
}

function renderAdmin() {
  elements.regularTabBtn.classList.toggle('active', adminStageType === 'regular');
  elements.extraTabBtn.classList.toggle('active', adminStageType === 'extra');

  const availableStages = configState.stages.filter((stage) => stage.type === adminStageType);
  if (!availableStages.some((stage) => stage.id === selectedStageId)) {
    selectedStageId = availableStages[0]?.id || configState.currentStageId;
    selectedCaseId = 1;
  }

  elements.stageSelector.innerHTML = '';
  availableStages.forEach((stage) => {
    const option = document.createElement('option');
    option.value = stage.id;
    option.textContent = stage.label;
    option.selected = stage.id === selectedStageId;
    elements.stageSelector.appendChild(option);
  });

  const stage = getStageById(selectedStageId);
  if (!stage) return;
  elements.caseSelector.innerHTML = '';
  stage.cases.forEach((caseData) => {
    const option = document.createElement('option');
    option.value = String(caseData.id);
    option.textContent = `${caseData.id}. ${caseData.name}`;
    option.selected = caseData.id === selectedCaseId;
    elements.caseSelector.appendChild(option);
  });

  if (!stage.cases.some((entry) => entry.id === selectedCaseId)) selectedCaseId = 1;
  renderForcePickSelector();
  renderItemsEditor();
}

function renderForcePickSelector() {
  const stage = getStageById(selectedStageId);
  if (!stage) return;
  const items = getUniquePreviewItems(stage);
  elements.forcePickSelector.innerHTML = '';
  const autoOption = document.createElement('option');
  autoOption.value = '';
  autoOption.textContent = 'Случайно по шансам';
  elements.forcePickSelector.appendChild(autoOption);
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = itemSignature(item);
    option.textContent = `${item.name} — ${effectSelectLabelMap[item.effect]}`;
    option.selected = stage.forcedNextItemSignature === option.value;
    elements.forcePickSelector.appendChild(option);
  });
  elements.forcePickSelector.value = stage.forcedNextItemSignature || '';
}

function renderItemsEditor() {
  const currentCase = getSelectedAdminCase();
  if (!currentCase) return;
  elements.itemsEditor.innerHTML = '';

  currentCase.items.forEach((item) => {
    const template = document.getElementById('editorItemTemplate');
    const node = template.content.firstElementChild.cloneNode(true);
    const previewThumb = node.querySelector('.preview-thumb');
    const previewText = node.querySelector('.preview-text');
    const previewEffect = node.querySelector('.preview-effect');

    setArtBackground(previewThumb, item.image);
    previewText.textContent = item.name;
    previewEffect.textContent = effectSelectLabelMap[item.effect];

    node.querySelectorAll('[data-field]').forEach((field) => {
      const fieldName = field.dataset.field;
      if (fieldName === 'file') {
        field.addEventListener('change', async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const dataUrl = await fileToDataUrl(file);
          item.image = dataUrl;
          saveConfigState();
          setArtBackground(previewThumb, item.image);
          renderPoolPreview();
          renderCasesGrid();
          renderForcePickSelector();
        });
        return;
      }

      field.value = item[fieldName];
      const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, (event) => {
        let value = event.target.value;
        if (fieldName === 'weight') value = Math.max(1, Number(value) || 1);
        if (fieldName === 'rarity') value = normalizeRarity(value);
        if (fieldName === 'effect') value = normalizeEffect(value);
        item[fieldName] = value;
        saveConfigState();

        if (fieldName === 'image') setArtBackground(previewThumb, item.image);
        if (fieldName === 'name') previewText.textContent = item.name;
        if (fieldName === 'effect') previewEffect.textContent = effectSelectLabelMap[item.effect];

        renderPoolPreview();
        renderCasesGrid();
        renderForcePickSelector();
      });
    });

    node.querySelector('.remove-item-btn').addEventListener('click', () => {
      const caseItems = getSelectedAdminCase().items;
      const index = caseItems.findIndex((entry) => entry.id === item.id);
      if (index >= 0) caseItems.splice(index, 1);
      if (!caseItems.length) caseItems.push(makeDefaultItem('Новый предмет'));
      saveConfigState();
      renderAll();
    });

    elements.itemsEditor.appendChild(node);
  });
}

function addItemToSelectedCase() {
  const targetCase = getSelectedAdminCase();
  if (!targetCase) return;
  targetCase.items.push(makeDefaultItem('Новый предмет'));
  saveConfigState();
  renderItemsEditor();
  renderPoolPreview();
  renderCasesGrid();
  renderForcePickSelector();
  requestAnimationFrame(() => {
    const lastInput = elements.itemsEditor.querySelector('.editor-item:last-child input[data-field="name"]');
    if (lastInput) lastInput.focus();
  });
}

function copyCaseToAllCases() {
  const stage = getStageById(selectedStageId);
  const sourceCase = getSelectedAdminCase();
  if (!stage || !sourceCase) return;
  const copiedItems = sourceCase.items.map(cloneItem);
  stage.cases.forEach((caseData) => {
    caseData.items = copiedItems.map(cloneItem);
  });
  saveConfigState();
  renderAll();
}

function copyStageToAllSameTypeStages() {
  const sourceStage = getStageById(selectedStageId);
  if (!sourceStage) return;
  const sourceCases = sourceStage.cases.map((caseData) => ({
    id: caseData.id,
    name: caseData.name,
    items: caseData.items.map(cloneItem),
  }));
  configState.stages
    .filter((stage) => stage.type === sourceStage.type)
    .forEach((stage) => {
      stage.cases = sourceCases.map((caseData) => ({
        id: caseData.id,
        name: caseData.name,
        items: caseData.items.map(cloneItem),
      }));
    });
  saveConfigState();
  renderAll();
}

function resetOpenedCasesForSelectedStage() {
  sessionState.openedByStage[selectedStageId] = {};
  saveSessionState();
  if (selectedStageId === configState.currentStageId) renderCasesGrid();
}

function resetEverything() {
  if (!confirm('Сбросить всю игру и вернуть базовые настройки?')) return;
  configState = makeInitialConfigState();
  sessionState = makeInitialSessionState();
  adminStageType = 'regular';
  selectedStageId = configState.currentStageId;
  selectedCaseId = 1;
  saveConfigState();
  saveSessionState();
  closeRouletteModal(true);
  renderAll();
}

function handleCaseClick(stageId, caseId) {
  if (spinState.active) return;
  const stage = getStageById(stageId);
  const caseData = stage ? getCaseById(stage, caseId) : null;
  if (!stage || !caseData) return;
  const openedItem = getOpenedStageMap(stageId)[String(caseId)];
  if (openedItem) {
    showExistingResult(stage, caseData, openedItem);
    return;
  }
  openCase(stage, caseData);
}

function openCase(stage, caseData) {
  if (!caseData.items.length) return;

  spinState.stageId = stage.id;
  spinState.caseId = caseData.id;
  spinState.winningItem = resolveWinningItem(stage, caseData);
  spinState.active = true;

  elements.modalTitle.textContent = `${stage.label} · ${caseData.name}`;
  elements.modalHint.textContent = 'Нажми пробел, крестик или «Закрыть», чтобы сразу показать результат.';
  elements.resultCloseBtn.textContent = 'Пропустить';
  elements.rouletteTrack.style.transition = 'none';
  elements.rouletteTrack.style.transform = 'translateX(0px)';
  elements.resultCard.className = 'result-card hidden';
  elements.resultCard.innerHTML = '';

  populateRouletteTrack(caseData, spinState.winningItem);
  openRouletteModal();
  playSpinStartSound();

  requestAnimationFrame(() => {
    const cardWidth = 182;
    const winnerIndex = 40;
    const wrapperWidth = elements.rouletteTrack.parentElement.clientWidth || 900;
    const targetOffset = (winnerIndex * cardWidth) - (wrapperWidth / 2) + (cardWidth / 2) + randomInt(-10, 10);
    spinState.targetOffset = targetOffset;
    elements.rouletteTrack.style.transition = 'transform 7.4s cubic-bezier(0.08, 0.76, 0.14, 1)';
    elements.rouletteTrack.style.transform = `translateX(-${targetOffset}px)`;
    window.clearTimeout(spinState.timerId);
    spinState.timerId = window.setTimeout(() => finalizeSpin(false), 7450);
  });
}

function populateRouletteTrack(caseData, winningItem) {
  elements.rouletteTrack.innerHTML = '';
  const totalSlots = 48;
  const winnerIndex = 40;
  for (let i = 0; i < totalSlots; i += 1) {
    const item = i === winnerIndex ? winningItem : pickWeighted(caseData.items);
    elements.rouletteTrack.appendChild(createRouletteCard(item));
  }
}

function finalizeSpin(fromFastForward) {
  if (!spinState.active || !spinState.winningItem) return;
  window.clearTimeout(spinState.timerId);
  spinState.timerId = null;
  spinState.active = false;

  const openedMap = getOpenedStageMap(spinState.stageId);
  openedMap[String(spinState.caseId)] = cloneItem(spinState.winningItem);
  saveSessionState();
  renderCasesGrid();

  if (fromFastForward) {
    elements.rouletteTrack.style.transition = 'transform 0.2s ease-out';
    elements.rouletteTrack.style.transform = `translateX(-${spinState.targetOffset}px)`;
  }

  showResult(spinState.winningItem, false);
}

function fastForwardSpin() {
  if (!spinState.active) return;
  elements.rouletteTrack.style.transition = 'transform 0.2s ease-out';
  elements.rouletteTrack.style.transform = `translateX(-${spinState.targetOffset}px)`;
  window.clearTimeout(spinState.timerId);
  spinState.timerId = window.setTimeout(() => finalizeSpin(true), 220);
}

function showExistingResult(stage, caseData, item) {
  elements.modalTitle.textContent = `${stage.label} · ${caseData.name}`;
  elements.modalHint.textContent = 'Этот кейс уже открыт в текущем этапе.';
  elements.resultCloseBtn.textContent = 'Закрыть';
  elements.rouletteTrack.innerHTML = '';
  elements.rouletteTrack.style.transition = 'none';
  elements.rouletteTrack.style.transform = 'translateX(0px)';
  openRouletteModal();
  showResult(item, true);
}

function showResult(item, alreadyOpened) {
  const normalized = cloneItem(item);
  const rarityText = rarityLabelMap[normalized.rarity] || normalized.rarity;
  elements.resultCard.className = `result-card effect-${normalized.effect}`;
  elements.resultCard.classList.remove('hidden');
  elements.resultCard.innerHTML = `
    <div class="result-card-inner rarity-${normalized.rarity}">
      <div class="result-art"></div>
      <div class="result-copy">
        <div class="result-headline">${escapeHtml(alreadyOpened ? 'УЖЕ ОТКРЫТ' : effectHeadlineMap[normalized.effect])}</div>
        <h3>${escapeHtml(normalized.name)}</h3>
        <div class="result-meta">
          <div class="result-effect-line">${escapeHtml(effectResultLineMap[normalized.effect])}</div>
          <div class="result-rarity-line">Редкость: ${escapeHtml(rarityText)}</div>
        </div>
      </div>
    </div>
  `;
  setArtBackground(elements.resultCard.querySelector('.result-art'), normalized.image);
  elements.resultCloseBtn.textContent = 'Закрыть';
  playResultSound(normalized.effect);
}

function handleRouletteCloseButton() {
  if (spinState.active) {
    fastForwardSpin();
    return;
  }
  closeRouletteModal(true);
}

function openRouletteModal() {
  elements.rouletteModal.classList.remove('hidden');
  elements.rouletteModal.setAttribute('aria-hidden', 'false');
}

function closeRouletteModal(force = false) {
  if (spinState.active && !force) return;
  elements.rouletteModal.classList.add('hidden');
  elements.rouletteModal.setAttribute('aria-hidden', 'true');
}

function openAdminModal() {
  elements.adminModal.classList.remove('hidden');
  elements.adminModal.setAttribute('aria-hidden', 'false');
}

function closeAdminModal() {
  elements.adminModal.classList.add('hidden');
  elements.adminModal.setAttribute('aria-hidden', 'true');
}

function switchAdminTab(type) {
  adminStageType = type;
  const candidate = configState.stages.find((stage) => stage.type === type);
  if (candidate) selectedStageId = candidate.id;
  selectedCaseId = 1;
  renderAdmin();
}

function goToPrevStage() {
  if (spinState.active) return;
  const index = STAGE_DEFS.findIndex((entry) => entry.id === configState.currentStageId);
  if (index <= 0) return;
  setCurrentStage(STAGE_DEFS[index - 1].id);
}

function goToNextStage() {
  if (spinState.active) return;
  const index = STAGE_DEFS.findIndex((entry) => entry.id === configState.currentStageId);
  if (index >= STAGE_DEFS.length - 1) return;
  finishCurrentStage(false);
  setCurrentStage(STAGE_DEFS[index + 1].id);
}

function finishCurrentStage(showAlert = false) {
  const stageId = configState.currentStageId;
  if (!sessionState.finishedStageIds.includes(stageId)) {
    sessionState.finishedStageIds.push(stageId);
    saveSessionState();
  }
  renderRoundPanel();
  renderStageStrip();
  if (showAlert) alert('Этап отмечен как завершённый.');
}

function startNewGame() {
  sessionState = makeInitialSessionState();
  saveSessionState();
  closeRouletteModal(true);
  renderAll();
}

function setCurrentStage(stageId) {
  if (spinState.active) return;
  const stage = getStageById(stageId);
  if (!stage) return;
  configState.currentStageId = stageId;
  selectedStageId = stageId;
  selectedCaseId = 1;
  adminStageType = stage.type;
  saveConfigState();
  closeRouletteModal(true);
  renderAll();
}

function updateBodyTheme() {
  document.body.classList.toggle('stage-extra', getCurrentStage().type === 'extra');
}

function makeInitialConfigState() {
  return {
    currentStageId: STAGE_DEFS[0].id,
    stages: STAGE_DEFS.map((stageDef) => ({
      id: stageDef.id,
      type: stageDef.type,
      label: stageDef.label,
      shortLabel: stageDef.shortLabel,
      description: stageDef.description,
      forcedNextItemSignature: '',
      cases: Array.from({ length: 16 }, (_, index) => ({
        id: index + 1,
        name: `Кейс ${String(index + 1).padStart(2, '0')}`,
        items: makeDefaultItems(stageDef.type).map(cloneItem),
      })),
    })),
  };
}

function makeInitialSessionState() {
  return {
    finishedStageIds: [],
    openedByStage: Object.fromEntries(STAGE_DEFS.map((stage) => [stage.id, {}])),
  };
}

function makeDefaultItems(type) {
  if (type === 'extra') {
    return [
      makeDefaultItem('Манго Экстра', 'plus', 'rare'),
      makeDefaultItem('Арбуз Экстра', 'empty', 'classified'),
      makeDefaultItem('АВТО +1', 'auto', 'rare'),
      makeDefaultItem('Лайм Экстра', 'plus', 'rare'),
      makeDefaultItem('Гранат Экстра', 'empty', 'restricted'),
    ];
  }
  return [
    makeDefaultItem('Манго', 'plus', 'restricted'),
    makeDefaultItem('Клубника', 'empty', 'mil-spec'),
    makeDefaultItem('АВТО +1', 'auto', 'classified'),
    makeDefaultItem('Бомба', 'bomb', 'covert'),
    makeDefaultItem('Виноград', 'empty', 'industrial'),
  ];
}

function makeDefaultItem(name, effect = 'empty', rarity = 'consumer') {
  return {
    id: makeId(),
    name,
    image: makePlaceholderImage(name, effect),
    weight: 1,
    rarity,
    effect,
  };
}

function cloneItem(item) {
  return {
    id: String(item?.id || makeId()),
    name: String(item?.name || 'Предмет'),
    image: String(item?.image || makePlaceholderImage('Item', 'empty')),
    weight: Math.max(1, Number(item?.weight) || 1),
    rarity: normalizeRarity(item?.rarity),
    effect: normalizeEffect(item?.effect),
  };
}

function loadConfigState() {
  const sources = [localStorage.getItem(PERSIST_KEY), ...LEGACY_CONFIG_KEYS.map((key) => localStorage.getItem(key))].filter(Boolean);
  if (!sources.length) return makeInitialConfigState();
  for (const raw of sources) {
    try {
      const normalized = normalizeConfigState(JSON.parse(raw));
      localStorage.setItem(PERSIST_KEY, JSON.stringify(normalized));
      return normalized;
    } catch {
      // ignore broken payloads
    }
  }
  return makeInitialConfigState();
}

function loadSessionState() {
  const sources = [sessionStorage.getItem(SESSION_KEY), ...LEGACY_SESSION_KEYS.map((key) => sessionStorage.getItem(key))].filter(Boolean);
  if (!sources.length) return makeInitialSessionState();
  for (const raw of sources) {
    try {
      const normalized = normalizeSessionState(JSON.parse(raw));
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
      return normalized;
    } catch {
      // ignore broken payloads
    }
  }
  return makeInitialSessionState();
}

function saveConfigState() {
  localStorage.setItem(PERSIST_KEY, JSON.stringify(configState));
}

function saveSessionState() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionState));
}

function normalizeConfigState(raw) {
  const currentStageId = STAGE_DEFS.some((stage) => stage.id === raw?.currentStageId)
    ? raw.currentStageId
    : STAGE_DEFS[0].id;

  const stages = STAGE_DEFS.map((def) => {
    const source = Array.isArray(raw?.stages) ? raw.stages.find((entry) => entry?.id === def.id) : null;
    const sourceCases = Array.isArray(source?.cases) ? source.cases : [];
    return {
      id: def.id,
      type: def.type,
      label: def.label,
      shortLabel: def.shortLabel,
      description: def.description,
      forcedNextItemSignature: String(source?.forcedNextItemSignature || ''),
      cases: Array.from({ length: 16 }, (_, index) => {
        const sourceCase = sourceCases.find((entry) => Number(entry?.id) === index + 1) || sourceCases[index] || {};
        const items = Array.isArray(sourceCase.items) && sourceCase.items.length
          ? sourceCase.items.map(cloneItem)
          : makeDefaultItems(def.type).map(cloneItem);
        return {
          id: index + 1,
          name: String(sourceCase.name || `Кейс ${String(index + 1).padStart(2, '0')}`),
          items,
        };
      }),
    };
  });

  return { currentStageId, stages };
}

function normalizeSessionState(raw) {
  const state = makeInitialSessionState();
  if (Array.isArray(raw?.finishedStageIds)) {
    state.finishedStageIds = raw.finishedStageIds.filter((id) => STAGE_DEFS.some((stage) => stage.id === id));
  }
  if (raw?.openedByStage && typeof raw.openedByStage === 'object') {
    STAGE_DEFS.forEach((stage) => {
      const opened = raw.openedByStage[stage.id];
      if (!opened || typeof opened !== 'object') return;
      const normalized = {};
      Object.entries(opened).forEach(([caseId, item]) => {
        normalized[String(caseId)] = cloneItem(item);
      });
      state.openedByStage[stage.id] = normalized;
    });
  }
  return state;
}

function getCurrentStage() {
  return getStageById(configState.currentStageId);
}

function getStageById(stageId) {
  return configState.stages.find((stage) => stage.id === stageId);
}

function getCaseById(stage, caseId) {
  return stage?.cases.find((caseData) => caseData.id === Number(caseId));
}

function getSelectedAdminCase() {
  return getCaseById(getStageById(selectedStageId), selectedCaseId);
}

function getOpenedStageMap(stageId) {
  if (!sessionState.openedByStage[stageId]) sessionState.openedByStage[stageId] = {};
  return sessionState.openedByStage[stageId];
}

function resolveWinningItem(stage, caseData) {
  if (stage.forcedNextItemSignature) {
    const exact = caseData.items.find((item) => itemSignature(item) === stage.forcedNextItemSignature);
    if (exact) {
      stage.forcedNextItemSignature = '';
      saveConfigState();
      renderForcePickSelector();
      return cloneItem(exact);
    }
  }
  return pickWeighted(caseData.items);
}

function pickWeighted(items) {
  const normalized = items.map(cloneItem);
  const total = normalized.reduce((sum, item) => sum + item.weight, 0);
  if (!total) return normalized[0] || makeDefaultItem('Предмет');
  let roll = Math.random() * total;
  for (const item of normalized) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return normalized[normalized.length - 1];
}

function getUniquePreviewItems(stage) {
  const seen = new Set();
  const result = [];
  stage.cases.forEach((caseData) => {
    caseData.items.forEach((item) => {
      const normalized = cloneItem(item);
      const key = `${normalized.name}__${normalized.effect}__${normalized.image}`;
      if (seen.has(key)) return;
      seen.add(key);
      result.push(normalized);
    });
  });
  return result;
}

function itemSignature(item) {
  const normalized = cloneItem(item);
  return `${normalized.name}__${normalized.effect}__${normalized.image}`;
}

function normalizeRarity(rarity) {
  return ['consumer', 'industrial', 'mil-spec', 'restricted', 'classified', 'covert', 'rare'].includes(rarity)
    ? rarity
    : 'consumer';
}

function normalizeEffect(effect) {
  return ['empty', 'plus', 'auto', 'bomb'].includes(effect) ? effect : 'empty';
}

function createRouletteCard(item) {
  const normalized = cloneItem(item);
  const card = document.createElement('div');
  card.className = `roulette-item rarity-${normalized.rarity}`;
  card.innerHTML = `
    <div class="item-art"></div>
    <div class="item-name">${escapeHtml(normalized.name)}</div>
    <div class="item-rarity">${escapeHtml(effectSelectLabelMap[normalized.effect])}</div>
  `;
  setArtBackground(card.querySelector('.item-art'), normalized.image);
  return card;
}

function setArtBackground(element, image) {
  element.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.34)), url("${escapeCssUrl(image)}")`;
}

function makePlaceholderImage(label, effect) {
  const bg = { empty: '1c273b', plus: '5b4314', auto: '5c520d', bomb: '5a1620' }[effect] || '1c273b';
  const accent = { empty: 'd5e6ff', plus: 'ffd96d', auto: 'fff1b7', bomb: 'ff9baa' }[effect] || 'ffffff';
  const safe = String(label || 'Item').replace(/[&<>]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#${bg}"/><stop offset="100%" stop-color="#0b1220"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="256" cy="170" r="110" fill="#${accent}" fill-opacity="0.14"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#${accent}" font-size="44" font-family="Arial, sans-serif" font-weight="700">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadConfig() {
  const blob = new Blob([JSON.stringify(configState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'config.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function importConfig(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    configState = normalizeConfigState(JSON.parse(text));
    saveConfigState();
    renderAll();
  } catch {
    alert('Не удалось импортировать config.json');
  } finally {
    event.target.value = '';
  }
}

function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function tone(frequency, duration, type = 'sine', volume = 0.035, delay = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  const end = start + duration;
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

function playSpinStartSound() {
  tone(340, 0.08, 'triangle', 0.03, 0);
  tone(430, 0.08, 'triangle', 0.028, 0.08);
}

function playResultSound(effect) {
  if (effect === 'plus') {
    tone(523, 0.14, 'triangle', 0.05, 0);
    tone(659, 0.14, 'triangle', 0.05, 0.12);
    tone(784, 0.18, 'triangle', 0.05, 0.24);
  } else if (effect === 'auto') {
    tone(392, 0.14, 'sawtooth', 0.05, 0);
    tone(587, 0.16, 'triangle', 0.05, 0.12);
    tone(784, 0.22, 'triangle', 0.055, 0.24);
    tone(988, 0.24, 'triangle', 0.05, 0.34);
  } else if (effect === 'bomb') {
    tone(220, 0.18, 'sawtooth', 0.06, 0);
    tone(150, 0.24, 'square', 0.06, 0.12);
  } else {
    tone(340, 0.12, 'sine', 0.04, 0);
    tone(290, 0.16, 'sine', 0.032, 0.12);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCssUrl(value) {
  return String(value).replace(/"/g, '\\"');
}
