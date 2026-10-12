import { cubeList } from "../cube";
import { untouchedCubeMaterial } from "../materials";
import { resetCubeGameState } from "./cubeClick";

export function resetCubes() {
    cubeList.forEach(cube => {
        cube.material = untouchedCubeMaterial;
    });
    resetCubeGameState();
}
