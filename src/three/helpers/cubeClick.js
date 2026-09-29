import { Color, Raycaster, Vector2 } from 'three';
import { renderer } from '../renderer';
import { camera1 } from '../cameras';
import { redCubeMaterial, greenCubeMaterial, blueCubeMaterial } from '../materials';
import { resetCubes } from './reset';
import { chooseAiMove, getMoveWinner } from './gameRules';
import { onLanguageChange, translate } from '../../language';
import {
    GAME_MODES,
    getAiDifficulty,
    getGameMode,
    AI_DIFFICULTIES,
} from '../../gameMode';
import './winnerModal.css';

const PULSE_DURATION = 5200;
const TAP_MOVEMENT_THRESHOLD = 12;
const AI_MOVE_DELAY = 450;

const raycaster = new Raycaster();
const mouse = new Vector2();
let currentColorIndex = 0;
let turnCount = 0;
let gameStarted = false;
let winnerModalOpen = false;
const roundPlays = [];
let aiTurnTimeout = null;
let selfishAiWorker = null;
let pendingSelfishAiRequest = null;
let selfishAiRequestId = 0;
const CUBE_COLORS = [redCubeMaterial, greenCubeMaterial, blueCubeMaterial];
const occupiedCubes = [
    { color: 'Rojo', HTMLColor: 'red', cubesWithThisColor: [] },
    { color: 'Verde', HTMLColor: 'green', cubesWithThisColor: [] },
    { color: 'Azul', HTMLColor: 'blue', cubesWithThisColor: [] },
];
const turnStatus = document.createElement('p');
turnStatus.className = 'game-turn-status';
turnStatus.setAttribute('aria-live', 'polite');

function updateTurnStatus() {
    if (!gameStarted) return;
    const color = translate(WINNER_TRANSLATION_KEYS[occupiedCubes[currentColorIndex].color]);
    const mode = getGameMode();
    if (mode === GAME_MODES.TWO_PLAYER) {
        turnStatus.textContent = translate('turnTwoPlayer', {
            player: turnCount % 2 + 1,
            color,
        });
    } else if (mode === GAME_MODES.ONE_PLAYER && currentColorIndex !== 0) {
        turnStatus.textContent = translate('turnAI', { color });
    } else if (mode === GAME_MODES.ONE_PLAYER) {
        turnStatus.textContent = translate('turnHuman', { color });
    } else {
        turnStatus.textContent = translate('turnThreePlayer', { color });
    }
}

onLanguageChange(updateTurnStatus);

function cancelSelfishAiRequest() {
    if (pendingSelfishAiRequest) {
        pendingSelfishAiRequest.resolve(null);
        pendingSelfishAiRequest = null;
    }
    if (selfishAiWorker) {
        selfishAiWorker.terminate();
        selfishAiWorker = null;
    }
}

function requestSelfishAiMove() {
    return new Promise((resolve, reject) => {
        if (!selfishAiWorker) {
            try {
                const worker = new Worker(
                    new URL('./selfishAi.worker.js', import.meta.url),
                    { type: 'module' },
                );
                selfishAiWorker = worker;
                worker.addEventListener('message', event => {
                    if (selfishAiWorker !== worker) return;
                    if (event.data.requestId !== pendingSelfishAiRequest?.requestId) return;
                    const request = pendingSelfishAiRequest;
                    pendingSelfishAiRequest = null;
                    if (event.data.error) {
                        request.reject(new Error(event.data.error));
                    } else {
                        request.resolve(event.data.move);
                    }
                });
                worker.addEventListener('error', event => {
                    if (selfishAiWorker !== worker) return;
                    if (pendingSelfishAiRequest) {
                        pendingSelfishAiRequest.reject(
                            new Error(`Super-hard AI worker failed: ${event.message}`),
                        );
                        pendingSelfishAiRequest = null;
                    }
                    worker.terminate();
                    selfishAiWorker = null;
                });
            } catch (error) {
                reject(error);
                return;
            }
        }

        const requestId = selfishAiRequestId + 1;
        selfishAiRequestId = requestId;
        pendingSelfishAiRequest = { requestId, resolve, reject };
        try {
            selfishAiWorker.postMessage({
                requestId,
                position: {
                    red: occupiedCubes[0].cubesWithThisColor,
                    green: occupiedCubes[1].cubesWithThisColor,
                    blue: occupiedCubes[2].cubesWithThisColor,
                    nextPlayer: currentColorIndex,
                },
            });
        } catch (error) {
            pendingSelfishAiRequest = null;
            reject(error);
        }
    });
}

