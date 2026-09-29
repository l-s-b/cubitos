import { Mesh } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import cubeClickColorChange from "./helpers/cubeClick";
import renderCubeResetter from "./helpers/reset";
import { untouchedCubeMaterial } from "./materials";

const cubeGeometry = new RoundedBoxGeometry(1, 1, 1, 3, 0.075);

const CUBE_DATA = [
  {
    positionPoints: [0, 0, 1.1],
    shortName: 'BBC',
    longName: "Center Mid Front"
  },
  {
    positionPoints: [0, 0, -1.1],
    shortName: 'BBA',
    longName: "Center Mid Back"
  }, 
  {
    positionPoints: [0, 1.1, 0],
    shortName: 'BCB',
    longName: "Center Up Here"
  },
  {
    positionPoints: [0, -1.1, 0],
    shortName: 'BAB',
    longName: "Center Down Here"
  },
  {
    positionPoints: [-1.1, 0, 0],
    shortName: 'ABB',
    longName: "Left Mid Here"
  },
  {
    positionPoints: [1.1, 0, 0],
    shortName: 'CBB',
    longName: "Right Mid Here"
  },
  {
    positionPoints: [0, 1.1, 1.1],
    shortName: 'BCC',
    longName: "Center Up Front"
  },
  {
    positionPoints: [0, 1.1, -1.1],
    shortName: 'BCA',
    longName: "Center Up Back"
  },
  {
    positionPoints: [0, -1.1, 1.1],
    shortName: 'BAC',
    longName: "Center Down Front"
  },
  {
    positionPoints: [0, -1.1, -1.1],
    shortName: 'BAA',
    longName: "Center Down Back"
  },
  {
    positionPoints: [-1.1, 0, 1.1],
    shortName: 'ABC',
    longName: "Left Mid Front"
  },
  {
    positionPoints: [1.1, 0, 1.1],
    shortName: 'CBC',
    longName: "Right Mid Front"
  },
  {
    positionPoints: [-1.1, 0, -1.1],
    shortName: 'ABA',
    longName: "Left Mid Back"
  },
  {
    positionPoints: [1.1, 0, -1.1],
    shortName: 'CBA',
    longName: "Right Mid Back"
  },
  {
    positionPoints: [-1.1, -1.1, 0],
    shortName: 'AAB',
    longName: "Left Down Here"
  },
  {
    positionPoints: [1.1, -1.1, 0],
    shortName: 'CAB',
    longName: "Right Down Here"
  },
  {
    positionPoints: [-1.1, 1.1, 0],
    shortName: 'ACB',
    longName: "Left Up Here"
  },
  {
    positionPoints: [1.1, 1.1, 0],
    shortName: 'CCB',
    longName: "Right Up Here"
  },
 
]

const cubeList = CUBE_DATA.map(eachCube => {
  const cube = new Mesh(cubeGeometry, untouchedCubeMaterial);
  cube.longName = eachCube.longName;
  cube.shortName = eachCube.shortName;
  cube.position.set(...eachCube.positionPoints);
  return cube;
});

cubeClickColorChange(cubeList);
renderCubeResetter();

export { cubeList }