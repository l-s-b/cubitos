import './style.css';
import setRenderEngine from './three/renderer';
import setCamera from './three/cameras';
import fillScene from './three/scene';
import placeLights from './three/lights';
import resize from './three/resize';
import animate from './three/loop';
import setCubeGroup from './three/cubeGroup';
import { rotationButtons } from './three/helpers/rotation';

setRenderEngine();
placeLights();
setCamera();
setCubeGroup();
fillScene();
rotationButtons();
resize();
animate();
