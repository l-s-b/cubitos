import { Scene } from "three";
import { camera1 } from "./cameras";
import { cubeGroup } from "./cubeGroup";

export const scene = new Scene();
export default function fillScene() {
    [camera1, cubeGroup].forEach( 
        element => {scene.add(element)}
    )
};
