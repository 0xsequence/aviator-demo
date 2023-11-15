import { Group, Color, MeshPhongMaterial, TetrahedronGeometry, Mesh } from 'three';
import { gsap } from "gsap";
import Airplane from './Game/Airplane.js';
import BasicLights from './Lights.js';
import Sea from './Backgrounds/Sea.js';
import Sky from './Backgrounds/Sky.js';
import Enemy from './Game/Enemy.js';
import { SequenceController, AuthModes } from './API/waas.js';
import { LeaderboardManager } from './API/leaderboard.js';

const GameModes = {
	Intro: "intro",
	Playing: "playing",
	Paused: "paused",
	GameEnding: "gameending",
	GameOver: "gameover"
}

export default class MainScene extends Group {
  constructor() {
    super();

    this.sequenceController = new SequenceController();
    this.sequenceController.authModeChangedCallback = this.authModeChanged.bind(this);
    this.leaderboardManager = new LeaderboardManager();

    this.game_mode = GameModes.Intro;
    this.message_box = document.getElementById("replayMessage");
    this.distance_box = document.getElementById("distValue");
    this.score_box = document.getElementById("score");

    this.sea = new Sea();
    this.sky = new Sky();
    this.airplane = new Airplane();
    this.lights = new BasicLights();

    this.sea.position.y = -500;
    this.sky.position.y = -400;

    this.airplane.scale.set(.25,.25,.25);
	  this.airplane.position.y = 200;
    this.airplane.position.x = -50;

    this.enemies = new Set();
    this.isFirstPylonCrash = false;

    this.add(this.sky, this.sea, this.airplane, this.lights);
    this.resetGame();
  }

  openLoginModal() {
    var modal = document.getElementById("loginModal");
    modal.setAttribute("open", true);
  }

  closeLoginModal() {
    var modal = document.getElementById("loginModal");
    modal.setAttribute("open", false);
  }

  authModeChanged() {
    if (this.sequenceController.mode === AuthModes.Completed) {
      this.closeLoginModal();

      this.message_box.innerHTML = "Welcome " + this.sequenceController.email + "!<br>Click to Start";
    }
  }

  resetGame() {
    this.game = {
      speed: .00035,
      baseSpeed: .00035,
      distanceForSpeedUpdate: 100,
      speedLastUpdate: 0,

      distance: 0,
      ratioSpeedDistance: 50,

      enemyLastSpawn: 0,
      enemyDistanceTolerance: 10,
      enemiesSpeed: 0.3,
      distanceForEnemiesSpawn: 30,

      planeDefaultHeight: 200,
      planeAmpHeight: 100,
      planeFallSpeed: 0.001,

      seaRadius: 500,
    }
    this.isFirstPylonCrash = false
  }

  updateSpeed(deltaTime) {
    if (this.game_mode !== GameModes.Playing) return;

    this.game.speed += this.game.baseSpeed * deltaTime * 0.00002;
  }

  updateDistance(deltaTime) {
    if (this.game_mode !== GameModes.Playing) return;

    this.game.distance += this.game.speed * deltaTime * this.game.ratioSpeedDistance;
    this.distance_box.innerHTML = Math.floor(this.game.distance);

    if (Math.floor(this.game.distance) % this.game.distanceForSpeedUpdate == 0 && Math.floor(this.game.distance) > this.game.speedLastUpdate){
      this.game.speedLastUpdate = Math.floor(this.game.distance);
      this.game.targetBaseSpeed += this.game.incrementSpeedByTime * deltaTime;
    }
  }

  firstPylonCrash() {
    this.isFirstPylonCrash = true;
  }

  isLast3RunsOver500Each() {
    if(localStorage.getItem('nonce') && Number(localStorage.getItem('nonce')) > 3){
      let runOf500 = true;
      for(let i = Number(localStorage.getItem('nonce')) - 1; i >= Number(localStorage.getItem('nonce'))-3; --i) {
        if(Number(localStorage.getItem(i)) < 500) runOf500 = false 
      }
      return runOf500
    } else {
      return false
    }
  }

