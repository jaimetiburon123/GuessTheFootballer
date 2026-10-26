import { CELL_FLIP_DELAY, TOAST_DURATION } from "./config.js";
import { COLUMNS, compareWithDifficulty, getDisplayValue } from "./compare.js";
import { dom } from "./dom.js";
import { state } from "./state.js";

let toastTimeoutId = null;

// =========================================
// Small UI updates
// =========================================
export function showMessage(text, type = "info") {
  dom.message.textContent = text;
  dom.message.className = `message message-${type}`;
}

export function showToast(text) {
  dom.toast.textContent = text;
  dom.toast.hidden = false;

  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    dom.toast.hidden = true;
  }, TOAST_DURATION);
}

export function updateGuessCount() {
  dom.guessCount.textContent = `${state.guessedPlayers.size} / ${state.difficulty.maxGuesses}`;
}

export function setInputEnabled(isEnabled) {
  dom.guessInput.disabled = !isEnabled;
  dom.guessButton.disabled = !isEnabled;
}

export function renderSettings() {
  dom.difficultyLabel.textContent = state.difficulty.label;
  dom.poolLabel.textContent = state.pool.label;
  dom.playerCount.textContent = state.poolPlayers.length;
  dom.legendPartial.hidden = !state.difficulty.showPartial;
  dom.legendArrows.hidden = !state.difficulty.showArrows;
}

export function renderStats() {
  const { played, wins, currentStreak, bestStreak } = state.stats;
  const winRate = played === 0 ? 0 : Math.round((wins / played) * 100);

  dom.statPlayed.textContent = played;
  dom.statWinRate.textContent = `${winRate}%`;
  dom.statStreak.textContent = currentStreak;
  dom.statBestStreak.textContent = bestStreak;
}

// =========================================
// Board
// =========================================
function createCell(text, extraClass) {
  const cell = document.createElement("span");
  cell.classList.add("cell", extraClass);
  cell.textContent = text;
  return cell;
}

function createAttributeCell(column, guessedPlayer) {
  const { result, arrow } = compareWithDifficulty(column, guessedPlayer, state.targetPlayer, state.difficulty);
  const cell = createCell(getDisplayValue(column, guessedPlayer), `cell-${result}`);

  if (arrow) {
    const arrowElement = document.createElement("span");
    arrowElement.classList.add("cell-arrow");
    arrowElement.textContent = arrow;
    cell.append(arrowElement);
  }

  return cell;
}

export function renderBoardHeader() {
  const headerCells = ["Player", ...state.visibleColumns.map((column) => column.label)]
    .map((label) => createCell(label, "cell-head"));
  dom.boardHeader.replaceChildren(...headerCells);

  // Adapt the grid to the number of visible columns
  dom.board.style.setProperty("--board-columns", `1.6fr repeat(${state.visibleColumns.length}, 1fr)`);
}

export function renderGuessRow(guessedPlayer) {
  const row = document.createElement("div");
  row.classList.add("board-row");

  const cells = [
    createCell(guessedPlayer.name, "cell-player"),
    ...state.visibleColumns.map((column) => createAttributeCell(column, guessedPlayer)),
  ];

  // Each cell flips in a little after the previous one
  cells.forEach((cell, index) => {
    cell.classList.add("cell-reveal");
    cell.style.setProperty("--reveal-delay", `${index * CELL_FLIP_DELAY}ms`);
  });

  row.append(...cells);

  dom.boardEmpty.hidden = true;
  // Newest guess goes on top
  dom.boardRows.prepend(row);
}

export function clearBoard() {
  dom.boardRows.replaceChildren(dom.boardEmpty);
  dom.boardEmpty.hidden = false;
}

// =========================================
// Autocomplete suggestions
// =========================================
function createSuggestionItem(player, index) {
  const item = document.createElement("li");
  item.classList.add("suggestion");
  item.setAttribute("role", "option");
  item.dataset.index = index;
  item.textContent = player.name;
  return item;
}

export function renderSuggestions() {
  dom.suggestionsList.replaceChildren(...state.currentSuggestions.map(createSuggestionItem));

  const hasSuggestions = state.currentSuggestions.length > 0;
  dom.suggestionsList.hidden = !hasSuggestions;
  dom.guessInput.setAttribute("aria-expanded", `${hasSuggestions}`);
}

export function renderActiveSuggestion() {
  const items = dom.suggestionsList.querySelectorAll(".suggestion");
  items.forEach((item, index) => {
    item.classList.toggle("active", index === state.activeSuggestionIndex);
  });

  const activeItem = items[state.activeSuggestionIndex];
  if (activeItem) {
    activeItem.scrollIntoView({ block: "nearest" });
  }
}

// =========================================
// End panel
// =========================================
function renderAnswerCard() {
  const items = COLUMNS.map((column) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("answer-item");

    const term = document.createElement("dt");
    term.textContent = column.label;

    const detail = document.createElement("dd");
    detail.textContent = getDisplayValue(column, state.targetPlayer);

    wrapper.append(term, detail);
    return wrapper;
  });

  dom.answerCard.replaceChildren(...items);
}

export function renderEndPanel(hasWon) {
  const { targetPlayer, difficulty } = state;
  const guessesUsed = state.guessedPlayers.size;
  const guessesText = guessesUsed === 1 ? "1 guess" : `${guessesUsed} guesses`;

  dom.endPanel.classList.toggle("end-panel-win", hasWon);
  dom.endPanel.classList.toggle("end-panel-lose", !hasWon);
  dom.endTitle.textContent = hasWon ? "🎉 You got it!" : "❌ Out of guesses";
  dom.endText.textContent = hasWon
    ? `The mystery player was ${targetPlayer.name}. You found them in ${guessesText} on ${difficulty.label}.`
    : `The mystery player was ${targetPlayer.name}.`;

  renderAnswerCard();
  dom.endPanel.hidden = false;
}
