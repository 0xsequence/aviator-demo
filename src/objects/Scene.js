import {
  Group,
  Color,
  MeshPhongMaterial,
  TetrahedronGeometry,
  Mesh,
} from 'three';
import { gsap } from 'gsap';
import Airplane from './Game/Airplane.js';
import BasicLights from './Lights.js';
import Sea from './Backgrounds/Sea.js';
import Sky from './Backgrounds/Sky.js';
import Enemy from './Game/Enemy.js';
import { SequenceController, AuthModes } from './API/waas.js';
import { LeaderboardManager } from './API/leaderboard.js';

import { getElByIDChain } from '../utils/getElByIDChain.js';
import { getElByID } from '../utils/getElByID.js';
import {
  acheivementTokenIDs,
  airplaneTokenIDs,
  airplanesContractAddress,
  boltContractAddress,
  orderbookContractAddress,
} from '../constants.js';
import { getChildByIDChain } from '../utils/getChildByIDChain.js';
import { parseFriendlyTokenAmount } from '../utils/parseFriendlyTokenAmount.js';
import {
  AchievementCardTypes,
  AchievementVerbageHowTo,
  AchievementVerbageTitle,
  GameModes,
} from '../gameConstants.js';
import { freePlaneGiftMintingWorkerAddress } from '../constants.js';

const LocalStorageKeys = {
  LastRunID: 'last_run_id',
  RunDistancePrefix: 'run_distance_',
};

export default class MainScene extends Group {
  airplane;

  changeSignoutButtonDisplay(display) {
    try {
      getElByID('sign-out-button').style.display = display;
    } catch (e) {
      //
    }
  }
  constructor() {
    super();

    this.sequenceController = new SequenceController(() => {
      const myPlanes = this.sequenceController.myPlanes;

      myPlanes.balanceSignal.listenOnce(planes => {
        if (!planes.ownsAny('0')) {
          var modal = getElByID('gift-modal');
          modal.setAttribute('open', true);

          var modalContent = getChildByIDChain(
            modal,
            'article',
            'modal-content'
          );

          const titleGift = document.createElement('p');
          titleGift.id = 'first-mint-msg';
          titleGift.innerHTML = 'Minting your first airplane...';
          titleGift.style = 'position: relative; text-align: center;';

          modalContent.appendChild(titleGift);

          const gridContainer = getChildByIDChain(
            modal,
            'article',
            'grid-container'
          );

          const panel = document.createElement('div');
          panel.className = 'color-panel plane-0';
          // Assuming there is a defined function handlePanelClick
          // panel.onclick = () => handlePanelClick(index + 1, true);

          gridContainer.appendChild(panel);

          // Adding spinner and updating button text after 2 seconds
          var cancelButton = document.getElementById('firstPlaneButton');
          const updateMintingButton = async () => {
            cancelButton.innerHTML = '<div class="spinner"></div>'; // Add your spinner HTML here
            cancelButton.removeAttribute('onClick'); // Remove the initial click handler to prevent closing the modal prematurel

            const url = freePlaneGiftMintingWorkerAddress;
            // const url = 'http://localhost:8787';
            const data = {
              address: this.sequenceController.email,
              tokenId: 0,
            };

            try {
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });

              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }

              myPlanes.expectChanges();

              console.log(response);
              document.getElementById('first-mint-msg').innerHTML = '';
              cancelButton.innerHTML = 'Continue';
              cancelButton.onclick = event => {
                this.closeGiftModal(event); // Assuming this function is defined elsewhere to handle the modal closing
              };
              localStorage.setItem('plane_color', 0);
            } catch (error) {
              console.error('Error:', error);
            }
          };

          // You might want to call this function when appropriate, for example after the modal is shown
          updateMintingButton();
        }
      });