function setTurnBackground(colorIndex) {
    const playerColor = CUBE_COLORS[colorIndex].color;
    const { h, s } = playerColor.getHSL({});
    const backgroundColor = new Color().setHSL(h, s * 0.65, 0.055);
    renderer.domElement.style.backgroundColor = `#${backgroundColor.getHexString()}`;
}

const WINNER_COLORS = {
    Rojo: '#ef5350',
    Verde: '#66bb6a',
    Azul: '#42a5f5',
};
const WINNER_TRANSLATION_KEYS = {
    Rojo: 'colorRed',
    Verde: 'colorGreen',
    Azul: 'colorBlue',
};

function showWinnerModal(color, onClose, winnerNameKey = null) {
    const overlay = document.createElement('div');
    const isDraw = winnerNameKey === 'draw';
    overlay.className = isDraw
        ? 'winner-modal winner-modal--draw'
        : 'winner-modal';
    overlay.style.setProperty(
        '--winner-color',
        isDraw ? '#d5d8de' : WINNER_COLORS[color],
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
    badge.textContent = '✓';

    const title = document.createElement('h2');
    title.className = 'winner-modal__title';
    title.id = 'winner-modal-title';
    const updateTitle = () => {
        if (winnerNameKey === 'draw') {
            title.textContent = translate('drawTitle');
        } else if (winnerNameKey) {
            title.textContent = translate('playerWins', {
                player: translate(winnerNameKey),
            });
        } else {
            title.textContent = translate('winnerTitle', {
                color: translate(WINNER_TRANSLATION_KEYS[color]),
            });
        }
        message.textContent = translate(isDraw ? 'drawMessage' : 'winnerMessage');
        closeButton.textContent = translate(isDraw ? 'drawReset' : 'playAgain');
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
    let startTime;
    let frameId;

    const pulse = timestamp => {
        if (startTime === undefined) startTime = timestamp;
        const phase = ((timestamp - startTime) % PULSE_DURATION) / PULSE_DURATION;
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
    function showWinner(winnerColor, playerNameKey = null) {
        const winningMaterial = playerNameKey === 'draw'
            ? null
            : CUBE_COLORS[currentColorIndex];
        if (winningMaterial) {
            cubeList.forEach(cube => {
                cube.material = winningMaterial;
            });
        }

        const stopWinnerGlow = winningMaterial
            ? startWinnerGlow(winningMaterial)
            : () => {};
        let isModalClosed = false;
        winnerModalOpen = true;
        window.dispatchEvent(new Event('cube-winner-start'));
        showWinnerModal(winnerColor, () => {
            if (isModalClosed) return;
            isModalClosed = true;
            stopWinnerGlow();
            resetCubes();
            winnerModalOpen = false;
            window.dispatchEvent(new Event('cube-winner-end'));
        }, playerNameKey);
    }

    function scheduleAiTurn() {
        if (
            getGameMode() !== GAME_MODES.ONE_PLAYER
            || currentColorIndex === 0
            || winnerModalOpen
        ) return;

        aiTurnTimeout = window.setTimeout(() => {
            aiTurnTimeout = null;
            if (!gameStarted || winnerModalOpen || currentColorIndex === 0) return;
            const availableCubes = cubeList.filter(cube => !cube.material.touched);
            if (getAiDifficulty() === AI_DIFFICULTIES.SUPER_HARD) {
                requestSelfishAiMove()
                    .then(moveName => {
                        if (
                            !moveName
                            || !gameStarted
                            || winnerModalOpen
                            || currentColorIndex === 0
                        ) return;
                        const selectedCube = availableCubes.find(
                            cube => cube.shortName === moveName
                        );
                        if (!selectedCube) {
                            throw new Error(`Super-hard AI selected unavailable cube "${moveName}".`);
                        }
                        makeMove(selectedCube);
                    })
                    .catch(error => {
                        console.error(error);
                        turnStatus.textContent = translate('aiError');
                    });
                return;
            }
            const selectedCube = chooseAiMove(
                availableCubes,
                currentColorIndex,
                occupiedCubes,
                getAiDifficulty(),
                turnCount === 1,
            );
            if (selectedCube) makeMove(selectedCube);
        }, AI_MOVE_DELAY);
    }

    function makeMove(selectedCube) {
        if (!gameStarted || winnerModalOpen || selectedCube.material.touched) return;

        const moveColorIndex = currentColorIndex;
        const playerIndex = turnCount % 2;
        selectedCube.material = CUBE_COLORS[moveColorIndex];
        occupiedCubes[moveColorIndex].cubesWithThisColor.push(selectedCube.shortName);
        roundPlays.push(selectedCube.shortName);
        console.log([...roundPlays]);

        const moveWinner = getMoveWinner(
            occupiedCubes.map(color => color.cubesWithThisColor),
            moveColorIndex,
            getGameMode(),
            playerIndex,
        );

        turnCount += 1;
        if (moveWinner) {
            showWinner(
                occupiedCubes[moveWinner.colorIndex].color,
                moveWinner.playerNameKey,
            );
            return;
        }
        if (cubeList.every(cube => cube.material.touched)) {
            showWinner(null, 'draw');
            return;
        }

        currentColorIndex = (moveColorIndex + 1) % CUBE_COLORS.length;
        setTurnBackground(currentColorIndex);
        updateTurnStatus();
        scheduleAiTurn();
    }

    setTurnBackground(0);

    const canvas = renderer.domElement;
    const cubeTooltip = document.createElement('div');
    cubeTooltip.className = 'cube-tooltip';
    cubeTooltip.setAttribute('aria-hidden', 'true');
    cubeTooltip.hidden = true;
    document.body.appendChild(cubeTooltip);

    function getCubeAtPointer(event) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera1);
        return raycaster.intersectObjects(cubeList)[0]?.object;
    }

    canvas.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch' || event.buttons !== 0) {
            cubeTooltip.hidden = true;
            return;
        }

        const cube = getCubeAtPointer(event);
        if (!cube) {
            cubeTooltip.hidden = true;
            return;
        }

        cubeTooltip.textContent = `${cube.shortName} — ${cube.longName}`;
        cubeTooltip.hidden = false;
        cubeTooltip.style.left = `${Math.max(8, Math.min(event.clientX + 14, window.innerWidth - cubeTooltip.offsetWidth - 8))}px`;
        cubeTooltip.style.top = `${Math.max(8, Math.min(event.clientY + 14, window.innerHeight - cubeTooltip.offsetHeight - 8))}px`;
    });
    canvas.addEventListener('pointerleave', () => {
        cubeTooltip.hidden = true;
    });

    let touchStart = null;

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
        if (movement <= TAP_MOVEMENT_THRESHOLD) onClick(event);
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
                && currentColorIndex !== 0
            )
        ) return;

        const selectedCube = getCubeAtPointer(event);
        if (selectedCube) makeMove(selectedCube);
    }
}

export const configureGameMode = () => {
    gameStarted = true;
    document.querySelector('#app').appendChild(turnStatus);
    updateTurnStatus();
};

export const resetCubeGameState = () => {
    if (aiTurnTimeout !== null) {
        window.clearTimeout(aiTurnTimeout);
        aiTurnTimeout = null;
    }
    cancelSelfishAiRequest();
    currentColorIndex = 0;
    turnCount = 0;
    roundPlays.length = 0;
    occupiedCubes.forEach(colorList => {
        colorList.cubesWithThisColor = [];
    });
    setTurnBackground(0);
    updateTurnStatus();
};