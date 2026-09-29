# Cubitos

A small 3D tic-tac-toe game built with Three.js.

## Play

- Choose 1-player mode to play against two AI opponents, or play with 2 or 3 players.
- Select Easy, Medium, or Hard for single-player games.
- Double-click an open cube to place the next player's mark.
- Drag the cube to rotate the board. The board glides briefly when you release.
- Use the on-screen rotation buttons or **W/A/S/D/Q/E** to rotate.
- Make a line of three to win. Choose **Play again** to start another game.
- Select **Reset** to clear the board.

The single-player AI runs in an obfuscated web worker so its calculations do not block the game.

## Run locally

Requires Node.js 18 or later.

```sh
npm install
npm run dev
```

To create a production build:

```sh
npm run build
```
