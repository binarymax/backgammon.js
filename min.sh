#!/bin/bash
jsmin <main.js >main.min.js
jsmin <game.js >game.min.js
jsmin <brain.js >brain.min.js
jsmin <board.js >board.min.js
rm backgammon.min.js
cat main.min.js game.min.js brain.min.js board.min.js >>backgammon.min.js