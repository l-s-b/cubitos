import { Group } from "three";
import { cubeList } from "./cube";

export const cubeGroup = new Group();
export default function setCubeGroup() {
    cubeList.forEach(cube => {
        cubeGroup.add(cube);
    });
}
