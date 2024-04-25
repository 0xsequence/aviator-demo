import {
  Group,
  DirectionalLight,
  AmbientLight,
  HemisphereLight,
  Color,
} from 'three';

export default class BasicLights extends Group {
  constructor(...args) {
    super(...args);

    var hemisphereLight = new HemisphereLight(0xaaaaaa, 0x000000, 0.9);

    // A directional light shines from a specific direction.
    // It acts like the sun, that means that all the rays produced are parallel.
    var shadowLight = new DirectionalLight(0xffffff, 0.9);

    // Set the direction of the light
    shadowLight.position.set(150, 350, 350);

    // Allow shadow casting
    shadowLight.castShadow = true;

    // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better,
    // but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // an ambient light modifies the global color of a scene and makes the shadows softer
    var ambientLight = new AmbientLight(0xdc8874, 0.5);

    // to activate the lights, just add them to the scene
    this.add(hemisphereLight);
    this.add(shadowLight);
    this.add(ambientLight);
  }
}
