import test from 'node:test';
import assert from 'node:assert/strict';
import winningCases from '../src/three/helpers/winningCases.js';
import {
    findWinningLine,
    getWinningCenterCube,
    getWinningMiddleCube,
} from '../src/three/helpers/winningLine.js';

test('finds each configured winning line and its facing center cube', () => {
    winningCases.forEach(winningCase => {
        assert.deepEqual(findWinningLine(winningCase), winningCase);
        assert.ok(getWinningCenterCube(winningCase));
    });
});

test('identifies V middle cubes and excludes straight winning lines', () => {
    const vLines = winningCases.filter(line => getWinningMiddleCube(line));
    assert.equal(vLines.length, 24);
    vLines.forEach(line => {
        const center = getWinningCenterCube(line);
        const middle = getWinningMiddleCube(line);
        assert.ok(line.includes(middle));
        assert.ok(!line.includes(center));
    });
});
