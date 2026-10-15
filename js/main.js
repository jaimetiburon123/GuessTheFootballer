"use strict";

// =========================================
// Constants
// =========================================
const RESULT = {
  CORRECT: "correct",
  PARTIAL: "partial",
  WRONG: "wrong",
};

const POSITION_LINES = {
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
const CLOSE_RANGE = 2;
const MAX_SUGGESTIONS = 8;

// Delay between each cell of a new row when it flips in (ms)
const CELL_FLIP_DELAY = 90;
const TOAST_DURATION = 2500;

// Typing this word anywhere outside the input toggles dark mode
const SECRET_WORD = "dark";

const STORAGE_KEYS = {
  STATS: "guess-the-footballer-stats",
  THEME: "guess-the-footballer-theme",
};

const EMPTY_STATS = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
};

// Every difficulty is described here, so the game logic has no special cases
const DIFFICULTIES = {
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

const POOLS = {
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

// =========================================
// DOM references
// =========================================
const setupSection = document.querySelector("#setup");
const startButton = document.querySelector("#start-button");
const gameArea = document.querySelector("#game-area");
const guessForm = document.querySelector("#guess-form");
const guessInput = document.querySelector("#guess-input");
const guessButton = document.querySelector("#guess-button");
const suggestionsList = document.querySelector("#suggestions");
const messageElement = document.querySelector("#message");
const boardElement = document.querySelector(".board");
const boardHeader = document.querySelector("#board-header");
const boardRows = document.querySelector("#board-rows");
const boardEmpty = document.querySelector("#board-empty");
const guessCountElement = document.querySelector("#guess-count");
const difficultyLabelElement = document.querySelector("#difficulty-label");
const poolLabelElement = document.querySelector("#pool-label");
const playerCountElement = document.querySelector("#player-count");
const legendPartial = document.querySelector("#legend-partial");
const legendArrows = document.querySelector("#legend-arrows");
const endPanel = document.querySelector("#end-panel");
const endTitle = document.querySelector("#end-title");
const endText = document.querySelector("#end-text");
const answerCard = document.querySelector("#answer-card");
const playAgainButton = document.querySelector("#play-again-button");
const changeSettingsButton = document.querySelector("#change-settings-button");
const statPlayedElement = document.querySelector("#stat-played");
const statWinRateElement = document.querySelector("#stat-win-rate");
const statStreakElement = document.querySelector("#stat-streak");
const statBestStreakElement = document.querySelector("#stat-best-streak");
const toastElement = document.querySelector("#toast");

// =========================================
// Game state
// =========================================
let difficulty = DIFFICULTIES.normal;
let pool = POOLS.mixed;
let poolPlayers = [];
let visibleColumns = [];
let targetPlayer = null;
let guessedPlayers = new Set();
let gameOver = false;
let currentSuggestions = [];
let activeSuggestionIndex = -1;
let stats = { ...EMPTY_STATS };
let typedKeys = "";
let toastTimeoutId = null;

// =========================================
// Comparison functions
// Each one returns { result, arrow }
// =========================================
function compareExact(guessValue, targetValue) {
  const result = guessValue === targetValue ? RESULT.CORRECT : RESULT.WRONG;
  return { result, arrow: "" };
}

function compareNationality(guessValue, targetValue) {
  if (guessValue === targetValue) {
    return { result: RESULT.CORRECT, arrow: "" };
  }
  const sameContinent = NATIONALITY_CONTINENTS[guessValue] === NATIONALITY_CONTINENTS[targetValue];
  return { result: sameContinent ? RESULT.PARTIAL : RESULT.WRONG, arrow: "" };
}

function comparePosition(guessValue, targetValue) {
  if (guessValue === targetValue) {
    return { result: RESULT.CORRECT, arrow: "" };
  }
  const sameLine = POSITION_LINES[guessValue] === POSITION_LINES[targetValue];
  return { result: sameLine ? RESULT.PARTIAL : RESULT.WRONG, arrow: "" };
}

function compareNumber(guessValue, targetValue) {
  if (guessValue === targetValue) {
    return { result: RESULT.CORRECT, arrow: "" };
  }
  const isClose = Math.abs(guessValue - targetValue) <= CLOSE_RANGE;
  const arrow = targetValue > guessValue ? "↑" : "↓";
  return { result: isClose ? RESULT.PARTIAL : RESULT.WRONG, arrow };
}

// Columns of the board, in order (the "Player" column is rendered separately)
const COLUMNS = [
  { key: "nationality", label: "Nation", compare: compareNationality },
  { key: "league", label: "League", compare: compareExact },
  { key: "club", label: "Club", compare: compareExact },
  { key: "position", label: "Position", compare: comparePosition },
  { key: "age", label: "Age", compare: compareNumber },
  { key: "number", label: "Number", compare: compareNumber },
  { key: "foot", label: "Foot", compare: compareExact },
  { key: "active", label: "Status", compare: compareExact, format: (isActive) => (isActive ? "Active" : "Retired") },
];

// Applies the difficulty rules on top of the raw comparison
function compareWithDifficulty(column, guessedPlayer) {
  let { result, arrow } = column.compare(guessedPlayer[column.key], targetPlayer[column.key]);

  if (result === RESULT.PARTIAL && !difficulty.showPartial) {
    result = RESULT.WRONG;
  }
  if (!difficulty.showArrows) {
    arrow = "";
  }

  return { result, arrow };
}

// =========================================
// Helpers
// =========================================

// Lower case and without accents, so "pele" finds "Pelé"
function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function findPlayerByName(name) {
  const searchName = normalizeText(name);
  return PLAYERS.find((player) => normalizeText(player.name) === searchName);
}

function getRandomPlayer(players) {
  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex];
}

function getDisplayValue(column, player) {
  const value = player[column.key];
  return column.format ? column.format(value) : `${value}`;
}

function getSelectedOption(groupName) {
  return document.querySelector(`input[name="${groupName}"]:checked`).value;
}

function showMessage(text, type = "info") {
  messageElement.textContent = text;
  messageElement.className = `message message-${type}`;
}

function updateGuessCount() {
  guessCountElement.textContent = `${guessedPlayers.size} / ${difficulty.maxGuesses}`;
}

function setInputEnabled(isEnabled) {
  guessInput.disabled = !isEnabled;
  guessButton.disabled = !isEnabled;
}

function showToast(text) {
  toastElement.textContent = text;
  toastElement.hidden = false;

  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toastElement.hidden = true;
  }, TOAST_DURATION);
}

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
function renderStats() {
  const winRate = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);

  statPlayedElement.textContent = stats.played;
  statWinRateElement.textContent = `${winRate}%`;
  statStreakElement.textContent = stats.currentStreak;
  statBestStreakElement.textContent = stats.bestStreak;
}

