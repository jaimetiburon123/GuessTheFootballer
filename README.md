# Guess the Footballer

Misión M1 · El Despertar del DOM — Web Development I.

## How to play

1. Choose a difficulty and a player pool, then press "Start game".
2. Type a footballer's name. Suggestions appear as you type (use ↑ ↓ and Enter, or click).
3. Each guess adds a row to the board comparing your player with the mystery player.
4. Use the clues to find the mystery player before you run out of guesses.

## Use of AI
I used claude code as a partner to code the game.
Real Prompt Examples:
- "Before doing any code (do not code anything for now) how would you
  recommend splitting up this task of creating this game in 5 different
  phases"
- "Make it be a mixture of 150 football legends and current top 150
  players. Also a column of the attributes to compare should be added to
  say if the player is active or non active."

After completing all the changes I wanted to do for each step, I played the amount of games needed to check that all new features worked correctly and that all limit cases didnt give errors (repeating a player, wasting all guesses, etc) before commiting to github.

Something that I had to write manually were the corrections to the player database since claude warned me information about recent transfers could be outdated.

## Autopsy
1. I decided to make the player database as a javascript file (players.js) instead of a Json. The alternative that I discarded was making a players.json file loaded with fetch() because fetch() doesn't work when you open index.html by double-clicking it (you would always need a local server). With a .js file, the game works just by opening it.

2. Each difficulty (Easy, Normal, Hard) is defined in one object called DIFFICULTIES, with its corresponding number of guesses and which hints it shows. The alternative that I discarded was was writing "if" statements for each difficulty in every function that behaved differently because it would make editing after adding or changing a level much harder. This way I only change one object.