  updateLocalScores() {
    if(!localStorage.getItem('nonce')) localStorage.setItem('nonce', String(0))
    localStorage.setItem(`${localStorage.getItem('nonce')}`, String(this.game.distance))
    localStorage.setItem('nonce',String(Number(localStorage.getItem('nonce'))+1))
  }

  isFirstCrash() {
    return localStorage.getItem('nonce') == 1 ? true : false
  }

  switchGameMode(new_game_mode) {
    if (this.game_mode === new_game_mode) return;

    this.game_mode = new_game_mode;

    if (this.game_mode === GameModes.Intro) {
      this.message_box.style.display = "block";
      this.score_box.style.display = "none";
      this.leaderboardManager.leaderboardWrapper.style.display = "block";
      this.message_box.innerHTML = "Click to Login";
    } else if (this.game_mode === GameModes.Playing) {
      this.score_box.style.display = "block";
      this.message_box.style.display = "none";
      this.leaderboardManager.leaderboardWrapper.style.display = "none";
    } else if (this.game_mode === GameModes.Paused) {
      this.score_box.style.display = "block";
      this.message_box.style.display = "block";
      this.leaderboardManager.leaderboardWrapper.style.display = "block";
      this.message_box.innerHTML = "Paused<br>Click to Resume";
    } else if (this.game_mode === GameModes.GameEnding) {
      this.score_box.style.display = "block";
      this.message_box.style.display = "block";
      this.leaderboardManager.leaderboardWrapper.style.display = "block";
      this.message_box.innerHTML = "Game Over";
      
      // updates progress
      this.updateLocalScores()

      this.leaderboardManager.saveScore(this.game.distance, this.sequenceController.email, this.sequenceController.walletAddress);
    } else if (this.game_mode === GameModes.GameOver) {

      if(this.game.distance >= 2500){
        alert(3)
        this.sequenceController.callContract(3, (tx) => {
          console.log(tx)
        })
      } else if(this.isLast3RunsOver500Each()){
        alert(2)
        this.sequenceController.callContract(2, (tx) => {
          console.log(tx)
        })
      } else if(this.game.distance >= 1000 && this.game.distance < 2500){
        alert(1)
        this.sequenceController.callContract(1, (tx) => {
          console.log(tx)
        })
      } else if(this.isFirstCrash()){
        alert(0)
        this.sequenceController.callContract(0, (tx) => {
          console.log(tx)
        })
      } else if (this.isFirstPylonCrash){
        alert(4)
        this.sequenceController.callContract(4, (tx) => {
          console.log(tx)
        })
      }

      this.score_box.style.display = "block";
      this.message_box.style.display = "block";
      this.leaderboardManager.leaderboardWrapper.style.display = "block";
      this.message_box.innerHTML = "Game Over<br>Click to Replay";
    }
  }

  handleMouseClick() {
    if (this.sequenceController.mode !== AuthModes.Completed) {
      this.openLoginModal();
      return;
    }

    if (this.game_mode === GameModes.Intro) {
      this.switchGameMode(GameModes.Playing);
    } else if (this.game_mode === GameModes.Playing) {
      this.switchGameMode(GameModes.Paused);
    } else if (this.game_mode === GameModes.Paused) {
      this.switchGameMode(GameModes.Playing);
    } else if (this.game_mode === GameModes.GameOver) {
      for (const enemy of this.enemies) {
        this.remove(enemy);
        this.enemies.delete(enemy);
      }

      this.resetGame();
      this.switchGameMode(GameModes.Playing);
    }
  }

  collideCheck(mesh1, mesh2, tolerance) {
		const diffPos = mesh1.position.clone().sub(mesh2.position.clone());
		const d = diffPos.length();
		return d < tolerance;
	}

