import { Group } from 'three';
import Cloud from './Cloud.js';

export default class Sky extends Group {
  constructor() {
    super();

    this.name = 'sky';

    // choose a number of clouds to be scattered in the sky
    this.nClouds = 20;

    // To distribute the clouds consistently,
    // we need to place them according to a uniform angle
    var stepAngle = (Math.PI * 2) / this.nClouds;

    // create the clouds
    for (var i = 0; i < this.nClouds; i++) {
      var c = new Cloud();

      // set the rotation and the position of each cloud;
      // for that we use a bit of trigonometry
      var a = stepAngle * i; // this is the final angle of the cloud
      var h = 750 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself

      // Trigonometry!!! I hope you remember what you've learned in Math :)
      // in case you don't:
      // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
      c.position.y = Math.sin(a) * h;
      c.position.x = Math.cos(a) * h;

      // rotate the cloud according to its position
      c.rotation.z = a + Math.PI / 2;

      // for a better result, we position the clouds
      // at random depths inside of the scene
      c.position.z = -400 - Math.random() * 400;

      // we also set a random scale for each cloud
      var s = 1 + Math.random() * 2;
      c.scale.set(s, s, s);

      // do not forget to add the mesh of each cloud in the scene
      this.add(c);
    }
  }
}
