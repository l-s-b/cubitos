# Cubitos

A small 3D tic-tac-toe game built with Three.js.

## Play

- Double-click an open cube to place the next player's mark.
- Drag the cube to rotate the board. The board glides briefly when you release.
- Use the on-screen rotation buttons or **W/A/S/D/Q/E** to rotate.
- Make a line of three to win. Choose **Play again** to start another game.

### AI difficulties

In 1-player mode, you play against Red and Green, which each take turns trying to make their own line of three:

- **Easy** picks a random open cube.
- **Medium** takes an immediate win or blocks an opponent's immediate win; otherwise, it picks randomly.
- **Hard** also looks for and blocks forks (moves that create multiple winning chances), and avoids the center cubes on its first move.

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
