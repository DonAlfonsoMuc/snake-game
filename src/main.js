import {
  GRID_SIZE,
  createInitialState,
  restartState,
  setDirection,
  stepState,
  togglePause,
} from "./gameLogic.js";
import {
  fetchTopScores,
  fetchRecentScores,
  fetchBestScore,
  isScoresApiConfigured,
  submitScore,
} from "./supabaseScores.js";
import { createI18n } from "./locales/i18n.js";

const TICK_MS = 130;
const CELL = 20;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const infoButtonEl = document.getElementById("info-button");
const currentScoreLabelEl = document.getElementById("current-score-label");
const bestScoreLabelEl = document.getElementById("best-score-label");
const leaderboardButtonEl = document.getElementById("leaderboard-button");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const currentScoreRow = document.getElementById("current-score-row");
const bestScoreRow = document.getElementById("best-score-row");
const statusEl = document.getElementById("status");
const controlsPopover = document.getElementById("controls-popover");
const helpTouchEl = document.getElementById("help-touch");
const toggleDpadLabelEl = document.getElementById("toggle-dpad-label");
const restartButtonEl = document.getElementById("restart-button");
const helpKeyboardEl = document.getElementById("help-keyboard");
const helpControllerEl = document.getElementById("help-controller");
const settingsTitleEl = document.getElementById("settings-title");
const settingsCloseEl = document.getElementById("settings-close");
const gameOverModalEl = document.getElementById("game-over-modal");
const gameOverTitleEl = document.getElementById("game-over-title");
const gameOverScoreEl = document.getElementById("game-over-score");
const gameOverCompareEl = document.getElementById("game-over-compare");
const playerNameLabelEl = document.getElementById("player-name-label");
const playerNameInputEl = document.getElementById("player-name-input");
const saveScoreButtonEl = document.getElementById("save-score-button");
const saveScoreStatusEl = document.getElementById("save-score-status");
const gameOverMessageEl = document.getElementById("game-over-message");
const recentScoresPanelEl = document.getElementById("recent-scores-panel");
const recentScoresTitleEl = document.getElementById("recent-scores-title");
const recentScoresChartEl = document.getElementById("recent-scores-chart");
const recentScoresCaptionEl = document.getElementById("recent-scores-caption");
const gameOverCloseEl = document.getElementById("game-over-close");
const leaderboardModalEl = document.getElementById("leaderboard-modal");
const leaderboardTitleEl = document.getElementById("leaderboard-title");
const leaderboardCloseEl = document.getElementById("leaderboard-close");
const leaderboardListEl = document.getElementById("leaderboard-list");
const leaderboardEmptyEl = document.getElementById("leaderboard-empty");
const modalBackdropEl = document.getElementById("modal-backdrop");
const pauseButton = document.getElementById("pause-button");
const dpad = document.getElementById("dpad");
const dpadToggle = document.getElementById("toggle-dpad");
const dpadUpButton = document.querySelector(".dpad-up");
const dpadLeftButton = document.querySelector(".dpad-left");
const dpadRightButton = document.querySelector(".dpad-right");
const dpadDownButton = document.querySelector(".dpad-down");
const landscapeMediaQuery = window.matchMedia("(orientation: landscape)");
const SWIPE_MIN_DISTANCE = 24;
const GAMEPAD_DEADZONE = 0.55;
const GAMEPAD_REPEAT_MS = 130;
const INPUT_BUFFER_LIMIT = 3;
const INPUT_DEDUPE_WINDOW_MS = 45;
const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
const DPAD_STORAGE_KEY = "snake_show_dpad";
const PLAYER_NAME_STORAGE_KEY = "snake_player_name";
const i18n = createI18n();
const themeColorMetaEl = document.querySelector('meta[name="theme-color"]');
const THEME_COLOR_NORMAL = "#d3fbfb";
const THEME_COLOR_MODAL = "#9faf9f";
const GAME_OVER_MESSAGES = {
  de: [
    "Das war knapp. Einmal tief durchatmen und direkt die naechste Runde starten.",
    "Starke Runde. Mit dem naechsten Lauf knacken wir den Rekord.",
    "Guter Versuch. Du hast den Rhythmus schon fast perfekt.",
    "Sehr ordentlich gespielt. Noch eine Runde und der Bestwert wackelt.",
    "Fast geschafft. Kleine Anpassung und du holst mehr Punkte.",
  ],
  en: [
    "That was close. Take a breath and go again.",
    "Solid run. The next one can beat the record.",
    "Nice attempt. You are close to a perfect rhythm.",
    "Good control. One more round and the best score is in reach.",
    "Almost there. Small adjustment and you will score higher.",
  ],
};
let touchStart = null;
let bestScore = null;
let scoreSubmittedForRound = false;
let hasStarted = false;
let gameOverReferenceBestScore = null;
let gameOverMotivation = "";
let topScores = [];
let recentScores = [];
let leaderboardBusy = false;
let gamepadLoopStarted = false;
let gamepadPrevPausePressed = false;
let gamepadPrevRestartPressed = false;
let gamepadHeldDirection = null;
let gamepadNextRepeatAt = 0;
let queuedDirections = [];
let lastDirectionInputAt = 0;