      myPlanes.balanceSignal.listen(this.myPlanesChanged);
      myPlanes.metadataSignal.listen(planes => {
        const gridContainer = getElByIDChain(
          'marketplace-modal',
          'article',
          'panel-container',
          'grid-container'
        );
        for (const id of airplaneTokenIDs) {
          const planeEl = getChildByIDChain(gridContainer, `plane-${id}`);
          const titleEl = getChildByIDChain(planeEl, `title`);
          titleEl.textContent = planes.tokenMetadatas.get(id).name;
          // const priceEl = getChildByIDChain(planeEl, `price`)
          // priceEl.textContent = planes.tokenMetadata.get(id)
        }
      });
      myPlanes.isFastPollingSignal.listen(active => {
        const spinnerHolder = getElByIDChain(
          'hangar-modal',
          'article',
          'spinner-holder'
        );
        spinnerHolder.innerHTML = active ? '<div class="spinner"></div>' : ''; // Add your spinner HTML here
      });
      myPlanes.expectChanges();

      const myBolts = this.sequenceController.myBolts;
      const balanceEl = getElByIDChain(
        'marketplace-modal',
        'article',
        'footer',
        'bolt-balance'
      );
      myBolts.balanceSignal.listen(bolts => {
        if (bolts.ownsAny('0')) {
          balanceEl.innerHTML = `🔩 ${parseFriendlyTokenAmount(
            bolts.tokenBalances.get('0')
          )}`;
        } else {
          balanceEl.innerHTML = '🔩 0.00';
        }
      });
      myBolts.isFastPollingSignal.listen(active => {
        balanceEl.classList[active ? 'add' : 'remove']('faded');
      });
      myBolts.expectChanges();