function recordGameResult(hasWon) {
  stats.played++;
  if (hasWon) {
    stats.wins++;
    stats.currentStreak++;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  saveToStorage(STORAGE_KEYS.STATS, stats);
  renderStats();
}

function loadStats() {
  stats = { ...EMPTY_STATS, ...loadFromStorage(STORAGE_KEYS.STATS) };
  renderStats();
}

// =========================================
// Dark mode (secret word)
// =========================================
function setDarkMode(isDark) {
  document.body.classList.toggle("dark", isDark);
  saveToStorage(STORAGE_KEYS.THEME, isDark ? "dark" : "light");
}

function loadTheme() {
  setDarkMode(loadFromStorage(STORAGE_KEYS.THEME) === "dark");
}

function handleSecretKey(event) {
  // Ignore typing inside text fields, otherwise player names could trigger it
  if (event.target.matches("input[type='text']") || event.key.length !== 1) {
    return;
  }

  typedKeys = (typedKeys + event.key.toLowerCase()).slice(-SECRET_WORD.length);

  if (typedKeys === SECRET_WORD) {
    const isDark = !document.body.classList.contains("dark");
    setDarkMode(isDark);
    showToast(isDark ? "🌙 Dark mode on" : "☀️ Dark mode off");
    typedKeys = "";
  }
}

// =========================================
// Board rendering
// =========================================
function createCell(text, extraClass) {
  const cell = document.createElement("span");
  cell.classList.add("cell", extraClass);
  cell.textContent = text;
  return cell;
}

function createAttributeCell(column, guessedPlayer) {
  const { result, arrow } = compareWithDifficulty(column, guessedPlayer);
  const cell = createCell(getDisplayValue(column, guessedPlayer), `cell-${result}`);

  if (arrow) {
    const arrowElement = document.createElement("span");
    arrowElement.classList.add("cell-arrow");
    arrowElement.textContent = arrow;
    cell.append(arrowElement);
  }

  return cell;
}

function renderBoardHeader() {
  const headerCells = ["Player", ...visibleColumns.map((column) => column.label)]
    .map((label) => createCell(label, "cell-head"));
  boardHeader.replaceChildren(...headerCells);

  // Adapt the grid to the number of visible columns
  boardElement.style.setProperty("--board-columns", `1.6fr repeat(${visibleColumns.length}, 1fr)`);
}

function renderGuessRow(guessedPlayer) {
  const row = document.createElement("div");
  row.classList.add("board-row");

  const cells = [
    createCell(guessedPlayer.name, "cell-player"),
    ...visibleColumns.map((column) => createAttributeCell(column, guessedPlayer)),
  ];

  // Each cell flips in a little after the previous one
  cells.forEach((cell, index) => {
    cell.classList.add("cell-reveal");
    cell.style.setProperty("--reveal-delay", `${index * CELL_FLIP_DELAY}ms`);
  });

  row.append(...cells);

  boardEmpty.hidden = true;
  // Newest guess goes on top
  boardRows.prepend(row);
}

function clearBoard() {
  boardRows.querySelectorAll(".board-row").forEach((row) => row.remove());
  boardEmpty.hidden = false;
}

// =========================================
// Autocomplete suggestions
// =========================================
function getMatchingPlayers(query) {
  const searchText = normalizeText(query);
  if (searchText === "") {
    return [];
  }

  return poolPlayers
    .filter((player) => !guessedPlayers.has(player))
    .filter((player) => normalizeText(player.name).includes(searchText))
    .slice(0, MAX_SUGGESTIONS);
}

function createSuggestionItem(player, index) {
  const item = document.createElement("li");
  item.classList.add("suggestion");
  item.setAttribute("role", "option");
  item.dataset.index = index;
  item.textContent = player.name;
  return item;
}

function renderSuggestions() {
  suggestionsList.replaceChildren(...currentSuggestions.map(createSuggestionItem));

  const hasSuggestions = currentSuggestions.length > 0;
  suggestionsList.hidden = !hasSuggestions;
  guessInput.setAttribute("aria-expanded", `${hasSuggestions}`);
}

function hideSuggestions() {
  currentSuggestions = [];
  activeSuggestionIndex = -1;
  renderSuggestions();
}

function highlightSuggestion(newIndex) {
  const items = suggestionsList.querySelectorAll(".suggestion");
  items.forEach((item) => item.classList.remove("active"));

  activeSuggestionIndex = newIndex;
  if (newIndex >= 0) {
    items[newIndex].classList.add("active");
    items[newIndex].scrollIntoView({ block: "nearest" });
  }
}

function selectSuggestion(index) {
  guessInput.value = currentSuggestions[index].name;
  hideSuggestions();
  guessForm.requestSubmit();
}

function handleInput() {
  currentSuggestions = getMatchingPlayers(guessInput.value);
  activeSuggestionIndex = -1;
  renderSuggestions();
}

function handleInputKeydown(event) {
  if (suggestionsList.hidden) {
    return;
  }

  const lastIndex = currentSuggestions.length - 1;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      highlightSuggestion(activeSuggestionIndex >= lastIndex ? 0 : activeSuggestionIndex + 1);
      break;
    case "ArrowUp":
      event.preventDefault();
      highlightSuggestion(activeSuggestionIndex <= 0 ? lastIndex : activeSuggestionIndex - 1);
      break;
    case "Enter":
      if (activeSuggestionIndex >= 0) {
        event.preventDefault();
        selectSuggestion(activeSuggestionIndex);
      }
      break;
    case "Escape":
      hideSuggestions();
      break;
  }
}

