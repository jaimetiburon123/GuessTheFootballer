import { PLAYERS } from "./players.js";
import { MAX_SUGGESTIONS } from "./config.js";
import { state } from "./state.js";

// =========================================
// Player search
// =========================================

// Lower case and without accents, so "pele" finds "Pelé"
function normalizeText(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function findPlayerByName(name) {
  const searchName = normalizeText(name);
  return PLAYERS.find((player) => normalizeText(player.name) === searchName);
}

// Players of the current pool whose name contains the query and haven't been guessed
export function getMatchingPlayers(query) {
  const searchText = normalizeText(query);
  if (searchText === "") {
    return [];
  }

  return state.poolPlayers
    .filter((player) => !state.guessedPlayers.has(player))
    .filter((player) => normalizeText(player.name).includes(searchText))
    .slice(0, MAX_SUGGESTIONS);
}

export function getRandomPlayer(players) {
  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex];
}