canvas.width = GRID_SIZE * CELL;
canvas.height = GRID_SIZE * CELL;

let state = createInitialState();
state = {
  ...state,
  isPaused: true,
};

function applyStaticTranslations() {
  document.documentElement.lang = i18n.t("htmlLang");
  infoButtonEl.setAttribute("aria-label", i18n.t("infoAria"));
  currentScoreLabelEl.textContent = i18n.t("currentScoreLabel");
  bestScoreLabelEl.textContent = i18n.t("bestScoreLabel");
  leaderboardButtonEl.textContent = i18n.t("leaderboardButton");
  helpTouchEl.textContent = i18n.t("helpTouch");
  settingsTitleEl.textContent = i18n.t("settingsTitle");
  settingsCloseEl.setAttribute("aria-label", i18n.t("closeDialog"));
  gameOverCloseEl.setAttribute("aria-label", i18n.t("closeDialog"));
  playerNameLabelEl.textContent = i18n.t("playerNameLabel");
  playerNameInputEl.placeholder = i18n.t("playerNamePlaceholder");
  saveScoreButtonEl.textContent = i18n.t("saveScoreButton");
  leaderboardTitleEl.textContent = i18n.t("leaderboardTitle");
  leaderboardCloseEl.setAttribute("aria-label", i18n.t("closeDialog"));
  leaderboardEmptyEl.textContent = i18n.t("leaderboardEmpty");
  recentScoresTitleEl.textContent = i18n.t("recentScoresTitle");
  toggleDpadLabelEl.textContent = i18n.t("showArrows");
  restartButtonEl.textContent = i18n.t("restart");
  helpKeyboardEl.textContent = i18n.t("helpKeyboard");
  helpControllerEl.textContent = i18n.t("helpController");
  canvas.setAttribute("aria-label", i18n.t("boardAria"));
  controlsPopover.setAttribute("aria-label", i18n.t("popoverAria"));
  gameOverModalEl.setAttribute("aria-label", i18n.t("statusGameOver"));
  leaderboardModalEl.setAttribute("aria-label", i18n.t("leaderboardTitle"));
  dpad.setAttribute("aria-label", i18n.t("dpadAria"));
  dpadUpButton.setAttribute("aria-label", i18n.t("upAria"));
  dpadDownButton.setAttribute("aria-label", i18n.t("downAria"));
  dpadLeftButton.setAttribute("aria-label", i18n.t("leftAria"));
  dpadRightButton.setAttribute("aria-label", i18n.t("rightAria"));
}

function sanitizePlayerName(name) {
  const trimmed = (name || "").trim().replace(/\s+/g, " ");
  return trimmed.slice(0, 24);
}

