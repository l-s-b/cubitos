import { WebGLRenderer } from "three";

const renderer = new WebGLRenderer({alpha: true, antialias: true});

function setRenderEngine() {
    const rendererDOM = renderer.domElement;
    document.querySelector('#app').appendChild(rendererDOM);
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export { renderer };
export default setRenderEngine;
