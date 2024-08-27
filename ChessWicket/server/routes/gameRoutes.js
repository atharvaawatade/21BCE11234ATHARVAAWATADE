const express = require('express');
const router = express.Router();
const { initializeGame, joinGame, makeMove } = require('../controllers/gameController');


router.post('/new', initializeGame);
router.post('/join', joinGame);
router.post('/move', makeMove); 

module.exports = router;