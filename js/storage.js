import { STORAGE_KEYS, EMPTY_STATS } from "./config.js";
import { state } from "./state.js";

// =========================================
// Local storage (wrapped because it can fail in private mode)
// =========================================
function loadFromStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (error) {
    return null;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage not available: the game still works, it just won't remember
  }
}

// =========================================
// Statistics
// =========================================
export function loadStats() {
  state.stats = { ...EMPTY_STATS, ...loadFromStorage(STORAGE_KEYS.STATS) };
}

export function recordGameResult(hasWon) {
  const { stats } = state;

  stats.played++;
  if (hasWon) {
    stats.wins++;
    stats.currentStreak++;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  saveToStorage(STORAGE_KEYS.STATS, stats);
}

// =========================================
// Theme
// =========================================
export function setDarkMode(isDark) {
  document.body.classList.toggle("dark", isDark);
  saveToStorage(STORAGE_KEYS.THEME, isDark ? "dark" : "light");
}

export function loadTheme() {
  setDarkMode(loadFromStorage(STORAGE_KEYS.THEME) === "dark");
}
