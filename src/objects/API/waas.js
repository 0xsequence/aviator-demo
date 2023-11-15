import { Sequence, defaults } from '@0xsequence/waas'

const AuthModes = {
    Email: "email",
    Code: "code",
    Completed: "completed"
}

class SequenceController {
    constructor() {
        this.sequence = new Sequence({
            network: 'polygon',
            key: 'eyJzZWNyZXQiOiJ0YmQiLCJ0ZW5hbnQiOjksImlkZW50aXR5UG9vbElkIjoidXMtZWFzdC0yOjQyYzlmMzlkLWM5MzUtNGQ1Yy1hODQ1LTVjODgxNWM3OWVlMyIsImVtYWlsQ2xpZW50SWQiOiI1Zmw3ZGc3bXZ1NTM0bzl2ZmpiYzZoajMxcCJ9',
        }, defaults.TEMPLATE_NEXT);

        this.authInstance = null;
        this.email = null;
        this.token = null;
        this.mode = AuthModes.Email;
        this.walletAddress = null;
        this.authModeChangedCallback = null;

        this.emailVerifyForm = document.getElementById("emailVerify");
        this.codeVerifyForm = document.getElementById("codeVerify");

        this.sequence.isSignedIn().then((signedIn) => {
            if (signedIn) {
                this.fetchWalletAddress();
            }
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
  
        loginButton.setAttribute("aria-busy", false);
        var emailInput = document.getElementById("emailInput");
        emailInput.setAttribute("aria-invalid", true);
      });
    }
  
    finalizeEmailAuth(code) {
      if (this.email === null || this.authInstance === null) return;
  
      var loginButton = document.getElementById("loginButton");
  
      loginButton.setAttribute("aria-busy", true);
  
      this.sequence.email.finalizeAuth({ instance: this.authInstance, email: this.email, answer: code }).then((token) => {
        this.token = token;

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
      this.sequence.signIn(this.token, this.email).then((address) => {
        this.walletAddress = address;
        this.switchAuthMode(AuthModes.Completed);
      }).catch((error) => {
        alert(error);
        this.mode = AuthModes.Email;
      });
    }
  
    fetchWalletAddress() {
      this.sequence.getAddress().then((address) => {
        this.walletAddress = address;
  
        this.sequence.deviceName.get().then((deviceName) => {
          this.email = deviceName;
          this.switchAuthMode(AuthModes.Completed);
        });
      }).catch((error) => {
        alert(error);
        this.mode = AuthModes.Email;
      })
    }

    callContract(tokenId, cb) {
      this.sequence.callContract({
        chainId: 137,
        to: '0x',
        abi: 'mint(uint256)',
        func: 'mint',
        args: [`${tokenId}`],
        value: 0                                           
      }).then((tx)=> {
        console.log(tx)
        cb(tx)
      })
    }
}

export { SequenceController, AuthModes }
