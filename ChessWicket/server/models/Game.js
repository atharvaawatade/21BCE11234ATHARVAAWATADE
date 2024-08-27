const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  board: {
    type: Array,
    default: [],
  },
  players: {
    type: Array,
    default: [],
  },
  currentPlayer: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'waiting', // 'ongoing' when the game starts
  },
  teamCode: {
    type: String,
    unique: true,
  },
});

module.exports = mongoose.model('Game', GameSchema);
