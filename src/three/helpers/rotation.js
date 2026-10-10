import { cubeGroup } from "../cubeGroup";
import { renderer } from "../renderer";
import "./buttons.css";
import { Matrix4, Quaternion, Vector3 } from "three";
import { onLanguageChange, translate } from "../../language";

const app = document.querySelector("#app");

export const rotationFlags = {
    rotateUp: false,
    rotateDown: false,
    rotateLeft: false,
    rotateRight: false,
    rotateClockwise: false,
    rotateCounterClockwise: false,
};

const orthogonalRotations = createOrthogonalRotations();
const settlingDuration = 3;
const snapThreshold = 0.0001;
const AI_ROTATION_MAX_DURATION = 2;
const WINNER_ROTATION_MAX_DURATION = 3;
const minimumRotationAngle = Math.PI / 2;
const minimumRotationThreshold = Math.PI / 4;
// Use "axis-locked" to select one rotation axis after the first 10 pointer deltas.
const dragRotationMode = "compound";
let forcedRotationTarget = null;
let isDragging = false;
let dragVelocityX = 0;
let dragVelocityY = 0;
let lastDragTimestamp = 0;
let lastPointerX = 0;
let lastPointerY = 0;
let activePointerId = null;
let dragAxis = null;
let dragDeltaCount = 0;
let pendingDragX = 0;
let pendingDragY = 0;
const dragInertia = {
    x: 0,
    y: 0,
};
const dragInertiaDamping = 4.5;
const dragInertiaThreshold = 0.08;
const maxDragInertiaSpeed = 5.5;
let winnerMotionActive = false;
let winnerMotionElapsed = 0;
let winnerPreparationActive = false;
let winnerControlsLocked = false;
let winnerPreparationElapsed = 0;
let winnerPreparationDuration = 0;
const winnerPreparationStart = new Quaternion();
const winnerPreparationTarget = new Quaternion();
const winnerPreparationAdjustment = new Quaternion();
const winnerCurrentInverse = new Quaternion();
const winnerCandidateDelta = new Quaternion();
const winnerBestDelta = new Quaternion();
const winnerCenterDirection = new Vector3();
const winnerLineDirection = new Vector3();
const winnerCandidateDirection = new Vector3();
const winnerBestDirection = new Vector3();
const winnerScreenDirection = new Vector3();
const winnerRightTurnAxis = new Vector3(0, 1, 0);
const winnerScreenDirections = {
    x: new Vector3(1, 0, 0),
    y: new Vector3(0, 1, 0),
};
const winnerDownwardAxis = new Vector3(1, 0, 0);
let winnerPreparationResolve = null;
const winnerMotionSpeeds = {
    x: { min: 0, max: 0, frequency: 0, phase: 0, direction: 1 },
    y: { min: 0, max: 0, frequency: 0, phase: 0, direction: 1 },
    z: { min: 0, max: 0, frequency: 0, phase: 0, direction: 1 },
};
const winnerMotionBase = new Quaternion();
const winnerMotionXRotation = new Quaternion();
const winnerMotionYRotation = new Quaternion();
const winnerMotionZRotation = new Quaternion();
const winnerMotionXAxis = new Vector3(1, 0, 0);
const winnerMotionYAxis = new Vector3(0, 1, 0);
const winnerMotionZAxis = new Vector3(0, 0, 1);
const winnerMotionRandomRange = (min, max) => min + Math.random() * (max - min);
const buttonPresses = new Map();
const settlingState = {
    start: new Quaternion(),
    target: new Quaternion(),
    elapsed: 0,
    active: false,
};

const buttonRotations = {
    rotateUp: [new Vector3(1, 0, 0), -1],
    rotateDown: [new Vector3(1, 0, 0), 1],
    rotateLeft: [new Vector3(0, 1, 0), -1],
    rotateRight: [new Vector3(0, 1, 0), 1],
    rotateClockwise: [new Vector3(0, 0, 1), -1],
    rotateCounterClockwise: [new Vector3(0, 0, 1), 1],
};
const buttonIdsByKey = new Map([
    ["w", "rotateUp"],
    ["s", "rotateDown"],
    ["a", "rotateLeft"],
    ["d", "rotateRight"],
    ["e", "rotateClockwise"],
    ["q", "rotateCounterClockwise"],
]);

