import { cubeList } from "../cube";
import { untouchedCubeMaterial } from "../materials";
import { resetCubeGameState } from "./cubeClick";
import { onLanguageChange, translate } from "../../language";

  export function resetCubes() {
    cubeList.forEach(cube => {
        cube.material = untouchedCubeMaterial;
    })
    resetCubeGameState();
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
  const setDisabled = () => {
    resetButton.disabled = true;
  };
  window.addEventListener('cube-winner-preparing', setDisabled);
  window.addEventListener('cube-winner-start', setDisabled);
  window.addEventListener('cube-winner-preparation-end', () => {
    resetButton.disabled = false;
  });
  window.addEventListener('cube-winner-end', () => {
    resetButton.disabled = false;
  });
  window.addEventListener('cube-tutorial-start', () => {
    document.body.classList.add('tutorial-active');
    resetButton.disabled = true;
  });
  window.addEventListener('cube-tutorial-end', () => {
    document.body.classList.remove('tutorial-active');
    resetButton.disabled = false;
  });
  resetButton.addEventListener('click', resetCubes)  
}
