import { Color, Raycaster, Vector2 } from 'three';
import { renderer } from '../renderer';
import { camera1 } from '../cameras';
import { redCubeMaterial, greenCubeMaterial, blueCubeMaterial } from '../materials';
import winningCases from './winningCases';
import { resetCubes } from './reset';
import './winnerModal.css';
import { onLanguageChange, translate } from '../../language';

const raycaster = new Raycaster();
const mouse = new Vector2();
let currentColorIndex = 2;
let currentGameMode = 'three-player';
let turnCount = 0;
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
    turnStatus.textContent = currentGameMode === 'two-player'
        ? translate('turnTwoPlayer', {
            player: turnCount % 2 + 1,
            color,
        })
        : translate('turnThreePlayer', { color });
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
    function checkWinner(thisTurnsCubes) {
        const isWinner = winningCases.some(winningCase => (
                winningCase.every(winningPosition => thisTurnsCubes.includes(winningPosition))
            )
        )
        if (isWinner) { 
            turnStatus.hidden = true;
            const winner = occupiedCubes[currentColorIndex];
            const winningMaterial = cubeColors[currentColorIndex];
            cubeList.forEach(cube => {
                cube.material = winningMaterial;
            });

            const stopWinnerGlow = startWinnerGlow(winningMaterial);
            let isModalClosed = false;
            window.dispatchEvent(new Event('cube-winner-start'));
            const winnerNameKey = currentGameMode === 'two-player'
                ? currentColorIndex === 1 ? 'playerTwo' : 'playerOne'
                : null;
            showWinnerModal(winner.color, () => {
                if (isModalClosed) return;
                isModalClosed = true;
                stopWinnerGlow();
                resetCubes();
                window.dispatchEvent(new Event('cube-winner-end'));
            }, false, winnerNameKey);
            return true;
        }
        return false;
    }

    function showDraw() {
        let isModalClosed = false;
        turnStatus.hidden = true;
        window.dispatchEvent(new Event('cube-winner-start'));
        showWinnerModal(null, () => {
            if (isModalClosed) return;
            isModalClosed = true;
            resetCubes();
            window.dispatchEvent(new Event('cube-winner-end'));
        }, true);
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
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera1);
        const intersects = raycaster.intersectObjects(cubeList);

        if (intersects.length > 0) {
            const selectedCube = intersects[0].object;
            const currentColor = selectedCube.material;
            if (currentColor.touched) {return}
            else if (currentColorIndex === 2) {currentColorIndex = 0} else {currentColorIndex++};
            selectedCube.material = cubeColors[currentColorIndex];
            occupiedCubes[currentColorIndex].cubesWithThisColor.push(selectedCube.shortName);
            turnCount += 1;
            const hasWinner = checkWinner(occupiedCubes[currentColorIndex].cubesWithThisColor);
            if (!hasWinner && cubeList.every(cube => cube.material.touched)) {
                showDraw();
            } else if (!hasWinner) {
                const nextColorIndex = (currentColorIndex + 1) % cubeColors.length;
                setTurnBackground(nextColorIndex);
                updateTurnStatus();
            }
        }

    }
}
export const resetCubeGameState = () => {
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
    currentGameMode = mode;
    gameStarted = true;
    resetCubeGameState();
    document.querySelector('#app').appendChild(turnStatus);
    turnStatus.hidden = false;
    updateTurnStatus();
};