function createOrthogonalRotations() {
    const rotations = [];
    const axes = [
        new Vector3(1, 0, 0),
        new Vector3(-1, 0, 0),
        new Vector3(0, 1, 0),
        new Vector3(0, -1, 0),
        new Vector3(0, 0, 1),
        new Vector3(0, 0, -1),
    ];

    axes.forEach(zAxis => {
        axes.forEach(yAxis => {
            if (Math.abs(zAxis.dot(yAxis)) > 0) return;

            const xAxis = new Vector3().crossVectors(yAxis, zAxis);
            const rotation = new Matrix4().makeBasis(xAxis, yAxis, zAxis);
            rotations.push(new Quaternion().setFromRotationMatrix(rotation));
        });
    });

    return rotations;
}

function closestOrthogonalRotation() {
    return closestRotationTo(cubeGroup.quaternion);
}

function closestRotationTo(source) {
    return orthogonalRotations.reduce((closest, rotation) => (
        source.angleTo(rotation) < source.angleTo(closest)
            ? rotation
            : closest
    ));
}

function getSignedRotationAlongAxis(rotation, currentInverse, axis, result) {
    result.copy(rotation).multiply(currentInverse).normalize();
    if (result.w < 0) {
        result.set(-result.x, -result.y, -result.z, -result.w);
    }
    const vectorLength = Math.hypot(result.x, result.y, result.z);
    if (vectorLength === 0) return 0;
    const angle = 2 * Math.atan2(vectorLength, result.w);
    return angle * (
        result.x * axis.x + result.y * axis.y + result.z * axis.z
    ) / vectorLength;
}

function setForcedRotationTarget(pressStart, axis, direction) {
    const minimumRotation = new Quaternion().setFromAxisAngle(
        axis,
        minimumRotationAngle * direction
    );
    const desiredRotation = pressStart.clone().premultiply(minimumRotation);
    forcedRotationTarget = closestRotationTo(desiredRotation);
}

function stopDragInertia() {
    dragInertia.x = 0;
    dragInertia.y = 0;
}

function randomizeWinnerMotionSpeed(speed, minSpeed, maxSpeed) {
    speed.min = winnerMotionRandomRange(minSpeed, maxSpeed * 0.45);
    speed.max = winnerMotionRandomRange(
        Math.max(speed.min, maxSpeed * 0.55),
        maxSpeed
    );
    speed.frequency = winnerMotionRandomRange(0.35, 0.85);
    speed.phase = winnerMotionRandomRange(0, Math.PI * 2);
    speed.direction = Math.random() < 0.5 ? -1 : 1;
}

