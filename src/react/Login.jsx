import React, { useEffect, useState } from 'react';
import { useOpenConnectModal } from '@0xsequence/kit';
import {
  useDisconnect,
  useAccount,
  useWalletClient,
  useSendTransaction,
} from 'wagmi';
import './styles.css';

import SequenceMarketABI from '../abi/ISequenceMarket.json';

import { ethers } from 'ethers';
import { config } from './App.jsx';

const AuthModes = {
  Email: 'email',
  Code: 'code',
  Completed: 'completed',
};

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

const ContractAddress = '0xbb35dcf99a74b4a6c38d69789232fa63e1e69e31';
let setFromMarketPlace = false;
let approveCallback = null;
function Login(props) {
  const { setOpenConnectModal } = useOpenConnectModal();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const [fullfillOrderData, setFulfillOrderData] = useState(null)
  const {
    data: txnData,
    sendTransaction,
    isLoading: isSendTxnLoading,
  } = useSendTransaction();
  const onClick = () => {
    setOpenConnectModal(true);
    console.log(document.getElementById('container'));
  };

  window.setOpenConnectModal = () => {
    setOpenConnectModal(true);
  };

  useEffect(() => {
    setInterval(() => {
      if (document.getElementById('webpack-dev-server-client-overlay'))
        document.getElementById('webpack-dev-server-client-overlay').remove();
    }, 10);

    if (isConnected && walletClient) {
      console.log(walletClient);
      props.scene.sequenceController.init(
        walletClient,
        sendBurnToken,
        sendAcceptRequest
      );
      props.scene.switchGameMode(GameModes.Intro);
      props.scene.sequenceController.switchAuthMode(AuthModes.Completed);
    }
  }, [isConnected, walletClient]);

  const sendBurnToken = async (tokenID, amount, callback) => {
    const contractABI = ['function burn(uint256 tokenId, uint256 amount)']; // Replace with your contract's ABI
    const contract = new ethers.Contract(ContractAddress, contractABI);
    const data = contract.interface.encodeFunctionData('burn', [
      tokenID,
      amount,
    ]);

    try {
      await sendTransaction({
        to: ContractAddress,
        data: data,
        value: '0',
        gas: null,
      });
      setFromMarketPlace = false;
      callback(null, null);
    } catch (error) {
      callback(error);
    }
  };

  const sendAcceptRequest = async (
    requestId,
    address,
    tokenID,
    amount,
    callback
  ) => {
    const sequenceMarketInterface = new ethers.utils.Interface(
      SequenceMarketABI.abi
    );

    const data = sequenceMarketInterface.encodeFunctionData('acceptRequest', [
      requestId,
      1,
      address,
      [],
      [],
    ]);

    setFulfillOrderData(data)

    const erc20Interface = new ethers.utils.Interface([
      'function approve(address spender, uint256 amount) public returns (bool)',
    ]);

    const dataApprove = erc20Interface.encodeFunctionData('approve', [
      '0xB537a160472183f2150d42EB1c3DD6684A55f74c',
      String(amount),
    ]);

    try {
      setFromMarketPlace = true;
      callback(null)
      await sendTransaction({
        to: '0xa9c88358862211870db6f18bc9b3f6e4f8b3eae7',
        data: dataApprove,
        value: '0',
        gas: null,
      });
    } catch (error) {
      alert('there was an error in approving tokens, refresh the page')
      console.log(error)
    }
  };

  useEffect(() => {
    if (txnData && setFromMarketPlace) {
      setTimeout(async () => {
        try{
          setFromMarketPlace = false;
          await sendTransaction({
            to: '0xB537a160472183f2150d42EB1c3DD6684A55f74c',
            data: fullfillOrderData,
            value: '0',
            gas: null,
          });
        }catch(err){
          console.log(err)
          alert('there was an error in fulfilling the order, refresh the page')
        }
      }, 1000) 
    } else {
      console.log(txnData)
    }
  }, [txnData, fullfillOrderData]);

  return (
    <>
      <div style={{ textAlign: 'center', zIndex: 100 }}>
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
            style={{ cursor: 'pointer' }}
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
