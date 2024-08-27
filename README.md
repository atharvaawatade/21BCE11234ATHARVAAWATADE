# ChessWicket

ChessWicket is a turn-based chess-like game where two players can compete against each other. The game features custom characters with unique movement patterns and a dynamic game board. Players can join a game using a 5-digit code and take turns to move their characters strategically.

## Features

- **Custom Characters**: The game includes the following characters:
  - **Pawn (P)**: Moves one block in any direction (Left, Right, Forward, or Backward).
  - **Hero1 (H1)**: Moves two blocks straight in any direction, killing any opponent's character in its path.
  - **Hero2 (H2)**: Moves two blocks diagonally in any direction, killing any opponent's character in its path.
  - **Hero3 (H3)**: Moves two steps straight and one to the side, killing only the character at its final landing position (if occupied by an opponent).

- **Dynamic Team Composition**: Players can select their team composition at the start of the game.

- **Multiplayer Functionality**: Players can play against each other from different devices by entering the same 5-digit team code.

- **Real-Time Updates**: The game uses WebSocket for real-time communication to ensure that moves and game state updates are synchronized between players.

- **Game State Management**: The game allows Player A to move only A characters and Player B to move only B characters. It ensures that the game waits for Player B to join before starting.

## Setup and Installation

### Prerequisites

- Node.js (>=14.x)
- MongoDB
- React

### Clone the Repository

```bash
git clone https://github.com/atharvaawatade/21BCE11234ATHARVAAWATADE.git
cd 21BCE11234ATHARVAAWATADE
