import { Group } from 'three';
import Airplane from './Game/Airplane.js';
import BasicLights from './Lights.js';
import Sea from './Backgrounds/Sea.js';
import Sky from './Backgrounds/Sky.js';

export default class MainScene extends Group {
  constructor() {
    super();

    this.sea = new Sea();
    this.sky = new Sky();
    this.airplane = new Airplane();
    this.lights = new BasicLights();

    this.sea.position.y = -600;
    this.sky.position.y = -600;

    this.airplane.scale.set(.25,.25,.25);
	  this.airplane.position.y = 100;

    this.add(this.sky, this.sea, this.airplane, this.lights);
  }

  update(timeStamp) {
    this.airplane.propeller.rotation.x = timeStamp / 100;
    this.sea.rotation.z = timeStamp / 10000;
    this.sky.rotation.z = timeStamp / 10000;

    this.sea.moveWaves();
  }

  updatePlane(mousePos){
    // let's move the airplane between -100 and 100 on the horizontal axis, 
    // and between 25 and 175 on the vertical axis,
    // depending on the mouse position which ranges between -1 and 1 on both axes;
    // to achieve that we use a normalize function (see below)
    
    var targetX = this.normalize(mousePos.x, -1, 1, -100, 100);
    var targetY = this.normalize(mousePos.y, -1, 1, 25, 175);
  
    // update the airplane's position
    this.airplane.position.y = targetY + 100;
    this.airplane.position.x = targetX;
  }
  
  normalize(v,vmin,vmax,tmin, tmax){
    var nv = Math.max(Math.min(v,vmax), vmin);
    var dv = vmax-vmin;
    var pc = (nv-vmin)/dv;
    var dt = tmax-tmin;
    var tv = tmin + (pc*dt);
    return tv;
  }
}