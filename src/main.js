import {
  GRID_SIZE,
  createInitialState,
  restartState,
  setDirection,
  stepState,
  togglePause,
} from "./gameLogic.js";

const TICK_MS = 130;
const CELL = 20;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const controls = document.querySelector(".controls");
const SWIPE_MIN_DISTANCE = 24;
let touchStart = null;

canvas.width = GRID_SIZE * CELL;
canvas.height = GRID_SIZE * CELL;

let state = createInitialState();

function updateHud() {
  scoreEl.textContent = String(state.score);

  if (state.isGameOver) {
    statusEl.textContent = "Game Over";
    statusEl.className = "game-over";
    return;
  }

  if (state.isPaused) {
    statusEl.textContent = "Paused";
    statusEl.className = "paused";
    return;
  }

  statusEl.textContent = "Running";
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
}

function onDirectionInput(direction) {
  state = setDirection(state, direction);
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
    state = togglePause(state);
  }

  if (key === "r") {
    state = restartState(state);
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
    state = togglePause(state);
  }

  if (action === "restart") {
    state = restartState(state);
  }

  render();
}

controls.addEventListener("click", handleControlInput);

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
    onDirectionInput(directionFromDelta(dx, dy));
  } else {
    onDirectionInput(directionFromTap(end));
  }

  touchStart = null;
});

canvas.addEventListener("pointercancel", () => {
  touchStart = null;
});

setInterval(() => {
  state = stepState(state);
  render();
}, TICK_MS);

render();
