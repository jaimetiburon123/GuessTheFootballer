import { NATIONALITY_CONTINENTS } from "./players.js";
import { RESULT, POSITION_LINES, CLOSE_RANGE } from "./config.js";

// =========================================
// Comparison functions
// Each one returns { result, arrow }
// =========================================

// Shared rule: equal values are always CORRECT.
// compareDifferent only runs when the values are not equal.
function withExactMatch(compareDifferent) {
  return (guessValue, targetValue) =>
    guessValue === targetValue
      ? { result: RESULT.CORRECT, arrow: "" }
      : compareDifferent(guessValue, targetValue);
}

// Same group (continent, line...) means PARTIAL, otherwise WRONG
function sameGroupResult(groups, guessValue, targetValue) {
  const sameGroup = groups[guessValue] === groups[targetValue];
  return { result: sameGroup ? RESULT.PARTIAL : RESULT.WRONG, arrow: "" };
}

const compareExact = withExactMatch(() => ({ result: RESULT.WRONG, arrow: "" }));

const compareNationality = withExactMatch((guessValue, targetValue) =>
  sameGroupResult(NATIONALITY_CONTINENTS, guessValue, targetValue));

const comparePosition = withExactMatch((guessValue, targetValue) =>
  sameGroupResult(POSITION_LINES, guessValue, targetValue));

const compareNumber = withExactMatch((guessValue, targetValue) => {
  const isClose = Math.abs(guessValue - targetValue) <= CLOSE_RANGE;
  const arrow = targetValue > guessValue ? "↑" : "↓";
  return { result: isClose ? RESULT.PARTIAL : RESULT.WRONG, arrow };
});

// Columns of the board, in order (the "Player" column is rendered separately)
export const COLUMNS = [
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
export function compareWithDifficulty(column, guessedPlayer, targetPlayer, difficulty) {
  let { result, arrow } = column.compare(guessedPlayer[column.key], targetPlayer[column.key]);

  if (result === RESULT.PARTIAL && !difficulty.showPartial) {
    result = RESULT.WRONG;
  }
  if (!difficulty.showArrows) {
    arrow = "";
  }

  return { result, arrow };
}

export function getDisplayValue(column, player) {
  const value = player[column.key];
  return column.format ? column.format(value) : `${value}`;
}
