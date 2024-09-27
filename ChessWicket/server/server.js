const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const GameRoutes = require('./routes/gameRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.use('/api', GameRoutes);

mongoose
  .connect(' ', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

const gameState = {}; 

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('joinGame', ({ gameId, player }) => {
    socket.join(gameId);

    if (!gameState[gameId]) {
      gameState[gameId] = {
        board: [
          ['AP1', 'AH1', 'AH2', 'AH3', 'AP2'],
          ['', '', '', '', ''],
          ['', '', '', '', ''],
          ['', '', '', '', ''],
          ['BP1', 'BH1', 'BH2', 'BH3', 'BP2'],
        ],
        currentPlayer: 'PlayerA',
        players: { PlayerA: null, PlayerB: null },
        gameStarted: false,
      };
    }

    if (player === 'PlayerA') {
      gameState[gameId].players.PlayerA = socket.id;
    } else if (player === 'PlayerB') {
      gameState[gameId].players.PlayerB = socket.id;
      if (gameState[gameId].players.PlayerA) {
        io.to(gameId).emit('gameUpdate', {
          ...gameState[gameId],
          message: 'Player B has joined. You can start the game.',
        });
        gameState[gameId].gameStarted = true;
      }
    }

    io.to(gameId).emit('gameUpdate', gameState[gameId]);
  });

  socket.on('movePiece', ({ gameId, board, nextPlayer, piece }) => {
    if (!gameState[gameId] || !gameState[gameId].gameStarted) return;

    const currentPlayer = gameState[gameId].currentPlayer;

    if (socket.id !== gameState[gameId].players[currentPlayer]) {
      socket.emit('error', { message: 'It\'s not your turn!' });
      return;
    }


    if (piece.startsWith(currentPlayer.charAt(0))) {
      gameState[gameId].board = board;
      gameState[gameId].currentPlayer = nextPlayer;
      io.to(gameId).emit('gameUpdate', gameState[gameId]);
    } else {
      socket.emit('error', { message: 'You can only move your own pieces!' });
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');

  });
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
});



let players = [];
let gameBoard = [
  ['A-H1', '', '', '', 'B-H1'],
  ['', 'A-P1', '', 'B-P1', ''],
  ['', '', '', '', ''],
  ['', 'B-P2', '', 'A-P2', ''],
  ['B-H2', '', '', '', 'A-H2']
];

function handleMove(from, to, ws) {
  const playerIndex = players.indexOf(ws);
  const piece = gameBoard[from[0]][from[1]];

  if (piece && piece.startsWith(playerIndex === 0 ? 'A' : 'B')) {
    if (piece.endsWith('H3')) {
      const validMove = validateHero3Move(from, to);
      if (validMove) {
        executeMove(from, to, piece, ws);
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid Hero3 move' }));
      }
    } else {
      const validMove = validateMove(from, to, piece);
      if (validMove) {
        executeMove(from, to, piece, ws);
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid move' }));
      }
    }
  } else {
    ws.send(JSON.stringify({ type: 'error', message: 'Not your turn or invalid piece selection' }));
  }
}

function validateHero3Move(from, to) {
  const rowDiff = Math.abs(to[0] - from[0]);
  const colDiff = Math.abs(to[1] - from[1]);

  if (
    (rowDiff === 2 && colDiff === 1) ||  
    (rowDiff === 1 && colDiff === 2)     
  ) {
    if (to[0] >= 0 && to[0] < 5 && to[1] >= 0 && to[1] < 5) {
      return true;
    }
  }
  return false;
}

function executeMove(from, to, piece, ws) {
  const playerIndex = players.indexOf(ws);

  const newBoard = gameBoard.map(row => row.slice());
  newBoard[from[0]][from[1]] = '';

  const pieceAtDestination = gameBoard[to[0]][to[1]];
  if (pieceAtDestination && pieceAtDestination.startsWith(playerIndex === 0 ? 'B' : 'A')) {
    newBoard[to[0]][to[1]] = '';
  }

  newBoard[to[0]][to[1]] = piece;
  gameBoard = newBoard;

  broadcastGameState();

  players.forEach(player => {
    player.send(JSON.stringify({ type: 'move', from, to }));
  });
}

function broadcastGameState() {
  players.forEach(player => {
    player.send(JSON.stringify({ type: 'gameState', gameBoard }));
  });
}

function resetGameBoard() {
  gameBoard = [
    ['A-H1', '', '', '', 'B-H1'],
    ['', 'A-P1', '', 'B-P1', ''],
    ['', '', '', '', ''],
    ['', 'B-P2', '', 'A-P2', ''],
    ['B-H2', '', '', '', 'A-H2']
  ];
  broadcastGameState();
}

io.on('connection', (socket) => {
  console.log('Client connected');
  players.push(socket);

  socket.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'move') {
      handleMove(data.from, data.to, socket);
    }
  });

  socket.on('disconnect', () => {
    players = players.filter(player => player !== socket);
    if (players.length === 0) {
      resetGameBoard();
    }
  });
});
