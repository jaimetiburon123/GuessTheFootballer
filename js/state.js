import { DIFFICULTIES, POOLS, EMPTY_STATS } from "./config.js";

// =========================================
// All mutable game state in one place
// =========================================
export const state = {
  // Settings
  difficulty: DIFFICULTIES.normal,
  pool: POOLS.mixed,
  poolPlayers: [],
  visibleColumns: [],

  // Current round
  targetPlayer: null,
  guessedPlayers: new Set(),
  gameOver: false,

  // Autocomplete
  currentSuggestions: [],
  activeSuggestionIndex: -1,

  // Saved data and secret key
  stats: { ...EMPTY_STATS },
  typedKeys: "",
};
