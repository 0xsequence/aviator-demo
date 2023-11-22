import { Sequence, defaults, isSentTransactionResponse } from '@0xsequence/waas'
import { SequenceIndexer } from '@0xsequence/indexer'

const AuthModes = {
    Email: "email",
    Code: "code",
    Completed: "completed"
}

const ContractAddress = "0x2Fdf496353923C5F1bDd9fFdacE3Db555942B30d";

class SequenceController {
    constructor() {
        this.sequence = new Sequence({
            network: 'polygon',
            key: 'eyJzZWNyZXQiOiJ0YmQiLCJ0ZW5hbnQiOjksImlkZW50aXR5UG9vbElkIjoidXMtZWFzdC0yOjQyYzlmMzlkLWM5MzUtNGQ1Yy1hODQ1LTVjODgxNWM3OWVlMyIsImVtYWlsQ2xpZW50SWQiOiI1Zmw3ZGc3bXZ1NTM0bzl2ZmpiYzZoajMxcCJ9',
        }, defaults.TEMPLATE_NEXT);

        this.indexer = new SequenceIndexer('https://polygon-indexer.sequence.app');

        this.authInstance = null;
        this.email = null;
        this.token = null;
        this.mode = AuthModes.Email;
        this.walletAddress = null;
        this.authModeChangedCallback = null;
        this.balancesChangedCallback = null;
        this.ownedTokenBalances = [];

        this.emailVerifyForm = document.getElementById("emailVerify");
        this.codeVerifyForm = document.getElementById("codeVerify");

        this.sequence.isSignedIn().then((signedIn) => {
            if (signedIn) {
                this.fetchWalletAddress();
            }
        });
    }

    burnToken(token, callback) {
      // const txn = this.sequence.sendTransaction({
      //   chainId: token.chainId,
      //   transactions: [{
      //     to: token.contractAddress,
      //     value: token.balance,
      //   }]
      // }).then((response) => {
      //   console.log(response);
      //   callback(response, null);
      // }).catch((error) => {
      //   console.log("Error:", error);
      //   callback(null, error);
      // });

      // if (isSentTransactionResponse(txn)) {
      //   console.log(txn);
      // } else {
      //   callback(null, "Invalid txn");
      // }

      this.sequence.sendERC1155({
        chainId: Number(token.chainId),
        token: token.contractAddress,
        to: token.contractAddress,
        values: [{
          id: token.tokenID,
          value: token.balance,
        }]
      }).then((response) => {
        console.log(response);
        callback(response, null);
      }).catch((error) => {
          console.log("Error:", error);
          callback(null, error);
      });

      // this.sequence.callContract({
      //   chainId: token.chainId,
      //   to: token.contractAddress,
      //   abi: 'burn(uint256,uint256)',
      //   func: 'burn',
      //   args: [parseInt(token.tokenID), parseInt(token.balance)],
      //   value: 0
      // }).then((tx)=> {
      //   callback(tx, null);
      // }).catch((error) => {
      //   callback(null, error);
      // });
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

    switchAuthMode(mode) {
      if (this.mode === mode) return;
  
      this.mode = mode;
  
      if (this.mode === AuthModes.Email) {
        this.emailVerifyForm.style.display = "block";
        this.codeVerifyForm.style.display = "none";
      } else if (this.mode === AuthModes.Code) {
        this.emailVerifyForm.style.display = "none";
        this.codeVerifyForm.style.display = "block";
      } else if (this.mode === AuthModes.Completed) {
        this.emailVerifyForm.style.display = "block";
        this.codeVerifyForm.style.display = "none";

        this.fetchWalletTokens();
      }

      if (this.authModeChangedCallback !== null) this.authModeChangedCallback();
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
      }).catch((error) => {
        alert(error);
  
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

    callContract(tokenId, cb) {
      console.log("Calling contract", tokenId);
      this.sequence.callContract({
        chainId: 137,
        to: ContractAddress,
        abi: 'mint(uint256)',
        func: 'mint',
        args: [`${tokenId}`],
        value: 0
      }).then((tx)=> {
        cb(tx)
      }).catch((error) => {
        console.log(error);
      });
    }
}

export { SequenceController, AuthModes }
