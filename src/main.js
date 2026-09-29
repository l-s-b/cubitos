import './style.css';
import setRenderEngine from './three/renderer';
import setCamera from './three/cameras';
import fillScene from './three/scene';
import placeLights from './three/lights';
import resize from './three/resize';
import animate from './three/loop';
import setCubeGroup from './three/cubeGroup';
import { rotationButtons } from './three/helpers/rotation';
import { createLanguageToggle } from './language';
import { configureGameMode } from './three/helpers/cubeClick';
import createStartMenu from './startMenu';

createLanguageToggle();
setRenderEngine();
placeLights();
setCamera();
setCubeGroup();
fillScene();
resize();
animate();
createStartMenu(mode => {
  configureGameMode(mode);
  rotationButtons();
});