function setupDragRotation() {
    const canvas = renderer.domElement;
    const dragSensitivity = 0.005;

    window.addEventListener("cube-winner-preparing", () => {
        winnerControlsLocked = true;
        winnerPreparationActive = false;
        stopDragInertia();
        isDragging = false;
        if (activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
            canvas.releasePointerCapture(activePointerId);
        }
        activePointerId = null;
        settlingState.active = false;
        forcedRotationTarget = null;
        Object.keys(rotationFlags).forEach(id => {
            rotationFlags[id] = false;
        });
        buttonPresses.clear();
    });
    window.addEventListener("cube-tutorial-start", () => {
        winnerControlsLocked = true;
        stopDragInertia();
        isDragging = false;
        activePointerId = null;
        settlingState.active = false;
        forcedRotationTarget = null;
        Object.keys(rotationFlags).forEach(id => {
            rotationFlags[id] = false;
        });
        buttonPresses.clear();
    });
    window.addEventListener("cube-tutorial-end", () => {
        winnerControlsLocked = false;
    });
    window.addEventListener("cube-winner-start", () => {
        winnerControlsLocked = true;
        winnerMotionBase.copy(cubeGroup.quaternion);
        winnerMotionElapsed = 0;
        randomizeWinnerMotionSpeed(winnerMotionSpeeds.x, 0.04, 0.24);
        randomizeWinnerMotionSpeed(winnerMotionSpeeds.y, 0.05, 0.32);
        randomizeWinnerMotionSpeed(winnerMotionSpeeds.z, 0.02, 0.14);
        winnerMotionActive = true;
        stopDragInertia();
        settlingState.active = false;
        Object.keys(rotationFlags).forEach(id => {
            rotationFlags[id] = false;
        });
        buttonPresses.clear();
    });
    window.addEventListener("cube-winner-preparation-end", () => {
        winnerControlsLocked = false;
    });
    window.addEventListener("cube-winner-end", () => {
        cubeGroup.quaternion.copy(winnerMotionBase);
        winnerMotionActive = false;
        winnerMotionElapsed = 0;
        settlingState.active = false;
        winnerControlsLocked = false;
    });

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", event => {
        if (winnerControlsLocked || event.button !== 0 || activePointerId !== null) return;

        activePointerId = event.pointerId;
        isDragging = true;
        dragVelocityX = 0;
        dragVelocityY = 0;
        lastDragTimestamp = event.timeStamp;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        stopDragInertia();
        dragAxis = null;
        dragDeltaCount = 0;
        pendingDragX = 0;
        pendingDragY = 0;
        forcedRotationTarget = null;
        settlingState.active = false;
        canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", event => {
        if (!isDragging || event.pointerId !== activePointerId) return;

        const deltaX = event.clientX - lastPointerX;
        const deltaY = event.clientY - lastPointerY;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        const elapsed = (event.timeStamp - lastDragTimestamp) / 1000;
        if (elapsed > 0) {
            const instantaneousVelocityX = deltaX * dragSensitivity / elapsed;
            const instantaneousVelocityY = deltaY * dragSensitivity / elapsed;
            dragVelocityX += (instantaneousVelocityX - dragVelocityX) * 0.45;
            dragVelocityY += (instantaneousVelocityY - dragVelocityY) * 0.45;
        }
        lastDragTimestamp = event.timeStamp;

        if (dragRotationMode === "axis-locked") {
            if (!dragAxis) {
                pendingDragX += deltaX;
                pendingDragY += deltaY;
                dragDeltaCount += 1;

                if (dragDeltaCount < 10) return;

                dragAxis = Math.abs(pendingDragX) >= Math.abs(pendingDragY)
                    ? "x"
                    : "y";
                return;
            }

            if (dragAxis === "x") {
                rotateAroundWorldAxis(
                    cubeGroup,
                    new Vector3(0, 1, 0),
                    deltaX * dragSensitivity
                );
            } else {
                rotateAroundWorldAxis(
                    cubeGroup,
                    new Vector3(1, 0, 0),
                    deltaY * dragSensitivity
                );
            }
            return;
        }

        // Compound mode maps horizontal and vertical movement to Y and X rotations.
        if (deltaX !== 0) {
            rotateAroundWorldAxis(
                cubeGroup,
                new Vector3(0, 1, 0),
                deltaX * dragSensitivity
            );
        }
        if (deltaY !== 0) {
            rotateAroundWorldAxis(
                cubeGroup,
                new Vector3(1, 0, 0),
                deltaY * dragSensitivity
            );
        }
    });
    canvas.addEventListener("pointerup", event => {
        if (!isDragging || event.pointerId !== activePointerId) return;

        isDragging = false;
        activePointerId = null;
        dragAxis = null;
        dragDeltaCount = 0;
        pendingDragX = 0;
        pendingDragY = 0;
        const elapsed = (event.timeStamp - lastDragTimestamp) / 1000;
        if (elapsed > 0) {
            const releaseDecay = Math.exp(-dragInertiaDamping * elapsed);
            dragVelocityX *= releaseDecay;
            dragVelocityY *= releaseDecay;
        }
        const speed = Math.hypot(dragVelocityX, dragVelocityY);
        if (speed > dragInertiaThreshold) {
            const speedScale = Math.min(1, maxDragInertiaSpeed / speed);
            dragInertia.x = dragVelocityX * speedScale;
            dragInertia.y = dragVelocityY * speedScale;
        }
        canvas.releasePointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointercancel", event => {
        if (event.pointerId !== activePointerId) return;

        isDragging = false;
        activePointerId = null;
        dragVelocityX = 0;
        dragVelocityY = 0;
        stopDragInertia();
        dragAxis = null;
        dragDeltaCount = 0;
        pendingDragX = 0;
        pendingDragY = 0;
        if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }
    });
}

