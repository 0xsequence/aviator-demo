import { Group, Color, MeshPhongMaterial, TetrahedronGeometry, Mesh } from 'three';
import { gsap } from "gsap";
import Airplane from './Game/Airplane.js';
import BasicLights from './Lights.js';
import Sea from './Backgrounds/Sea.js';
import Sky from './Backgrounds/Sky.js';
import Enemy from './Game/Enemy.js';

import { Sequence, defaults } from '@0xsequence/waas'

const GameModes = {
	Intro: "intro",
	Playing: "playing",
	Paused: "paused",
	GameEnding: "gameending",
	GameOver: "gameover"
}

const AuthModes = {
  Email: "email",
  Code: "code",
  Completed: "completed"
}

const sequence = new Sequence({
  network: 'polygon',
  key: 'eyJzZWNyZXQiOiJ0YmQiLCJ0ZW5hbnQiOjksImlkZW50aXR5UG9vbElkIjoidXMtZWFzdC0yOjQyYzlmMzlkLWM5MzUtNGQ1Yy1hODQ1LTVjODgxNWM3OWVlMyIsImVtYWlsQ2xpZW50SWQiOiI1Zmw3ZGc3bXZ1NTM0bzl2ZmpiYzZoajMxcCJ9',
}, defaults.TEMPLATE_NEXT);

const API_URL = "http://taylanpince.pythonanywhere.com";


export default class MainScene extends Group {
  constructor() {
    super();

    this.authInstance = null;
    this.authEmail = null;
    this.authToken = null;
    this.authMode = AuthModes.Email;
    this.authWalletAddress = null;
    
    this.leaderboard = [];

    this.game_mode = GameModes.Intro;
    this.message_box = document.getElementById("replayMessage");
    this.distance_box = document.getElementById("distValue");
    this.score_box = document.getElementById("score");
    this.leaderboardWrapper = document.getElementById("leaderboard");

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

    this.add(this.sky, this.sea, this.airplane, this.lights);
    this.resetGame();

    sequence.isSignedIn().then((signedIn) => {
      console.log("Signed in?");
      console.log(signedIn);
      if (signedIn) {
        this.fetchWalletAddress();
      }
    });

    this.loadLeaderboard();
  }

  loadLeaderboard() {
    fetch(API_URL).then((response) => {
      response.json().then((results) => {
        this.leaderboard = results;
        this.leaderboardWrapper.innerHTML = "";

        const leaderboardList = this.leaderboardWrapper.appendChild(document.createElement("ol"));

        for (let i = 0; i < this.leaderboard.length; i++) {
          const listItem = leaderboardList.appendChild(document.createElement("li"));
          const entry = this.leaderboard[i];

          listItem.innerHTML = entry.email + " " + entry.score;
        }
      });
    });
  }

  openLoginModal() {
    var modal = document.getElementById("loginModal");
    modal.setAttribute("open", true);
  }

  closeLoginModal() {
    var modal = document.getElementById("loginModal");
    modal.setAttribute("open", false);
  }

  switchAuthMode(mode) {
    if (this.authMode === mode) return;

    this.authMode = mode;

    var emailVerifyForm = document.getElementById("emailVerify");
    var codeVerifyForm = document.getElementById("codeVerify");

    if (this.authMode === AuthModes.Email) {
      emailVerifyForm.style.display = "block";
      codeVerifyForm.style.display = "none";
    } else if (this.authMode === AuthModes.Code) {
      emailVerifyForm.style.display = "none";
      codeVerifyForm.style.display = "block";
    } else if (this.authMode === AuthModes.Completed) {
      this.closeLoginModal();

      this.message_box.innerHTML = "Welcome " + this.authEmail + "!<br>Click to Start";

      emailVerifyForm.style.display = "block";
      codeVerifyForm.style.display = "none";
    }
  }

  triggerLoginModalForm() {
    if (this.authMode === AuthModes.Email) {
      var emailInput = document.getElementById("emailInput");
      var emailValue = emailInput.value;
  
      if (emailValue === "" || !emailInput.validity.valid) {
        emailInput.setAttribute("aria-invalid", true);
        return;
      }
  
      emailInput.setAttribute("aria-invalid", false);
  
      this.authenticateEmail(emailValue);
    } else if (this.authMode === AuthModes.Code) {
      var codeInput = document.getElementById("codeInput");
      var codeValue = codeInput.value;
  
      if (codeValue.length !== 6) {
        codeInput.setAttribute("aria-invalid", true);
        return;
      }
  
      codeInput.setAttribute("aria-invalid", false);
  
      this.finalizeEmailAuth(codeValue);
    }
  }

