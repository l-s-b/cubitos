import { PerspectiveCamera } from "three";
import { renderer } from "./renderer";
import { light1 } from "./lights";

const camera1 = new PerspectiveCamera();
const DEFAULT_CAMERA_DISTANCE = 7.2;

export function updateCameraViewport(width, height) {
    camera1.aspect = width / height;
    camera1.position.z = height > width
        ? DEFAULT_CAMERA_DISTANCE * 1.5
        : DEFAULT_CAMERA_DISTANCE;
    camera1.updateProjectionMatrix();
}

function setCamera() {
    camera1.add(light1);
    camera1.fov = 40;
    camera1.near = 0.1;
    camera1.far = 200;
    updateCameraViewport(
        document.documentElement.clientWidth || window.innerWidth,
        document.documentElement.clientHeight || window.innerHeight,
    );
}

export { camera1 };

export default setCamera;
