import { camera1, updateCameraViewport } from "./cameras";
import { cubeGroup } from "./cubeGroup";
import { renderer } from "./renderer";

export default function resize() {
    let tutorialActive = false;

    const updateViewport = () => {
        const width = document.documentElement.clientWidth || window.innerWidth;
        const height = document.documentElement.clientHeight || window.innerHeight;

        updateCameraViewport(width, height);
        cubeGroup.position.set(0, 0, 0);
        if (tutorialActive) {
            const visibleHeight = 2 * Math.tan(camera1.fov * Math.PI / 360) * camera1.position.z;
            if (width >= height) {
                cubeGroup.position.x = visibleHeight * (width / height) / 6;
            } else {
                cubeGroup.position.y = -visibleHeight / 6;
            }
        }
        renderer.setSize(width, height);
    };

    window.addEventListener("cube-tutorial-start", () => {
        tutorialActive = true;
        updateViewport();
    });
    window.addEventListener("cube-tutorial-end", () => {
        tutorialActive = false;
        updateViewport();
    });
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", updateViewport);
    }
    updateViewport();
}