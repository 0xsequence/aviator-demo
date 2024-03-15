/**
 * entry.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { WebGLRenderer, PerspectiveCamera, Scene, Fog } from 'three';
import MainScene from './objects/Scene.js';

import App from './react/App.jsx'
import ColorPanels from './react/ColorPanels.jsx'
import "./game.css";

const { innerHeight, innerWidth } = window;
var aspectRatio = innerHeight / innerWidth;
var fieldOfView = 60;
var nearPlane = 1;
var farPlane = 10000;

const scene = new Scene();
const camera = new PerspectiveCamera(
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane
);
const renderer = new WebGLRenderer({ antialias: true, alpha: true });
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
var mousePos = { x: 0, y: 0 };
var prevTimeStamp = 0;
const onAnimationFrameHandler = timeStamp => {
  const deltaTime = timeStamp - prevTimeStamp;
  renderer.render(scene, camera);
  mainScene.tick && mainScene.tick(deltaTime, mousePos);
  prevTimeStamp = timeStamp;
  window.requestAnimationFrame(onAnimationFrameHandler);
};
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

  var tx = -1 + (event.clientX / innerWidth) * 2;

  // for the vertical axis, we need to inverse the formula
  // because the 2D y-axis goes the opposite direction of the 3D y-axis

  var ty = 1 - (event.clientY / innerHeight) * 2;
  mousePos = { x: tx, y: ty };
}
document.addEventListener('mousemove', handleMouseMove, false);

function handleMouseUp(event) {
  console.log('howdy')
  mainScene.handleMouseClick();
}
document.getElementById('glass').addEventListener('mouseup', handleMouseUp, false);

window.closeModal = event => {
  event.preventDefault();
  mainScene.closeLoginModal();
};

window.triggerLogin = event => {
  event.preventDefault();
  mainScene.sequenceController.triggerLoginModalForm();
};

window.triggerGoogleLogin = event => {
  event.preventDefault();
  mainScene.sequenceController.googleLogin();
};

window.burnCard = event => {
  event.preventDefault();
  mainScene.burnActiveCard();
};

window.closeCardModal = event => {
  event.preventDefault();
  mainScene.closeCardModal();
};

window.closeGiftModal = event => {
  event.preventDefault();
  mainScene.closeGiftModal();
}

window.switchToMarketplace = async (event) => {
  event.preventDefault();
  mainScene.switchToMarketplace()
};

window.openInventory = (event) => {
  event.preventDefault();

  mainScene.openInventory()
}

window.openHangar = (event) => {
  event.preventDefault();
  mainScene.openHangar()
}

window.purchase = (event, id) => {
  event.preventDefault()

  console.log(id)
  const order = mainScene.requestIds.filter(order => Number(order.tokenId) === id);
  console.log(order)

  mainScene.sequenceController.sendTransactionRequest(order[0].orderId, mainScene.sequenceController.email, id, order[0].pricePerToken, () => {
    mainScene.switchToMarketplace()
  })
}

// dom
document.body.style.margin = 0;
document.body.style.zoom = 0.77;
document.getElementById('world').style.zoom = 1.3;
document.getElementById('world').appendChild(renderer.domElement);

const root = createRoot(document.getElementById('login'));

console.log(Number(localStorage.getItem('plane_color')))
mainScene.airplane.addPlane(localStorage.getItem('plane_color') ? Number(localStorage.getItem('plane_color')) : 1)

root.render(
  <div>
    <App scene={mainScene} />
  </div>
);