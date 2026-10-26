import { PLAYERS } from "./players.js";
import { DIFFICULTIES, POOLS, SECRET_WORD } from "./config.js";
import { COLUMNS } from "./compare.js";
import { dom } from "./dom.js";
import { state } from "./state.js";
import { loadStats, recordGameResult, loadTheme, setDarkMode } from "./storage.js";
import { findPlayerByName, getMatchingPlayers, getRandomPlayer } from "./search.js";
import {
  showMessage,
  showToast,
  updateGuessCount,
  setInputEnabled,
  renderSettings,
  renderStats,
  renderBoardHeader,
  renderGuessRow,
  clearBoard,
  renderSuggestions,
  renderActiveSuggestion,
  renderEndPanel,
} from "./render.js";

// =========================================
// Autocomplete
// =========================================
function hideSuggestions() {
  state.currentSuggestions = [];
  state.activeSuggestionIndex = -1;
  renderSuggestions();
}

function highlightSuggestion(newIndex) {
  state.activeSuggestionIndex = newIndex;
  renderActiveSuggestion();
}

function selectSuggestion(index) {
  dom.guessInput.value = state.currentSuggestions[index].name;
  hideSuggestions();
  dom.guessForm.requestSubmit();
}

function handleInput() {
  state.currentSuggestions = getMatchingPlayers(dom.guessInput.value);
  state.activeSuggestionIndex = -1;
  renderSuggestions();
}

function handleInputKeydown(event) {
  if (dom.suggestionsList.hidden) {
    return;
  }

  const currentIndex = state.activeSuggestionIndex;
  const lastIndex = state.currentSuggestions.length - 1;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      highlightSuggestion(currentIndex >= lastIndex ? 0 : currentIndex + 1);
      break;
    case "ArrowUp":
      event.preventDefault();
      highlightSuggestion(currentIndex <= 0 ? lastIndex : currentIndex - 1);
      break;
    case "Enter":
      if (currentIndex >= 0) {
        event.preventDefault();
        selectSuggestion(currentIndex);
      }
      break;
    case "Escape":
      hideSuggestions();
      break;
  }
}

// One listener on the list handles every suggestion (event delegation).
// "mousedown" instead of "click" so it runs before the input loses focus.
function handleSuggestionMousedown(event) {
  const item = event.target.closest(".suggestion");
  if (!item) {
    return;
  }
  event.preventDefault();
  selectSuggestion(Number(item.dataset.index));
}

// =========================================
// Dark mode (secret word)
// =========================================
function handleSecretKey(event) {
  // Ignore typing inside text fields, otherwise player names could trigger it
  if (event.target.matches("input[type='text']") || event.key.length !== 1) {
    return;
  }

  state.typedKeys = (state.typedKeys + event.key.toLowerCase()).slice(-SECRET_WORD.length);

  if (state.typedKeys === SECRET_WORD) {
    const isDark = !document.body.classList.contains("dark");
    setDarkMode(isDark);
    showToast(isDark ? "🌙 Dark mode on" : "☀️ Dark mode off");
    state.typedKeys = "";
  }
}

// =========================================
// Game flow
// =========================================
function endGame(hasWon) {
  state.gameOver = true;
  recordGameResult(hasWon);
  renderStats();
  setInputEnabled(false);
  hideSuggestions();
  showMessage("");
  renderEndPanel(hasWon);
  dom.playAgainButton.focus();
}

// Returns an error message, or null if the guess is valid
function validateGuess(inputValue, guessedPlayer) {
  if (inputValue === "") {
    return "Type a footballer's name first.";
  }
  if (!guessedPlayer) {
    return `"${inputValue}" is not in the database.`;
  }
  if (!state.pool.filter(guessedPlayer)) {
    return `${guessedPlayer.name} is not in the "${state.pool.label}" pool.`;
  }
  if (state.guessedPlayers.has(guessedPlayer)) {
    return `You already guessed ${guessedPlayer.name}.`;
  }
  return null;
}

function handleGuess(event) {
  event.preventDefault();
  if (state.gameOver) {
    return;
  }

  const inputValue = dom.guessInput.value.trim();
  const guessedPlayer = findPlayerByName(inputValue);
  const error = validateGuess(inputValue, guessedPlayer);
  if (error) {
    showMessage(error, "error");
    return;
  }

  state.guessedPlayers.add(guessedPlayer);
  updateGuessCount();
  renderGuessRow(guessedPlayer);
  dom.guessInput.value = "";
  hideSuggestions();
  showMessage("");

  const { maxGuesses } = state.difficulty;
  if (guessedPlayer === state.targetPlayer) {
    endGame(true);
  } else if (state.guessedPlayers.size >= maxGuesses) {
    endGame(false);
  } else {
    const guessesLeft = maxGuesses - state.guessedPlayers.size;
    showMessage(`${guessesLeft} ${guessesLeft === 1 ? "guess" : "guesses"} left.`);
  }
}

function getSelectedOption(groupName) {
  return document.querySelector(`input[name="${groupName}"]:checked`).value;
}

// Reads the setup screen and prepares everything that depends on it
function applySettings() {
  state.difficulty = DIFFICULTIES[getSelectedOption("difficulty")];
  state.pool = POOLS[getSelectedOption("pool")];
  state.poolPlayers = PLAYERS.filter(state.pool.filter);

  // The "Status" column gives no information when the pool has only one type of player
  const hiddenKeys = state.pool === POOLS.mixed
    ? state.difficulty.hiddenColumns
    : [...state.difficulty.hiddenColumns, "active"];
  state.visibleColumns = COLUMNS.filter((column) => !hiddenKeys.includes(column.key));

  renderSettings();
  renderBoardHeader();
}

function startGame() {
  state.targetPlayer = getRandomPlayer(state.poolPlayers);
  state.guessedPlayers = new Set();
  state.gameOver = false;

  clearBoard();
  hideSuggestions();
  showMessage("");
  updateGuessCount();
  dom.endPanel.hidden = true;
  setInputEnabled(true);
  dom.guessInput.value = "";
  dom.guessInput.focus();
}

function showSetupScreen() {
  dom.gameArea.hidden = true;
  dom.setupSection.hidden = false;
  dom.startButton.focus();
}

function handleStartClick() {
  applySettings();
  dom.setupSection.hidden = true;
  dom.gameArea.hidden = false;
  startGame();
}

// =========================================
// Events
// =========================================
dom.startButton.addEventListener("click", handleStartClick);
// "submit" fires both when the button is clicked and when Enter is pressed
dom.guessForm.addEventListener("submit", handleGuess);
dom.guessInput.addEventListener("input", handleInput);
dom.guessInput.addEventListener("keydown", handleInputKeydown);
dom.guessInput.addEventListener("blur", hideSuggestions);
dom.suggestionsList.addEventListener("mousedown", handleSuggestionMousedown);
dom.playAgainButton.addEventListener("click", startGame);
dom.changeSettingsButton.addEventListener("click", showSetupScreen);
document.addEventListener("keydown", handleSecretKey);

loadTheme();
loadStats();
renderStats();
