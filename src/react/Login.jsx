import React, { useEffect, useState } from "react";
import { useOpenConnectModal } from "@0xsequence/kit";
import {
  useDisconnect,
  useAccount,
  useWalletClient,
  useSendTransaction,
} from "wagmi";
import "./styles.css";

import { ethers } from "ethers";
import { config } from "./App.jsx";

const AuthModes = {
  Email: "email",
  Code: "code",
  Completed: "completed",
};

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
};

const ContractAddress = "0xbb35dcf99a74b4a6c38d69789232fa63e1e69e31";

function Login(props) {
  const { setOpenConnectModal } = useOpenConnectModal();
  const [burnCallback, setBurnCallback] = useState(null)
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const {
    data: txnData,
    sendTransaction,
    isLoading: isSendTxnLoading,
  } = useSendTransaction();
  const onClick = () => {
    setOpenConnectModal(true);
  };

  window.setOpenConnectModal = () => {
    setOpenConnectModal(true);
    setTimeout(
      () =>
        (document.getElementById("email").style.backgroundColor =
          "transparent"),
      0
    );
    setTimeout(
      () => (document.getElementById("email").style.border = "0px"),
      0
    );
    setTimeout(
      () => (document.getElementById("email").style.margin = "10px"),
      0
    );
    setTimeout(
      () => (document.getElementById("email").style.marginLeft = "-10px"),
      0
    );
  };

  useEffect(() => {
    setInterval(() => {
      if (document.getElementById("webpack-dev-server-client-overlay"))
        document.getElementById("webpack-dev-server-client-overlay").remove();
    }, 100);

    if (isConnected && walletClient) {
      console.log(walletClient);
      props.scene.sequenceController.init(walletClient, sendBurnToken);
      props.scene.switchGameMode(GameModes.Intro);
      props.scene.sequenceController.switchAuthMode(AuthModes.Completed);
    }
  }, [isConnected, walletClient]);

  const sendBurnToken = async (tokenID, amount, callback) => {
    const contractABI = ["function burn(uint256 tokenId, uint256 amount)"]; // Replace with your contract's ABI
    const contract = new ethers.Contract(ContractAddress, contractABI);
    const data = contract.interface.encodeFunctionData("burn", [
      tokenID,
      amount,
    ]);

    try {
      console.log(sendTransaction);
      sendTransaction({
        to: ContractAddress,
        data: data,
        value: "0",
        gas: null,
      });
    } catch (error) {
      callback(error);
    }
  };

  useEffect(() => {
    if (txnData) {
    setTimeout(() => {

    }, 1000)
      console.log(txnData);
      props.scene.closeCardModal()
      props.scene.sequenceController.fetchWalletTokens();
    }
  }, [isSendTxnLoading, txnData]);

  return (
    <>
      <div style={{ textAlign: "center", zIndex: 100 }}>
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        {!isConnected && (
          <div
            className="message message--replay"
            style={{ cursor: "pointer" }}
          >
            Click to login
          </div>
        )}
        <br />
        <br />
        <br />
      </div>
    </>
  );
}

export default Login;