import { arbitrumSepolia } from 'wagmi/chains';
import { SequenceIndexer } from '@0xsequence/indexer';
import { SequenceMetadata } from '@0xsequence/metadata';
import {
  airplanesContractAddress,
  acheivementsContractAddress,
  boltContractAddress,
  acheivementTokenIDs,
  airplaneTokenIDs,
} from '../../constants';
import { MyTokenData } from './MyTokenData';
import { AuthModes } from '../../gameConstants';

class SequenceController {
  constructor(onInitd) {
    this.onInitd = onInitd;
    this.metadata = new SequenceMetadata(
      'https://metadata.sequence.app',
      process.env.PROJECT_ACCESS_KEY_PROD
    );
    this.indexer = new SequenceIndexer(
      'https://arbitrum-sepolia-indexer.sequence.app',
      process.env.PROJECT_ACCESS_KEY_PROD
    );

    this.chainId = null;
    this.indexer.getChainID(({ chainID }) => {
      this.chainId = chainID;
    });

    this.authInstance = null;
    // this.walletClient = null;

    this.email = null;
    this.token = null;
    this.mode = AuthModes.Email;
    this.walletAddress = null;
    this.authModeChangedCallback = null;
    this.balancesChangedCallback = null;

    this.emailVerifyForm = document.getElementById('emailVerify');
    this.codeVerifyForm = document.getElementById('codeVerify');
  }

  async init(walletClient, sendBurnToken, sendTransactionRequest) {
    this.sendBurnToken = sendBurnToken;
    this.sendTransactionRequest = sendTransactionRequest;
    this.walletAddress = walletClient.account.address;
    this.switchAuthMode(AuthModes.Completed);
    this.email = walletClient.account.address;
    this.mode = AuthModes.Completed;
    const chainID = arbitrumSepolia.id.toString();
    const makeMyTokenData = (contractAddress, metadataTokenIds) => {
      return new MyTokenData(
        this.indexer,
        this.metadata,
        this.email,
        chainID,
        contractAddress,
        metadataTokenIds
      );
    };
    this.myAcheivements = makeMyTokenData(
      acheivementsContractAddress,
      acheivementTokenIDs
    );
    this.myPlanes = makeMyTokenData(airplanesContractAddress, airplaneTokenIDs);
    this.myBolts = makeMyTokenData(
      boltContractAddress
      // boltTokenIDs // no metadata exists for this token
    );
    if (this.onInitd) {
      this.onInitd();
    }
  }

  async sendBurnToken(tokenID, amount, callback) {
    console.warn('not ready');
  }

  async sendTransactionRequest(requestId, address, tokenID, amount, callback) {
    console.warn('not ready');
  }

  async mintERC20() {
    const amount = 100; // or whatever your amount is
    // Create the fetch request

    const res = await fetch('https://tiny-rice-1049.tpin.workers.dev', {
      // const res = await fetch('http://localhost:8787', {
      method: 'POST', // Specify the method
      headers: {
        'Content-Type': 'application/json', // Specify the content type as JSON
      },
      body: JSON.stringify({
        address: this.walletAddress,
        amount: amount,
      }), // Convert the JavaScript object to a JSON string
    });

    if (res.status != 200) {
      alert("you've reached your daily max of 100 tokens");
    }
    console.log(await res.text());
  }

  async burnToken(tokenID, balance, callback) {
    return this.sendBurnToken(tokenID, balance, callback);
  }

  resetForm() {
    this.mode = 'email';
  }

  switchAuthMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    self = this;
    let interval = setInterval(() => {
      console.log('switching auth mode');
      this.authModeChangedCallback();
      if (self.email || this.mode == AuthModes.Email) {
        clearInterval(interval);
      }
    }, 500);
  }

  triggerLoginModalForm() {
    if (this.mode === AuthModes.Email) {
      var emailInput = document.getElementById('emailInput');
      var emailValue = emailInput.value;

      if (emailValue === '' || !emailInput.validity.valid) {
        emailInput.setAttribute('aria-invalid', true);
        return;
      }

      emailInput.setAttribute('aria-invalid', false);

      this.authenticateEmail(emailValue);
    } else if (this.mode === AuthModes.Code) {
      var codeInput = document.getElementById('codeInput');
      var codeValue = codeInput.value;

      if (codeValue.length !== 6) {
        codeInput.setAttribute('aria-invalid', true);
        return;
      }

      codeInput.setAttribute('aria-invalid', false);

      this.finalizeEmailAuth(codeValue);
    }
  }

  callAchievementMinterContract(tokenId, callback, waas = false) {
    console.log('Minting token:', tokenId);
    const url = 'https://icy-pond-97da.tpin.workers.dev';
    // const url = 'http://localhost:8787';
    const data = {
      address: this.walletAddress,
      tokenId: tokenId,
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).then(async res => {
      const txHash = await res.text();
      console.log(txHash);
      callback(txHash);
    });
  }

  clearAddress() {
    this.email = null;
  }
}

export { SequenceController, AuthModes };
