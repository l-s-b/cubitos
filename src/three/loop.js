import { Clock } from "three";
import { camera1 } from "./cameras";
import {
    rotationChecks,
    settleCubeGroup,
    updateDragInertia,
    updateWinnerPreparation,
    updateWinnerMotion,
} from "./helpers/rotation";
import { renderer } from "./renderer";
import { scene } from "./scene";

const clock = new Clock();

export default function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    rotationChecks();
    updateDragInertia(deltaTime);
    settleCubeGroup(deltaTime);
    updateWinnerPreparation(deltaTime);
    updateWinnerMotion(deltaTime);
    renderer.render(scene, camera1);
}