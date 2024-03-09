import { SequenceIndexer } from '@0xsequence/indexer';

const AuthModes = {
  Email: 'email',
  Code: 'code',
  Completed: 'completed',
};

const ContractAddress = '0xbb35dcf99a74b4a6c38d69789232fa63e1e69e31';

class SequenceController {
  constructor() {
    this.indexer = new SequenceIndexer(
      'https://arbitrum-sepolia-indexer.sequence.app'
    );

    this.chainId = null;
    this.indexer.getChainID(({ chainID }) => {
      this.chainId = chainID;
    });

    this.authInstance = null;
    // this.walletClient = null;
    this.sendTransaction = null;

    this.email = null;
    this.token = null;
    this.mode = AuthModes.Email;
    this.walletAddress = null;
    this.authModeChangedCallback = null;
    this.balancesChangedCallback = null;
    this.ownedTokenBalances = [];

    this.emailVerifyForm = document.getElementById('emailVerify');
    this.codeVerifyForm = document.getElementById('codeVerify');
  }

  async init(walletClient, sendTransaction) {
    this.walletAddress = walletClient.account.address;
    this.switchAuthMode(AuthModes.Completed);
    this.email = walletClient.account.address;
    this.mode = AuthModes.Completed;
    this.fetchWalletTokens();
    this.sendBurnToken = sendTransaction;
  }

  async burnToken(token, callback) {
    this.sendBurnToken(token.tokenID, token.balance, callback);
  }

  fetchWalletTokens() {
    if (this.mode !== AuthModes.Completed) return;
    console.log(this.walletAddress);
    console.log('Fetching token balances...');
    this.indexer
      .getTokenBalances({
        accountAddress: this.walletAddress,
        contractAddress: ContractAddress,
        includeMetadata: true,
        metadataOptions: { includeMetadataContracts: [ContractAddress] },
      })
      .then(tokenBalances => {
        console.log(tokenBalances);
        this.ownedTokenBalances = [];

        for (let i = 0; i < tokenBalances.balances.length; i++) {
          const balance = tokenBalances.balances[i];
          this.ownedTokenBalances.push(balance);
        }

        if (this.balancesChangedCallback !== null)
          this.balancesChangedCallback();
      })
      .catch(error => {
        console.log(error);
      });
  }

  resetForm() {
    this.mode = 'email';
  }

  switchAuthMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    self = this;
    let interval = setInterval(() => {
      console.log('switching auth mode')
      this.authModeChangedCallback();
      if (self.email || this.mode == AuthModes.Email) {
        clearInterval(interval);
      }
    }, 10);
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

  fetchWalletAddress() {
    let loginButton = document.getElementById('loginButton');
  }

  callContract(tokenId, callback, waas = false) {
    console.log('Minting token:', tokenId);
    fetch(
      `https://shy-hall-dff2.tpin.workers.dev/?address=${this.walletAddress}&tokenId=${tokenId}`
    ).then(async res => {
      console.log(res);
      const txHash = await res.text();
      console.log(txHash);
      callback(txHash);
    });
  }

  clearAddress() {
    this.email = null
    return this
  }
}

export { SequenceController, AuthModes };