  authenticateEmail(email) {
    console.log("Authenticating...");
    console.log(email);

    var loginButton = document.getElementById("loginButton");

    loginButton.setAttribute("aria-busy", true);

    sequence.email.initiateAuth({ email: email }).then(({ email, instance }) => {
      this.authEmail = email;
      this.authInstance = instance;
      console.log(this.authInstance);
      console.log(this.authEmail);

      console.log("Success!");
      loginButton.setAttribute("aria-busy", false);

      this.switchAuthMode(AuthModes.Code);
    }).catch((error) => {
      alert(error);

      loginButton.setAttribute("aria-busy", false);
      var emailInput = document.getElementById("emailInput");
      emailInput.setAttribute("aria-invalid", true);
    });
  }

  finalizeEmailAuth(code) {
    if (this.authEmail === null || this.authInstance === null) return;

    console.log("Verifying...");
    console.log(code);
    console.log(this.authInstance);
    console.log(this.authEmail);

    var loginButton = document.getElementById("loginButton");

    loginButton.setAttribute("aria-busy", true);

    sequence.email.finalizeAuth({ instance: this.authInstance, email: this.authEmail, answer: code }).then((token) => {
      this.authToken = token;
      console.log("Success!");
      console.log(this.authToken);

      loginButton.setAttribute("aria-busy", false);

      this.createWalletAddress();
    }).catch((error) => {
      alert(error);

      loginButton.setAttribute("aria-busy", false);
      var codeInput = document.getElementById("codeInput");
      codeInput.setAttribute("aria-invalid", true);
    });
  }

  createWalletAddress() {
    console.log("Signing in...");
    sequence.signIn(this.authToken, this.authEmail).then((address) => {
      this.authWalletAddress = address;
      console.log(this.authWalletAddress);
      this.switchAuthMode(AuthModes.Completed);
    }).catch((error) => {
      alert(error);
      this.authMode = AuthModes.Email;
    });
  }

  fetchWalletAddress() {
    console.log("Fetching wallet...");
    sequence.getAddress().then((address) => {
      this.authWalletAddress = address;

      sequence.deviceName.get().then((deviceName) => {
        this.authEmail = deviceName;
        console.log(this.authWalletAddress);
        console.log(this.authEmail);
        this.switchAuthMode(AuthModes.Completed);
      });
    }).catch((error) => {
      alert(error);
      this.authMode = AuthModes.Email;
    })
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

  switchGameMode(new_game_mode) {
    if (this.game_mode === new_game_mode) return;

    this.game_mode = new_game_mode;

    if (this.game_mode === GameModes.Intro) {
      this.message_box.style.display = "block";
      this.score_box.style.display = "none";
      this.leaderboardWrapper.style.display = "block";
      this.message_box.innerHTML = "Click to Login";
    } else if (this.game_mode === GameModes.Playing) {
      this.score_box.style.display = "block";
      this.message_box.style.display = "none";
      this.leaderboardWrapper.style.display = "none";
    } else if (this.game_mode === GameModes.Paused) {
      this.score_box.style.display = "block";
      this.message_box.style.display = "block";
      this.leaderboardWrapper.style.display = "block";
      this.message_box.innerHTML = "Paused<br>Click to Resume";
    } else if (this.game_mode === GameModes.GameEnding) {
      this.score_box.style.display = "block";
      this.message_box.style.display = "block";
      this.leaderboardWrapper.style.display = "block";
      this.message_box.innerHTML = "Game Over";
      
      this.saveScore(this.game.distance);
    } else if (this.game_mode === GameModes.GameOver) {
      this.score_box.style.display = "block";
      this.message_box.style.display = "block";
      this.leaderboardWrapper.style.display = "block";
      this.message_box.innerHTML = "Game Over<br>Click to Replay";
    }
  }

  handleMouseClick() {
    if (this.authMode !== AuthModes.Completed) {
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

  saveScore(score) {
    console.log("Saving score...");
    console.log(score);
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email: this.authEmail, address: this.authWalletAddress, score: score})
    }).then((response) => {
      console.log(response);

      this.loadLeaderboard();
    });
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

    for (const enemy of this.enemies) {
      enemy.tick(deltaTime);

      enemy.angle += deltaTime * this.game.speed;

      if (enemy.angle > Math.PI * 2) {
        enemy.angle -= Math.PI * 2;
      }

      enemy.position.x = Math.cos(enemy.angle) * enemy.distance;
      enemy.position.y = -this.game.seaRadius + Math.sin(enemy.angle) * enemy.distance;

      if (this.collideCheck(this.airplane, enemy, this.game.enemyDistanceTolerance)) {
        this.explodeEnemy(enemy);
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
      const enemy = new Enemy();
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