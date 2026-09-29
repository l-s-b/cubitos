import { Color, Raycaster, Vector2 } from 'three';
import { renderer } from '../renderer';
import { camera1 } from '../cameras';
import { redCubeMaterial, greenCubeMaterial, blueCubeMaterial } from '../materials';
import winningCases from './winningCases';
import { resetCubes } from './reset';
import './winnerModal.css';
import { onLanguageChange, translate } from '../../language';
import {
    GAME_MODES,
    getAiDifficulty,
    getGameMode,
} from '../../gameMode';

const raycaster = new Raycaster();
const mouse = new Vector2();
let currentColorIndex = 2;
let turnCount = 0;
let winnerModalOpen = false;
let aiTurnTimeout = null;
let aiWorker = null;
let pendingAiRequest = null;
let aiRequestId = 0;
const cubeColors = [redCubeMaterial, greenCubeMaterial, blueCubeMaterial];
const occupiedCubes = [
    { color: 'Rojo', HTMLColor: 'red', cubesWithThisColor: [] },
    { color: 'Verde', HTMLColor: 'green', cubesWithThisColor: [] },
    { color: 'Azul', HTMLColor: 'blue', cubesWithThisColor: [] },
];

function setTurnBackground(colorIndex) {
    const playerColor = cubeColors[colorIndex].color;
    const { h, s } = playerColor.getHSL({});
    const backgroundColor = new Color().setHSL(h, s * 0.65, 0.055);
    renderer.domElement.style.backgroundColor = `#${backgroundColor.getHexString()}`;
}

const winnerColors = {
    Rojo: '#ef5350',
    Verde: '#66bb6a',
    Azul: '#42a5f5',
};
const winnerTranslationKeys = {
    Rojo: 'colorRed',
    Verde: 'colorGreen',
    Azul: 'colorBlue',
};
let gameStarted = false;
const turnStatus = document.createElement('p');
turnStatus.className = 'game-turn-status';
turnStatus.setAttribute('aria-live', 'polite');

function updateTurnStatus() {
    if (!gameStarted) return;
    const nextColorIndex = (currentColorIndex + 1) % cubeColors.length;
    const color = translate(
        winnerTranslationKeys[occupiedCubes[nextColorIndex].color]
    );
    if (getGameMode() === GAME_MODES.ONE_PLAYER) {
        turnStatus.textContent = nextColorIndex === 0
            ? translate('turnHuman', { color })
            : translate('turnAI', { color });
    } else if (getGameMode() === GAME_MODES.TWO_PLAYER) {
        turnStatus.textContent = translate('turnTwoPlayer', {
            player: turnCount % 2 + 1,
            color,
        });
    } else {
        turnStatus.textContent = translate('turnThreePlayer', { color });
    }
}

onLanguageChange(updateTurnStatus);

function showWinnerModal(color, onClose, isDraw = false, winnerNameKey = null) {
    const overlay = document.createElement('div');
    overlay.className = isDraw
        ? 'winner-modal winner-modal--draw'
        : 'winner-modal';
    overlay.style.setProperty(
        '--winner-color',
        isDraw ? '#d5d8de' : winnerColors[color],
    );
    overlay.setAttribute('role', 'presentation');

    const dialog = document.createElement('section');
    dialog.className = 'winner-modal__dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'winner-modal-title');

    const badge = document.createElement('div');
    badge.className = 'winner-modal__badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = isDraw ? '=' : '✓';

    const title = document.createElement('h2');
    title.className = 'winner-modal__title';
    title.id = 'winner-modal-title';
    const updateTitle = () => {
        if (isDraw) {
            title.textContent = translate('drawTitle');
            message.textContent = translate('drawMessage');
            closeButton.textContent = translate('drawReset');
        } else if (winnerNameKey) {
            title.textContent = translate('playerWins', {
                player: translate(winnerNameKey),
            });
            message.textContent = translate('winnerMessage');
            closeButton.textContent = translate('playAgain');
        } else {
            title.textContent = translate('winnerTitle', {
                color: translate(winnerTranslationKeys[color]),
            });
            message.textContent = translate('winnerMessage');
            closeButton.textContent = translate('playAgain');
        }
    };

    const message = document.createElement('p');
    message.className = 'winner-modal__message';

    const closeButton = document.createElement('button');
    closeButton.className = 'winner-modal__button';
    closeButton.type = 'button';
    updateTitle();
    const unsubscribeFromLanguageChanges = onLanguageChange(updateTitle);

    let isClosing = false;
    const close = () => {
        if (isClosing) return;
        isClosing = true;
        overlay.classList.add('winner-modal--closing');
        overlay.addEventListener('animationend', event => {
            if (event.target !== overlay) return;
            overlay.remove();
            unsubscribeFromLanguageChanges();
            onClose();
        });
    };

    closeButton.addEventListener('click', close);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) close();
    });
    overlay.addEventListener('keydown', event => {
        if (event.key === 'Escape') close();
    });

    dialog.append(badge, title, message, closeButton);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    closeButton.focus();
}

