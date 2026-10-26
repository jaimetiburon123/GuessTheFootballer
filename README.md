# Guess the Footballer

Misión M1 · El Despertar del DOM — Web Development I.

## How to run

The game uses JavaScript modules, so it needs a local server: open the folder in VS Code and use Live Server, or play online at https://jaimetiburon123.github.io/GuessTheFootballer/.

## How to play

1. Choose a difficulty and a player pool, then press "Start game".
2. Type a footballer's name. Suggestions appear as you type (use ↑ ↓ and Enter, or click).
3. Each guess adds a row to the board comparing your player with the mystery player.
4. Use the clues to find the mystery player before you run out of guesses.

Secret key: type the word "dark" anywhere outside the text box to toggle dark mode.

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
 1. Suggestions in the autocomplete list are handled with one single listener on the list (event delegation) instead of adding a listener to every suggestion. The alternative I discarded was one listener per suggestion: the list is rebuilt on every key press, so the listeners would have to be added and removed again each time, which is slower and easy to get wrong.

2. Each difficulty (Easy, Normal, Hard) is defined in one object called DIFFICULTIES, with its corresponding number of guesses and which hints it shows. The alternative that I discarded was was writing "if" statements for each difficulty in every function that behaved differently because it would make editing after adding or changing a level much harder. This way I only change one object.

