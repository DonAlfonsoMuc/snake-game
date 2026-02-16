import {
  GRID_SIZE,
  createInitialState,
  restartState,
  setDirection,
  stepState,
  togglePause,
} from "./gameLogic.js";
import {
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
const settingsTitleEl = document.getElementById("settings-title");
const settingsCloseEl = document.getElementById("settings-close");
const gameOverModalEl = document.getElementById("game-over-modal");
const gameOverTitleEl = document.getElementById("game-over-title");
const gameOverScoreEl = document.getElementById("game-over-score");
const gameOverCompareEl = document.getElementById("game-over-compare");
const gameOverMessageEl = document.getElementById("game-over-message");
const gameOverCloseEl = document.getElementById("game-over-close");
const modalBackdropEl = document.getElementById("modal-backdrop");
const pauseButton = document.getElementById("pause-button");
const dpad = document.getElementById("dpad");
const dpadToggle = document.getElementById("toggle-dpad");
const settingsRowEl = document.getElementById("settings-row");
const dpadUpButton = document.querySelector(".dpad-up");
const dpadLeftButton = document.querySelector(".dpad-left");
const dpadRightButton = document.querySelector(".dpad-right");
const dpadDownButton = document.querySelector(".dpad-down");
const SWIPE_MIN_DISTANCE = 24;
const DPAD_STORAGE_KEY = "snake_show_dpad";
const i18n = createI18n();
const themeColorMetaEl = document.querySelector('meta[name="theme-color"]');
const THEME_COLOR_NORMAL = "#e7ecbf";
const THEME_COLOR_MODAL = "#d8dcb3";
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
  helpTouchEl.textContent = i18n.t("helpTouch");
  settingsTitleEl.textContent = i18n.t("settingsTitle");
  settingsCloseEl.setAttribute("aria-label", i18n.t("closeDialog"));
  gameOverCloseEl.setAttribute("aria-label", i18n.t("closeDialog"));
  toggleDpadLabelEl.textContent = i18n.t("showArrows");
  restartButtonEl.textContent = i18n.t("restart");
  helpKeyboardEl.textContent = i18n.t("helpKeyboard");
  canvas.setAttribute("aria-label", i18n.t("boardAria"));
  controlsPopover.setAttribute("aria-label", i18n.t("popoverAria"));
  gameOverModalEl.setAttribute("aria-label", i18n.t("statusGameOver"));
  dpad.setAttribute("aria-label", i18n.t("dpadAria"));
  dpadUpButton.setAttribute("aria-label", i18n.t("upAria"));
  dpadDownButton.setAttribute("aria-label", i18n.t("downAria"));
  dpadLeftButton.setAttribute("aria-label", i18n.t("leftAria"));
  dpadRightButton.setAttribute("aria-label", i18n.t("rightAria"));
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
  updateModalBackdrop();
}

function closeGameOverModal() {
  gameOverModalEl.hidden = true;
  updateModalBackdrop();
}

function openSettingsModal() {
  controlsPopover.hidden = false;
  updateModalBackdrop();
}

function closeSettingsModal() {
  controlsPopover.hidden = true;
  updateModalBackdrop();
}

function closeAllModals() {
  closeSettingsModal();
  closeGameOverModal();
}

function updateModalBackdrop() {
  const hasOpenModal = !controlsPopover.hidden || !gameOverModalEl.hidden;
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
    themeColorMetaEl.setAttribute("content", "#e7ecbe");
    requestAnimationFrame(() => {
      themeColorMetaEl.setAttribute("content", THEME_COLOR_NORMAL);
    });
  });
}

function setupGlobalModalDismiss() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllModals();
    }
  });

  document.addEventListener("click", (event) => {
    if (!controlsPopover.hidden && !controlsPopover.contains(event.target) && !infoButtonEl.contains(event.target)) {
      closeSettingsModal();
    }
    if (!gameOverModalEl.hidden && !gameOverModalEl.contains(event.target)) {
      closeGameOverModal();
    }
  });
}

function onDpadToggleChange(event) {
  setDpadVisible(event.target.checked);
}

settingsRowEl.addEventListener("click", (event) => {
  if (event.target === dpadToggle) {
    return;
  }
  dpadToggle.checked = !dpadToggle.checked;
  setDpadVisible(dpadToggle.checked);
});

infoButtonEl.addEventListener("click", () => {
  openSettingsModal();
});

settingsCloseEl.addEventListener("click", () => {
  closeSettingsModal();
});

pauseButton.addEventListener("click", () => {
  startOrTogglePause();
  render();
});
gameOverCloseEl.addEventListener("click", () => {
  closeGameOverModal();
});
modalBackdropEl.addEventListener("click", () => {
  closeAllModals();
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
  state = setDirection(state, direction);
}

function setDpadVisible(visible) {
  dpad.hidden = !visible;
  dpadToggle.checked = visible;
  localStorage.setItem(DPAD_STORAGE_KEY, visible ? "1" : "0");
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
  state = restartState(state);
  state = {
    ...state,
    isPaused: true,
  };
  hasStarted = false;
  scoreSubmittedForRound = false;
  gameOverReferenceBestScore = null;
  gameOverMotivation = "";
  closeGameOverModal();
}

function onBoardDirectionInput(direction) {
  if (state.isGameOver) {
    return;
  }
  if (!hasStarted) {
    return;
  }
  state = setDirection(state, direction);
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

async function syncGameOverScore() {
  if (!state.isGameOver || scoreSubmittedForRound || state.score <= 0) {
    return;
  }

  scoreSubmittedForRound = true;

  try {
    await submitScore(state.score);
    if (bestScore === null || state.score > bestScore) {
      bestScore = state.score;
      updateBestScoreLabel();
    } else {
      await loadBestScore();
    }
  } catch (error) {
    console.error(error);
  }
}

function onGameOver() {
  gameOverReferenceBestScore = bestScore;
  gameOverMotivation = getRandomGameOverMessage();
  updateGameOverCard();
  openGameOverModal();
}

setInterval(() => {
  const wasGameOver = state.isGameOver;
  state = stepState(state);
  if (!wasGameOver && state.isGameOver) {
    onGameOver();
    syncGameOverScore();
  }
  render();
}, TICK_MS);

if (isScoresApiConfigured()) {
  loadBestScore();
}
closeAllModals();
setupGlobalModalDismiss();
applyStaticTranslations();
setDpadVisible(localStorage.getItem(DPAD_STORAGE_KEY) === "1");
updateBestScoreLabel();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}
