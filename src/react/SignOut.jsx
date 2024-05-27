import React, { useEffect } from 'react';
import { useDisconnect, useAccount } from 'wagmi';
import { AuthModes, GameModes } from '../gameConstants';

function SignOut(props) {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (!isConnected) {
      let sequenceController = props.scene.sequenceController;

      sequenceController.clearAddress();
      sequenceController.switchAuthMode(AuthModes.Email);
      sequenceController.resetForm();
      
      props.scene.clearLocalStores();
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
            id="sign-out-container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
            }}
          >
            <button
              id="sign-out-button"
              onClick={() => {
                disconnect();
                // localStorage.clear();
                // localStorage.setItem('plane_color', 0);
                // props.scene.airplane.addPlane(0);
              }}
            >
              ⏻ Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default SignOut;
