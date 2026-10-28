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
- **Super-hard** searches the possible game outcomes and chooses moves that maximize its own chances, while treating the other colors as independent rivals.

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

## Publishing changes

From either the `main` or `private` branch, stage all current changes, commit them on both local branches, and push only `main`. To bump the version in `package.json` and `package-lock.json`, pass one of `-Major`, `-Minor`, or `-Hotfix`:

```powershell
.\release.ps1 "Describe the change" -Minor
```

`-Major` increments the major version and resets minor and patch to zero; `-Minor` increments the minor version and resets patch to zero; `-Hotfix` increments the patch version. When a bump flag is used, the script creates an annotated `vX.Y.Z` tag on `main` and pushes it with `main`. Omitting a flag leaves the version unchanged and does not create a tag.

The script returns to the branch it started from. Since `main` and `private` have diverged, a cherry-pick conflict stops the release without pushing; the initial commit remains on the starting branch, so resolve the conflict and finish the cherry-pick and push manually.