// "mousedown" instead of "click" so it runs before the input loses focus
function handleSuggestionMousedown(event) {
  const item = event.target.closest(".suggestion");
  if (!item) {
    return;
  }
  event.preventDefault();
  selectSuggestion(Number(item.dataset.index));
}

// =========================================
// End of game
// =========================================
function renderAnswerCard() {
  const rows = COLUMNS.map((column) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("answer-item");

    const term = document.createElement("dt");
    term.textContent = column.label;

    const detail = document.createElement("dd");
    detail.textContent = getDisplayValue(column, targetPlayer);

    wrapper.append(term, detail);
    return wrapper;
  });

  answerCard.replaceChildren(...rows);
}

function endGame(hasWon) {
  gameOver = true;
  recordGameResult(hasWon);
  setInputEnabled(false);
  hideSuggestions();
  showMessage("");

  const guessesUsed = guessedPlayers.size;
  const guessesText = guessesUsed === 1 ? "1 guess" : `${guessesUsed} guesses`;

  endPanel.classList.toggle("end-panel-win", hasWon);
  endPanel.classList.toggle("end-panel-lose", !hasWon);
  endTitle.textContent = hasWon ? "🎉 You got it!" : "❌ Out of guesses";
  endText.textContent = hasWon
    ? `The mystery player was ${targetPlayer.name}. You found them in ${guessesText} on ${difficulty.label}.`
    : `The mystery player was ${targetPlayer.name}.`;

  renderAnswerCard();
  endPanel.hidden = false;
  playAgainButton.focus();
}

