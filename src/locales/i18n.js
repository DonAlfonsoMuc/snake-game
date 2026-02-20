const TRANSLATIONS = {
  en: {
    htmlLang: "en",
    infoAria: "Open settings",
    settingsTitle: "Settings",
    closeDialog: "Close dialog",
    leaderboardButton: "Top Scores",
    leaderboardTitle: "Top Scores",
    leaderboardEmpty: "No entries yet.",
    currentScoreLabel: "Score",
    bestScoreLabel: "Best",
    statusReady: "Ready",
    statusPaused: "Paused",
    statusRunning: "Running",
    statusGameOver: "Game Over",
    gameOverYourScore: "Your score",
    gameOverNewBest: "New best score. Excellent run.",
    gameOverMatchBest: "You matched the best score.",
    gameOverBehindBest: "Points to best score",
    gameOverBestUnavailable: "Best score comparison not available yet.",
    playerNameLabel: "Name",
    playerNamePlaceholder: "Your name",
    saveScoreButton: "Save Score",
    saveInProgress: "Saving...",
    saveSuccess: "Saved.",
    saveFailed: "Save failed. Try again.",
    saveAlreadyDone: "This score is already saved.",
    saveBackendUnavailable: "Backend unavailable.",
    anonymousName: "Anonymous",
    recentScoresTitle: "Last 100 results",
    recentScoresCaption: "{count} recent runs (oldest to newest).",
    start: "Start",
    pause: "Pause",
    restartRound: "Restart",
    helpTouch: "Swipe on board to steer. Tap board for quick turns.",
    showArrows: "Show arrows under board",
    restart: "Restart",
    helpKeyboard: "Keyboard: Arrow keys or WASD, Space to pause, R to restart.",
    helpController: "Controller: D-pad/left stick, A to start/pause, Y to restart.",
    boardAria: "Snake game board",
    popoverAria: "Game controls",
    dpadAria: "Directional controls",
    upAria: "Up",
    downAria: "Down",
    leftAria: "Left",
    rightAria: "Right",
  },
  de: {
    htmlLang: "de",
    infoAria: "Einstellungen öffnen",
    settingsTitle: "Einstellungen",
    closeDialog: "Dialog schließen",
    leaderboardButton: "Bestwerte",
    leaderboardTitle: "Bestwerte",
    leaderboardEmpty: "Noch keine Einträge.",
    currentScoreLabel: "Punkte",
    bestScoreLabel: "Bestwert",
    statusReady: "Bereit",
    statusPaused: "Pausiert",
    statusRunning: "Läuft",
    statusGameOver: "Game Over",
    gameOverYourScore: "Dein Score",
    gameOverNewBest: "Neuer Bestwert. Stark gespielt.",
    gameOverMatchBest: "Du hast den Bestwert erreicht.",
    gameOverBehindBest: "Punkte bis zum Bestwert",
    gameOverBestUnavailable: "Bestwert-Vergleich ist noch nicht verfügbar.",
    playerNameLabel: "Name",
    playerNamePlaceholder: "Dein Name",
    saveScoreButton: "Score speichern",
    saveInProgress: "Speichere...",
    saveSuccess: "Gespeichert.",
    saveFailed: "Speichern fehlgeschlagen. Bitte erneut versuchen.",
    saveAlreadyDone: "Dieser Score wurde bereits gespeichert.",
    saveBackendUnavailable: "Backend nicht verfügbar.",
    anonymousName: "Anonym",
    recentScoresTitle: "Letzte 100 Ergebnisse",
    recentScoresCaption: "{count} letzte Runden (von alt nach neu).",
    start: "Start",
    pause: "Pause",
    restartRound: "Neu starten",
    helpTouch: "Wische auf dem Spielfeld zum Lenken. Kurzer Tipp für schnelle Richtungswahl.",
    showArrows: "Pfeiltasten unter dem Spielfeld anzeigen",
    restart: "Neustart",
    helpKeyboard: "Tastatur: Pfeiltasten oder WASD, Leertaste für Pause, R für Neustart.",
    helpController: "Controller: Steuerkreuz/Linker Stick, A für Start/Pause, Y für Neustart.",
    boardAria: "Schlange Spielfeld",
    popoverAria: "Spielsteuerung",
    dpadAria: "Richtungssteuerung",
    upAria: "Hoch",
    downAria: "Runter",
    leftAria: "Links",
    rightAria: "Rechts",
  },
};

function detectLanguage() {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  const hasGerman = candidates.some((lang) => lang && lang.toLowerCase().startsWith("de"));
  return hasGerman ? "de" : "en";
}

export function createI18n() {
  const language = detectLanguage();
  const active = TRANSLATIONS[language] ?? TRANSLATIONS.en;

  return {
    language,
    t(key, params = {}) {
      const raw = active[key] ?? TRANSLATIONS.en[key] ?? key;
      if (typeof raw !== "string") {
        return raw;
      }
      return raw.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? ""));
    },
  };
}
