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

import App from './react/App.jsx';
import ColorPanels from './react/ColorPanels.jsx';
import './game.css';

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
  mainScene.handleMouseClick();
}
document
  .getElementById('glass')
  .addEventListener('mouseup', handleMouseUp, false);

const closeFaucetCardModal = event => {
  event.preventDefault();
  mainScene.closeFaucetModal();
};

const closeGiftModal = event => {
  event.preventDefault();
  mainScene.closeGiftModal();
};

const openFaucet = event => {
  mainScene.openFaucet();
};

const openHangar = event => {
  event.preventDefault();
  mainScene.openHangar();
};

const closeCardModal = event => {
  event.preventDefault();
  mainScene.closeCardModal();
};

const burnCard = event => {
  event.preventDefault();
  mainScene.burnActiveCard();
};

const openWallet = event => {
  window.open(
    `https://sepolia.arbiscan.io/address/${mainScene.sequenceController.email}`
  );
};

document.addEventListener('DOMContentLoaded', () => {
  // open faucet
  const faucetBtn = document.getElementById('faucetBtn');
  if (faucetBtn) {
      faucetBtn.addEventListener('click', openFaucet);
  }

  // open hangar
  const hangarBtn = document.getElementById('airplaneHangarBtn');
  if (hangarBtn) {
    hangarBtn.addEventListener('click', openHangar);
  }

  //firstPlaneButton
  const firstPlaneButton = document.getElementById('firstPlaneButton');
  if (firstPlaneButton) {
    firstPlaneButton.addEventListener('click', closeGiftModal);
  }

  // closeFaucetCardModal
  const closeFaucetCardModalEl = document.getElementById('closeFaucetCardModal')
  if(closeFaucetCardModalEl){
    closeFaucetCardModalEl.addEventListener('click', closeFaucetCardModal)
  }

  // closeCardModal
  const closeCardModalEl = document.getElementById('closeCardModal-1')
  if(closeCardModalEl){
    closeCardModalEl.addEventListener('click', closeCardModal)
  }

  const closeCardModalEl2 = document.getElementById('closeCardModal-2')
  if(closeCardModalEl2){
    closeCardModalEl2.addEventListener('click', closeCardModal)
  }

  const burnButton = document.getElementById('burnButton')
  if(burnButton){
    burnButton.addEventListener('click', burnCard)
  }
  const walletButton = document.getElementById('walletButton')
  if(walletButton){
    walletButton.addEventListener('click', openWallet)
  }
});

// dom
document.body.style.margin = 0;
document.getElementById('world').appendChild(renderer.domElement);

const root = createRoot(document.getElementById('login'));

mainScene.airplane.addPlane(Number(localStorage.getItem('plane_color')));

root.render(
  <div>
    <App scene={mainScene} />
  </div>
);