export function getCubeGravityTarget() {
    return forcedRotationTarget || closestOrthogonalRotation();
}

export function rotationButtons() {
    setupDragRotation();

    const buttonDefinitions = [
        ["rotateUp", "▲", "w", "rotateUp"],
        ["rotateDown", "▼", "s", "rotateDown"],
        ["rotateLeft", "◀", "a", "rotateLeft"],
        ["rotateRight", "▶", "d", "rotateRight"],
        ["rotateClockwise", "↻", "e", "rotateClockwise"],
        ["rotateCounterClockwise", "↺", "q", "rotateCounterClockwise"],
    ];
    const buttons = [];

    buttonDefinitions.forEach(([id, label, key, translationKey]) => {
        const btn = document.createElement("button");
        buttons.push(btn);
        btn.id = id;
        btn.innerText = label;
        btn.setAttribute("aria-label", translate(translationKey));
        btn.title = `${translate(translationKey)} (${key.toUpperCase()})`;
        app.appendChild(btn);
        window.addEventListener("cube-tutorial-start", () => {
            btn.disabled = true;
        });
        window.addEventListener("cube-tutorial-end", () => {
            btn.disabled = false;
            btn.classList.remove("tutorial-controls-muted");
        });
        window.addEventListener("cube-tutorial-animation-start", () => {
            btn.classList.add("tutorial-controls-muted");
        });
        window.addEventListener("cube-tutorial-animation-end", () => {
            btn.classList.remove("tutorial-controls-muted");
        });

        const start = () => {
            if (winnerControlsLocked) return;
            stopDragInertia();
            rotationFlags[id] = true;
            forcedRotationTarget = null;
            settlingState.active = false;
            buttonPresses.set(id, cubeGroup.quaternion.clone());
        };
        const stop = () => {
            rotationFlags[id] = false;
            const pressStart = buttonPresses.get(id);
            buttonPresses.delete(id);

            if (!pressStart) return;

            if (pressStart.angleTo(cubeGroup.quaternion) < minimumRotationThreshold) {
                const [axis, direction] = buttonRotations[id];
                setForcedRotationTarget(pressStart, axis, direction);
            }
            settlingState.active = false;
        };

        btn.addEventListener("mousedown", start);
        btn.addEventListener("mouseup", stop);
        btn.addEventListener("mouseleave", stop);
        btn.addEventListener("touchstart", start);
        btn.addEventListener("touchend", stop);
    });

    onLanguageChange(() => {
        buttonDefinitions.forEach(([id, , key, translationKey]) => {
            const button = document.getElementById(id);
            const label = translate(translationKey);
            button.setAttribute("aria-label", label);
            button.title = `${label} (${key.toUpperCase()})`;
        });
    });

    window.addEventListener("keydown", event => {
        const id = buttonIdsByKey.get(event.key.toLowerCase());
        if (!winnerControlsLocked && id && !rotationFlags[id]) {
            stopDragInertia();
            rotationFlags[id] = true;
            buttonPresses.set(id, cubeGroup.quaternion.clone());
            forcedRotationTarget = null;
        }
    });
    window.addEventListener("keyup", event => {
        const id = buttonIdsByKey.get(event.key.toLowerCase());
        if (id && rotationFlags[id]) {
            rotationFlags[id] = false;
            const pressStart = buttonPresses.get(id);
            buttonPresses.delete(id);

            if (pressStart && pressStart.angleTo(cubeGroup.quaternion) < minimumRotationThreshold) {
                const [axis, direction] = buttonRotations[id];
                setForcedRotationTarget(pressStart, axis, direction);
            }
        }
    });
};

export function rotateAroundWorldAxis(object, axis, angle) {
  const q = new Quaternion();
  q.setFromAxisAngle(axis.normalize(), angle);
  object.quaternion.premultiply(q);
}

