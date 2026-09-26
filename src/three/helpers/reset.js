import { cubeList } from "../cube";
import { untouchedCubeMaterial } from "../materials";
import { resetCubeColorOrder } from "./cubeClick";

  export function resetCubes() {
    cubeList.forEach(cube => {
        cube.material = untouchedCubeMaterial;
        resetCubeColorOrder();
    })
  }

export default function renderCubeResetter() {
  const resetButton = document.createElement('button');
  resetButton.id = "reset";
  resetButton.innerText = "RESET";
  const app = document.querySelector('#app');
  app.appendChild(resetButton);

  resetButton.addEventListener('click', resetCubes)  
}
