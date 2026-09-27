import { cubeList } from "../cube";
import { untouchedCubeMaterial } from "../materials";
import { resetCubeColorOrder } from "./cubeClick";
import { onLanguageChange, translate } from "../../language";

  export function resetCubes() {
    cubeList.forEach(cube => {
        cube.material = untouchedCubeMaterial;
    })
    resetCubeColorOrder();
  }

export default function renderCubeResetter() {
  const resetButton = document.createElement('button');
  resetButton.id = "reset";
  resetButton.innerText = translate('reset');
  const app = document.querySelector('#app');
  app.appendChild(resetButton);

  onLanguageChange(() => {
    resetButton.innerText = translate('reset');
  });
  resetButton.addEventListener('click', resetCubes)  
}
