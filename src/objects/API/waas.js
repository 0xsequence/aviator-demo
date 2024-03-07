import { Sequence, defaults, isSentTransactionResponse } from '@0xsequence/waas'
import { SequenceIndexer } from '@0xsequence/indexer'
import {ethers} from 'ethers'
const AuthModes = {
    Email: "email",
    Code: "code",
    Completed: "completed"
}

const ContractAddress = "0xbb35dcf99a74b4a6c38d69789232fa63e1e69e31";
const MinterContractAddress = "0x3d33ad6e2210ae3957b26f8099fe3d517bdfdf1f";

const WaaSAPIKey = ENV.waasConfigKey
const BuilderAPIKey = ENV.projectAccessKey

function decodeJWT(token) {
  const base64Url = token.split('.')[1]; // Get the payload part of the token
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Replace URL-safe characters
  const payload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(payload);
}

class SequenceController {
    constructor() {
        // this.sequence = new Sequence({
        //     projectId: ENV.projectId,
        //     network: 'mumbai',
        //     projectAccessKey: BuilderAPIKey,
        //     waasConfigKey: WaaSAPIKey,
        // }, ENV.rpcServer);

        this.indexer = new SequenceIndexer('https://arbitrum-sepolia-indexer.sequence.app');

        this.chainId = null;
        this.indexer.getChainID(({chainID}) => {
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

        this.emailVerifyForm = document.getElementById("emailVerify");
        this.codeVerifyForm = document.getElementById("codeVerify");

        // this.sequence.isSignedIn().then((signedIn) => {
        //     if (signedIn) {
        //       console.log('signed in')
        //         this.fetchWalletAddress();
        //     }
        // });
    }

    async init(walletClient, sendTransaction) {
      console.log(walletClient)
      this.walletAddress = walletClient.account.address
      this.switchAuthMode(AuthModes.Completed);
      this.email = walletClient.account.address;
      this.mode = AuthModes.Completed;
      this.fetchWalletTokens()
      this.sendBurnToken = sendTransaction
    }

    async authenticateGoogle(idToken) {
      var googleButton = document.getElementById("googleButton");
      googleButton.setAttribute("aria-busy", true);
      try {
        const walletAddress = await this.sequence.signIn({
          idToken: idToken
        }, 'google-sign-in-aviator')
        this.email = decodeJWT(idToken).email
        this.walletAddress = walletAddress.wallet
        googleButton.setAttribute("aria-busy", false);
        this.switchAuthMode(AuthModes.Completed);
      }catch(err){
        console.log(err)
      }
    }

    async burnToken(token, callback) {
      console.log(token)
      this.sendBurnToken(token.tokenID,token.balance, callback)
    }

    closeSession(callback) {
      this.sequence.getSessionID().then((sessionID) => {
        this.sequence.dropSession({sessionId: sessionID}).then(() => {
          this.authInstance = null;
          this.email = null;
          this.token = null;
          this.mode = AuthModes.Email;
          this.walletAddress = null;

          callback(null);
        }).catch((error) => {
          console.log(error);
          callback(error);
        })
      }).catch((error) => {
        console.log(error);
        callback(error);
      });
    }

    fetchWalletTokens() {
      if (this.mode !== AuthModes.Completed) return;
      console.log(this.walletAddress);
      console.log("Fetching token balances...");
      this.indexer.getTokenBalances({
        accountAddress: this.walletAddress,
        contractAddress: ContractAddress,
        includeMetadata: true,
        metadataOptions: { includeMetadataContracts: [ContractAddress] }
      }).then((tokenBalances) => {
        console.log(tokenBalances);
        this.ownedTokenBalances = [];
        
        for (let i = 0; i < tokenBalances.balances.length; i++) {
          const balance = tokenBalances.balances[i];
          this.ownedTokenBalances.push(balance);
        }

        if (this.balancesChangedCallback !== null) this.balancesChangedCallback();
      }).catch((error) => {
        console.log(error);
      });
    }

    resetForm() {
      this.mode = 'email';
    }

    switchAuthMode(mode) {
      if (this.mode === mode) return;
  
      this.mode = mode;
  
      // if (this.mode === AuthModes.Email) {
      //   this.emailVerifyForm.style.display = "block";
      //   this.codeVerifyForm.style.display = "none";
      // } else if (this.mode === AuthModes.Code) {
      //   this.emailVerifyForm.style.display = "none";
      //   this.codeVerifyForm.style.display = "block";
      // } else if (this.mode === AuthModes.Completed) {
      //   this.emailVerifyForm.style.display = "block";
      //   this.codeVerifyForm.style.display = "none";

        // this.fetchWalletTokens();
      // }

      self = this;
      let interval = setInterval(() => {this.authModeChangedCallback(); if(self.email){clearInterval(interval)}}, 1000)
    }
  
    triggerLoginModalForm() {
      if (this.mode === AuthModes.Email) {
        var emailInput = document.getElementById("emailInput");
        var emailValue = emailInput.value;
    
        if (emailValue === "" || !emailInput.validity.valid) {
          emailInput.setAttribute("aria-invalid", true);
          return;
        }
    
        emailInput.setAttribute("aria-invalid", false);
    
        this.authenticateEmail(emailValue);
      } else if (this.mode === AuthModes.Code) {
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
      var loginButton = document.getElementById("loginButton");
  
      loginButton.setAttribute("aria-busy", true);
  
      this.sequence.email.initiateAuth({ email: email }).then(({ email, instance }) => {
        this.email = email;
        this.authInstance = instance;

        loginButton.setAttribute("aria-busy", false);
  
        this.switchAuthMode(AuthModes.Code);
      }).catch((error) => {
        alert(error);
  
        let emailInput = document.getElementById("emailInput");
        emailInput.setAttribute("aria-invalid", true);
        loginButton.setAttribute("aria-busy", false);
      });
    }
  
    finalizeEmailAuth(code) {
      if (this.email === null || this.authInstance === null) return;
  
      let loginButton = document.getElementById("loginButton");
  
      loginButton.setAttribute("aria-busy", true);
      this.sequence.email.finalizeAuth({ instance: this.authInstance, email: this.email, answer: code }).then((token) => {
        this.token = token;
  
        this.createWalletAddress();
      }).catch((error) => { // errors here
        alert(error);
        console.log(error) 
        loginButton.setAttribute("aria-busy", false);
        var codeInput = document.getElementById("codeInput");
        codeInput.setAttribute("aria-invalid", true);
      });
    }
  
    createWalletAddress() {
      this.sequence.signIn(this.token, this.email).then((address) => {
        console.log(address);
        this.fetchWalletAddress();
      }).catch((error) => {
        alert(error);
        this.mode = AuthModes.Email;

        let loginButton = document.getElementById("loginButton");
        loginButton.setAttribute("aria-busy", false);
      });
    }
  
    fetchWalletAddress() {
      let loginButton = document.getElementById("loginButton");

      this.sequence.getAddress().then((address) => {
        this.walletAddress = address;
  
        this.sequence.deviceName.get().then((deviceName) => {
          this.email = deviceName;
          this.switchAuthMode(AuthModes.Completed);

          loginButton.setAttribute("aria-busy", false);
        });
      }).catch((error) => {
        alert(error);
        this.mode = AuthModes.Email;
        loginButton.setAttribute("aria-busy", false);
      });
    }

    callContract(tokenId, callback, waas = false) {
      console.log("Minting token:", tokenId);
      fetch(`https://shy-hall-dff2.tpin.workers.dev/?address=${this.walletAddress}&tokenId=${tokenId}`).then(async (res) => {
        console.log(res)
        const txHash = await res.text()
        console.log(txHash)
        callback(txHash)
      })
      // if(waas){
      //   this.sequence.callContract({
      //     chainId: this.chainId,
      //     to: ContractAddress,
      //     abi: 'mint(address to, uint256 tokenId, uint256 amount, bytes data)',
      //     func: 'mint',
      //     args: {
      //       to: this.walletAddress, 
      //       tokenId: `${tokenId}`, 
      //       amount: "1", 
      //       data: "0x00"
      //     },
      //     value: 0
      //   }).then((tx)=> {
      //     callback(tx, null);
      //   }).catch((error) => {
      //     console.log(error);
      //     callback(null, error);
      //   });
      // } else {
      //   // https://fancy-glitter-895a.yellow-shadow-d7ff.workers.dev
      // }
    }
}

export { SequenceController, AuthModes }
