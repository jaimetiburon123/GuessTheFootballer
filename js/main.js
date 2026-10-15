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
const MAX_GUESSES = 8;
const MAX_SUGGESTIONS = 8;

// =========================================
// DOM references
// =========================================
const guessForm = document.querySelector("#guess-form");
const guessInput = document.querySelector("#guess-input");
const guessButton = document.querySelector("#guess-button");
const suggestionsList = document.querySelector("#suggestions");
const messageElement = document.querySelector("#message");
const boardRows = document.querySelector("#board-rows");
const boardEmpty = document.querySelector("#board-empty");
const guessCountElement = document.querySelector("#guess-count");
const playerCountElement = document.querySelector("#player-count");
const endPanel = document.querySelector("#end-panel");
const endTitle = document.querySelector("#end-title");
const endText = document.querySelector("#end-text");
const answerCard = document.querySelector("#answer-card");
const playAgainButton = document.querySelector("#play-again-button");

// =========================================
// Game state
// =========================================
let targetPlayer = null;
let guessedPlayers = new Set();
let gameOver = false;
let currentSuggestions = [];
let activeSuggestionIndex = -1;

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

function getRandomPlayer() {
  const randomIndex = Math.floor(Math.random() * PLAYERS.length);
  return PLAYERS[randomIndex];
}

function getDisplayValue(column, player) {
  const value = player[column.key];
  return column.format ? column.format(value) : `${value}`;
}

function showMessage(text, type = "info") {
  messageElement.textContent = text;
  messageElement.className = `message message-${type}`;
}

function updateGuessCount() {
  guessCountElement.textContent = `${guessedPlayers.size} / ${MAX_GUESSES}`;
}

function setInputEnabled(isEnabled) {
  guessInput.disabled = !isEnabled;
  guessButton.disabled = !isEnabled;
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
  const { result, arrow } = column.compare(guessedPlayer[column.key], targetPlayer[column.key]);
  const cell = createCell(getDisplayValue(column, guessedPlayer), `cell-${result}`);

  if (arrow) {
    const arrowElement = document.createElement("span");
    arrowElement.classList.add("cell-arrow");
    arrowElement.textContent = arrow;
    cell.append(arrowElement);
  }

  return cell;
}

function renderGuessRow(guessedPlayer) {
  const row = document.createElement("div");
  row.classList.add("board-row");

  row.append(createCell(guessedPlayer.name, "cell-player"));
  COLUMNS.forEach((column) => {
    row.append(createAttributeCell(column, guessedPlayer));
  });

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

  return PLAYERS
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
  setInputEnabled(false);
  hideSuggestions();
  showMessage("");

  const guessesUsed = guessedPlayers.size;
  const guessesText = guessesUsed === 1 ? "1 guess" : `${guessesUsed} guesses`;

  endPanel.classList.toggle("end-panel-win", hasWon);
  endPanel.classList.toggle("end-panel-lose", !hasWon);
  endTitle.textContent = hasWon ? "🎉 You got it!" : "❌ Out of guesses";
  endText.textContent = hasWon
    ? `The mystery player was ${targetPlayer.name}. You found them in ${guessesText}.`
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
  } else if (guessedPlayers.size >= MAX_GUESSES) {
    endGame(false);
  } else {
    const guessesLeft = MAX_GUESSES - guessedPlayers.size;
    showMessage(`${guessesLeft} ${guessesLeft === 1 ? "guess" : "guesses"} left.`);
  }
}

function startGame() {
  targetPlayer = getRandomPlayer();
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

// =========================================
// Events
// =========================================
// "submit" fires both when the button is clicked and when Enter is pressed
guessForm.addEventListener("submit", handleGuess);
guessInput.addEventListener("input", handleInput);
guessInput.addEventListener("keydown", handleInputKeydown);
guessInput.addEventListener("blur", hideSuggestions);
suggestionsList.addEventListener("mousedown", handleSuggestionMousedown);
playAgainButton.addEventListener("click", startGame);

playerCountElement.textContent = PLAYERS.length;
startGame();
