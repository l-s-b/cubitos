import WINNING_CASES from './winningCases.js';

const CUBE_NAMES = Object.freeze([
    'BBC', 'BBA', 'BCB', 'BAB', 'ABB', 'CBB',
    'BCC', 'BCA', 'BAC', 'BAA', 'ABC', 'CBC',
    'ABA', 'CBA', 'AAB', 'CAB', 'ACB', 'CCB',
]);
const WIN_SCORE = 100;

function getPermutations(values) {
    if (values.length === 0) return [[]];
    return values.flatMap((value, index) => (
        getPermutations(values.filter((_, otherIndex) => otherIndex !== index))
            .map(rest => [value, ...rest])
    ));
}

function getCoordinates(name) {
    return [...name].map(axis => axis === 'A' ? -1 : axis === 'B' ? 0 : 1);
}

function getCubeName(coordinates) {
    return coordinates.map(value => value === -1 ? 'A' : value === 0 ? 'B' : 'C')
        .join('');
}

function buildSymmetryMappings(cubeIndexes, winningMasks) {
    const winningMaskSet = new Set(winningMasks);
    const mappings = [];

    getPermutations([0, 1, 2]).forEach(permutation => {
        for (let signs = 0; signs < 8; signs += 1) {
            const signByAxis = [0, 1, 2].map(axis => (
                (signs & (1 << axis)) === 0 ? -1 : 1
            ));
            const mapping = CUBE_NAMES.map(name => {
                const coordinates = getCoordinates(name);
                const transformed = permutation.map((sourceAxis, targetAxis) => (
                    coordinates[sourceAxis] * signByAxis[targetAxis]
                ));
                return cubeIndexes.get(getCubeName(transformed));
            });
            if (mapping.some(index => index === undefined)) continue;

            const preservesWinningCases = winningMasks.every(mask => {
                let transformedMask = 0;
                mapping.forEach((targetIndex, sourceIndex) => {
                    if ((mask & (1 << sourceIndex)) !== 0) {
                        transformedMask |= 1 << targetIndex;
                    }
                });
                return winningMaskSet.has(transformedMask);
            });
            if (preservesWinningCases) mappings.push(mapping);
        }
    });
    return mappings;
}

function buildMaskTables(mappings) {
    const maskCount = 1 << CUBE_NAMES.length;
    return mappings.map(mapping => {
        const table = new Uint32Array(maskCount);
        for (let mask = 0; mask < maskCount; mask += 1) {
            let transformedMask = 0;
            for (let sourceIndex = 0; sourceIndex < CUBE_NAMES.length; sourceIndex += 1) {
                if ((mask & (1 << sourceIndex)) !== 0) {
                    transformedMask |= 1 << mapping[sourceIndex];
                }
            }
            table[mask] = transformedMask;
        }
        return table;
    });
}

function countBits(mask) {
    let count = 0;
    for (; mask !== 0; mask &= mask - 1) count += 1;
    return count;
}

const cubeIndexes = new Map(CUBE_NAMES.map((name, index) => [name, index]));
const winningMasks = WINNING_CASES.map(winningCase => winningCase.reduce(
    (mask, name) => mask | (1 << cubeIndexes.get(name)),
    0,
));
const lineMasksByCube = CUBE_NAMES.map((_, cubeIndex) => (
    winningMasks.filter(mask => (mask & (1 << cubeIndex)) !== 0)
));
const symmetryMappings = buildSymmetryMappings(cubeIndexes, winningMasks);
const maskTables = buildMaskTables(symmetryMappings);

function canonicalKey(redMask, greenMask, blueMask) {
    let bestRed = Infinity;
    let bestGreen = Infinity;
    let bestBlue = Infinity;
    for (const table of maskTables) {
        const transformedRed = table[redMask];
        const transformedGreen = table[greenMask];
        const transformedBlue = table[blueMask];
        if (
            transformedRed < bestRed
            || (
                transformedRed === bestRed
                && (
                    transformedGreen < bestGreen
                    || (
                        transformedGreen === bestGreen
                        && transformedBlue < bestBlue
                    )
                )
            )
        ) {
            bestRed = transformedRed;
            bestGreen = transformedGreen;
            bestBlue = transformedBlue;
        }
    }
    return `${bestRed}:${bestGreen}:${bestBlue}`;
}