      this.sequenceController.myAcheivements.balanceSignal.listen(
        this.myAcheivementsChanged
      );
    });

    this.updateMarketplaceData()
    this.sequenceController.authModeChangedCallback = this.authModeChanged;
    this.leaderboardManager = new LeaderboardManager();

    this.game_mode_previous = null;
    this.airplane_hangar_btn = getElByID('hangar-button');
    this.marketplace_btn = getElByID('marketplace-button');
    this.achievement_cards = getElByID('achievement-cards');

    let intervalCardSlotsBtn = setInterval(() => {
      const cardSlotsContainer = getElByID('card-slots');
      if (cardSlotsContainer && cardSlotsContainer.offsetHeight > 0) {
        // Ensure the element is rendered and visible
        // Calculate the available space (viewport height - 20vh for top and bottom)
        const viewportHeight = window.innerHeight;
        const desiredTopAndBottomSpace = viewportHeight * 0.15 * 2; // 10vh from top and 10vh from bottom
        const availableHeight = viewportHeight - desiredTopAndBottomSpace;

        const cards = document.getElementsByClassName('card');
        const cardSlots = document.getElementsByClassName('card-slot');
        const cardSlotsCurrentHeight = cardSlotsContainer.offsetHeight;
        const scaleFactor = availableHeight / cardSlotsCurrentHeight;
        const multiplier = scaleFactor * 1.1;

        for (let i = 0; i < cards.length; i++) {
          cards[i].style.setProperty(
            'width',
            `${48 * multiplier + 0.2 * multiplier}px`,
            'important'
          );
          cards[i].style.setProperty(
            'height',
            `${65 * multiplier + 0.2 * multiplier}px`,
            'important'
          );
        }

        for (let i = 0; i < cardSlots.length; i++) {
          cardSlots[i].style.setProperty(
            'width',
            `${52 * multiplier}px`,
            'important'
          );
          cardSlots[i].style.setProperty(
            'height',
            `${69 * multiplier}px`,
            'important'
          );
        }

        document.documentElement.style.setProperty(
          '--card-width',
          `${48 * multiplier + 0.2 * multiplier}px`,
          'important'
        );
        document.documentElement.style.setProperty(
          '--card-height',
          `${65 * multiplier + 0.2 * multiplier}px`,
          'important'
        );
        document.documentElement.style.setProperty(
          '--card-slot-width',
          `${52 * multiplier}px`,
          'important'
        );
        document.documentElement.style.setProperty(
          '--card-slot-height',
          `${69 * multiplier}px`,
          'important'
        );

        clearInterval(intervalCardSlotsBtn);
      }
    }, 100);

    this.message_box = getElByID('replayMessage');
    this.distance_box = getElByID('distValue');
    this.score_box = getElByID('score');
    this.card_slots = getElByID('card-slots');
    this.card_label = getElByID('cardLabel');
    this.leaderboard_wrapper = getElByID('leaderboardContainer');

    this.switchGameMode(GameModes.Intro);

    this.requestIds = [];

    this.activeCardID = null;
    this.activeTokenID = null;

    this.sea = new Sea();
    this.sky = new Sky();
    this.airplane = new Airplane();
    this.lights = new BasicLights();

    this.sea.position.y = -500;
    this.sky.position.y = -400;

    this.airplane.scale.set(0.25, 0.25, 0.25);
    this.airplane.position.y = 200;
    this.airplane.position.x = -50;

    this.enemies = new Set();
    this.isFirstPylonCrash = false;

    this.enemiesTotal = 0;

    this.add(this.sky, this.sea, this.airplane, this.lights);
    this.resetGame();
  }

  updateMarketplaceData() {
    const marketplaceSpinnerHolder = getElByIDChain(
      'marketplace-modal',
      'article',
      'spinner-holder'
    );
    marketplaceSpinnerHolder.innerHTML = '<div class="spinner"></div>';
    fetch(
      'https://marketplace-api.sequence.app/arbitrum-sepolia/rpc/Marketplace/GetTopOrders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionAddress: airplanesContractAddress,
          currencyAddresses: [boltContractAddress],
          orderbookContractAddress,
          tokenIDs: airplaneTokenIDs,
          isListing: true,
          priceSort: 'DESC',
        }),
      }
    ).then(res => {
      res.json().then(result => {
        const gridEl = getElByIDChain(
          'marketplace-modal',
          'article',
          'panel-container',
          'grid-container'
        );
        for (const id of airplaneTokenIDs) {
          const order = result.orders.find(o => o.tokenId === id);
          const planeEl = getChildByIDChain(gridEl, `plane-${id}`);
          const priceEl = getChildByIDChain(planeEl, 'price');
          if (order) {
            priceEl.textContent = `🔩${parseFriendlyTokenAmount(
              order.pricePerToken
            )}`;
          }
          planeEl.classList[!order ? 'add' : 'remove']('faded');
          planeEl.onclick = order
            ? () => {
                marketplaceSpinnerHolder.innerHTML =
                  '<div class="spinner"></div>';
                this.sequenceController.sendTransactionRequest(
                  order.orderId,
                  this.sequenceController.email,
                  id,
                  order.pricePerToken,
                  () => {
                    marketplaceSpinnerHolder.innerHTML = ''; // Add your spinner HTML here
                    this.closeMarketplace();
                    this.openHangar(true, id);
                    this.sequenceController.myPlanes.expectChanges();
                  }
                );
              }
            : null;
        }
        marketplaceSpinnerHolder.innerHTML = ''; // Add your spinner HTML here
      });
    });
  }

  getPlane() {
    return this.aiplane;
  }

  openMarketplace = () => {
    var modal = getElByID('marketplace-modal');
    modal.setAttribute('open', true);
  };

  minting = false;
  useFaucet = () => {
    if (this.minting) {
      return;
    }
    this.minting = true;
    var mintButton = getElByIDChain(
      'marketplace-modal',
      'article',
      'footer',
      'use-faucet-button'
    );
    mintButton.innerHTML = '<div class="spinner"></div>'; // Add your spinner HTML here

    this.sequenceController.mintERC20().then(() => {
      mintButton.innerHTML = 'Mint 🔩 100';
      this.minting = false;
      this.sequenceController.myBolts.expectChanges();
    });
  };

  openHangar = () => {
    var modal = getElByID('hangar-modal');
    if (modal.getAttribute('open') === 'true') {
      return;
    }
    modal.setAttribute('open', true);
  };

  closeGiftModal = () => {
    var modal = getElByID('gift-modal');
    modal.setAttribute('open', false);
    console.log('closing');
  };

  closeHangar = () => {
    var modal = getElByID('hangar-modal');
    modal.setAttribute('open', false);
  };

  closeMarketplace = () => {
    var modal = getElByID('marketplace-modal');
    modal.setAttribute('open', false);
  };

  burnActiveCard = () => {
    if (this.activeTokenID === null) return;

    const burnButton = getElByID('burn-button');

    burnButton.setAttribute('aria-busy', true);
    const tokenID = this.activeTokenID.toString();

    this.sequenceController.burnToken(
      tokenID,
      this.sequenceController.myAcheivements.tokenBalances.get(tokenID),
      (response, error) => {
        console.log(response, error);

        if (error === null) {
          burnButton.setAttribute('aria-busy', false);
          this.sequenceController.myAcheivements.expectChanges();
        }
      }
    );
  };

  handleSignOut = event => {
    this.switchGameMode(GameModes.SigningOut);
    this.airplane_hangar_btn.style.display = 'none';
    this.marketplace_btn.style.display = 'none';
  };

  handleCardSlotHoverOut = event => {
    const cardTooltipContainer = getElByID('cardTooltip');

    cardTooltipContainer.innerHTML = '';
    cardTooltipContainer.style.display = 'none';
  };

  handleCardSlotHover = event => {
    const cardID = event.target.id;
    const cardTooltipContainer = getElByID('cardTooltip');

    cardTooltipContainer.style.display = 'block';
    cardTooltipContainer.innerHTML = (
      this.isCardWon(cardID) ? AchievementVerbageTitle : AchievementVerbageHowTo
    )[cardID];
  };

  handleCardSlotClick = event => {
    const cardID = event.target.id;
    if (this.isCardWon(cardID)) {
      this.activeTokenID = cardID;
      var modal = getElByID('achievement-card-modal');
      const titleEl = getChildByIDChain(modal, 'article', 'title');
      titleEl.textContent =
        this.sequenceController.myAcheivements.tokenMetadatas.get(cardID).name;
      const cardEl = getChildByIDChain(
        modal,
        'article',
        'modal-content',
        'card'
      );
      cardEl.className = 'modal-card card-' + cardID;
      modal.setAttribute('open', true);
    }
  };
  closeAchievementCard = event => {
    var modal = getElByID('achievement-card-modal');
    modal.setAttribute('open', false);
  };

  showCard(cardID, onComplete) {
    this.activeCardID = cardID;
    const cardContainer = getElByID('cardContainer');
    cardContainer.innerHTML = '';

    this.card_label.innerHTML = AchievementVerbageTitle[cardID];

    const card = document.createElement('div');
    card.onclick = () => {
      this.removeCard(onComplete);
    };
    const cardBack = document.createElement('div');

    card.id = 'activeCard';
    card.className = 'card card-' + cardID;
    card.zIndex = 9;

    cardBack.className = 'card-backface';

    cardContainer.appendChild(card);
    card.appendChild(cardBack);

    const tl1 = gsap.timeline();
    tl1.to(card, {
      duration: 0.75, // Duration of the animation
      y: 0, // Move to its original position
      rotationY: 0, // Flip to show the front
      ease: 'power1.out',
    });

    const tl2 = gsap.timeline();
    tl2.to(this.card_label, {
      y: '-20px',
      duration: 0.25,
      opacity: 1.0,
    });
  }

  removeCard(onComplete) {
    if (this.activeCardID === null) return;
    getElByID('card-slots').style.zIndex = 0;

    const cardID = this.activeCardID;
    this.activeCardID = null;

    const cardSlotsContainer = getElByID('card-slots');

    const cardSlot = getChildByIDChain(cardSlotsContainer, cardID.toString());
    const { x, y, width, height } = cardSlot.getBoundingClientRect();
    const card = getElByID('activeCard');

    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight;

    const cardSlotsCurrentHeight = cardSlotsContainer.offsetHeight;

    const scaleFactorHeightWithoutMultiplier =
      availableHeight / cardSlotsCurrentHeight;
    const boundingRect = getElByID('activeCard').getBoundingClientRect();

    const tl1 = gsap.timeline();
    tl1.to(card, {
      duration: 0.75,
      x: boundingRect.x - boundingRect.width - 200,
      y: y - 2000,
      rotationY: 360,
      scale: 0.22 * scaleFactorHeightWithoutMultiplier,
      ease: 'power1.out',
      onComplete: () => {
        this.cleanUpCard(cardID);
        onComplete();
      },
    });

    const tl2 = gsap.timeline();
    tl2.to(this.card_label, {
      duration: 0.25,
      opacity: 0.0,
    });

    // tl.add(this.cleanUpCard, '+=1');
  }

  cleanUpCard(cardID) {
    if (cardID === undefined) return;

    this.addCard(cardID);

    getElByID('card-slots').style.zIndex = 8;

    const cardContainer = getElByID('cardContainer');
    cardContainer.innerHTML = '';
    this.card_label.innerHTML = '';
  }

  openWalletModal() {
    var modal = getElByID('walletModal');
    modal.setAttribute('open', true);

    var modalContent = getElByID('walletModalContent');
    modalContent.innerHTML = `<p>${this.sequenceController.email}</p>`;
  }

  closeWalletModal() {
    var modal = getElByID('walletModal');
    modal.setAttribute('open', false);
  }

  openLoginModal() {
    var modal = getElByID('loginModal');
    modal.setAttribute('open', true);
  }

  closeLoginModal() {
    var modal = getElByID('loginModal');
    modal.setAttribute('open', false);

    this.sequenceController.resetForm();
  }

  addCard(cardID) {
    const cardsEl = getElByID('card-slots');
    const cardEl = getChildByIDChain(cardsEl, cardID.toString());
    cardEl.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'card card-' + cardID;

    cardEl.appendChild(card);
  }

  myPlanesChanged = planes => {
    const gridEl = getElByIDChain('hangar-modal', 'article', 'grid-container');
    for (const id of airplaneTokenIDs) {
      const planeEl = getChildByIDChain(gridEl, `plane-${id}`);
      const ownsAny = planes.ownsAny(id);
      planeEl.classList[!ownsAny ? 'add' : 'remove']('faded');
      planeEl.onclick = ownsAny
        ? () => {
            this.airplane.addPlane(Number(id));
            for (const id2 of airplaneTokenIDs) {
              const planeEl2 = getChildByIDChain(gridEl, `plane-${id2}`);
              planeEl2.classList[id2 === id ? 'add' : 'remove']('selected');
            }
          }
        : null;
    }
  };

  myAcheivementsChanged = acheivements => {
    if (!acheivements.tokenMetadatas) {
      return;
    }
    for (const id of acheivementTokenIDs) {
      if (acheivements.ownsAny(id)) {
        this.addCard(id);
      }
    }
  };

  authModeChanged = () => {
    if (this.sequenceController.mode === AuthModes.Completed) {
      // this.closeLoginModal();
      if (this.sequenceController.email) {
        this.achievement_cards.style.display = 'block';
        this.message_box.innerHTML =
          'Welcome ' +
          this.sequenceController.email.slice(0, 7) +
          '..' +
          this.sequenceController.email.slice(
            this.sequenceController.email.length - 4,
            this.sequenceController.email.length
          ) +
          '!<br>Click to Start';
        // this.message_box.innerHTML = "Welcome " + this.sequenceController.email.slice(0,8) +".."+"!<br>Click to Start";
        this.airplane_hangar_btn.style.display = 'block';
        this.marketplace_btn.style.display = 'block';
        this.message_box.style.display = 'block';
        this.card_slots.style.display = 'block';
        this.leaderboard_wrapper.style.display = 'block';
      }
    } else {
      this.message_box.style.display = 'none';
      this.airplane_hangar_btn.style.display = 'none';
      this.marketplace_btn.style.display = 'none';
      this.card_slots.style.display = 'none';
      this.leaderboard_wrapper.style.display = 'none';
    }
  };

  resetGame() {
    this.game = {
      speed: 0.00035,
      baseSpeed: 0.00035,
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
    };

    this.isFirstPylonCrash = false;
    this.enemiesTotal = 0;
  }

  updateSpeed(deltaTime) {
    if (this.game_mode !== GameModes.Playing) return;

    this.game.speed += this.game.baseSpeed * deltaTime * 0.00002;
  }

  updateDistance(deltaTime) {
    if (this.game_mode !== GameModes.Playing) return;

    this.game.distance +=
      this.game.speed * deltaTime * this.game.ratioSpeedDistance;
    this.distance_box.innerHTML = Math.floor(this.game.distance);

    if (
      Math.floor(this.game.distance) % this.game.distanceForSpeedUpdate == 0 &&
      Math.floor(this.game.distance) > this.game.speedLastUpdate
    ) {
      this.game.speedLastUpdate = Math.floor(this.game.distance);
      this.game.targetBaseSpeed += this.game.incrementSpeedByTime * deltaTime;
    }
  }

  isLast3RunsOver500Each() {
    let lastRun = localStorage.getItem(LocalStorageKeys.LastRunID);
    if (lastRun && Number(lastRun) > 3) {
      let runOf500 = true;
      for (let i = Number(lastRun) - 1; i >= Number(lastRun) - 3; i--) {
        if (
          Number(
            localStorage.getItem(LocalStorageKeys.RunDistancePrefix + String(i))
          ) < 500
        )
          runOf500 = false;
      }
      return runOf500;
    } else {
      return false;
    }
  }

  clearLocalStores() {
    if (!localStorage.getItem(LocalStorageKeys.LastRunID)) {
      return;
    }

    let lastRun = Number(localStorage.getItem(LocalStorageKeys.LastRunID));

    for (let i = 0; i < lastRun; i++) {
      let key = LocalStorageKeys.RunDistancePrefix + String(i);
      if (!localStorage.getItem(key)) continue;
      localStorage.removeItem(key);
    }

    localStorage.removeItem(LocalStorageKeys.LastRunID);
  }

  updateLocalScores() {
    if (!localStorage.getItem(LocalStorageKeys.LastRunID)) {
      localStorage.setItem(LocalStorageKeys.LastRunID, String(0));
    }

    let lastRun = Number(localStorage.getItem(LocalStorageKeys.LastRunID));

    localStorage.setItem(
      LocalStorageKeys.RunDistancePrefix + String(lastRun),
      String(this.game.distance)
    );
    localStorage.setItem(LocalStorageKeys.LastRunID, String(lastRun + 1));
  }

  isFirstCrash() {
    return this.sequenceController.myAcheivements.ownsAny(
      AchievementCardTypes.FirstCrash.toString()
    );
  }

  isCardWon(cardID) {
    return this.sequenceController.myAcheivements.ownsAny(cardID.toString());
  }

  switchGameMode(new_game_mode) {
    if (this.game_mode === new_game_mode) return;

    this.game_mode = new_game_mode;
    if (this.game_mode === GameModes.Intro) {
      this.message_box.style.display = 'block';
      this.score_box.style.display = 'none';
      this.card_slots.style.display = 'none';
      this.leaderboard_wrapper.style.display = 'block';
      this.airplane_hangar_btn.style.display = 'none';
      this.marketplace_btn.style.display = 'none';
      this.changeSignoutButtonDisplay('none');
      this.achievement_cards.style.display = 'none';
    } else if (this.game_mode === GameModes.Playing) {
      this.score_box.style.display = 'block';
      this.message_box.style.display = 'none';
      this.card_slots.style.display = 'none';
      this.leaderboard_wrapper.style.display = 'none';
      this.airplane_hangar_btn.style.display = 'none';
      this.marketplace_btn.style.display = 'none';
      this.changeSignoutButtonDisplay('none');
      this.achievement_cards.style.display = 'none';
    } else if (this.game_mode === GameModes.Paused) {
      this.score_box.style.display = 'block';
      this.message_box.style.display = 'block';
      this.card_slots.style.display = 'block';
      this.leaderboard_wrapper.style.display = 'block';
      this.message_box.innerHTML = 'Paused<br>Click to Resume';
      this.airplane_hangar_btn.style.display = 'block';
      this.marketplace_btn.style.display = 'block';
      this.changeSignoutButtonDisplay('block');
      this.achievement_cards.style.display = 'none';
    } else if (this.game_mode === GameModes.GameEnding) {
      this.score_box.style.display = 'block';
      this.message_box.style.display = 'block';
      this.card_slots.style.display = 'block';
      this.leaderboard_wrapper.style.display = 'block';
      this.message_box.innerHTML = 'Game Over';
      this.achievement_cards.style.display = 'block';

      this.updateLocalScores();

      this.leaderboardManager.saveScore(
        this.game.distance,
        this.sequenceController.email,
        this.sequenceController.walletAddress
      );
    } else if (this.game_mode === GameModes.GameOver) {
      this.score_box.style.display = 'block';
      this.message_box.style.display = 'block';
      this.card_slots.style.display = 'block';
      this.leaderboard_wrapper.style.display = 'block';
      this.message_box.innerHTML = 'Game Over<br>Click to Replay';

      const achievementTokensToMint = [];

      if (
        this.game.distance >= 2500 &&
        !this.isCardWon(AchievementCardTypes.TwentyFiveHundredMeterRun)
      ) {
        achievementTokensToMint.push(
          AchievementCardTypes.TwentyFiveHundredMeterRun
        );
      }
      if (
        this.isLast3RunsOver500Each() &&
        !this.isCardWon(AchievementCardTypes.ThreeRuns)
      ) {
        achievementTokensToMint.push(AchievementCardTypes.ThreeRuns);
      }
      if (
        this.game.distance >= 1000 &&
        this.game.distance < 2500 &&
        !this.isCardWon(AchievementCardTypes.ThousandMeterRun)
      ) {
        achievementTokensToMint.push(AchievementCardTypes.ThousandMeterRun);
      }
      if (
        this.isFirstPylonCrash &&
        !this.isCardWon(AchievementCardTypes.FirstPylonCrash)
      ) {
        achievementTokensToMint.push(AchievementCardTypes.FirstPylonCrash);
      }

      if (!this.isCardWon(AchievementCardTypes.FirstCrash)) {
        achievementTokensToMint.push(AchievementCardTypes.FirstCrash);
      }

      const achievementSequence = async () => {
        this.game_mode = GameModes.CardReady;
        this.message_box.innerHTML = 'Game Over';
        while (achievementTokensToMint.length > 0) {
          const tokenID = achievementTokensToMint.shift();
          await Promise.all([
            new Promise(async resolve => {
              this.showCard(tokenID, resolve);
              this.sequenceController.callAchievementMinterContract(
                tokenID,
                (tx, error) => {
                  if (error) {
                    console.log(error);
                    return;
                  }
                  console.log(tx);
                  this.sequenceController.myAcheivements.expectChanges();
                }
              );
            }),
            new Promise(resolve => setTimeout(resolve, 2000)),
          ]);
        }
        this.game_mode = GameModes.GameOver;
        this.changeSignoutButtonDisplay('block');
        this.airplane_hangar_btn.style.display = 'block';
        this.marketplace_btn.style.display = 'block';
        this.message_box.style.display = 'block';
        this.message_box.innerHTML = 'Game Over<br>Click to Replay';
      };
      achievementSequence();
    }
  }

  handleMouseClick() {
    if (
      this.game_mode === GameModes.SigningOut ||
      this.game_mode === GameModes.CardDetails
    )
      return;
    if (this.sequenceController.mode !== AuthModes.Completed) {
      window.setOpenConnectModal();
      return;
    }

    if (this.game_mode === GameModes.Intro) {
      this.switchGameMode(GameModes.Playing);
    } else if (this.game_mode === GameModes.Playing) {
      this.switchGameMode(GameModes.Paused);
    } else if (this.game_mode === GameModes.Paused) {
      this.switchGameMode(GameModes.Playing);
    } else if (
      this.game_mode === GameModes.GameEnding ||
      this.game_mode === GameModes.CardWon
    ) {
      return;
    } else if (this.game_mode === GameModes.CardReady) {
      //card is removed by clicking on it
      return;
      ``;
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

    this.sky.rotation.z += (deltaTime * this.game.speed) / 2;

    this.sea.tick(deltaTime, this.game.speed);

    if (this.game_mode === GameModes.Playing) {
      this.updatePlane(deltaTime, mousePos);
      this.updateDistance(deltaTime);

      if (
        Math.floor(this.game.distance) % this.game.distanceForEnemiesSpawn ==
          0 &&
        Math.floor(this.game.distance) > this.game.enemyLastSpawn
      ) {
        this.game.enemyLastSpawn = Math.floor(this.game.distance);
        this.spawnEnemies(4);
      }

      this.updateSpeed(deltaTime);
    } else if (this.game_mode === GameModes.GameEnding) {
      this.game.speed *= 0.99;
      this.airplane.rotation.z +=
        (-Math.PI / 2 - this.airplane.rotation.z) * 0.0002 * deltaTime;
      this.airplane.rotation.x += 0.0003 * deltaTime;
      this.game.planeFallSpeed *= 1.05;
      this.airplane.position.y -= this.game.planeFallSpeed * deltaTime;

      if (this.airplane.position.y < -200) {
        this.switchGameMode(GameModes.GameOver);
      }
    } else if (
      this.game_mode !== GameModes.GameOver &&
      this.game_mode !== GameModes.CardWon &&
      this.game_mode !== GameModes.CardReady
    ) {
      this.updatePlane(deltaTime, mousePos);
    }

    for (const [index, enemy] of this.enemies.entries()) {
      enemy.tick(deltaTime);

      enemy.angle += deltaTime * this.game.speed;

      if (enemy.angle > Math.PI * 2) {
        enemy.angle -= Math.PI * 2;
      }

      enemy.position.x = Math.cos(enemy.angle) * enemy.distance;
      enemy.position.y =
        -this.game.seaRadius + Math.sin(enemy.angle) * enemy.distance;

      if (
        this.collideCheck(
          this.airplane,
          enemy,
          this.game.enemyDistanceTolerance
        )
      ) {
        this.explodeEnemy(enemy);

        if (enemy.name === 0) {
          this.isFirstPylonCrash = true;
        }

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

    var targetY = this.normalize(mousePos.y, -0.75, 0.75, 25, 175) + 100;
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
      const enemy = new Enemy(this.enemiesTotal);
      this.enemiesTotal += 1;
      enemy.angle = -(i * 0.1);
      enemy.distance =
        this.game.seaRadius +
        this.game.planeDefaultHeight +
        (-1 + Math.random() * 2) * (this.game.planeAmpHeight - 20);
      enemy.position.x = Math.cos(enemy.angle) * enemy.distance;
      enemy.position.y =
        -this.game.seaRadius + Math.sin(enemy.angle) * enemy.distance;

      this.add(enemy);
      this.enemies.add(enemy);
    }
  }

  explodeEnemy(enemy) {
    this.spawnParticles(enemy.position.clone(), 15, new Color('red'), 3);
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
      const targetX = pos.x + (-1 + Math.random() * 2) * 50;
      const targetY = pos.y + (-1 + Math.random() * 2) * 50;
      const targetZ = pos.z + (-1 + Math.random() * 2) * 50;
      const speed = 0.6 + Math.random() * 0.2;
      gsap.to(mesh.rotation, speed, {
        x: Math.random() * 12,
        y: Math.random() * 12,
      });
      gsap.to(mesh.scale, speed, { x: 0.1, y: 0.1, z: 0.1 });
      gsap.to(mesh.position, speed, {
        x: targetX,
        y: targetY,
        z: targetZ,
        delay: Math.random() * 0.1,
        ease: 'power2.out',
        onComplete: () => {
          this.remove(mesh);
        },
      });
    }
  }

  normalize(v, vmin, vmax, tmin, tmax) {
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + pc * dt;
    return tv;
  }
}
