export const GRID_SIZE = 20;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function keyFor(pos) {
  return `${pos.x},${pos.y}`;
}

function insideGrid(pos, gridSize) {
  return pos.x >= 0 && pos.y >= 0 && pos.x < gridSize && pos.y < gridSize;
}

export function spawnFood(snake, gridSize = GRID_SIZE, rng = Math.random) {
  const occupied = new Set(snake.map(keyFor));
  const empty = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const pos = { x, y };
      if (!occupied.has(keyFor(pos))) {
        empty.push(pos);
      }
    }
  }

  if (empty.length === 0) {
    return null;
  }

  const idx = Math.floor(rng() * empty.length);
  return empty[idx];
}

export function createInitialState(gridSize = GRID_SIZE, rng = Math.random) {
  const center = Math.floor(gridSize / 2);
  const snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ];

  return {
    gridSize,
    snake,
    direction: "right",
    pendingDirection: "right",
    food: spawnFood(snake, gridSize, rng),
    score: 0,
    isGameOver: false,
    isPaused: false,
  };
}

export function setDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection]) {
    return state;
  }

  if (nextDirection === OPPOSITES[state.direction]) {
    return state;
  }

  return {
    ...state,
    pendingDirection: nextDirection,
  };
}

export function togglePause(state) {
  if (state.isGameOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function restartState(state, rng = Math.random) {
  return createInitialState(state.gridSize, rng);
}

export function stepState(state, rng = Math.random) {
  if (state.isGameOver || state.isPaused) {
    return state;
  }

  const direction = state.pendingDirection;
  const vector = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };

  if (!insideGrid(nextHead, state.gridSize)) {
    return {
      ...state,
      direction,
      isGameOver: true,
    };
  }

  const grows = state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;
  const bodyToCheck = grows ? state.snake : state.snake.slice(0, -1);
  const hitsSelf = bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

  if (hitsSelf) {
    return {
      ...state,
      direction,
      isGameOver: true,
    };
  }

  const movedSnake = [nextHead, ...state.snake];
  if (!grows) {
    movedSnake.pop();
  }

  const nextFood = grows ? spawnFood(movedSnake, state.gridSize, rng) : state.food;

  return {
    ...state,
    snake: movedSnake,
    direction,
    food: nextFood,
    score: state.score + (grows ? 1 : 0),
    isGameOver: nextFood === null,
  };
}
