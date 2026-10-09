import { AI_DIFFICULTIES, GAME_MODES } from '../../gameMode.js';
import WINNING_CASES from './winningCases.js';

const CENTER_CUBE_NAMES = Object.freeze([
    'BBC', 'BBA', 'BCB', 'BAB', 'ABB', 'CBB',
]);

export function hasWinningLine(cubes) {
    return getWinningLine(cubes) !== null;
}

export function getWinningLine(cubes) {
    return WINNING_CASES.find(winningCase => (
        winningCase.every(winningPosition => cubes.includes(winningPosition))
    )) || null;
}

export function getWinningCenterCube(winningLine) {
    const faceAxis = [0, 1, 2].find(axis => (
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
    const faceAxis = [0, 1, 2].find(axis => (
        winningLine.every(position => position[axis] === winningLine[0][axis])
        && winningLine[0][axis] !== 'B'
    ));
    if (faceAxis === undefined) return null;

    const centerCube = ['B', 'B', 'B'];
    centerCube[faceAxis] = winningLine[0][faceAxis];
    if (winningLine.includes(centerCube.join(''))) return null;
    const centerCoordinates = centerCube.map(value => (
        value === 'A' ? -1 : value === 'C' ? 1 : 0
    ));
    const coordinates = winningLine.map(position => [...position].map(value => (
        value === 'A' ? -1 : value === 'C' ? 1 : 0
    )));
    const oppositePairs = [];

    for (let first = 0; first < coordinates.length; first += 1) {
        for (let second = first + 1; second < coordinates.length; second += 1) {
            if (coordinates[first].every((value, axis) => (
                value + coordinates[second][axis] === 2 * centerCoordinates[axis]
            ))) {
                oppositePairs.push([first, second]);
            }
        }
    }

    if (oppositePairs.length !== 1) return null;
    const [first, second] = oppositePairs[0];
    return winningLine.find((_, index) => index !== first && index !== second) || null;
}

export function getMoveWinner(cubesByColor, colorIndex, mode, playerIndex) {
    if (!hasWinningLine(cubesByColor[colorIndex])) return null;
    if (mode === GAME_MODES.TWO_PLAYER) {
        return {
            colorIndex,
            playerNameKey: playerIndex === 0 ? 'playerOne' : 'playerTwo',
        };
    }
    return { colorIndex, playerNameKey: null };
}

function getImmediateWinningMoves(cubes, availableCubes) {
    return availableCubes.filter(cube => (
        hasWinningLine([...cubes, cube.shortName])
    ));
}

function chooseRandom(cubes) {
    return cubes[Math.floor(Math.random() * cubes.length)];
}

function getForkMoves(cubes, availableCubes) {
    return availableCubes.filter(cube => {
        const remainingCubes = availableCubes.filter(
            availableCube => availableCube.shortName !== cube.shortName
        );
        const nextCubes = [...cubes, cube.shortName];
        return getImmediateWinningMoves(nextCubes, remainingCubes).length >= 2;
    });
}

export function chooseAiMove(
    availableCubes,
    colorIndex,
    occupiedCubes,
    difficulty,
    isFirstAiMove = false,
) {
    if (availableCubes.length === 0) return undefined;
    if (difficulty === AI_DIFFICULTIES.EASY) return chooseRandom(availableCubes);

    const ownCubes = occupiedCubes[colorIndex].cubesWithThisColor;
    const isHardOpeningMove = difficulty === AI_DIFFICULTIES.HARD && isFirstAiMove;
    const candidateMoves = isHardOpeningMove
        ? availableCubes.filter(cube => !CENTER_CUBE_NAMES.includes(cube.shortName))
        : availableCubes;
    const winningMoves = getImmediateWinningMoves(ownCubes, candidateMoves);
    if (winningMoves.length > 0) return chooseRandom(winningMoves);

    const opponents = occupiedCubes.filter((_, index) => index !== colorIndex);
    const opponentThreats = opponents.flatMap(opponent => (
        getImmediateWinningMoves(opponent.cubesWithThisColor, candidateMoves)
    ));
    if (opponentThreats.length > 0) {
        const blockingMoves = candidateMoves.map(cube => ({
            cube,
            threatsBlocked: opponentThreats.filter(
                threat => threat.shortName === cube.shortName
            ).length,
        })).filter(move => move.threatsBlocked > 0);
        const mostThreatsBlocked = Math.max(
            ...blockingMoves.map(move => move.threatsBlocked)
        );
        return chooseRandom(blockingMoves
            .filter(move => move.threatsBlocked === mostThreatsBlocked)
            .map(move => move.cube));
    }

    if (difficulty === AI_DIFFICULTIES.MEDIUM) return chooseRandom(availableCubes);

    const ownForkMoves = getForkMoves(ownCubes, candidateMoves);
    if (ownForkMoves.length > 0) return chooseRandom(ownForkMoves);

    const opponentForkMoves = opponents.flatMap(opponent => (
        getForkMoves(opponent.cubesWithThisColor, candidateMoves)
    ));
    const forkBlocks = candidateMoves.filter(cube => (
        opponentForkMoves.some(forkMove => forkMove.shortName === cube.shortName)
    ));
    if (forkBlocks.length > 0) return chooseRandom(forkBlocks);

    const scoredMoves = candidateMoves.map(cube => {
        const nextAvailableCubes = candidateMoves.filter(
            availableCube => availableCube.shortName !== cube.shortName
        );
        const ownThreats = getImmediateWinningMoves(
            [...ownCubes, cube.shortName],
            nextAvailableCubes,
        ).length;
        const opponentForks = opponents.reduce((forkCount, opponent) => (
            forkCount + getForkMoves(
                opponent.cubesWithThisColor,
                nextAvailableCubes,
            ).length
        ), 0);
        return { cube, ownThreats, opponentForks };
    });
    const bestScore = scoredMoves.reduce((best, move) => (
        move.ownThreats > best.ownThreats
        || (move.ownThreats === best.ownThreats && move.opponentForks < best.opponentForks)
            ? move
            : best
    ));
    const bestMoves = scoredMoves.filter(move => (
        move.ownThreats === bestScore.ownThreats
        && move.opponentForks === bestScore.opponentForks
    ));
    return chooseRandom(bestMoves.map(move => move.cube));
}
