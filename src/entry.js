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
import './game.css';

import App from './react/App.jsx';
import { getElByID } from './utils/getElByID.js';
import { getElByIDChain } from './utils/getElByIDChain.js';
import { acheivementTokenIDs } from './constants.js';
import { getChildByIDChain } from './utils/getChildByIDChain.js';

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

const openWallet = event => {
  window.open(
    `https://sepolia.arbiscan.io/address/${mainScene.sequenceController.email}`
  );
};

const blockClick = event => {
  event.stopPropagation();
};

function makeElementsClickable(els, onClick) {
  if (!onClick) {
    throw new Error('onClick method might not exist');
  }
  for (const el of els) {
    el.addEventListener('click', event => {
      event.preventDefault();
      onClick(event);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  makeElementsClickable([getElByID('hangar-button')], mainScene.openHangar);
  makeElementsClickable(
    [getElByID('marketplace-button')],
    mainScene.openMarketplace
  );

  makeElementsClickable(
    [getElByIDChain('gift-modal', 'article', 'close'), getElByID('gift-modal')],
    mainScene.closeGiftModal
  );

  makeElementsClickable(
    [
      getElByIDChain('hangar-modal', 'article'),
      getElByIDChain('marketplace-modal', 'article'),
      getElByIDChain('gift-modal', 'article'),
    ],
    blockClick
  );

  makeElementsClickable(
    [
      getElByIDChain('hangar-modal', 'article', 'close'),
      getElByID('hangar-modal'),
    ],
    mainScene.closeHangar
  );

  makeElementsClickable(
    [
      getElByIDChain('marketplace-modal', 'article', 'close'),
      getElByID('marketplace-modal'),
    ],
    mainScene.closeMarketplace
  );

  makeElementsClickable(
    [
      getElByIDChain('achievement-card-modal', 'article', 'close'),
      getElByID('achievement-card-modal'),
    ],
    mainScene.closeAchievementCard
  );
  makeElementsClickable([getElByID('burn-button')], mainScene.burnActiveCard);

  makeElementsClickable(
    [getElByIDChain('gift-modal', 'article', 'close'), getElByID('gift-modal')],
    mainScene.closeGiftModal
  );

  makeElementsClickable([getElByID('use-faucet-button')], mainScene.useFaucet);

  const cardSlotsEl = getElByID('card-slots');
  for (const id of acheivementTokenIDs) {
    const cardContainer = getChildByIDChain(cardSlotsEl, id);
    cardContainer.addEventListener(
      'mouseover',
      mainScene.handleCardSlotHover,
      false
    );
    cardContainer.addEventListener(
      'mouseout',
      mainScene.handleCardSlotHoverOut,
      false
    );
    cardContainer.addEventListener(
      'mouseup',
      mainScene.handleCardSlotClick,
      false
    );
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

window.debug = {
  mainScene
}