// =========================================
// Game flow
// =========================================
function handleGuess(event) {
  event.preventDefault();
  if (gameOver) {
    return;
  }

  const inputValue = guessInput.value.trim();
  if (inputValue === "") {
    showMessage("Type a footballer's name first.", "error");
    return;
  }

  const guessedPlayer = findPlayerByName(inputValue);
  if (!guessedPlayer) {
    showMessage(`"${inputValue}" is not in the database.`, "error");
    return;
  }

  if (!pool.filter(guessedPlayer)) {
    showMessage(`${guessedPlayer.name} is not in the "${pool.label}" pool.`, "error");
    return;
  }

  if (guessedPlayers.has(guessedPlayer)) {
    showMessage(`You already guessed ${guessedPlayer.name}.`, "error");
    return;
  }

  guessedPlayers.add(guessedPlayer);
  updateGuessCount();
  renderGuessRow(guessedPlayer);
  guessInput.value = "";
  hideSuggestions();
  showMessage("");

  if (guessedPlayer === targetPlayer) {
    endGame(true);
  } else if (guessedPlayers.size >= difficulty.maxGuesses) {
    endGame(false);
  } else {
    const guessesLeft = difficulty.maxGuesses - guessedPlayers.size;
    showMessage(`${guessesLeft} ${guessesLeft === 1 ? "guess" : "guesses"} left.`);
  }
}

// Reads the setup screen and prepares everything that depends on it
function applySettings() {
  difficulty = DIFFICULTIES[getSelectedOption("difficulty")];
  pool = POOLS[getSelectedOption("pool")];
  poolPlayers = PLAYERS.filter(pool.filter);

  // The "Status" column gives no information when the pool has only one type of player
  const hiddenKeys = pool === POOLS.mixed
    ? difficulty.hiddenColumns
    : [...difficulty.hiddenColumns, "active"];
  visibleColumns = COLUMNS.filter((column) => !hiddenKeys.includes(column.key));

  difficultyLabelElement.textContent = difficulty.label;
  poolLabelElement.textContent = pool.label;
  playerCountElement.textContent = poolPlayers.length;
  legendPartial.hidden = !difficulty.showPartial;
  legendArrows.hidden = !difficulty.showArrows;

  renderBoardHeader();
}

function startGame() {
  targetPlayer = getRandomPlayer(poolPlayers);
  guessedPlayers = new Set();
  gameOver = false;

  clearBoard();
  hideSuggestions();
  showMessage("");
  updateGuessCount();
  endPanel.hidden = true;
  setInputEnabled(true);
  guessInput.value = "";
  guessInput.focus();
}

function showSetupScreen() {
  gameArea.hidden = true;
  setupSection.hidden = false;
  startButton.focus();
}

function handleStartClick() {
  applySettings();
  setupSection.hidden = true;
  gameArea.hidden = false;
  startGame();
}

// =========================================
// Events
// =========================================
startButton.addEventListener("click", handleStartClick);
// "submit" fires both when the button is clicked and when Enter is pressed
guessForm.addEventListener("submit", handleGuess);
guessInput.addEventListener("input", handleInput);
guessInput.addEventListener("keydown", handleInputKeydown);
guessInput.addEventListener("blur", hideSuggestions);
suggestionsList.addEventListener("mousedown", handleSuggestionMousedown);
playAgainButton.addEventListener("click", startGame);
changeSettingsButton.addEventListener("click", showSetupScreen);
document.addEventListener("keydown", handleSecretKey);

loadTheme();
loadStats();
