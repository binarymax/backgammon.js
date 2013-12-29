#!/bin/bash

#requires jsmin
jsmin <src/main.js >build/main.min.js
jsmin <src/game.js >build/game.min.js
jsmin <src/brain.js >build/brain.min.js
jsmin <src/board.js >build/board.min.js
rm backgammon.min.js
cat build/main.min.js build/game.min.js build/brain.min.js build/board.min.js >>backgammon.min.js