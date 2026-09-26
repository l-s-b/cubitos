import { cubeGroup } from "../cubeGroup";
import { renderer } from "../renderer";
import "./buttons.css";
import { Matrix4, Quaternion, Vector3 } from "three";

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
const minimumRotationAngle = Math.PI / 2;
const minimumRotationThreshold = Math.PI / 4;
// Use "axis-locked" to select one rotation axis after the first 10 pointer deltas.
const dragRotationMode = "compound";
let forcedRotationTarget = null;
let isDragging = false;
let dragVelocityX = 0;
let dragVelocityY = 0;
let lastDragTimestamp = 0;
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

    window.addEventListener("cube-winner-start", () => {
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
    window.addEventListener("cube-winner-end", () => {
        cubeGroup.quaternion.copy(winnerMotionBase);
        winnerMotionActive = false;
        winnerMotionElapsed = 0;
        settlingState.active = false;
    });

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", event => {
        if (event.button !== 0) return;

        isDragging = true;
        dragVelocityX = 0;
        dragVelocityY = 0;
        lastDragTimestamp = event.timeStamp;
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
        if (!isDragging) return;

        const elapsed = (event.timeStamp - lastDragTimestamp) / 1000;
        if (elapsed > 0) {
            const instantaneousVelocityX = event.movementX * dragSensitivity / elapsed;
            const instantaneousVelocityY = event.movementY * dragSensitivity / elapsed;
            dragVelocityX += (instantaneousVelocityX - dragVelocityX) * 0.45;
            dragVelocityY += (instantaneousVelocityY - dragVelocityY) * 0.45;
        }
        lastDragTimestamp = event.timeStamp;

        if (dragRotationMode === "axis-locked") {
            if (!dragAxis) {
                pendingDragX += event.movementX;
                pendingDragY += event.movementY;
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
                    event.movementX * dragSensitivity
                );
            } else {
                rotateAroundWorldAxis(
                    cubeGroup,
                    new Vector3(1, 0, 0),
                    event.movementY * dragSensitivity
                );
            }
            return;
        }

        // Compound mode maps horizontal and vertical movement to Y and X rotations.
        if (event.movementX !== 0) {
            rotateAroundWorldAxis(
                cubeGroup,
                new Vector3(0, 1, 0),
                event.movementX * dragSensitivity
            );
        }
        if (event.movementY !== 0) {
            rotateAroundWorldAxis(
                cubeGroup,
                new Vector3(1, 0, 0),
                event.movementY * dragSensitivity
            );
        }
    });
    canvas.addEventListener("pointerup", event => {
        if (!isDragging) return;

        isDragging = false;
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
        isDragging = false;
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

    const buttons = [
        ["rotateUp", "▲", "w"],
        ["rotateDown", "▼", "s"],
        ["rotateLeft", "◀", "a"],
        ["rotateRight", "▶", "d"],
        ["rotateClockwise", "CW", "e"],
        ["rotateCounterClockwise", "CC", "q"],
    ];

    buttons.forEach(([id, label, key]) => {
        const btn = document.createElement("button");
        btn.id = id;
        btn.innerText = label;
        app.appendChild(btn);

        const start = () => {
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

    window.addEventListener("keydown", event => {
        const id = buttonIdsByKey.get(event.key.toLowerCase());
        if (id && !rotationFlags[id]) {
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
    if (winnerMotionActive) return;

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