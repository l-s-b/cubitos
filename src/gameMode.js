export const GAME_MODES = Object.freeze({
    ONE_PLAYER: 'one-player',
    TWO_PLAYER: 'two-player',
    THREE_PLAYER: 'three-player',
});

export const AI_DIFFICULTIES = Object.freeze({
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
});

let currentGameMode = GAME_MODES.THREE_PLAYER;
let currentAiDifficulty = AI_DIFFICULTIES.EASY;

export function configureGame(mode, difficulty = AI_DIFFICULTIES.EASY) {
    currentGameMode = mode;
    currentAiDifficulty = difficulty;
}

export function getGameMode() {
    return currentGameMode;
}

export function getAiDifficulty() {
    return currentAiDifficulty;
}
