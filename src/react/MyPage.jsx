import React, {useEffect} from 'react'
import { useOpenConnectModal } from '@0xsequence/kit'
import { useDisconnect, useAccount, useWalletClient } from 'wagmi'
import './styles.css'

const AuthModes = {
    Email: "email",
    Code: "code",
    Completed: "completed"
}

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

function MyPage(props) {
    const { setOpenConnectModal } = useOpenConnectModal()

    const { isConnected } = useAccount()
    const {disconnect} = useDisconnect()
    const { data: walletClient } = useWalletClient()

    const onClick = () => {
        setOpenConnectModal(true)
    }

    window.setOpenConnectModal = () => {
        setOpenConnectModal(true)
        setTimeout(() => document.getElementById('email').style.backgroundColor = 'transparent', 0)
        setTimeout(() => document.getElementById('email').style.border = '0px', 0)
        setTimeout(() => document.getElementById('email').style.margin = '10px', 0)
        setTimeout(() => document.getElementById('email').style.marginLeft = '-10px', 0)
    }

    useEffect(() => {
        setInterval(() => {
            if(document.getElementById('webpack-dev-server-client-overlay')) document.getElementById('webpack-dev-server-client-overlay').remove()
        }, 100)

        if(isConnected&& walletClient){
            console.log(walletClient)
            props.scene.sequenceController.init(walletClient)
            props.scene.switchGameMode(GameModes.Intro)
            props.scene.sequenceController.switchAuthMode(AuthModes.Completed)
        }
    }, [isConnected, walletClient])

    return (
        <>
        <div style={{textAlign:'center', zIndex: 100}}>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            {!isConnected &&<div className='message message--replay' style={{cursor: 'pointer'}}>
                Click to login
            </div> }
            <br/>
            <br/>
            <br/>
        </div>
        </>
    )
}

export default MyPage