function formatTopScoreEntry(entry) {
  const player = sanitizePlayerName(entry.player_name) || i18n.t("anonymousName");
  return `${player} - ${entry.score}`;
}

function renderLeaderboard() {
  leaderboardListEl.innerHTML = "";
  if (!topScores.length) {
    leaderboardEmptyEl.hidden = false;
    return;
  }

  leaderboardEmptyEl.hidden = true;
  topScores.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = formatTopScoreEntry(entry);
    leaderboardListEl.appendChild(li);
  });
}

function renderRecentScores() {
  recentScoresChartEl.innerHTML = "";
  if (!recentScores.length) {
    recentScoresPanelEl.hidden = true;
    recentScoresCaptionEl.textContent = "";
    return;
  }

  recentScoresPanelEl.hidden = false;
  const maxScore = Math.max(1, ...recentScores.map((entry) => Number(entry.score) || 0));
  const ordered = [...recentScores].reverse();

  ordered.forEach((entry) => {
    const score = Number(entry.score) || 0;
    const bar = document.createElement("span");
    bar.className = "recent-score-bar";
    bar.style.height = `${Math.max(4, Math.round((score / maxScore) * 100))}%`;
    bar.title = `${sanitizePlayerName(entry.player_name) || i18n.t("anonymousName")}: ${score}`;
    recentScoresChartEl.appendChild(bar);
  });

  recentScoresCaptionEl.textContent = i18n.t("recentScoresCaption", { count: recentScores.length });
}

async function loadTopScores() {
  if (!isScoresApiConfigured()) {
    topScores = [];
    renderLeaderboard();
    return;
  }

  try {
    topScores = await fetchTopScores(25);
  } catch (error) {
    console.error(error);
    topScores = [];
  }
  renderLeaderboard();
}

async function loadRecentScores() {
  if (!isScoresApiConfigured()) {
    recentScores = [];
    renderRecentScores();
    return;
  }

  try {
    recentScores = await fetchRecentScores(100);
  } catch (error) {
    console.error(error);
    recentScores = [];
  }
  renderRecentScores();
}

async function submitScoreEntry(score, playerName, showStatus = false) {
  if (scoreSubmittedForRound || score <= 0) {
    if (showStatus) {
      saveScoreStatusEl.textContent = i18n.t("saveAlreadyDone");
    }
    return;
  }

  if (!isScoresApiConfigured()) {
    if (showStatus) {
      saveScoreStatusEl.textContent = i18n.t("saveBackendUnavailable");
    }
    return;
  }

  scoreSubmittedForRound = true;
  if (showStatus) {
    saveScoreStatusEl.textContent = i18n.t("saveInProgress");
  }

  try {
    await submitScore(score, playerName || null);
    if (showStatus) {
      saveScoreStatusEl.textContent = i18n.t("saveSuccess");
    }

    if (bestScore === null || score > bestScore) {
      bestScore = score;
      updateBestScoreLabel();
    } else {
      await loadBestScore();
    }
    await loadTopScores();
  } catch (error) {
    console.error(error);
    scoreSubmittedForRound = false;
    if (showStatus) {
      saveScoreStatusEl.textContent = i18n.t("saveFailed");
    }
  }
}

function submitCurrentRoundScore(showStatus = false) {
  const name = sanitizePlayerName(playerNameInputEl.value);
  if (name) {
    localStorage.setItem(PLAYER_NAME_STORAGE_KEY, name);
  } else {
    localStorage.removeItem(PLAYER_NAME_STORAGE_KEY);
  }
  return submitScoreEntry(state.score, name, showStatus);
}

function updateBestScoreLabel() {
  if (bestScore === null) {
    bestScoreEl.textContent = "-";
    return;
  }
  bestScoreEl.textContent = String(bestScore);
}

function getRandomGameOverMessage() {
  const messages = GAME_OVER_MESSAGES[i18n.language] ?? GAME_OVER_MESSAGES.en;
  const idx = Math.floor(Math.random() * messages.length);
  return messages[idx];
}