function startWinnerGlow(material) {
    const originalColor = material.emissive.clone();
    const originalIntensity = material.emissiveIntensity;
    const winnerEmissive = material.color.clone();
    const highlightEmissive = winnerEmissive.clone().lerp(new Color(0xffffff), 0.45);
    const emissiveStops = [
        new Color(0x000000),
        winnerEmissive,
        highlightEmissive,
        winnerEmissive,
        new Color(0x000000),
    ];
    const intensityStops = [0, 0.3, 0.85, 0.3, 0];
    const pulseDuration = 5200;
    let startTime;
    let frameId;

    const pulse = timestamp => {
        if (startTime === undefined) startTime = timestamp;
        const phase = ((timestamp - startTime) % pulseDuration) / pulseDuration;
        const segment = phase * (emissiveStops.length - 1);
        const index = Math.floor(segment);
        const rawProgress = segment - index;
        const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
        const nextIndex = Math.min(index + 1, emissiveStops.length - 1);

        material.emissive.lerpColors(
            emissiveStops[index],
            emissiveStops[nextIndex],
            progress
        );
        material.emissiveIntensity = intensityStops[index] + (
            intensityStops[nextIndex] - intensityStops[index]
        ) * progress;
        frameId = requestAnimationFrame(pulse);
    };
    frameId = requestAnimationFrame(pulse);

    return () => {
        cancelAnimationFrame(frameId);
        material.emissive.copy(originalColor);
        material.emissiveIntensity = originalIntensity;
    };
}


