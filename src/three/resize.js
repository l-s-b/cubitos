import { updateCameraViewport } from "./cameras";
import { renderer } from "./renderer";

export default function resize() {
    const updateViewport = () => {
        const width = document.documentElement.clientWidth || window.innerWidth;
        const height = document.documentElement.clientHeight || window.innerHeight;

        updateCameraViewport(width, height);
        renderer.setSize(width, height);
    };

    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", updateViewport);
    }
    updateViewport();
}