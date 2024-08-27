import React, { useState, useEffect } from 'react';
import './GameBoard.css';
import { io } from 'socket.io-client';

const initialBoardState = [
  ['AP1', 'AH1', 'AH2', 'AH3', 'AP2'],
  ['', '', '', '', ''],
  ['', '', '', '', ''],
  ['', '', '', '', ''],
  ['BP1', 'BH1', 'BH2', 'BH3', 'BP2'],
];

const GameBoard = ({ gameId, player }) => {
  const [board, setBoard] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('joinGame', { gameId, player });

    newSocket.on('gameUpdate', (gameData) => {
      setBoard(gameData.board);
      setCurrentPlayer(gameData.currentPlayer);
      setGameStarted(gameData.gameStarted);
      updateStatusMessage(gameData.currentPlayer, gameData.gameStarted);
    });

    newSocket.on('playerBJoined', () => {
      setGameStarted(true);
      alert('Player B has joined! You can start the game now.');
      setCurrentPlayer('PlayerA'); // Ensure game starts with Player A
    });

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, player]);

  useEffect(() => {
    updateStatusMessage(currentPlayer, gameStarted);
  }, [currentPlayer, gameStarted]);

  const updateStatusMessage = (currentPlayer, gameStarted) => {
    if (!gameStarted) {
      setStatusMessage('Waiting for opponent...');
    } else if (player === currentPlayer) {
      setStatusMessage('Your turn');
    } else {
      setStatusMessage('Please wait for your opponent’s move');
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    if (!gameStarted) {
      alert('Game has not started yet.');
      return;
    }

    if (currentPlayer !== player) {
      alert("It's not your turn!");
      return;
    }

    const piece = board[rowIndex][colIndex];

    if (selectedPiece) {
      if (isValidMove(selectedPiece, rowIndex, colIndex)) {
        movePiece(selectedPiece, rowIndex, colIndex);
        setSelectedPiece(null);
      } else {
        alert('Invalid move!');
      }
    } else if (piece && piece.startsWith(player.charAt(0))) {
      setSelectedPiece({ piece, rowIndex, colIndex });
    }
  };

  const movePiece = async (selectedPiece, newRow, newCol) => {
    const { piece, rowIndex, colIndex } = selectedPiece;

    try {
      const response = await fetch('http://localhost:5000/api/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          from: { row: rowIndex, col: colIndex },
          to: { row: newRow, col: newCol },
          piece,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        alert(error);
        return;
      }

      const gameData = await response.json();
      setBoard(gameData.board);
      setCurrentPlayer(gameData.currentPlayer);
    } catch (err) {
      console.error('Error making move:', err);
    }
  };

  const isValidMove = (selectedPiece, newRow, newCol) => {
    const { piece, rowIndex, colIndex } = selectedPiece;
    const pieceType = piece.slice(1); // Extract character type (P, H1, H2, H3)

    if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) {
      // Out of bounds
      return false;
    }

    // Check if the target cell is occupied by a friendly piece
    const targetPiece = board[newRow][newCol];
    if (targetPiece && targetPiece.startsWith(player.charAt(0))) {
      return false;
    }

    switch (pieceType) {
      case 'P': // Pawn
        return Math.abs(newRow - rowIndex) <= 1 && Math.abs(newCol - colIndex) <= 1;
      
      case 'H1': // Hero1
        return (newRow === rowIndex && Math.abs(newCol - colIndex) === 2) ||
               (newCol === colIndex && Math.abs(newRow - rowIndex) === 2);
      
      case 'H2': // Hero2
        return Math.abs(newRow - rowIndex) === 2 && Math.abs(newCol - colIndex) === 2;
      
      case 'H3': // Hero3
        const rowDiff = Math.abs(newRow - rowIndex);
        const colDiff = Math.abs(newCol - colIndex);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
      
      default:
        return false;
    }
  };

  return (
    <div className="game-container">
      <div className="dashboard">
        <h2>{player === 'PlayerA' ? 'You are Player A' : 'You are Player B'}</h2>
        <p>{statusMessage}</p>
      </div>
      <div className="game-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`board-cell ${selectedPiece?.rowIndex === rowIndex && selectedPiece?.colIndex === colIndex ? 'selected' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                data-piece={cell}
              >
                {cell && <span>{cell}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
