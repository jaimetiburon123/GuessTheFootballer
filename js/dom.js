// =========================================
// All DOM references in one place
// =========================================
export const dom = {
  // Setup screen
  setupSection: document.querySelector("#setup"),
  startButton: document.querySelector("#start-button"),

  // Status bar
  gameArea: document.querySelector("#game-area"),
  guessCount: document.querySelector("#guess-count"),
  difficultyLabel: document.querySelector("#difficulty-label"),
  poolLabel: document.querySelector("#pool-label"),
  playerCount: document.querySelector("#player-count"),

  // Guess form and suggestions
  guessForm: document.querySelector("#guess-form"),
  guessInput: document.querySelector("#guess-input"),
  guessButton: document.querySelector("#guess-button"),
  suggestionsList: document.querySelector("#suggestions"),
  message: document.querySelector("#message"),

  // Board
  board: document.querySelector(".board"),
  boardHeader: document.querySelector("#board-header"),
  boardRows: document.querySelector("#board-rows"),
  boardEmpty: document.querySelector("#board-empty"),
  legendPartial: document.querySelector("#legend-partial"),
  legendArrows: document.querySelector("#legend-arrows"),

  // End panel
  endPanel: document.querySelector("#end-panel"),
  endTitle: document.querySelector("#end-title"),
  endText: document.querySelector("#end-text"),
  answerCard: document.querySelector("#answer-card"),
  playAgainButton: document.querySelector("#play-again-button"),
  changeSettingsButton: document.querySelector("#change-settings-button"),

  // Statistics
  statPlayed: document.querySelector("#stat-played"),
  statWinRate: document.querySelector("#stat-win-rate"),
  statStreak: document.querySelector("#stat-streak"),
  statBestStreak: document.querySelector("#stat-best-streak"),

  toast: document.querySelector("#toast"),
};
