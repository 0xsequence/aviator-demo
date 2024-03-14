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
    this.sendTransactionRequest = null
    this.sendBurnToken = null

    this.emailVerifyForm = document.getElementById('emailVerify');
    this.codeVerifyForm = document.getElementById('codeVerify');
  }

  async init(walletClient, sendTransactionBurn, sendTransactionRequest) {
    this.walletAddress = walletClient.account.address;
    this.switchAuthMode(AuthModes.Completed);
    this.email = walletClient.account.address;
    this.mode = AuthModes.Completed;
    this.fetchWalletTokens();
    this.sendBurnToken = sendTransactionBurn;
    this.sendTransactionRequest = sendTransactionRequest

    // indexer 
    this.indexer
      .getTokenBalances({
        accountAddress: this.email,
        contractAddress: '0x1693ffc74edbb50d6138517fe5cd64fd1c917709',
        includeMetadata: true,
        metadataOptions: { includeMetadataContracts: ['0x1693ffc74edbb50d6138517fe5cd64fd1c917709'] },
      })
      .then(async (tokenBalances) => {
        let requiresGift = true
        console.log(tokenBalances)
        for (let i = 0; i < tokenBalances.balances.length; i++) {
          const tokenId = tokenBalances.balances[i].tokenID;
          console.log(tokenId)
          if(Number(tokenId) == 1){
            requiresGift = false
          }
        }

        if(requiresGift){
          var modal = document.getElementById("cardModal-gift");
          modal.setAttribute("open", true);

          var modalContent = document.getElementById("cardModalContentGift");

          const titleGift = document.createElement('p');
          titleGift.id = 'inventory-title';
          titleGift.innerHTML = 'A gift for registering';
          titleGift.style = 'position: relative; text-align: center;';

          modalContent.appendChild(titleGift);

          const gridContainer = document.getElementById('gridContainerGift');

          const panel = document.createElement('div');
          panel.className = 'color-panel plane-1';
          // Assuming there is a defined function handlePanelClick
          // panel.onclick = () => handlePanelClick(index + 1, true);

          gridContainer.appendChild(panel);

          // Adding spinner and updating button text after 2 seconds
          var cancelButton = document.getElementById("firstPlaneButton");
          var self = this
          async function updateMintingButton() {
              cancelButton.innerHTML = '<div class="spinner"></div>'; // Add your spinner HTML here
              cancelButton.removeAttribute('onClick'); // Remove the initial click handler to prevent closing the modal prematurel


              const url = 'https://yellow-bonus-97e1.yellow-shadow-d7ff.workers.dev';
              console.log(self.email)
          const data = {
            address: self.email,
            tokenId: 1
          };
          
            try {
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
              });
          
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
          
              console.log(response);
              cancelButton.innerHTML = 'Continue';
              cancelButton.onclick = function(event) {
                closeGiftModal(event); // Assuming this function is defined elsewhere to handle the modal closing
              };
              localStorage.setItem('plane_color', 1)
            } catch (error) {
              console.error('Error:', error);
            }
          }

          // You might want to call this function when appropriate, for example after the modal is shown
          updateMintingButton();

          // const url = 'https://yellow-bonus-97e1.yellow-shadow-d7ff.workers.dev';
          // console.log(address)
          // const data = {
          //   address: this.email,
          //   tokenId: 1
          // };
          
          //   try {
          //     const response = await fetch(url, {
          //       method: 'POST',
          //       headers: {
          //         'Content-Type': 'application/json'
          //       },
          //       body: JSON.stringify(data)
          //     });
          
          //     if (!response.ok) {
          //       throw new Error(`HTTP error! Status: ${response.status}`);
          //     }
          
          //     console.log(response);
          //   } catch (error) {
          //     console.error('Error:', error);
          //   }
        }
      })
    // if no balance, 
    // open modal
    // set loading
    // mint
    // remove loading
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
