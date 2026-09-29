import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_DIFFICULTIES } from '../src/gameMode.js';
import { GAME_MODES } from '../src/gameMode.js';
import {
    chooseAiMove,
    getMoveWinner,
    hasWinningLine,
} from '../src/three/helpers/gameRules.js';
import { getOptimalSelfishMoves } from '../src/three/helpers/selfishAi.js';

const createOccupiedCubes = () => [
    { cubesWithThisColor: [] },
    { cubesWithThisColor: [] },
    { cubesWithThisColor: [] },
];

const createCube = shortName => ({ shortName });
const CUBE_SHORT_NAMES = [
    'BBC', 'BBA', 'BCB', 'BAB', 'ABB', 'CBB',
    'BCC', 'BCA', 'BAC', 'BAA', 'ABC', 'CBC',
    'ABA', 'CBA', 'AAB', 'CAB', 'ACB', 'CCB',
];
const createAvailableCubes = occupiedCubes => {
    const occupiedNames = new Set(
        occupiedCubes.flatMap(color => color.cubesWithThisColor)
    );
    return CUBE_SHORT_NAMES
        .filter(name => !occupiedNames.has(name))
        .map(createCube);
};

test('recognizes configured V-shaped winning positions', () => {
    assert.equal(hasWinningLine(['ACB', 'BCA', 'CCB']), true);
});

test('recognizes a team win across multiple colors', () => {
    assert.equal(hasWinningLine(['ACB', 'BCB', 'CAB']), false);
    assert.equal(hasWinningLine(['ACB', 'BCB', 'CCB']), true);
});

test('two-player wins require a same-color line and go to the last mover', () => {
    const cubesByColor = [
        ['ACB', 'BCB', 'CCB'],
        ['ABA', 'BBA'],
        ['BBC'],
    ];

    assert.deepEqual(
        getMoveWinner(cubesByColor, 0, GAME_MODES.TWO_PLAYER, 1),
        { colorIndex: 0, playerNameKey: 'playerTwo' },
    );
    assert.equal(getMoveWinner(cubesByColor, 1, GAME_MODES.TWO_PLAYER, 1), null);
});

test('three-player color wins remain unchanged', () => {
    const cubesByColor = [
        ['ACB', 'BCB', 'CCB'],
        [],
        [],
    ];

    assert.deepEqual(
        getMoveWinner(cubesByColor, 0, GAME_MODES.THREE_PLAYER, 1),
        { colorIndex: 0, playerNameKey: null },
    );
});

test('easy AI chooses an available cube', () => {
    const cubes = [createCube('ACB'), createCube('CCB')];
    const selected = chooseAiMove(
        cubes,
        1,
        createOccupiedCubes(),
        AI_DIFFICULTIES.EASY,
    );

    assert.ok(cubes.includes(selected));
});

test('hard AI avoids face-center cubes on its first move', () => {
    const occupiedCubes = createOccupiedCubes();
    const cubes = createAvailableCubes(occupiedCubes);
    const centerCubes = new Set(['BBC', 'BBA', 'BCB', 'BAB', 'ABB', 'CBB']);

    const selected = chooseAiMove(
        cubes,
        1,
        occupiedCubes,
        AI_DIFFICULTIES.HARD,
        true,
    );

    assert.ok(selected);
    assert.equal(centerCubes.has(selected.shortName), false);
});

test('medium AI takes an available winning move', () => {
    const occupiedCubes = createOccupiedCubes();
    occupiedCubes[1].cubesWithThisColor = ['ACB', 'BCB'];
    const cubes = [createCube('CCB'), createCube('CAB')];

    assert.equal(
        chooseAiMove(cubes, 1, occupiedCubes, AI_DIFFICULTIES.MEDIUM).shortName,
        'CCB',
    );
});

test('medium AI blocks an opponent winning outward V line', () => {
    const occupiedCubes = createOccupiedCubes();
    occupiedCubes[0].cubesWithThisColor = ['ACB', 'BCA'];
    const cubes = [createCube('CCB'), createCube('CAB')];

    assert.equal(
        chooseAiMove(cubes, 1, occupiedCubes, AI_DIFFICULTIES.MEDIUM).shortName,
        'CCB',
    );
});

test('hard AI creates an outward V fork when possible', () => {
    const occupiedCubes = createOccupiedCubes();
    occupiedCubes[1].cubesWithThisColor = ['ACB'];
    const cubes = createAvailableCubes(occupiedCubes);
    const ownForkMoves = cubes.filter(cube => {
        const ownCubes = ['ACB', cube.shortName];
        const futureMoves = cubes.filter(
            futureCube => futureCube.shortName !== cube.shortName
        );
        const winningReplies = futureMoves.filter(futureCube => (
            hasWinningLine([...ownCubes, futureCube.shortName])
        ));
        return winningReplies.length >= 2;
    });

    const selectedMove = chooseAiMove(
        cubes,
        1,
        occupiedCubes,
        AI_DIFFICULTIES.HARD,
    );

    assert.ok(ownForkMoves.some(move => move.shortName === selectedMove.shortName));
});

test('hard AI blocks an opponent outward V fork setup', () => {
    const occupiedCubes = createOccupiedCubes();
    occupiedCubes[0].cubesWithThisColor = ['ACB'];
    const cubes = createAvailableCubes(occupiedCubes);
    const opponentForkMoves = cubes.filter(cube => {
        const opponentCubes = ['ACB', cube.shortName];
        const futureMoves = cubes.filter(
            futureCube => futureCube.shortName !== cube.shortName
        );
        const winningReplies = futureMoves.filter(futureCube => (
            hasWinningLine([...opponentCubes, futureCube.shortName])
        ));
        return winningReplies.length >= 2;
    });

    const selectedMove = chooseAiMove(
        cubes,
        1,
        occupiedCubes,
        AI_DIFFICULTIES.HARD,
    );

    assert.ok(opponentForkMoves.some(move => move.shortName === selectedMove.shortName));
});

test('super-hard AI takes an immediate win for its own color', () => {
    assert.deepEqual(getOptimalSelfishMoves({
        red: ['ACB', 'BCB'],
        green: ['BBC'],
        blue: ['ABA', 'BAB'],
        nextPlayer: 2,
    }), ['CBC']);
});

test('super-hard AI blocks Red instead of playing for Blue', () => {
    const bestMoves = getOptimalSelfishMoves({
        red: ['ACB', 'BCB'],
        green: [],
        blue: ['ABA', 'BAB'],
        nextPlayer: 1,
    });

    assert.deepEqual(bestMoves, ['CCB']);
});

test('super-hard Green takes its own win instead of supporting another color', () => {
    assert.deepEqual(getOptimalSelfishMoves({
        red: ['BBC'],
        green: ['ACB', 'BCB'],
        blue: ['BBA'],
        nextPlayer: 1,
    }), ['CCB']);
});
