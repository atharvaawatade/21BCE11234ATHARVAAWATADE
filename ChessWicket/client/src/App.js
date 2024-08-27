import React, { useState } from 'react';
import GameBoard from './components/GameBoard';
import './App.css';

function App() {
  const [teamCode, setTeamCode] = useState('');
  const [gameId, setGameId] = useState('');
  const [player, setPlayer] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  const handleCreateGame = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player1: 'PlayerA' }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Game started! Share this code with Player B: ${result.gameCode}`);
        setTeamCode(result.gameCode);
        setGameId(result.game._id);
        setPlayer('PlayerA');
        setGameStarted(true);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleJoinGame = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: teamCode, player: 'PlayerB' }),
      });
      const result = await response.json();
      if (response.ok) {
        alert('Joined game successfully!');
        setGameId(result._id);
        setPlayer('PlayerB');
        setGameStarted(true);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  return (
    <div className="App">
      <h1>ChessWicket</h1>
      {!gameStarted ? (
        <div>
          <button onClick={handleCreateGame}>Create Game</button>
          <p>Team Code: {teamCode}</p>
          <input
            type="text"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value)}
            placeholder="Enter Team Code"
          />
          <button onClick={handleJoinGame}>Join Game</button>
        </div>
      ) : (
        <GameBoard gameId={gameId} player={player} />
      )}
    </div>
  );
}

export default App;