export default function cubeClickColorChange(cubeList) {
    function showOutcome(winnerColor, winnerPlayerKey = null, isDraw = false) {
        let isModalClosed = false;
        turnStatus.hidden = true;
        winnerModalOpen = true;
        window.dispatchEvent(new Event('cube-winner-start'));
        const winningMaterial = isDraw ? null : cubeColors[currentColorIndex];
        if (winningMaterial) {
            cubeList.forEach(cube => {
                cube.material = winningMaterial;
            });
        }
        const stopWinnerGlow = winningMaterial
            ? startWinnerGlow(winningMaterial)
            : () => {};
        showWinnerModal(winnerColor, () => {
            if (isModalClosed) return;
            isModalClosed = true;
            stopWinnerGlow();
            resetCubes();
            winnerModalOpen = false;
            window.dispatchEvent(new Event('cube-winner-end'));
        }, isDraw, winnerPlayerKey);
    }

    function requestAiWorker() {
        if (aiWorker) return aiWorker;
        const worker = new Worker(
            new URL('./ai.worker.js', import.meta.url),
            { type: 'module' },
        );
        aiWorker = worker;
        worker.addEventListener('message', event => {
            if (aiWorker !== worker) return;
            if (event.data.requestId !== pendingAiRequest?.requestId) return;
            const request = pendingAiRequest;
            pendingAiRequest = null;
            if (event.data.error) {
                request.reject(new Error(event.data.error));
            } else {
                request.resolve(event.data.move);
            }
        });
        worker.addEventListener('error', event => {
            if (aiWorker !== worker) return;
            if (pendingAiRequest) {
                pendingAiRequest.reject(
                    new Error(`AI worker failed: ${event.message}`),
                );
                pendingAiRequest = null;
            }
            worker.terminate();
            aiWorker = null;
        });
        return worker;
    }

    function requestAiMove() {
        return new Promise((resolve, reject) => {
            let worker;
            try {
                worker = requestAiWorker();
            } catch (error) {
                reject(error);
                return;
            }
            const requestId = aiRequestId + 1;
            aiRequestId = requestId;
            pendingAiRequest = { requestId, resolve, reject };
            const occupiedNames = new Set(
                occupiedCubes.flatMap(color => color.cubesWithThisColor)
            );
            try {
                worker.postMessage({
                    requestId,
                    difficulty: getAiDifficulty(),
                    position: {
                        red: occupiedCubes[0].cubesWithThisColor,
                        green: occupiedCubes[1].cubesWithThisColor,
                        blue: occupiedCubes[2].cubesWithThisColor,
                        nextPlayer: (currentColorIndex + 1) % cubeColors.length,
                    },
                    availableCubes: cubeList
                        .filter(cube => !occupiedNames.has(cube.shortName))
                        .map(cube => cube.shortName),
                });
            } catch (error) {
                pendingAiRequest = null;
                reject(error);
            }
        });
    }

    function scheduleAiTurn() {
        const nextPlayer = (currentColorIndex + 1) % cubeColors.length;
        if (
            getGameMode() !== GAME_MODES.ONE_PLAYER
            || nextPlayer === 0
            || winnerModalOpen
        ) return;

        aiTurnTimeout = window.setTimeout(() => {
            aiTurnTimeout = null;
            if (
                !gameStarted
                || winnerModalOpen
                || getGameMode() !== GAME_MODES.ONE_PLAYER
                || (currentColorIndex + 1) % cubeColors.length === 0
            ) return;
            requestAiMove()
                .then(moveName => {
                    if (!moveName || !gameStarted || winnerModalOpen) return;
                    const selectedCube = cubeList.find(
                        cube => cube.shortName === moveName
                    );
                    if (!selectedCube || selectedCube.material.touched) {
                        throw new Error(`AI selected unavailable cube "${moveName}".`);
                    }
                    makeMove(selectedCube);
                })
                .catch(error => {
                    console.error(error);
                    turnStatus.textContent = translate('aiError');
                });
        }, 450);
    }

    function makeMove(selectedCube, moveColorIndex) {
        if (
            !gameStarted
            || winnerModalOpen
            || selectedCube.material.touched
        ) return;
        currentColorIndex = moveColorIndex;
        selectedCube.material = cubeColors[moveColorIndex];
        occupiedCubes[moveColorIndex].cubesWithThisColor.push(selectedCube.shortName);
        const playerIndex = turnCount % 2;
        turnCount += 1;

        const isWinner = winningCases.some(winningCase => (
            winningCase.every(position => (
                occupiedCubes[moveColorIndex].cubesWithThisColor.includes(position)
            ))
        ));
        if (isWinner) {
            const winnerPlayerKey = getGameMode() === GAME_MODES.TWO_PLAYER
                ? playerIndex === 0 ? 'playerOne' : 'playerTwo'
                : null;
            showOutcome(
                occupiedCubes[moveColorIndex].color,
                winnerPlayerKey,
            );
            return;
        }
        if (cubeList.every(cube => cube.material.touched)) {
            showOutcome(null, null, true);
            return;
        }

        const nextPlayer = (moveColorIndex + 1) % cubeColors.length;
        setTurnBackground(nextPlayer);
        updateTurnStatus();
        scheduleAiTurn();
    }

    setTurnBackground(0);

    const canvas = renderer.domElement;
    let touchStart = null;
    const tapMovementThreshold = 12;

    canvas.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch') return;
        touchStart = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
        };
    });
    canvas.addEventListener('pointerup', event => {
        if (
            event.pointerType !== 'touch'
            || !touchStart
            || event.pointerId !== touchStart.pointerId
        ) return;

        const movement = Math.hypot(
            event.clientX - touchStart.x,
            event.clientY - touchStart.y,
        );
        touchStart = null;
        if (movement <= tapMovementThreshold) onClick(event);
    });
    canvas.addEventListener('pointercancel', event => {
        if (event.pointerId === touchStart?.pointerId) touchStart = null;
    });
    canvas.addEventListener('dblclick', onClick, false);

    function onClick(event) {
        if (
            !gameStarted
            || winnerModalOpen
            || (
                getGameMode() === GAME_MODES.ONE_PLAYER
                && (currentColorIndex + 1) % cubeColors.length !== 0
            )
        ) return;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera1);
        const intersects = raycaster.intersectObjects(cubeList);

        if (intersects.length > 0) {
            const selectedCube = intersects[0].object;
            if (selectedCube.material.touched) return;
            const nextPlayer = (currentColorIndex + 1) % cubeColors.length;
            makeMove(selectedCube, nextPlayer);
        }

    }
}
export const resetCubeGameState = () => {
    if (aiTurnTimeout !== null) {
        window.clearTimeout(aiTurnTimeout);
        aiTurnTimeout = null;
    }
    if (pendingAiRequest) {
        pendingAiRequest.resolve(null);
        pendingAiRequest = null;
        if (aiWorker) {
            aiWorker.terminate();
            aiWorker = null;
        }
    }
    currentColorIndex = 2;
    turnCount = 0;
    occupiedCubes.forEach(colorList => {
        colorList.cubesWithThisColor = [];
    });
    setTurnBackground(0);
    turnStatus.hidden = false;
    updateTurnStatus();
};

export const configureGameMode = mode => {
    if (!Object.values(GAME_MODES).includes(mode)) {
        throw new Error(`Unknown game mode "${mode}".`);
    }
    gameStarted = true;
    resetCubeGameState();
    document.querySelector('#app').appendChild(turnStatus);
    turnStatus.hidden = false;
    updateTurnStatus();
};