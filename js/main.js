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

// =========================================
// DOM references
// =========================================
const guessForm = document.querySelector("#guess-form");
const guessInput = document.querySelector("#guess-input");
const guessButton = document.querySelector("#guess-button");
const messageElement = document.querySelector("#message");
const boardRows = document.querySelector("#board-rows");
const boardEmpty = document.querySelector("#board-empty");
const guessCountElement = document.querySelector("#guess-count");
const playerCountElement = document.querySelector("#player-count");

// =========================================
// Game state
// =========================================
let targetPlayer = null;
let guessCount = 0;
let gameOver = false;

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
  { key: "nationality", compare: compareNationality },
  { key: "league", compare: compareExact },
  { key: "club", compare: compareExact },
  { key: "position", compare: comparePosition },
  { key: "age", compare: compareNumber },
  { key: "number", compare: compareNumber },
  { key: "foot", compare: compareExact },
  { key: "active", compare: compareExact, format: (isActive) => (isActive ? "Active" : "Retired") },
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

function showMessage(text, type) {
  messageElement.textContent = text;
  messageElement.className = `message message-${type}`;
}

function updateGuessCount() {
  guessCountElement.textContent = guessCount;
}

// =========================================
// Rendering
// =========================================
function createCell(text, extraClass) {
  const cell = document.createElement("span");
  cell.classList.add("cell", extraClass);
  cell.textContent = text;
  return cell;
}

function createAttributeCell(column, guessedPlayer) {
  const guessValue = guessedPlayer[column.key];
  const { result, arrow } = column.compare(guessValue, targetPlayer[column.key]);
  const displayValue = column.format ? column.format(guessValue) : guessValue;

  const cell = createCell(`${displayValue}`, `cell-${result}`);

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

// =========================================
// Game flow
// =========================================
function endGameWithWin() {
  gameOver = true;
  guessInput.disabled = true;
  guessButton.disabled = true;

  const attemptsText = guessCount === 1 ? "1 guess" : `${guessCount} guesses`;
  showMessage(`🎉 Correct! It was ${targetPlayer.name}. You got it in ${attemptsText}.`, "success");
}

function handleGuess(event) {
  event.preventDefault();
  if (gameOver) {
    return;
  }

  const inputValue = guessInput.value;
  if (inputValue.trim() === "") {
    showMessage("Type a footballer's name first.", "error");
    return;
  }

  const guessedPlayer = findPlayerByName(inputValue);
  if (!guessedPlayer) {
    showMessage(`"${inputValue.trim()}" is not in the database.`, "error");
    return;
  }

  guessCount++;
  updateGuessCount();
  renderGuessRow(guessedPlayer);
  guessInput.value = "";
  showMessage("", "info");

  if (guessedPlayer === targetPlayer) {
    endGameWithWin();
  }
}

function startGame() {
  targetPlayer = getRandomPlayer();
  guessCount = 0;
  gameOver = false;
  updateGuessCount();
  playerCountElement.textContent = PLAYERS.length;
  guessInput.focus();
}

// =========================================
// Events
// =========================================
// "submit" fires both when the button is clicked and when Enter is pressed
guessForm.addEventListener("submit", handleGuess);

startGame();
