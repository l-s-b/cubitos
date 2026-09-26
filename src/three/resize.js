import { camera1 } from "./cameras";
import { renderer } from "./renderer";

export default function resize() {
    window.addEventListener('resize', () => {
        camera1.aspect = innerWidth / innerHeight;
        camera1.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    })
}