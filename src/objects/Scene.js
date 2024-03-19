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

import { SequenceIndexer } from '@0xsequence/indexer';

const indexer = new SequenceIndexer(
  'https://arbitrum-sepolia-indexer.sequence.app', ENV.projectAccessKeyProd
);

const colors = [
  'rgba(255, 165, 0, 0.65)',
  'rgba(173, 216, 230, 0.65)',
  'rgba(0, 128, 0, 0.65)',
  'rgba(255, 255, 0, 0.65)',
  'rgba(0, 0, 255, 0.65)',
  'rgba(75, 0, 130, 0.65)',
].reverse();

const GameModes = {
  Intro: 'intro',
  Playing: 'playing',
  Paused: 'paused',
  GameEnding: 'gameending',
  GameOver: 'gameover',
  CardWon: 'cardwon',
  CardReady: 'cardready',
  SigningOut: 'signingout',
  CardDetails: 'carddetails',
};

const CardTypes = {
  FirstCrash: 1,
  ThousandMeterRun: 2,
  ThreeRuns: 3,
  TwentyFiveHundredMeterRun: 4,
  FirstPylonCrash: 5,
};

const LocalStorageKeys = {
  LastRunID: 'last_run_id',
  RunDistancePrefix: 'run_distance_',
};

let selectedId = null; // Simulate selectedId