  tick(deltaTime, mousePos) {
    if (this.game_mode === GameModes.Paused) return;

    this.sky.rotation.z += deltaTime * this.game.speed / 2;

    this.sea.tick(deltaTime, this.game.speed);

    if (this.game_mode === GameModes.Playing) {
      this.updatePlane(deltaTime, mousePos);
      this.updateDistance(deltaTime);
      
      if (Math.floor(this.game.distance) % this.game.distanceForEnemiesSpawn == 0 && Math.floor(this.game.distance) > this.game.enemyLastSpawn) {
        this.game.enemyLastSpawn = Math.floor(this.game.distance);
        this.spawnEnemies(4);
      }

      this.updateSpeed(deltaTime);
    } else if (this.game_mode === GameModes.GameEnding) {
      this.game.speed *= .99;
      this.airplane.rotation.z += (-Math.PI/2 - this.airplane.rotation.z) * 0.0002 * deltaTime;
      this.airplane.rotation.x += 0.0003 * deltaTime;
      this.game.planeFallSpeed *= 1.05;
      this.airplane.position.y -= this.game.planeFallSpeed * deltaTime;

      if (this.airplane.position.y < -200) {
        this.switchGameMode(GameModes.GameOver);
      }
    } else if (this.game_mode !== GameModes.GameOver) {
      this.updatePlane(deltaTime, mousePos);
    }

    for (const [index, enemy] of this.enemies.entries()) {
      enemy.tick(deltaTime);

      enemy.angle += deltaTime * this.game.speed;

      if (enemy.angle > Math.PI * 2) {
        enemy.angle -= Math.PI * 2;
      }

      enemy.position.x = Math.cos(enemy.angle) * enemy.distance;
      enemy.position.y = -this.game.seaRadius + Math.sin(enemy.angle) * enemy.distance;

      if (this.collideCheck(this.airplane, enemy, this.game.enemyDistanceTolerance)) {
        this.explodeEnemy(enemy);
        if(enemy.name == 0) this.firstPylonCrash()
        this.switchGameMode(GameModes.GameEnding);
      } else if (enemy.angle > Math.PI) {
        this.remove(enemy);
        this.enemies.delete(enemy);
      }
    }
  }

  updatePlane(deltaTime, mousePos) {
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

  spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
      const enemy = new Enemy(i);
      enemy.angle = -(i * 0.1);
      enemy.distance = this.game.seaRadius + this.game.planeDefaultHeight + (-1 + Math.random() * 2) * (this.game.planeAmpHeight - 20);
      enemy.position.x = Math.cos(enemy.angle) * enemy.distance;
      enemy.position.y = -this.game.seaRadius + Math.sin(enemy.angle) * enemy.distance;
      
      this.add(enemy);
      this.enemies.add(enemy);
    }
  }

  explodeEnemy(enemy) {
		this.spawnParticles(enemy.position.clone(), 15, new Color("red"), 3);
		this.remove(enemy);
    this.enemies.delete(enemy);
  }

  spawnParticles(pos, count, color, scale) {
    for (let i = 0; i < count; i++) {
      const geom = new TetrahedronGeometry(3, 0);
      const mat = new MeshPhongMaterial({
        color: 0x009999,
        shininess: 0,
        specular: 0xffffff,
        flatShading: true,
      });
      const mesh = new Mesh(geom, mat);
      this.add(mesh);
  
      mesh.visible = true;
      mesh.position.copy(pos);
      mesh.material.color = color;
      mesh.material.needsUpdate = true;
      mesh.scale.set(scale, scale, scale);
      const targetX = pos.x + (-1 + Math.random()*2) * 50;
      const targetY = pos.y + (-1 + Math.random()*2) * 50;
      const targetZ = pos.z + (-1 + Math.random()*2) * 50;
      const speed = 0.6 + Math.random() * 0.2;
      gsap.to(mesh.rotation, speed, {x: Math.random() * 12, y: Math.random() * 12});
      gsap.to(mesh.scale, speed, {x:.1, y:.1, z:.1});
      gsap.to(mesh.position, speed, {x:targetX, y:targetY, z: targetZ, delay:Math.random() *.1, ease: "power2.out", onComplete: () => {
        this.remove(mesh);
      }});
    }
  }
  
  normalize(v,vmin,vmax,tmin, tmax) {
    var nv = Math.max(Math.min(v,vmax), vmin);
    var dv = vmax-vmin;
    var pc = (nv-vmin)/dv;
    var dt = tmax-tmin;
    var tv = tmin + (pc*dt);
    return tv;
  }
}