function updateGameOverCard() {
  if (!state.isGameOver) {
    return;
  }

  gameOverTitleEl.textContent = i18n.t("statusGameOver");
  gameOverScoreEl.textContent = `${i18n.t("gameOverYourScore")}: ${state.score}`;

  if (gameOverReferenceBestScore === null) {
    gameOverCompareEl.textContent = i18n.t("gameOverBestUnavailable");
  } else if (state.score > gameOverReferenceBestScore) {
    gameOverCompareEl.textContent = i18n.t("gameOverNewBest");
  } else if (state.score === gameOverReferenceBestScore) {
    gameOverCompareEl.textContent = i18n.t("gameOverMatchBest");
  } else {
    const diff = gameOverReferenceBestScore - state.score;
    gameOverCompareEl.textContent = `${i18n.t("gameOverBehindBest")}: ${diff}`;
  }

  gameOverMessageEl.textContent = gameOverMotivation;
}

function openGameOverModal() {
  gameOverModalEl.hidden = false;
  gameOverModalEl.setAttribute("aria-modal", "true");
  updateModalBackdrop();
}

function closeGameOverModal() {
  gameOverModalEl.hidden = true;
  gameOverModalEl.removeAttribute("aria-modal");
  updateModalBackdrop();
}

function openLeaderboardModal() {
  leaderboardModalEl.hidden = false;
  leaderboardModalEl.setAttribute("aria-modal", "true");
  updateModalBackdrop();
}

function closeLeaderboardModal() {
  leaderboardModalEl.hidden = true;
  leaderboardModalEl.removeAttribute("aria-modal");
  updateModalBackdrop();
}

function openSettingsModal() {
  controlsPopover.hidden = false;
  controlsPopover.setAttribute("aria-modal", "true");
  updateModalBackdrop();
}

function closeSettingsModal() {
  controlsPopover.hidden = true;
  controlsPopover.removeAttribute("aria-modal");
  updateModalBackdrop();
}

function closeAllModals() {
  closeSettingsModal();
  closeGameOverModal();
  closeLeaderboardModal();
}

function updateModalBackdrop() {
  const hasOpenModal = !controlsPopover.hidden || !gameOverModalEl.hidden || !leaderboardModalEl.hidden;
  modalBackdropEl.hidden = !hasOpenModal;
  document.body.classList.toggle("modal-open", hasOpenModal);
  refreshThemeColor(hasOpenModal);
}

function refreshThemeColor(hasOpenModal) {
  if (!themeColorMetaEl) {
    return;
  }

  if (hasOpenModal) {
    themeColorMetaEl.setAttribute("content", THEME_COLOR_MODAL);
    return;
  }

  themeColorMetaEl.setAttribute("content", THEME_COLOR_NORMAL);
  requestAnimationFrame(() => {
    themeColorMetaEl.setAttribute("content", "#fbdd97");
    requestAnimationFrame(() => {
      themeColorMetaEl.setAttribute("content", THEME_COLOR_NORMAL);
    });
  });
}

function setupGlobalModalDismiss() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!controlsPopover.hidden) {
        closeSettingsModal();
        return;
      }
      if (!leaderboardModalEl.hidden) {
        closeLeaderboardModal();
      }
      if (!gameOverModalEl.hidden) {
        event.preventDefault();
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (!controlsPopover.hidden && !controlsPopover.contains(event.target) && !infoButtonEl.contains(event.target)) {
      closeSettingsModal();
    }
  });
}

function onDpadToggleChange(event) {
  if (landscapeMediaQuery.matches) {
    syncDpadVisibility();
    return;
  }
  setDpadPreference(event.target.checked);
  syncDpadVisibility();
}

infoButtonEl.addEventListener("click", () => {
  openSettingsModal();
});