export default class MainScene extends Group {
  airplane;
  constructor() {
    super();

    this.sequenceController = new SequenceController();
    this.sequenceController.authModeChangedCallback =
      this.authModeChanged.bind(this);
    this.sequenceController.balancesChangedCallback =
      this.walletBalancesChanged.bind(this);
    this.leaderboardManager = new LeaderboardManager();

    this.game_mode = GameModes.Intro;
    this.game_mode_previous = null;
    this.airplane_hangar_btn = document.getElementById('airplaneHangarBtn');
    this.faucet_btn = document.getElementById('faucetBtn');
    this.wallet_btn = document.getElementById('walletButton');
    this.achievement_cards = document.getElementById('achievment-cards')

    var self = this;
    let intervalSignOutBtn = setInterval(() => {
      if (document.getElementById('signOutBtn')) {
        self.sign_out_btn = document.getElementById('signOutBtn');
        self.sign_out_container = document.getElementById('signOutContainer');
        clearInterval(intervalSignOutBtn);
      }
    }, 1000);

    this.message_box = document.getElementById('replayMessage');
    this.distance_box = document.getElementById('distValue');
    this.score_box = document.getElementById('score');
    this.card_slots = document.getElementById('cardSlots');
    this.card_label = document.getElementById('cardLabel');
    this.leaderboard_wrapper = document.getElementById('leaderboardContainer');
    this.card_containers = [];

    this.requestIds = [];
    // this.signout_btn.addEventListener('mouseup', this.handleSignOut.bind(this), false);

    for (let i = 0; i < 5; i++) {
      const cardContainer = document.getElementById('cardSlot' + (i + 1));

      cardContainer.addEventListener(
        'mouseover',
        this.handleCardSlotHover.bind(this),
        false
      );
      cardContainer.addEventListener(
        'mouseout',
        this.handleCardSlotHoverOut.bind(this),
        false
      );
      cardContainer.addEventListener(
        'mouseup',
        this.handleCardSlotClick.bind(this),
        false
      );

      this.card_containers.push(cardContainer);
    }

    this.activeCardID = null;
    this.activeToken = null;

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

  handleCardSlotClick(event) {
    console.log(event);
    this.sequenceController.fetchWalletTokens();

    setTimeout(() => {
      let cardID = this.card_containers.indexOf(event.target);

      if (cardID === -1) return;
      cardID += 1;
      if (!this.isCardWon(cardID)) return;
  
      this.game_mode = GameModes.CardDetails;
  
      for (
        let i = 0;
        i < this.sequenceController.ownedTokenBalances.length;
        i++
      ) {
        const balance = this.sequenceController.ownedTokenBalances[i];
  
        if (Number(balance.tokenID) === cardID) this.showCardModal(balance);
      }
    }, 1000)
  }

  getPlane() {
    return this.aiplane;
  }

  arrayDelta(array1, array2) {
    // Convert arrays to sets for efficient lookup
    const set1 = new Set(array1);
    const set2 = new Set(array2);

    // Calculate delta
    const delta = [];
    for (const item of set1) {
      if (!set2.has(item)) {
        delta.push(item);
      }
    }
    return delta;
  }

  addOrderIfUnique(order) {
    // Check if there's an existing order with the same tokenId
    const exists = this.requestIds.some(
      existingOrder => existingOrder.tokenId === order.tokenId
    );

    if (!exists) {
      // If no existing order with the same tokenId, push the new order to the array
      this.requestIds.push({
        orderId: order.orderId,
        tokenId: order.tokenId,
        pricePerToken: order.pricePerToken,
      });
      console.log(`Order ${order.orderId} added.`);
    } else {
      console.log(`An order with tokenId ${order.tokenId} already exists.`);
    }
  }

  async switchToMarketplace(fromPurchase = false) {
    const panelContainer =
      document.getElementsByClassName('panel-container')[0];
    document.getElementById('marketPlaceButton') &&
      document.getElementById('marketPlaceButton').remove();
    // removing elements
    document.getElementById('inventory-title') &&
      document.getElementById('inventory-title').remove();
    document.querySelectorAll('.color-panel').forEach((panel, idx) => {
      panel.remove();
    });

    // adding elements
    const modalFooter = document.getElementById('modal-footer');

    if (!fromPurchase) {
      const inventoryButton = document.createElement('a');
      inventoryButton.id = 'inventoryButton';
      inventoryButton.innerHTML = 'Inventory';
      inventoryButton.role = 'button';
      inventoryButton.class = 'secondary';
      inventoryButton.ariaDisabled = 'false';
      inventoryButton.href = '#';
      inventoryButton.setAttribute('onclick', 'openInventory(event)');

      modalFooter.appendChild(inventoryButton);
    }

    indexer
      .getTokenBalances({
        accountAddress: this.sequenceController.email,
        contractAddress: '0xa9c88358862211870db6f18bc9b3f6e4f8b3eae7',
      })
      .then(tokenBalances => {

        console.log(tokenBalances);

        for (let i = 0; i < tokenBalances.balances.length; i++) {
          if(tokenBalances.balances[i].contractAddress == '0xa9c88358862211870db6f18bc9b3f6e4f8b3eae7'){
            const balance = tokenBalances.balances[i].balance;
            const titleMarketplace = document.createElement('p');
            titleMarketplace.id = 'marketplace-title';
            titleMarketplace.innerHTML = 'Marketplace &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 'Balance (⌨) ' + Number(balance / 10**18).toFixed(0);
            titleMarketplace.style = 'position: relative; text-align: center;';
            panelContainer.prepend(titleMarketplace);
          }
        }

      })
      .catch(error => {
        console.log(error);
      });

    const gridContainer = document.getElementById('gridContainer');
    const titles = [
      { title: 'Falcon Mark IV Redtail', price: 0 },
      { title: 'Hawkwind P-22 Emerald', price: 0 },
      { title: 'Lightning Spectre G6', price: 0 },
      { title: 'Raptor Fury X2', price: 0 },
      { title: 'Skyraider Z-11 Onyx', price: 0 },
      { title: 'Thunderbolt XR-5 Cobalt', price: 0 },
    ];

    const res = await fetch(
      'https://dev-marketplace-api.sequence.app/arbitrum-sepolia/rpc/Marketplace/GetTopOrders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionAddress: '0x1693ffc74edbb50d6138517fe5cd64fd1c917709',
          currencyAddresses: ['0xa9c88358862211870db6f18bc9b3f6e4f8b3eae7'],
          orderbookContractAddress:
            '0xB537a160472183f2150d42EB1c3DD6684A55f74c',
          tokenIDs: ['0', '1', '2', '3', '4', '5'],
          isListing: true,
          priceSort: 'DESC',
        }),
      }
    );
    const result = await res.json();

    const prices = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    var self = this;
    console.log(result.orders);
    result.orders.map(async order => {
      console.log('in this loop');
      console.log(order);
      self.addOrderIfUnique({
        orderId: order.orderId,
        tokenId: order.tokenId,
        pricePerToken: order.pricePerToken,
      });
      if (Number(order.pricePerToken) / 10 ** 18 >= 0.01) {
        prices[order.tokenId] =
          Number(order.pricePerToken).toFixed(2) / 10 ** 18;
      }
    });

    colors.forEach((color, index) => {
      const panel = document.createElement('div');
      panel.className = 'color-panel ' + 'plane-' + index;
      if (Object.values(prices)[index] >= 0.01) {
        panel.onclick = () => self.handlePanelClick(index, true);

        const panelText = document.createElement('span');
        panelText.className = 'plane-info';
        panelText.textContent = `${titles[index].title}`; // Assuming titles is the list of objects containing title and price
        panel.appendChild(panelText);

        const priceText = document.createElement('span');
        priceText.className = 'plane-info-price';
        priceText.textContent = `$${prices[index]}`; // Assuming titles is the list of objects containing title and price

        panel.appendChild(priceText);
      }
      gridContainer.appendChild(panel);
    });

    Object.values(prices).map((_, i) => {
      if (_ < 0.01) {
        console.log(i);
        const el = document.getElementsByClassName(`plane-${i}`)[0];
        console.log(el);
        el.style.backgroundImage = 'url()';
      }
    });
  }

  openHangar() {
    const panelContainer =
      document.getElementsByClassName('panel-container')[0];

    const titleMarketplace = document.createElement('p');
    titleMarketplace.id = 'inventory-title';
    titleMarketplace.innerHTML = 'Inventory';
    titleMarketplace.style = 'position: relative; text-align: center;';
    panelContainer.prepend(titleMarketplace);

    const modalFooter = document.getElementById('modal-footer');

    const marketplaceButton = document.createElement('a');
    marketplaceButton.id = 'marketPlaceButton';
    marketplaceButton.innerHTML = 'Marketplace';
    marketplaceButton.role = 'button';
    marketplaceButton.class = 'secondary';
    marketplaceButton.ariaDisabled = 'false';
    marketplaceButton.href = '#';
    marketplaceButton.setAttribute('onclick', 'switchToMarketplace(event)');
    console.log(marketplaceButton)
    modalFooter.appendChild(marketplaceButton);

    var self = this;
    indexer
      .getTokenBalances({
        accountAddress: this.sequenceController.email,
        contractAddress: '0x1693ffc74edbb50d6138517fe5cd64fd1c917709',
        includeMetadata: true,
        metadataOptions: {
          includeMetadataContracts: [
            '0x1693ffc74edbb50d6138517fe5cd64fd1c917709',
          ],
        },
      })
      .then(tokenBalances => {
        console.log(tokenBalances);
        let ownedTokenBalances = [];

        for (let i = 0; i < tokenBalances.balances.length; i++) {
          const tokenId = tokenBalances.balances[i].tokenID;
          ownedTokenBalances.push(tokenId);
        }

        const ids = ['0', '1', '2', '3', '4', '5'];
        const blanks = this.arrayDelta(ids, ownedTokenBalances);

        const gridContainer = document.getElementById('gridContainer');

        colors.forEach((color, index) => {
          const panel = document.createElement('div');
          panel.className = 'color-panel ' + 'plane-' + index;
          if (!blanks.includes(index)){
            panel.onclick = () => self.handlePanelClick(index, false, true);
          }
          gridContainer.appendChild(panel);
        });

        self.handlePanelClick(Number(localStorage.getItem('plane_color')), false, false)

        self.loadPlanes(ownedTokenBalances);
      })
      .catch(error => {
        console.log(error);
      });
  }

  loadPlanes(tokenIDs) {
    console.log(tokenIDs);
    const ids = ['0', '1', '2', '3', '4', '5'];
    const blanks = this.arrayDelta(ids, tokenIDs);
    console.log(blanks);
    blanks.map((_, i) => {
      const el = document.getElementsByClassName(`plane-${_}`)[0];
      console.log(el);
      el.style.backgroundImage = 'url()';
    });

    var modal = document.getElementById('cardModal-hangar');
    modal.setAttribute('open', true);

  }

  showCardModal(token) {
    this.activeToken = token;
    var modal = document.getElementById('cardModal');
    modal.setAttribute('open', true);

    var modalContent = document.getElementById('cardModalContent');
    modalContent.innerHTML = `<p>${token.tokenID}</p>`;
  }

  removeAllPurchaseButtons() {
    [1, 2, 3, 4, 5, 6].map(id => {
      document.getElementById('purchaseButton-' + id) &&
        document.getElementById('purchaseButton-' + id).remove();
    });
  }

  cardSlotClickHandlers() {
    for (let i = 0; i < 5; i++) {
      const cardContainer = document.getElementById('cardSlot' + (i + 1));

      cardContainer.addEventListener(
        'mouseover',
        this.handleCardSlotHover.bind(this),
        false
      );
      cardContainer.addEventListener(
        'mouseout',
        this.handleCardSlotHoverOut.bind(this),
        false
      );
      cardContainer.addEventListener(
        'mouseup',
        this.handleCardSlotClick.bind(this),
        false
      );

      this.card_containers.push(cardContainer);
    }
  }

  handlePanelClick(id, marketplace = false, openingHangar = false) {
    console.log(id);
    console.log('handle panel click')

    // Update the visual state of panels based on selection
    document.querySelectorAll('.color-panel').forEach((panel, idx) => {
      console.log('in for each')
      if (idx === id) {
        panel.classList.add('selected');
      } else {
        panel.classList.remove('selected');
      }
    });
    selectedId = id; // Update selected ID
    if (!marketplace) {
      this.airplane.addPlane(id);
    } else {
      this.removeAllPurchaseButtons();
      const modalFooter = document.getElementById('modal-footer');

      const inventoryButton = document.createElement('a');
      inventoryButton.id = 'purchaseButton-' + id;
      inventoryButton.innerHTML = 'Purchase?';
      inventoryButton.role = 'button';
      inventoryButton.class = 'secondary';
      inventoryButton.ariaDisabled = 'false';
      inventoryButton.href = '#';
      // requestId, mainScene.sequenceController.email, tokenID, amount,
      inventoryButton.setAttribute('onclick', `purchase(event, ${id})`);

      modalFooter.appendChild(inventoryButton);
    }

    if(openingHangar) this.closeCardModal()
  }
  openInventory(withLoading = false) {
    document.querySelectorAll('.color-panel').forEach((panel, idx) => {
      panel.remove();
    });

    this.removeAllPurchaseButtons();

    const panelContainer =
      document.getElementsByClassName('panel-container')[0];

    document.getElementById('marketplace-title') && document.getElementById('marketplace-title').remove();

    if(!document.getElementById('inventory-title')){

    const titleMarketplace = document.createElement('p');
    titleMarketplace.id = 'inventory-title';
    titleMarketplace.innerHTML = 'Inventory';
    titleMarketplace.style = 'position: relative; text-align: center;';
    panelContainer.prepend(titleMarketplace);
  }

    document.getElementById('inventoryButton') && document.getElementById('inventoryButton').remove();
    
    if(withLoading == false){

    const modalFooter = document.getElementById('modal-footer');

      const marketPlaceButton = document.createElement('a');
      marketPlaceButton.id = 'marketPlaceButton';
      marketPlaceButton.innerHTML = 'Marketplace';
      marketPlaceButton.role = 'button';
      marketPlaceButton.class = 'secondary';
      marketPlaceButton.ariaDisabled = 'false';
      marketPlaceButton.href = '#';
      marketPlaceButton.setAttribute('onclick', 'switchToMarketplace(event)');
      console.log(marketPlaceButton)
      modalFooter.appendChild(marketPlaceButton);
    }

    const gridContainer = document.getElementById('gridContainer');
    var self = this;

    if(!withLoading){
      gridContainer.innerHTML = ''; // Add your spinner HTML here
      gridContainer.style.display = 'grid'    
      // gridContainer.style.marginLeft = '0px'    
      // gridContainer.style.marginTop = '0px' 
    indexer
      .getTokenBalances({
        accountAddress: this.sequenceController.email,
        contractAddress: '0x1693ffc74edbb50d6138517fe5cd64fd1c917709',
        includeMetadata: true,
        metadataOptions: {
          includeMetadataContracts: [
            '0x1693ffc74edbb50d6138517fe5cd64fd1c917709',
          ],
        },
      })
      .then(tokenBalances => {
        console.log(tokenBalances);
        let ownedTokenBalances = [];
          colors.forEach((color, index) => {
            const panel = document.createElement('div');
            panel.className = 'color-panel ' + 'plane-' + index;
            panel.onclick = () => self.handlePanelClick(index);

            gridContainer.appendChild(panel);
          });

          for (let i = 0; i < tokenBalances.balances.length; i++) {
            const tokenId = tokenBalances.balances[i].tokenID;
            ownedTokenBalances.push(tokenId);
          }

          self.loadPlanes(ownedTokenBalances);
      })
      .catch(error => {
        console.log(error);
      });
    } else {
      // loading
      console.log('loading')
      // const 
      gridContainer.innerHTML = '<div class="spinner"></div>'; // Add your spinner HTML here
      gridContainer.style.display = 'flex'    
      gridContainer.style.width = '400px'    
      // gridContainer.style.marginTop = '100px'    
      // gridContainer.appendChild()
    }
  }
  closeGiftModal() {
    var modal = document.getElementById('cardModal-gift');
    modal.setAttribute('open', false);
    console.log('closing');
  }
  closeCardModal() {
    this.activeToken = null;
    var modal = document.getElementById('cardModal-hangar');
    var modal1 = document.getElementById('cardModal');
    modal.setAttribute('open', false);
    modal1.setAttribute('open', false);
    console.log('closing modal')
    if (this.game_mode_previous == null) {
      console.log('test');
      this.game_mode = GameModes.Intro;
    } else {
      this.game_mode = this.game_mode_previous;
      this.game_mode_previous = null;
      console.log('else');
    }

    this.removeAllPurchaseButtons();

    document.querySelectorAll('.color-panel').forEach((panel, idx) => {
      panel.remove();
    });
    const marketPlaceBtn = document.getElementById('marketPlaceButton');
    const inventoryBtn = document.getElementById('inventoryButton');

    document.getElementById('inventory-title') &&
      document.getElementById('inventory-title').remove();
    document.getElementById('marketplace-title') &&
      document.getElementById('marketplace-title').remove();

    marketPlaceBtn && marketPlaceBtn.remove();
    inventoryBtn && inventoryBtn.remove();
  }

  burnActiveCard() {
    if (this.activeToken === null) return;

    const burnButton = document.getElementById('burnButton');

    burnButton.setAttribute('aria-busy', true);

    this.sequenceController.burnToken(this.activeToken, (response, error) => {
      console.log(response, error);

      if (error === null) {
        setTimeout(() => {
          burnButton.setAttribute('aria-busy', false);
          this.sequenceController.fetchWalletTokens();
          this.closeCardModal();
        }, 7000);
      }
    });
  }

  handleSignOut(event) {
    this.game_mode = GameModes.SigningOut;
    this.airplane_hangar_btn.style.display = 'none';
    this.faucet_btn.style.display = 'none';
    this.wallet_btn.style.display = 'none'
    console.log('signing outtt');
  }

  handleCardSlotHoverOut(event) {
    let cardTooltipContainer = document.getElementById('cardTooltip');

    cardTooltipContainer.innerHTML = '';
    cardTooltipContainer.style.display = 'none';
  }

  handleCardSlotHover(event) {
    let cardID = this.card_containers.indexOf(event.target);
    if (cardID === -1) return;
    cardID += 1;
    let cardTooltipContainer = document.getElementById('cardTooltip');

    cardTooltipContainer.style.display = 'block';

    switch (cardID) {
      case CardTypes.FirstCrash:
        cardTooltipContainer.innerHTML = this.isCardWon(cardID)
          ? 'First Crash!'
          : 'Try crashing once';
        break;

      case CardTypes.ThousandMeterRun:
        cardTooltipContainer.innerHTML = this.isCardWon(cardID)
          ? '1000m Run!'
          : 'Can you pass 1000m?';
        break;

      case CardTypes.ThreeRuns:
        cardTooltipContainer.innerHTML = this.isCardWon(cardID)
          ? 'Three 500m Runs in a Row!'
          : 'Can you do 3x 500m runs in a row?';
        break;

      case CardTypes.TwentyFiveHundredMeterRun:
        cardTooltipContainer.innerHTML = this.isCardWon(cardID)
          ? '2500m Run!'
          : 'Can you go past 2500m?';
        break;

      case CardTypes.FirstPylonCrash:
        cardTooltipContainer.innerHTML = this.isCardWon(cardID)
          ? 'Crashed with First Pylon!'
          : 'Try hitting the first pylon!';
        break;

      default:
        cardTooltipContainer.innerHTML = '';
        break;
    }
  }

  showCard(cardID) {
    this.game_mode = GameModes.CardWon;
    this.activeCardID = cardID;

    switch (cardID) {
      case CardTypes.FirstCrash:
        this.card_label.innerHTML = 'First Crash!';
        break;

      case CardTypes.ThousandMeterRun:
        this.card_label.innerHTML = '1000m Run!';
        break;

      case CardTypes.ThreeRuns:
        this.card_label.innerHTML = 'Three 500m Runs in a Row!';
        break;

      case CardTypes.TwentyFiveHundredMeterRun:
        this.card_label.innerHTML = '2500m Run!';
        break;

      case CardTypes.FirstPylonCrash:
        this.card_label.innerHTML = 'Crashed with First Pylon!';
        break;

      default:
        break;
    }

    const card = document.createElement('div');
    const cardBack = document.createElement('div');
    const cardContainer = document.getElementById('cardContainer');

    card.id = 'activeCard';
    card.className = 'card card-' + cardID;
    card.zIndex = 9;

    cardBack.className = 'card-backface';

    cardContainer.appendChild(card);
    card.appendChild(cardBack);

    const tl = gsap.timeline({
      onComplete: this.showCardCleanUp.bind(this),
    });

    tl.to(card, {
      duration: 0.75, // Duration of the animation
      y: 0, // Move to its original position
      rotationY: 0, // Flip to show the front
      ease: 'power1.out',
    });

    tl.to(this.card_label, {
      y: '-20px',
      duration: 0.75,
      opacity: 1.0,
    });

    tl.add(() => {}, '+=2');
  }

  showCardCleanUp() {
    this.game_mode = GameModes.CardReady;
    // cardSlotClickHandlers();
    document.getElementById('cardSlots').style.zIndex = 8;
  }

  removeCard() {
    if (this.activeCardID === null) return;
    document.getElementById('cardSlots').style.zIndex = 0;

    const cardID = this.activeCardID;
    this.activeCardID = null;

    const tl = gsap.timeline({
      onComplete: this.cleanUpCard.bind(this),
      onCompleteParams: [cardID],
    });

    const cardSlot = this.card_containers[parseInt(cardID) - 1];
    const { x, y, width, height } = cardSlot.getBoundingClientRect();
    const card = document.getElementById('activeCard');
    console.log(window.innerHeight*.1)
    tl.to(card, {
      duration: 1.25,
      x: x - card.getBoundingClientRect().left + window.scrollX - width - window.innerWidth*.3*0.188333333,
      y: y - card.getBoundingClientRect().top + window.scrollY - height - window.innerHeight*.16,
      rotationY: 360,
      scale: 0.175,
      ease: 'power1.out',
    });

    tl.to(this.card_label, {
      duration: 1.25,
      opacity: 0.0,
    });

    tl.add(this.cleanUpCard.bind(this), '+=1');
  }

  cleanUpCard(cardID) {
    if (cardID === undefined) return;

    this.addCard(cardID);

    document.getElementById('cardSlots').style.zIndex = 8;

    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = '';
    this.card_label.innerHTML = '';

    this.game_mode = GameModes.GameOver;
    // document.getElementById('cardSlots').style.zIndex = 9;
    this.airplane_hangar_btn.style.display = 'block';
    this.wallet_btn.style.display = 'block';
    this.sign_out_btn.style.display = 'block';
    this.sign_out_container.style.display = 'flex';
    this.faucet_btn.style.display = 'block';
    this.cardSlotClickHandlers();
    // this.sequenceController.fetchWalletTokens();
  }

  openWalletModal() {
    var modal = document.getElementById('walletModal');
    modal.setAttribute('open', true);

    var modalContent = document.getElementById('walletModalContent');
    console.log(this.sequenceController.email)
    modalContent.innerHTML = `<p>${this.sequenceController.email}</p>`;
  }

  closeWalletModal() {
    var modal = document.getElementById('walletModal');
    modal.setAttribute('open', false);
  }

  openLoginModal() {
    var modal = document.getElementById('loginModal');
    modal.setAttribute('open', true);
  }

  closeLoginModal() {
    var modal = document.getElementById('loginModal');
    modal.setAttribute('open', false);

    this.sequenceController.resetForm();
  }

  clearAllCards() {
    for (let i = 0; i < 5; i++) {
      const cardContainer = this.card_containers[i];
      cardContainer.innerHTML = '';
    }
  }

  addCard(cardID) {
    const cardContainer = this.card_containers[parseInt(cardID) - 1];
    const card = document.createElement('div');

    card.className = 'card card-' + cardID;

    cardContainer.appendChild(card);
  }

  walletBalancesChanged() {
    this.clearAllCards();

    for (
      let i = 0;
      i < this.sequenceController.ownedTokenBalances.length;
      i++
    ) {
      const tokenBalance = this.sequenceController.ownedTokenBalances[i];

      this.addCard(tokenBalance.tokenID);
    }
  }

  authModeChanged() {
    if (this.sequenceController.mode === AuthModes.Completed) {
      // this.closeLoginModal();
      console.log(this.sequenceController.email);
      if (this.sequenceController.email) {
        this.achievement_cards.style.display = 'block'
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
        this.faucet_btn.style.display = 'block';
        this.message_box.style.display = 'block';
        this.wallet_btn.style.display = 'block'

        this.card_slots.style.display = 'block';
        this.leaderboard_wrapper.style.display = 'block';
      }
    } else {
      console.log('removing message box');
      this.message_box.style.display = 'none';
      this.faucet_btn.style.display = 'none';
      this.airplane_hangar_btn.style.display = 'none';
      this.card_slots.style.display = 'none';
      this.leaderboard_wrapper.style.display = 'none';
      this.wallet_btn.style.display = 'none'
    }
  }

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
    return Number(localStorage.getItem(LocalStorageKeys.LastRunID)) === 1;
  }

  isCardWon(cardID) {
    for (
      let i = 0;
      i < this.sequenceController.ownedTokenBalances.length;
      i++
    ) {
      const balance = this.sequenceController.ownedTokenBalances[i];
      if (Number(balance.tokenID) === cardID) return true;
    }

    return false;
  }

  switchGameMode(new_game_mode) {
    if (this.game_mode === new_game_mode) return;

    this.game_mode = new_game_mode;
    if (this.game_mode === GameModes.Intro) {
      this.message_box.style.display = 'block';
      this.score_box.style.display = 'none';
      this.card_slots.style.display = 'none';
      this.leaderboard_wrapper.style.display = 'block';
      this.message_box.style.display = 'none';
      this.airplane_hangar_btn.style.display = 'none';
      this.sign_out_btn.style.display = 'none';
      this.sign_out_container.style.display = 'none';
      this.faucet_btn.style.display = 'none';
      this.achievement_cards.style.display = 'none'
      console.log('intro');
      this.achievement_cards.style.display = 'none'
      this.wallet_btn.style.display = 'none'

    } else if (this.game_mode === GameModes.Playing) {
      this.score_box.style.display = 'block';
      this.message_box.style.display = 'none';
      this.card_slots.style.display = 'none';
      this.leaderboard_wrapper.style.display = 'none';
      this.airplane_hangar_btn.style.display = 'none';
      this.sign_out_btn.style.display = 'none';
      this.sign_out_container.style.display = 'none';
      this.faucet_btn.style.display = 'none';
      this.achievement_cards.style.display = 'none'
      this.wallet_btn.style.display = 'none'

    } else if (this.game_mode === GameModes.Paused) {
      this.score_box.style.display = 'block';
      this.message_box.style.display = 'block';
      this.card_slots.style.display = 'block';
      this.leaderboard_wrapper.style.display = 'block';
      this.message_box.innerHTML = 'Paused<br>Click to Resume';
      this.airplane_hangar_btn.style.display = 'block';
      this.sign_out_btn.style.display = 'block';
      this.sign_out_container.style.display = 'block';
      this.faucet_btn.style.display = 'block';
      this.achievement_cards.style.display = 'none'
      this.wallet_btn.style.display = 'block'

    } else if (this.game_mode === GameModes.GameEnding) {
      this.score_box.style.display = 'block';
      this.message_box.style.display = 'block';
      this.card_slots.style.display = 'block';
      this.leaderboard_wrapper.style.display = 'block';
      this.message_box.innerHTML = 'Game Over';
      this.achievement_cards.style.display = 'block'

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

      document.getElementById('cardSlots').style.zIndex = 0;

      if (
        this.game.distance >= 2500 &&
        !this.isCardWon(CardTypes.TwentyFiveHundredMeterRun)
      ) {
        this.showCard(CardTypes.TwentyFiveHundredMeterRun);
        this.sequenceController.callContract(
          CardTypes.TwentyFiveHundredMeterRun,
          (tx, error) => {
            if (error) {
              console.log(error);
              return;
            }
            console.log(tx);
            setTimeout(
              () => this.sequenceController.fetchWalletTokens(true),
              2000
            );
          }
        );
      } else if (
        this.isLast3RunsOver500Each() &&
        !this.isCardWon(CardTypes.ThreeRuns)
      ) {
      } else if (
        this.isLast3RunsOver500Each() &&
        !this.isCardWon(CardTypes.ThreeRuns)
      ) {
        this.showCard(CardTypes.ThreeRuns);
        this.sequenceController.callContract(
          CardTypes.ThreeRuns,
          (tx, error) => {
            if (error) {
              console.log(error);
              return;
            }
            console.log(tx);
            setTimeout(
              () => this.sequenceController.fetchWalletTokens(true),
              2000
            );
          }
        );
      } else if (
        this.game.distance >= 1000 &&
        this.game.distance < 2500 &&
        !this.isCardWon(CardTypes.ThousandMeterRun)
      ) {
        this.showCard(CardTypes.ThousandMeterRun);
        this.sequenceController.callContract(
          CardTypes.ThousandMeterRun,
          (tx, error) => {
            if (error) {
              console.log(error);
              return;
            }
            console.log(tx);
            setTimeout(
              () => this.sequenceController.fetchWalletTokens(true),
              2000
            );
          }
        );
      } else if (this.isFirstCrash() && !this.isCardWon(CardTypes.FirstCrash)) {
        this.showCard(CardTypes.FirstCrash);
        this.sequenceController.callContract(
          CardTypes.FirstCrash,
          (tx, error) => {
            if (error) {
              console.log(error);
              return;
            }
            console.log(tx);
            setTimeout(
              () => this.sequenceController.fetchWalletTokens(true),
              2000
            );
          }
        );
      } else if (
        this.isFirstPylonCrash &&
        !this.isCardWon(CardTypes.FirstPylonCrash)
      ) {
        this.showCard(CardTypes.FirstPylonCrash);
        this.sequenceController.callContract(
          CardTypes.FirstPylonCrash,
          (tx, error) => {
            if (error) {
              console.log(error);
              return;
            }
            console.log(tx);
            setTimeout(
              () => this.sequenceController.fetchWalletTokens(true),
              2000
            );
          }
        );
      } else {
        // let interval = setInterval(() => {
          console.log(this.wallet_btn)
          // if(this.wallet_btn) {
            // console.log('setting block')
            this.wallet_btn.style.display = 'block'
            // clearInterval(interval)
          // }
        // }, 100)
        this.sign_out_btn.style.display = 'block';
        this.sign_out_container.style.display = 'block';
        this.faucet_btn.style.display = 'block';
        this.airplane_hangar_btn.style.display = 'block';
      }
    }
  }

  handleMouseClick() {
    console.log(this.sequenceController.mode);
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
      if (this.activeCardID !== null) {
        this.removeCard(this.activeCardID);
        this.activeCardID = null;
      }

      return;
    } else if (this.game_mode === GameModes.GameOver) {
      if (this.activeCardID !== null) {
        this.removeCard(this.activeCardID);
        this.activeCardID = null;
        return;
      }

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
