import winningCases from './winningCases.js';

const CENTER_CUBE_NAMES = ['BBC', 'BBA', 'BCB', 'BAB', 'ABB', 'CBB'];
const AXES = [0, 1, 2];
const coordinate = value => (value === 'A' ? -1 : value === 'C' ? 1 : 0);

export function findWinningLine(cubes) {
    return winningCases.find(winningCase => (
        winningCase.every(position => cubes.includes(position))
    )) || null;
}

export function getWinningCenterCube(winningLine) {
    const faceAxis = AXES.find(axis => (
        winningLine.every(position => position[axis] === winningLine[0][axis])
        && winningLine[0][axis] !== 'B'
    ));
    if (faceAxis !== undefined) {
        const centerCube = ['B', 'B', 'B'];
        centerCube[faceAxis] = winningLine[0][faceAxis];
        return centerCube.join('');
    }
    return CENTER_CUBE_NAMES.find(cubeName => winningLine.includes(cubeName)) || null;
}

export function getWinningMiddleCube(winningLine) {
    if (winningLine.length !== 3) return null;
    const centerCubeName = getWinningCenterCube(winningLine);
    if (!centerCubeName || winningLine.includes(centerCubeName)) return null;

    const center = [...centerCubeName].map(coordinate);
    const positions = winningLine.map(name => [...name].map(coordinate));
    const oppositePairs = [];
    for (let first = 0; first < positions.length; first += 1) {
        for (let second = first + 1; second < positions.length; second += 1) {
            if (positions[first].every((value, axis) => (
                value + positions[second][axis] === 2 * center[axis]
            ))) {
                oppositePairs.push([first, second]);
            }
        }
    }
    if (oppositePairs.length !== 1) return null;

    const [first, second] = oppositePairs[0];
    return winningLine.find((_, index) => index !== first && index !== second) || null;
}
