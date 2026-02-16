# Snake

Minimal classic Snake implementation (no external dependencies).

- Auto locale: German (`de`) if device/browser language is German, otherwise English.
- App icons: `/assets/favicon.svg` and `/assets/apple-touch-icon.png`.

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
- Start/Pause: `Space` or the on-screen start/pause button below the board
- While paused: tap/swipe on the board to continue and set direction
- Restart: `R` or `Restart` in the info popover
- Optional D-pad arrows below the board: enable in the info popover

## Global Best Score (Supabase)

1. Open `/Users/sgr/Projects/Snake/src/supabaseScores.js`.
2. Set:
   - `SUPABASE_URL` to your project URL (`https://<project>.supabase.co`)
   - `SUPABASE_ANON_KEY` to your anon public key
3. Reload the page.

Behavior:
- On load, the game fetches the highest score from `public.scores`.
- On game over, a positive score is inserted once for that round.
