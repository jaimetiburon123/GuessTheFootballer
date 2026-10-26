// =========================================
// Game constants and configuration
// =========================================
export const RESULT = {
  CORRECT: "correct",
  PARTIAL: "partial",
  WRONG: "wrong",
};

export const POSITION_LINES = {
  GK: "Goalkeeper",
  CB: "Defence",
  LB: "Defence",
  RB: "Defence",
  CDM: "Midfield",
  CM: "Midfield",
  CAM: "Midfield",
  LW: "Attack",
  RW: "Attack",
  ST: "Attack",
};

// Max difference for a numeric value to count as "close"
export const CLOSE_RANGE = 2;
export const MAX_SUGGESTIONS = 8;

// Delay between each cell of a new row when it flips in (ms)
export const CELL_FLIP_DELAY = 90;
export const TOAST_DURATION = 2500;

// Typing this word anywhere outside the input toggles dark mode
export const SECRET_WORD = "dark";

export const STORAGE_KEYS = {
  STATS: "guess-the-footballer-stats",
  THEME: "guess-the-footballer-theme",
};

export const EMPTY_STATS = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
};

// Every difficulty is described here, so the game logic has no special cases
export const DIFFICULTIES = {
  easy: {
    label: "Easy",
    maxGuesses: 10,
    showPartial: true,
    showArrows: true,
    hiddenColumns: [],
  },
  normal: {
    label: "Normal",
    maxGuesses: 8,
    showPartial: false,
    showArrows: true,
    hiddenColumns: [],
  },
  hard: {
    label: "Hard",
    maxGuesses: 6,
    showPartial: false,
    showArrows: false,
    hiddenColumns: ["league", "club", "number", "foot"],
  },
};

export const POOLS = {
  mixed: {
    label: "Mixed",
    filter: () => true,
  },
  legends: {
    label: "Legends",
    filter: (player) => !player.active,
  },
  current: {
    label: "Current",
    filter: (player) => player.active,
  },
};
