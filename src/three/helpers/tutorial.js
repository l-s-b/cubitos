import { cubeList } from '../cube';
import { cubeGroup } from '../cubeGroup';
import {
    blueCubeMaterial,
    greenCubeMaterial,
    redCubeMaterial,
    untouchedCubeMaterial,
} from '../materials';
import { Color } from 'three';
import { renderer } from '../renderer';
import { flipWinnerViewDown, prepareWinnerView } from './rotation';
import DEMONSTRATIONS from './tutorialExamples.js';

let originalRotation = null;
let originalCanvasBackground = '';
let animationToken = 0;
const DEMONSTRATION_MATERIALS = [
    redCubeMaterial,
    greenCubeMaterial,
    blueCubeMaterial,
    redCubeMaterial,
];

function getCube(name) {
    const cube = cubeList.find(candidate => candidate.shortName === name);
    if (!cube) throw new Error(`Tutorial references unknown cube "${name}".`);
    return cube;
}

function clearDemo() {
    cubeList.forEach(cube => {
        cube.material = untouchedCubeMaterial;
    });
}

function showLine(line, material) {
    clearDemo();
    line.forEach(name => {
        getCube(name).material = material;
    });
}

function setTutorialBackground(material) {
    const { h, s } = material.color.getHSL({});
    const backgroundColor = new Color().setHSL(h, s * 0.65, 0.055);
    renderer.domElement.style.backgroundColor = `#${backgroundColor.getHexString()}`;
}

async function animateTutorialRotation(rotation) {
    window.dispatchEvent(new Event('cube-tutorial-animation-start'));
    try {
        await rotation();
    } finally {
        window.dispatchEvent(new Event('cube-tutorial-animation-end'));
    }
}

export function beginTutorial() {
    animationToken += 1;
    originalRotation = cubeGroup.quaternion.clone();
    originalCanvasBackground = renderer.domElement.style.backgroundColor;
    clearDemo();
    window.dispatchEvent(new Event('cube-tutorial-start'));
}

export async function showTutorialStep(index) {
    const token = animationToken + 1;
    animationToken = token;
    const demonstration = DEMONSTRATIONS[index];
    if (!demonstration) throw new RangeError(`Unknown tutorial step "${index}".`);

    const material = DEMONSTRATION_MATERIALS[index];
    setTutorialBackground(material);
    showLine(demonstration.line, material);
    const centerCube = getCube(demonstration.center);
    const firstCube = getCube(demonstration.line[0]);
    const lastCube = getCube(demonstration.line[2]);
    const lineDirection = lastCube.position.clone().sub(firstCube.position);
    const screenAxis = demonstration.screenAxis || null;
    await animateTutorialRotation(() => prepareWinnerView(centerCube.position, {
        lineDirection,
        screenAxis,
        rotationDirection: demonstration.rotationDirection || null,
    }));
    return token === animationToken;
}

export async function straightenTutorialV() {
    const token = animationToken + 1;
    animationToken = token;
    const demonstration = DEMONSTRATIONS[3];
    await animateTutorialRotation(flipWinnerViewDown);
    return token === animationToken;
}

export function endTutorial() {
    animationToken += 1;
    clearDemo();
    if (originalRotation) {
        cubeGroup.quaternion.copy(originalRotation);
        originalRotation = null;
    }
    renderer.domElement.style.backgroundColor = originalCanvasBackground;
    originalCanvasBackground = '';
    window.dispatchEvent(new Event('cube-tutorial-end'));
}
