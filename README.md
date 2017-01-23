# backgammon.js v0.1 (alpha)
Backgammon via JavaScript

Backgammon.js consists of four modules:
 - Global defaults
 - Game Logic
 - UI (requires jQuery)
 - AI (is not very intelligent)

## Global Defaults (main.js)
Includes the namespace, game defaults, and some helper functions

## Game Logic (game.js)
The game logic consist of the board state, dice roller, and move generator.

Modules can plug into the engine to listen for a roll, and act accordingly.

## AI (brain.js)
The AI operates on a very simple (yet somewhat effective) move ranking.  It does not look more than one move ahead, rather it scores each candidate move based on position, and hit, and vulnerability.

## UI (board.js, backgammon.css)
The Board is drawn as an HTML table with CSS.  One image is used for the felt background texture.

jQuery is required for scaling, animations, and checker drag-drop.

## Example AI Tournament
An example AI tournament is provided in example.html.  It initializes 12 boards with 24 respective AI's, and begins playing immediately

## Positions

When Initializing a game you can specify a starting position in a modified FEN format:

#### Ported FEN (Forsyth-Edwards Notation)
Outputs a board into a position
Ported from https://en.wikipedia.org/wiki/Forsyth-Edwards_Notation
The position conists of 5 tokens, separated by a single space.  The tokens are outlined as follows:
 * 1. Piece placement (from white's perspective). Each point is described, starting with 24 and ending with point 1; within each point, the number and color of checkers is described. (white = "W", black = "B". Empty points are denoted by "/".
 * 2. Active color. "W" means white moves next, "B" means black.
 * 3. Two digits in hexadecimal format (0 for none, F for 15). The first digit is the number of white checkers on the bar,  the second digit is the number of black checkers on the bar.
 * 4. Full move number: The number of the full move. It starts at 1, and is incremented after blacks move.
 * 5. Two digits numbered 0 through 6.  The first and second are the values rolled for two dice (1 to 6).  If a digit is zero, it denotes the die is yet to be rolled.
