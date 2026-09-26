import { PerspectiveCamera } from "three";
import { renderer } from "./renderer";
import { light1 } from "./lights";

const camera1 = new PerspectiveCamera();

function setCamera() {
    camera1.add(light1);
    camera1.fov = 40;
    camera1.aspect = window.innerWidth / window.innerHeight;
    camera1.near = 0.1;
    camera1.far = 200;  
    camera1.position.z = 7.2;
    camera1.updateProjectionMatrix();
}

export { camera1 };

export default setCamera;