async function openLeaderboardWithData(event) {
  if (event) {
    event.preventDefault();
  }
  if (leaderboardBusy) {
    return;
  }
  leaderboardBusy = true;
  leaderboardButtonEl.disabled = true;
  try {
    await loadTopScores();
    openLeaderboardModal();
  } finally {
    leaderboardBusy = false;
    leaderboardButtonEl.disabled = false;
  }
}

leaderboardButtonEl.addEventListener("click", openLeaderboardWithData);
leaderboardButtonEl.addEventListener("touchend", openLeaderboardWithData, { passive: false });

settingsCloseEl.addEventListener("click", () => {
  closeSettingsModal();
});

leaderboardCloseEl.addEventListener("click", () => {
  closeLeaderboardModal();
});

pauseButton.addEventListener("click", () => {
  startOrTogglePause();
  render();
});
gameOverCloseEl.addEventListener("click", () => {
  closeGameOverModal();
});
modalBackdropEl.addEventListener("click", () => {
  if (!controlsPopover.hidden) {
    closeSettingsModal();
  }
});

function updateHud() {
  scoreEl.textContent = String(state.score);
  if (state.isGameOver) {
    pauseButton.textContent = i18n.t("restartRound");
  } else {
    pauseButton.textContent = state.isPaused ? i18n.t("start") : i18n.t("pause");
  }

  const isRunning = hasStarted && !state.isPaused && !state.isGameOver;
  currentScoreRow.classList.toggle("hidden", !isRunning);
  currentScoreRow.classList.toggle("highlight", isRunning);
  bestScoreRow.classList.toggle("highlight", !hasStarted || state.isGameOver);

  if (state.isGameOver) {
    statusEl.textContent = i18n.t("statusGameOver");
    statusEl.className = "game-over";
    return;
  }

  if (!hasStarted) {
    statusEl.textContent = i18n.t("statusReady");
    statusEl.className = "paused";
    return;
  }

  if (state.isPaused) {
    statusEl.textContent = i18n.t("statusPaused");
    statusEl.className = "paused";
    return;
  }

  statusEl.textContent = i18n.t("statusRunning");
  statusEl.className = "";
}

function drawGrid() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#ececec";
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const p = i * CELL;

    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
  }
}

function drawCells() {
  if (state.food) {
    ctx.fillStyle = "#b5261e";
    ctx.fillRect(state.food.x * CELL + 1, state.food.y * CELL + 1, CELL - 2, CELL - 2);
  }

  state.snake.forEach((segment, idx) => {
    ctx.fillStyle = idx === 0 ? "#176e3f" : "#1e8a4f";
    ctx.fillRect(segment.x * CELL + 1, segment.y * CELL + 1, CELL - 2, CELL - 2);
  });
}

function render() {
  drawGrid();
  drawCells();
  updateHud();
  updateGameOverCard();
}

function onDirectionInput(direction) {
  enqueueDirection(direction);
}

function enqueueDirection(direction) {
  if (!OPPOSITES[direction]) {
    return false;
  }

  const now = performance.now();
  const lastQueued = queuedDirections[queuedDirections.length - 1] ?? null;
  const effectiveDirection = lastQueued || state.pendingDirection || state.direction;

  if (direction === effectiveDirection) {
    return false;
  }

  if (direction === OPPOSITES[effectiveDirection]) {
    return false;
  }

  if (lastQueued === direction && now - lastDirectionInputAt <= INPUT_DEDUPE_WINDOW_MS) {
    return false;
  }

  if (queuedDirections.length >= INPUT_BUFFER_LIMIT) {
    queuedDirections.shift();
  }
  queuedDirections.push(direction);
  lastDirectionInputAt = now;
  return true;
}

function applyNextQueuedDirection() {
  if (!queuedDirections.length) {
    return;
  }
  const next = queuedDirections.shift();
  state = setDirection(state, next);
}

function isModalOpen() {
  return !controlsPopover.hidden || !leaderboardModalEl.hidden || !gameOverModalEl.hidden;
}

