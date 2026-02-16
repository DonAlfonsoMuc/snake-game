# Snake

Minimal classic Snake implementation (no external dependencies).

## Run

1. Start a static server from this folder:
   - `python3 -m http.server 5173`
2. Open `http://localhost:5173`.

## Tests

- Run core logic tests (Node 18+):
  - `node --test tests/gameLogic.test.mjs`

## Controls

- Keyboard: Arrow keys or `WASD`
- Touch: swipe on the board to steer, short tap sets direction by tapped side
- Pause: `Space` or on-screen `Pause`
- Restart: `R` or on-screen `Restart`
