/**
 * entry.js
 * 
 * This is the first file loaded. It sets up the Renderer, 
 * Scene and Camera. It also starts the render loop and 
 * handles window resizes.
 * 
 */

import { WebGLRenderer, PerspectiveCamera, Scene, Fog } from 'three';
import MainScene from './objects/Scene.js';

import "./game.css";

const { innerHeight, innerWidth } = window;
var aspectRatio = innerHeight / innerWidth;
var fieldOfView = 60;
var nearPlane = 1;
var farPlane = 10000;

const scene = new Scene();
const camera = new PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
const renderer = new WebGLRenderer({antialias: true, alpha: true});
const mainScene = new MainScene();

// scene
scene.fog = new Fog(0xf7d9aa, 100, 950);
scene.add(mainScene);

// camera
camera.position.set(0, 200, 200);

// renderer
renderer.shadowMap.enabled = true;
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setClearColor(0x7ec0ee, 1);

// render loop
var mousePos={x:0, y:0};
var prevTimeStamp = 0;
const onAnimationFrameHandler = (timeStamp) => {
  const deltaTime = timeStamp - prevTimeStamp;
  renderer.render(scene, camera);
  mainScene.tick && mainScene.tick(deltaTime, mousePos);
  prevTimeStamp = timeStamp;
  window.requestAnimationFrame(onAnimationFrameHandler);
}
window.requestAnimationFrame(onAnimationFrameHandler);

// resize
const windowResizeHanlder = () => { 
  const { innerHeight, innerWidth } = window;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
windowResizeHanlder();
window.addEventListener('resize', windowResizeHanlder);

// mouse
function handleMouseMove(event) {
  const { innerHeight, innerWidth } = window;
	// here we are converting the mouse position value received 
	// to a normalized value varying between -1 and 1;
	// this is the formula for the horizontal axis:
	
	var tx = -1 + (event.clientX / innerWidth)*2;

	// for the vertical axis, we need to inverse the formula 
	// because the 2D y-axis goes the opposite direction of the 3D y-axis
	
	var ty = 1 - (event.clientY / innerHeight)*2;
	mousePos = {x:tx, y:ty};
}
document.addEventListener('mousemove', handleMouseMove, false);

function handleMouseUp(event) {
  mainScene.handleMouseClick();
}
document.addEventListener('mouseup', handleMouseUp, false);

window.closeModal = (event) => {
  event.preventDefault();
  mainScene.closeLoginModal();
};

window.triggerLogin = (event) => {
  event.preventDefault();
  mainScene.authManager.triggerLoginModalForm();
};

// dom
document.body.style.margin = 0;
document.getElementById("world").appendChild( renderer.domElement );