function buttonPressed(button) {
  if (!button) {
    return false;
  }
  if (typeof button === "number") {
    return button > 0.5;
  }
  return button.pressed || button.value > 0.5;
}

function readDirectionFromGamepad(gamepad) {
  if (!gamepad) {
    return null;
  }

  const up = buttonPressed(gamepad.buttons?.[12]);
  const down = buttonPressed(gamepad.buttons?.[13]);
  const left = buttonPressed(gamepad.buttons?.[14]);
  const right = buttonPressed(gamepad.buttons?.[15]);

  if (up && !down) return "up";
  if (down && !up) return "down";
  if (left && !right) return "left";
  if (right && !left) return "right";

  const x = Number(gamepad.axes?.[0] || 0);
  const y = Number(gamepad.axes?.[1] || 0);
  if (Math.abs(x) < GAMEPAD_DEADZONE && Math.abs(y) < GAMEPAD_DEADZONE) {
    return null;
  }

  if (Math.abs(x) > Math.abs(y)) {
    return x > 0 ? "right" : "left";
  }
  return y > 0 ? "down" : "up";
}

function handleGamepadInput(timestamp) {
  if (isModalOpen()) {
    gamepadHeldDirection = null;
    gamepadPrevPausePressed = false;
    gamepadPrevRestartPressed = false;
    return;
  }

  const pads = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : [];
  let direction = null;
  let pausePressed = false;
  let restartPressed = false;

  for (const pad of pads) {
    if (!pad || !pad.connected) {
      continue;
    }
    if (!direction) {
      direction = readDirectionFromGamepad(pad);
    }
    pausePressed ||= buttonPressed(pad.buttons?.[0]) || buttonPressed(pad.buttons?.[9]);
    restartPressed ||= buttonPressed(pad.buttons?.[3]);
  }

  if (direction) {
    const shouldApply = direction !== gamepadHeldDirection || timestamp >= gamepadNextRepeatAt;
    if (shouldApply) {
      onBoardDirectionInput(direction);
      gamepadHeldDirection = direction;
      gamepadNextRepeatAt = timestamp + GAMEPAD_REPEAT_MS;
      render();
    }
  } else {
    gamepadHeldDirection = null;
  }

  if (pausePressed && !gamepadPrevPausePressed) {
    startOrTogglePause();
    render();
  }
  if (restartPressed && !gamepadPrevRestartPressed) {
    restartGame();
    render();
  }

  gamepadPrevPausePressed = pausePressed;
  gamepadPrevRestartPressed = restartPressed;
}

function gamepadLoop(timestamp = 0) {
  handleGamepadInput(timestamp);
  requestAnimationFrame(gamepadLoop);
}

function startGamepadLoopIfSupported() {
  if (gamepadLoopStarted || typeof navigator.getGamepads !== "function") {
    return;
  }
  gamepadLoopStarted = true;
  requestAnimationFrame(gamepadLoop);
}

function setDpadPreference(visible) {
  localStorage.setItem(DPAD_STORAGE_KEY, visible ? "1" : "0");
}

function syncDpadVisibility() {
  const preferredVisible = localStorage.getItem(DPAD_STORAGE_KEY) === "1";
  const visible = landscapeMediaQuery.matches || preferredVisible;
  dpad.hidden = !visible;
  dpadToggle.checked = visible;
  dpadToggle.disabled = landscapeMediaQuery.matches;
}

function startOrTogglePause() {
  if (state.isGameOver) {
    restartGame();
    hasStarted = true;
    state = togglePause(state);
    return;
  }

  if (!hasStarted) {
    hasStarted = true;
    if (state.isPaused) {
      state = togglePause(state);
    }
    return;
  }

  state = togglePause(state);
}