function buildRootMasks(position) {
    if (!position || !Array.isArray(position.red)
        || !Array.isArray(position.green) || !Array.isArray(position.blue)) {
        throw new TypeError('An AI position must contain red, green, and blue cube arrays.');
    }
    if (![0, 1, 2].includes(position.nextPlayer)) {
        throw new RangeError('The next player must be Red (0), Green (1), or Blue (2).');
    }

    const masks = ['red', 'green', 'blue'].map(color => (
        position[color].reduce((mask, name) => {
            const cubeIndex = cubeIndexes.get(name);
            if (cubeIndex === undefined) {
                throw new Error(`Unknown cube name "${name}" in AI position.`);
            }
            const bit = 1 << cubeIndex;
            if ((mask & bit) !== 0) {
                throw new Error(`Repeated cube name "${name}" in AI position.`);
            }
            return mask | bit;
        }, 0)
    ));
    if (
        (masks[0] & masks[1])
        || (masks[0] & masks[2])
        || (masks[1] & masks[2])
    ) {
        throw new Error('A cube cannot belong to more than one color.');
    }

    const occupiedMask = masks[0] | masks[1] | masks[2];
    if (countBits(occupiedMask) % 3 !== position.nextPlayer) {
        throw new Error('The next player does not match the Red-Green-Blue turn order.');
    }
    if (masks.some(mask => winningMasks.some(
        winningMask => (mask & winningMask) === winningMask
    ))) {
        throw new Error('Cannot calculate a move after a winning line already exists.');
    }
    return { masks, occupiedMask };
}

function scoreTerminal(winner, depth) {
    return [0, 1, 2].map(player => (
        player === winner ? WIN_SCORE - depth : -WIN_SCORE + depth
    ));
}

export function getOptimalSelfishMoves(position) {
    const { masks, occupiedMask } = buildRootMasks(position);
    const rootPlayer = position.nextPlayer;
    const transpositions = new Map();

    const solvePosition = (currentRed, currentGreen, currentBlue, player) => {
        const key = canonicalKey(currentRed, currentGreen, currentBlue);
        const cached = transpositions.get(key);
        if (cached !== undefined) return cached;

        const occupied = currentRed | currentGreen | currentBlue;
        const availableMask = ((1 << CUBE_NAMES.length) - 1) & ~occupied;
        const depth = countBits(occupied);
        if (availableMask === 0) return [0, 0, 0];

        const playerMask = player === 0
            ? currentRed
            : player === 1 ? currentGreen : currentBlue;
        for (let remaining = availableMask; remaining !== 0; remaining &= remaining - 1) {
            const bit = remaining & -remaining;
            const cubeIndex = 31 - Math.clz32(bit);
            if (lineMasksByCube[cubeIndex].some(
                lineMask => ((playerMask | bit) & lineMask) === lineMask
            )) {
                const winningScore = scoreTerminal(player, depth + 1);
                transpositions.set(key, winningScore);
                return winningScore;
            }
        }

        let bestScore = null;
        for (let remaining = availableMask; remaining !== 0; remaining &= remaining - 1) {
            const bit = remaining & -remaining;
            const cubeIndex = 31 - Math.clz32(bit);
            const nextRed = player === 0 ? currentRed | bit : currentRed;
            const nextGreen = player === 1 ? currentGreen | bit : currentGreen;
            const nextBlue = player === 2 ? currentBlue | bit : currentBlue;
            const score = solvePosition(
                nextRed,
                nextGreen,
                nextBlue,
                (player + 1) % 3,
            );
            if (bestScore === null || score[player] > bestScore[player]) {
                bestScore = score;
            }
        }

        transpositions.set(key, bestScore);
        return bestScore;
    };

    const availableMask = ((1 << CUBE_NAMES.length) - 1) & ~occupiedMask;
    const rootMoves = [];
    const immediateWins = [];
    for (let remaining = availableMask; remaining !== 0; remaining &= remaining - 1) {
        const bit = remaining & -remaining;
        const cubeIndex = 31 - Math.clz32(bit);
        if (lineMasksByCube[cubeIndex].some(
            lineMask => ((masks[rootPlayer] | bit) & lineMask) === lineMask
        )) {
            immediateWins.push(CUBE_NAMES[cubeIndex]);
        }
    }
    if (immediateWins.length > 0) return immediateWins;

    for (let remaining = availableMask; remaining !== 0; remaining &= remaining - 1) {
        const bit = remaining & -remaining;
        const cubeIndex = 31 - Math.clz32(bit);
        const nextMasks = masks.map((mask, player) => (
            player === rootPlayer ? mask | bit : mask
        ));
        const score = solvePosition(
            nextMasks[0],
            nextMasks[1],
            nextMasks[2],
            (rootPlayer + 1) % 3,
        );
        rootMoves.push({ cube: CUBE_NAMES[cubeIndex], score });
    }

    if (rootMoves.length === 0) return [];
    const bestScore = rootMoves.reduce(
        (best, move) => Math.max(best, move.score[rootPlayer]),
        -Infinity,
    );
    return rootMoves
        .filter(move => move.score[rootPlayer] === bestScore)
        .map(move => move.cube);
}
