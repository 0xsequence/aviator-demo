/**
 * entry.js
 * 
 * This is the first file loaded. It sets up the Renderer, 
 * Scene and Camera. It also starts the render loop and 
 * handles window resizes.
 * 
 */

import React from 'react'
import * as ReactDOM from 'react-dom';
import { WebGLRenderer, PerspectiveCamera, Scene, Fog } from 'three';
import MainScene from './objects/Scene.js';
import App from './react/App.jsx'
import ColorPanels from './react/ColorPanels.jsx'
import "./game.css";
import { ENV } from '../env.js';

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
  console.log('howdy')
  mainScene.handleMouseClick();
}
document.getElementById('glass').addEventListener('mouseup', handleMouseUp, false);

window.closeModal = (event) => {
  event.preventDefault();
  mainScene.closeLoginModal();
};

window.triggerLogin = (event) => {
  event.preventDefault();
  mainScene.sequenceController.triggerLoginModalForm();
};

window.triggerGoogleLogin = (event) => {
  event.preventDefault();
  mainScene.sequenceController.googleLogin();
};

window.burnCard = (event) => {
  event.preventDefault();
  mainScene.burnActiveCard();
};

window.closeCardModal = (event) => {
  event.preventDefault();
  mainScene.closeCardModal();
};

window.openHangar = (event) => {
  event.preventDefault();
  console.log('opening')
  mainScene.openHangar();
}

// dom
document.body.style.margin = 0;
document.body.style.zoom = 0.77;
document.getElementById('world').style.zoom = 1.3;
document.getElementById("world").appendChild( renderer.domElement );

const root = ReactDOM.createRoot(document.getElementById('login'))

root.render(
  <div>
    <App scene={mainScene}/>
  </div>
);

// hangar planes
const colors = [
  'rgba(255, 165, 0, 0.65)', 'rgba(173, 216, 230, 0.65)',
  'rgba(0, 128, 0, 0.65)', 'rgba(255, 255, 0, 0.65)', 'rgba(0, 0, 255, 0.65)',
  'rgba(75, 0, 130, 0.65)',
].reverse();

const imageSrcArray = [
  "~/images/planes/Falcon_Mark_IV_Redtail.png"
]; // Replace these with your actual image paths

const gridContainer = document.getElementById('gridContainer');

colors.forEach((color, index) => {
  const panel = document.createElement('div');
  panel.className = 'color-panel '+'plane-'+(index+1);
  panel.onclick = () => handlePanelClick(index + 1);
  
  gridContainer.appendChild(panel);
});

let selectedId = null; // Simulate selectedId

function handlePanelClick(id) {
  console.log(id);
  // Update the visual state of panels based on selection
  document.querySelectorAll('.color-panel').forEach((panel, idx) => {
    if (idx + 1 === id) {
      panel.classList.add('selected');
    } else {
      panel.classList.remove('selected');
    }
  });
  selectedId = id; // Update selected ID
  scene.airplane.addPlane()
}