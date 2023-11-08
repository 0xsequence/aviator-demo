import { Group } from 'three';
import Airplane from './Game/Airplane.js';
import BasicLights from './Lights.js';
import Sea from './Backgrounds/Sea.js';
import Sky from './Backgrounds/Sky.js';

const GameModes = {
	Intro: "intro",
	Playing: "playing",
	Paused: "paused",
	GameOver: "gameover"
}


export default class MainScene extends Group {
  constructor() {
    super();

    this.game_mode = GameModes.Intro;
    this.message_box = document.getElementById("replayMessage");

    this.sea = new Sea();
    this.sky = new Sky();
    this.airplane = new Airplane();
    this.lights = new BasicLights();

    this.sea.position.y = -500;
    this.sky.position.y = -400;

    this.airplane.scale.set(.25,.25,.25);
	  this.airplane.position.y = 200;
    this.airplane.position.x = -50;

    this.add(this.sky, this.sea, this.airplane, this.lights);
  }

  switchGameMode(new_game_mode) {
    if (this.game_mode === new_game_mode) return;

    this.game_mode = new_game_mode;

    if (this.game_mode === GameModes.Intro) {
      this.message_box.style.display = "block";
      this.message_box.innerHTML = "Click to Start"
    } else if (this.game_mode === GameModes.Playing) {
      this.message_box.style.display = "none";
    } else if (this.game_mode === GameModes.Paused) {
      this.message_box.style.display = "block";
      this.message_box.innerHTML = "Paused<br>Click to Resume"
    } else if (this.game_mode === GameModes.GameOver) {
      this.message_box.style.display = "block";
      this.message_box.innerHTML = "Game Over<br>Click to Replay"
    }
  }

  handleMouseClick() {
    if (this.game_mode === GameModes.Intro) {
      this.switchGameMode(GameModes.Playing);
    } else if (this.game_mode === GameModes.Playing) {
      this.switchGameMode(GameModes.Paused);
    } else if (this.game_mode === GameModes.Paused) {
      this.switchGameMode(GameModes.Playing);
    } else if (this.game_mode === GameModes.GameOver) {
      this.switchGameMode(GameModes.Playing);
    }
  }

  tick(deltaTime, mousePos) {
    if (this.game_mode === GameModes.Paused) return;

    this.sky.rotation.z += deltaTime / 5000;

    this.sea.tick(deltaTime);
    this.updatePlane(deltaTime, mousePos);
  }

  updatePlane(deltaTime, mousePos){
    // let's move the airplane between -100 and 100 on the horizontal axis, 
    // and between 25 and 175 on the vertical axis,
    // depending on the mouse position which ranges between -1 and 1 on both axes;
    // to achieve that we use a normalize function (see below)

    var targetY = this.normalize(mousePos.y, -.75, .75, 25, 175) + 100;
    // var targetX = this.normalize(mousePos.x, -.75, .75, -100, 100);
    
    // Move the plane at each frame by adding a fraction of the remaining distance
    this.airplane.position.y += (targetY - this.airplane.position.y) * 0.1;

    // Rotate the plane proportionally to the remaining distance
    this.airplane.rotation.z = (targetY - this.airplane.position.y) * 0.0128;
    this.airplane.rotation.x = (this.airplane.position.y - targetY) * 0.0064;

    this.airplane.tick(deltaTime);
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