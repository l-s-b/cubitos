import { PointLight, PointLightHelper } from "three";

// Por las dudas, variables con let (la misma luz bien podría variar!)
let LIGHT_COLOR = 'white';
let LIGHT_INTENSITY = 5;
let LIGHT_REACH_LIMIT = 0;
let LIGHT_DECAY = 0.75;

export const light1 = new PointLight(
    LIGHT_COLOR, LIGHT_INTENSITY, LIGHT_REACH_LIMIT, LIGHT_DECAY
)

const lightHelper = new PointLightHelper(light1, 1); 

export default function placeLights() {
    light1.position.set(0, 5, 5);
}