export function rotationChecks() {
    if (winnerMotionActive || winnerPreparationActive || winnerControlsLocked) return;

    if (Object.values(rotationFlags).some(Boolean)) {
        settlingState.active = false;
    }
    if (rotationFlags.rotateUp) {
        rotateAroundWorldAxis(cubeGroup, new Vector3(1, 0, 0), -0.05);
    }
    if (rotationFlags.rotateDown) {
        rotateAroundWorldAxis(cubeGroup, new Vector3(1, 0, 0), 0.05);
    }
    if (rotationFlags.rotateLeft) {
        rotateAroundWorldAxis(cubeGroup, new Vector3(0, 1, 0), -0.05);
    }
    if (rotationFlags.rotateRight) {
        rotateAroundWorldAxis(cubeGroup, new Vector3(0, 1, 0), 0.05);
    }
    if (rotationFlags.rotateClockwise) {
        rotateAroundWorldAxis(cubeGroup, new Vector3(0, 0, 1), -0.05);
    }
    if (rotationFlags.rotateCounterClockwise) {
        rotateAroundWorldAxis(cubeGroup, new Vector3(0, 0, 1), 0.05);
    }
}

export function updateDragInertia(deltaTime) {
    if (isDragging || winnerMotionActive) return;

    const speed = Math.hypot(dragInertia.x, dragInertia.y);
    if (speed <= dragInertiaThreshold) {
        stopDragInertia();
        return;
    }

    const decay = Math.exp(-dragInertiaDamping * deltaTime);
    const rotationScale = (1 - decay) / dragInertiaDamping;
    rotateAroundWorldAxis(
        cubeGroup,
        new Vector3(0, 1, 0),
        dragInertia.x * rotationScale
    );
    rotateAroundWorldAxis(
        cubeGroup,
        new Vector3(1, 0, 0),
        dragInertia.y * rotationScale
    );
    dragInertia.x *= decay;
    dragInertia.y *= decay;
}

export function settleCubeGroup(deltaTime) {
    if (
        winnerMotionActive
        || winnerPreparationActive
        || winnerControlsLocked
        || isDragging
        || dragInertia.x !== 0
        || dragInertia.y !== 0
        || Object.values(rotationFlags).some(Boolean)
    ) return;

    const targetRotation = getCubeGravityTarget();
    const distance = cubeGroup.quaternion.angleTo(targetRotation);

    if (distance <= snapThreshold) {
        cubeGroup.quaternion.copy(targetRotation);
        forcedRotationTarget = null;
        settlingState.active = false;
        return;
    }

    if (!settlingState.active) {
        settlingState.start.copy(cubeGroup.quaternion);
        settlingState.target.copy(targetRotation);
        settlingState.elapsed = 0;
        settlingState.active = true;
    }

    settlingState.elapsed = Math.min(
        settlingState.elapsed + deltaTime,
        settlingDuration
    );
    const progress = settlingState.elapsed / settlingDuration;
    const easedProgress = progress < 0.5
        ? 4 * progress ** 3
        : 1 - ((-2 * progress + 2) ** 3) / 2;

    cubeGroup.quaternion.copy(settlingState.start).slerp(
        settlingState.target,
        easedProgress
    );
}

export function updateWinnerMotion(deltaTime) {
    if (!winnerMotionActive) return;

    winnerMotionElapsed += deltaTime;
    const getAngle = speed => {
        const wave = (
            Math.sin(winnerMotionElapsed * speed.frequency + speed.phase) + 1
        ) / 2;
        const angularSpeed = speed.min + (speed.max - speed.min) * wave;
        return angularSpeed * speed.direction * deltaTime;
    };

    winnerMotionXRotation.setFromAxisAngle(
        winnerMotionXAxis,
        getAngle(winnerMotionSpeeds.x)
    );
    winnerMotionYRotation.setFromAxisAngle(
        winnerMotionYAxis,
        getAngle(winnerMotionSpeeds.y)
    );
    winnerMotionZRotation.setFromAxisAngle(
        winnerMotionZAxis,
        getAngle(winnerMotionSpeeds.z)
    );
    cubeGroup.quaternion
        .premultiply(winnerMotionYRotation)
        .premultiply(winnerMotionXRotation)
        .premultiply(winnerMotionZRotation)
        .normalize();
}

