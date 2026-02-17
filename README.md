# Snake

Minimal classic Snake implementation (no external dependencies).

- Auto locale: German (`de`) if device/browser language is German, otherwise English.
- App icons: `/assets/snake-brand.png`, `/assets/icon-192.png`, `/assets/icon-512.png`, `/assets/apple-touch-icon-180.png`.
- PWA support: `manifest.webmanifest` + `sw.js` for install/offline (iOS: Add to Home Screen), plus `offline.html` fallback screen.

## Run

1. Start a static server from this folder:
   - `python3 -m http.server 5173`
2. Open `http://localhost:5173`.

## Demo
https://donalfonsomuc.github.io/snake-game/

## Tests

- Run core logic tests (Node 18+):
  - `node --test tests/gameLogic.test.mjs`

## Controls

- Keyboard: Arrow keys or `WASD`
- Touch: swipe on the board to steer, short tap sets direction by tapped side
- Start/Pause: `Space` or the on-screen start/pause button below the board
- While paused: tap/swipe on the board to continue and set direction
- Restart: `R` or `Restart` in the info popover
- Optional D-pad arrows below the board: enable in the info popover

