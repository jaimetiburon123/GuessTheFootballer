"use strict";

// DOM references
const playerCountElement = document.querySelector("#player-count");

// Show how many players are available in the database
playerCountElement.textContent = PLAYERS.length;
