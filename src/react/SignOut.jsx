import React, { useEffect } from 'react';
import { useDisconnect, useAccount } from 'wagmi';

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

const AuthModes = {
  Email: 'email',
  Code: 'code',
  Completed: 'completed',
};

function SignOut(props) {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (!isConnected) {
      let sequenceController = props.scene.sequenceController.clearAddress();
      sequenceController.switchAuthMode(AuthModes.Email);
      sequenceController.resetForm();
      props.scene.switchGameMode(GameModes.Intro);
      props.scene.resetGame();
      props.scene.achievement_cards.style.display = 'none';
    }
  }, [isConnected]);
  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <br />
        {isConnected && (
          <div
            id="signOutContainer"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
            }}
          >
            <button
              id="signOutBtn"
              onClick={() => {
                // props.scene.clearLocalStores();
                localStorage.setItem('plane_color', 0);
                disconnect();
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default SignOut;