export function prepareWinnerView(
    winningCenterPosition,
    {
        isWin = false,
        lineDirection = null,
        screenAxis = null,
        rotationDirection = null,
    } = {},
) {
    window.dispatchEvent(new Event("cube-winner-preparing"));
    winnerCenterDirection.copy(winningCenterPosition).normalize();
    if (lineDirection && screenAxis) {
        winnerLineDirection.copy(lineDirection).normalize();
        winnerScreenDirection.copy(winnerScreenDirections[screenAxis]);
    } else {
        winnerLineDirection.set(0, 0, 0);
        winnerScreenDirection.set(0, 0, 0);
    }
    winnerCurrentInverse.copy(cubeGroup.quaternion).invert();
    const targetRotation = orthogonalRotations.reduce((best, rotation) => {
        const facingScore = winnerCandidateDirection
            .copy(winnerCenterDirection)
            .applyQuaternion(rotation)
            .z;
        const bestFacingScore = winnerBestDirection
            .copy(winnerCenterDirection)
            .applyQuaternion(best)
            .z;
        if (facingScore > bestFacingScore + snapThreshold) return rotation;
        if (Math.abs(facingScore - bestFacingScore) > snapThreshold) return best;
        const lineScore = winnerCandidateDirection
            .copy(winnerLineDirection)
            .applyQuaternion(rotation)
            .dot(winnerScreenDirection);
        const bestLineScore = winnerBestDirection
            .copy(winnerLineDirection)
            .applyQuaternion(best)
            .dot(winnerScreenDirection);
        if (lineScore > bestLineScore + snapThreshold) return rotation;
        if (Math.abs(lineScore - bestLineScore) > snapThreshold) return best;
        const rotationAxis = rotationDirection === "right"
            ? winnerRightTurnAxis
            : null;
        if (rotationAxis) {
            const turnScore = getSignedRotationAlongAxis(
                rotation,
                winnerCurrentInverse,
                rotationAxis,
                winnerCandidateDelta,
            );
            const bestTurnScore = getSignedRotationAlongAxis(
                best,
                winnerCurrentInverse,
                rotationAxis,
                winnerBestDelta,
            );
            if (turnScore > bestTurnScore + snapThreshold) return rotation;
            if (Math.abs(turnScore - bestTurnScore) > snapThreshold) return best;
        }
        if (cubeGroup.quaternion.angleTo(rotation) < cubeGroup.quaternion.angleTo(best)) {
            return rotation;
        }
        return best;
    });
    return animateWinnerPreparation(targetRotation, isWin);
}

export function flipWinnerViewDown() {
    window.dispatchEvent(new Event("cube-winner-preparing"));
    winnerPreparationAdjustment.setFromAxisAngle(
        winnerDownwardAxis,
        minimumRotationAngle,
    );
    winnerPreparationTarget
        .copy(winnerPreparationAdjustment)
        .multiply(cubeGroup.quaternion)
        .normalize();
    return animateWinnerPreparation(winnerPreparationTarget);
}

function animateWinnerPreparation(targetRotation, isWin = false) {
    const angle = cubeGroup.quaternion.angleTo(targetRotation);
    winnerPreparationStart.copy(cubeGroup.quaternion);
    winnerPreparationTarget.copy(targetRotation);
    winnerPreparationElapsed = 0;
    winnerPreparationDuration = Math.min(
        isWin ? WINNER_ROTATION_MAX_DURATION : AI_ROTATION_MAX_DURATION,
        Math.max(0.35, angle * 0.7),
    );
    winnerPreparationActive = angle > snapThreshold;
    forcedRotationTarget = null;
    settlingState.active = false;

    if (!winnerPreparationActive) {
        cubeGroup.quaternion.copy(winnerPreparationTarget);
        return Promise.resolve();
    }

    return new Promise(resolve => {
        winnerPreparationResolve = resolve;
    });
}

export function updateWinnerPreparation(deltaTime) {
    if (!winnerPreparationActive) return;

    winnerPreparationElapsed = Math.min(
        winnerPreparationElapsed + deltaTime,
        winnerPreparationDuration,
    );
    const progress = winnerPreparationElapsed / winnerPreparationDuration;
    const easedProgress = 1 - (1 - progress) ** 3;
    cubeGroup.quaternion.copy(winnerPreparationStart).slerp(
        winnerPreparationTarget,
        easedProgress,
    );
    if (progress === 1) {
        cubeGroup.quaternion.copy(winnerPreparationTarget);
        winnerPreparationActive = false;
        winnerPreparationResolve?.();
        winnerPreparationResolve = null;
    }
}