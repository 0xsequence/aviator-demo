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

const AuthModes = {
    Email: 'email',
    Code: 'code',
    Completed: 'completed',
  };

function SignOut(props) {

    const { isConnected } = useAccount()
    const {disconnect} = useDisconnect()

    return (
        <>
        <div style={{textAlign:'center'}}>
            <br/>
            {isConnected && <div onClick={() => {
                let sequenceController = props.scene.sequenceController.clearAddress()
                sequenceController.switchAuthMode(AuthModes.Email);
                sequenceController.resetForm()
                props.scene.switchGameMode(GameModes.Intro);
                props.scene.resetGame();
                // props.scene.clearLocalStores();
                console.log(sequenceController.email)
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