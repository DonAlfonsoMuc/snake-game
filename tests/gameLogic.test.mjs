import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  setDirection,
  spawnFood,
  stepState,
  togglePause,
} from "../src/gameLogic.js";

function sequenceRng(values) {
  let idx = 0;
  return () => {
    const value = values[idx] ?? values[values.length - 1] ?? 0;
    idx += 1;
    return value;
  };
}

test("snake moves one cell per tick", () => {
  const state = createInitialState(10, sequenceRng([0]));
  const next = stepState(state, sequenceRng([0]));

  assert.equal(next.snake[0].x, state.snake[0].x + 1);
  assert.equal(next.snake[0].y, state.snake[0].y);
  assert.equal(next.snake.length, state.snake.length);
});

test("snake grows and score increments when food is eaten", () => {
  const state = {
    gridSize: 8,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
    direction: "right",
    pendingDirection: "right",
    food: { x: 3, y: 2 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = stepState(state, sequenceRng([0]));

  assert.equal(next.snake.length, 4);
  assert.equal(next.score, 1);
  assert.notDeepEqual(next.food, state.food);
});

test("wall collision ends the game", () => {
  const state = {
    gridSize: 6,
    snake: [
      { x: 5, y: 2 },
      { x: 4, y: 2 },
      { x: 3, y: 2 },
    ],
    direction: "right",
    pendingDirection: "right",
    food: { x: 0, y: 0 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = stepState(state);
  assert.equal(next.isGameOver, true);
});

test("opposite direction input is ignored", () => {
  const state = createInitialState(10, sequenceRng([0]));
  const next = setDirection(state, "left");

  assert.equal(next.pendingDirection, "right");
});

test("food never spawns on the snake body", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ];

  const food = spawnFood(snake, 4, sequenceRng([0]));
  assert.ok(food);
  assert.equal(snake.some((p) => p.x === food.x && p.y === food.y), false);
});

test("pause prevents movement", () => {
  const state = createInitialState(10, sequenceRng([0]));
  const paused = togglePause(state);
  const next = stepState(paused, sequenceRng([0]));

  assert.deepEqual(next.snake, paused.snake);
});
