import { MeshPhongMaterial } from "three";

const untouchedCubeMaterial = new MeshPhongMaterial({
    color:'white',
    shininess: 300
});
untouchedCubeMaterial.touched = false;
const redCubeMaterial = new MeshPhongMaterial({
    color: 'red'
});
redCubeMaterial.touched = true;
const greenCubeMaterial = new MeshPhongMaterial({
    color: 'green'
});
greenCubeMaterial.touched = true;
const blueCubeMaterial = new MeshPhongMaterial({
    color: 'blue'
});
blueCubeMaterial.touched = true;

export { untouchedCubeMaterial, redCubeMaterial, greenCubeMaterial, blueCubeMaterial }