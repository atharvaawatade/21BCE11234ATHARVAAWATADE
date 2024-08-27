const Game = require('../models/Game');

// Utility function to generate a unique 5-digit game code
const generateGameCode = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};

// Handler for initializing a new game
const initializeGame = async (req, res) => {
    try {
        const gameCode = generateGameCode();
        const newGame = new Game({
            board: createInitialBoard(),
            players: [req.body.player1],
            currentPlayer: req.body.player1,
            teamCode: gameCode,
            status: 'waiting',
        });

        const game = await newGame.save();
        res.json({ game, gameCode });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Handler for joining an existing game
const joinGame = async (req, res) => {
    try {
        const { code, player } = req.body;
        const game = await Game.findOne({ teamCode: code });

        if (!game) {
            return res.status(404).send('Game not found');
        }

        if (game.players.length < 2) {
            game.players.push(player);
            game.status = 'ongoing';
            await game.save();
            res.json(game);
        } else {
            res.status(400).send('Game is already full');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Function to create the initial game board
const createInitialBoard = () => {
    return [
        ['A-H1', '', '', '', 'B-H1'],
        ['', 'A-P1', '', 'B-P1', ''],
        ['', '', '', '', ''],
        ['', 'B-P2', '', 'A-P2', ''],
        ['B-H2', '', '', '', 'A-H2']
    ];
};

// Handler for making a move
const makeMove = async (req, res) => {
    try {
        const { gameId, from, to, piece } = req.body;
        const game = await Game.findById(gameId);

        if (!game) {
            return res.status(404).send('Game not found');
        }

        const currentPlayer = game.currentPlayer;

        // Ensure the piece belongs to the current player
        if (!piece.startsWith(currentPlayer.charAt(0))) {
            return res.status(400).send('Invalid move: Not your piece.');
        }

        // Validate the move according to your game logic
        const validMove = isValidMove(game.board, piece, from, to, currentPlayer);
        if (!validMove) {
            return res.status(400).send('Invalid move.');
        }

        // Execute the move
        game.board[to.row][to.col] = piece;
        game.board[from.row][from.col] = '';
        game.currentPlayer = currentPlayer === 'PlayerA' ? 'PlayerB' : 'PlayerA';

        await game.save();
        res.json(game);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Function to validate the move
const isValidMove = (board, piece, from, to, currentPlayer) => {
    const pieceType = piece.slice(1); // Extract piece type (P, H1, H2, H3)
    const { row: fromRow, col: fromCol } = from;
    const { row: toRow, col: toCol } = to;

    if (toRow < 0 || toRow >= 5 || toCol < 0 || toCol >= 5) {
        // Out of bounds
        return false;
    }

    // Check if the target cell is occupied by a friendly piece
    const targetPiece = board[toRow][toCol];
    if (targetPiece && targetPiece.startsWith(currentPlayer.charAt(0))) {
        return false;
    }

    switch (pieceType) {
        case 'P': // Pawn
            return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
        
        case 'H1': // Hero1
            return (toRow === fromRow && Math.abs(toCol - fromCol) === 2) ||
                   (toCol === fromCol && Math.abs(toRow - fromRow) === 2);
        
        case 'H2': // Hero2
            return Math.abs(toRow - fromRow) === 2 && Math.abs(toCol - fromCol) === 2;
        
        case 'H3': // Hero3
            const rowDiff = Math.abs(toRow - fromRow);
            const colDiff = Math.abs(toCol - fromCol);
            return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        
        default:
            return false;
    }
};

module.exports = { initializeGame, joinGame, makeMove };