function restartGame() {
  if (state.isGameOver && !scoreSubmittedForRound && state.score > 0) {
    submitCurrentRoundScore(false);
  }

  state = restartState(state);
  state = {
    ...state,
    isPaused: true,
  };
  hasStarted = false;
  scoreSubmittedForRound = false;
  gameOverReferenceBestScore = null;
  gameOverMotivation = "";
  queuedDirections = [];
  saveScoreStatusEl.textContent = "";
  closeGameOverModal();
}

function onBoardDirectionInput(direction) {
  if (state.isGameOver) {
    return;
  }
  if (!hasStarted) {
    return;
  }
  enqueueDirection(direction);
  if (state.isPaused) {
    state = togglePause(state);
  }
}

function directionFromDelta(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

function directionFromTap(point) {
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  return directionFromDelta(dx, dy);
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key.startsWith("arrow")) {
    event.preventDefault();
  }

  if (key === "arrowup" || key === "w") onDirectionInput("up");
  if (key === "arrowdown" || key === "s") onDirectionInput("down");
  if (key === "arrowleft" || key === "a") onDirectionInput("left");
  if (key === "arrowright" || key === "d") onDirectionInput("right");

  if (key === " ") {
    event.preventDefault();
    startOrTogglePause();
    render();
  }

  if (key === "r") {
    restartGame();
    render();
  }
});

window.addEventListener("gamepadconnected", () => {
  startGamepadLoopIfSupported();
});

window.addEventListener("pointerdown", () => {
  startGamepadLoopIfSupported();
}, { once: true });

function handleControlInput(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const direction = button.dataset.dir;
  const action = button.dataset.action;

  if (direction) {
    onDirectionInput(direction);
  }

  if (action === "pause") {
    startOrTogglePause();
  }

  if (action === "restart") {
    restartGame();
  }

  render();
}

controlsPopover.addEventListener("click", handleControlInput);

dpad.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-dir]");
  if (!button) {
    return;
  }
  onDirectionInput(button.dataset.dir);
  render();
});

dpadToggle.addEventListener("input", onDpadToggleChange);
dpadToggle.addEventListener("change", onDpadToggleChange);
if (typeof landscapeMediaQuery.addEventListener === "function") {
  landscapeMediaQuery.addEventListener("change", syncDpadVisibility);
} else if (typeof landscapeMediaQuery.addListener === "function") {
  landscapeMediaQuery.addListener(syncDpadVisibility);
}

saveScoreButtonEl.addEventListener("click", async () => {
  await submitCurrentRoundScore(true);
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  touchStart = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
});

canvas.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "touch") {
    return;
  }
  if (!touchStart) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const end = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  const dx = end.x - touchStart.x;
  const dy = end.y - touchStart.y;
  const distance = Math.hypot(dx, dy);

  if (distance >= SWIPE_MIN_DISTANCE) {
    onBoardDirectionInput(directionFromDelta(dx, dy));
  } else {
    onBoardDirectionInput(directionFromTap(end));
  }

  touchStart = null;
  render();
});

canvas.addEventListener("pointercancel", () => {
  touchStart = null;
});

async function loadBestScore() {
  try {
    bestScore = await fetchBestScore();
  } catch (error) {
    console.error(error);
    bestScore = null;
  }
  updateBestScoreLabel();
}

function onGameOver() {
  gameOverReferenceBestScore = bestScore;
  gameOverMotivation = getRandomGameOverMessage();
  playerNameInputEl.value = localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || "";
  saveScoreStatusEl.textContent = "";
  updateGameOverCard();
  loadRecentScores();
  openGameOverModal();
}

setInterval(() => {
  const wasGameOver = state.isGameOver;
  applyNextQueuedDirection();
  state = stepState(state);
  if (!wasGameOver && state.isGameOver) {
    queuedDirections = [];
    onGameOver();
  }
  render();
}, TICK_MS);

if (isScoresApiConfigured()) {
  loadBestScore();
}
closeAllModals();
setupGlobalModalDismiss();
applyStaticTranslations();
syncDpadVisibility();
renderRecentScores();
updateBestScoreLabel();
render();
startGamepadLoopIfSupported();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}
