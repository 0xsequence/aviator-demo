import React from 'react'
import { useDisconnect, useAccount } from 'wagmi'

const GameModes = {
	Intro: "intro",
	Playing: "playing",
	Paused: "paused",
	GameEnding: "gameending",
	GameOver: "gameover",
  CardWon: "cardwon",
  CardReady: "cardready",
  SigningOut: "signingout",
  CardDetails: "carddetails",
}

function SignOut(props) {

    const { isConnected } = useAccount()
    const {disconnect} = useDisconnect()

    return (
        <>
        <div style={{textAlign:'center'}}>
            <br/>
            {isConnected && <div onClick={() => {
                props.scene.switchGameMode(GameModes.Intro);
                props.scene.resetGame();
                props.scene.clearLocalStores();
                props.scene.sequenceController.resetForm()
                disconnect()
                }} className='sign-out' style={{cursor: 'pointer'}}>
                sign out
            </div> 
            }
        </div>
        </>
    )
}

export default SignOut