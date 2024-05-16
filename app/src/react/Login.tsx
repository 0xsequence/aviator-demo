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

let setOpenConnectModalButtonRef: any;

function Login(props: any) {
  const { setOpenConnectModal } = useOpenConnectModal();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const [fullfillOrderData, setFulfillOrderData] = useState<any>(null)
  const {
    data: txnData,
    sendTransaction,
  } = useSendTransaction();

  const onClick = () => {
    setOpenConnectModal(true);
    console.log(document.getElementById('container'));
  };

  const setOpenConnectModalButton = () => {
    setOpenConnectModal(true);
  }

  setOpenConnectModalButtonRef = setOpenConnectModalButton

  useEffect(() => {
    setInterval(() => {
      if (document.getElementById('webpack-dev-server-client-overlay'))
        document.getElementById('webpack-dev-server-client-overlay')!.remove();
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

  const sendBurnToken = async (tokenID: any, amount: any, callback: any) => {
    const contractABI = ['function burn(uint256 tokenId, uint256 amount)']; // Replace with your contract's ABI
    const contract = new ethers.Contract(ContractAddress, contractABI);
    const data = contract.interface.encodeFunctionData('burn', [
      tokenID,
      amount,
    ]);

    try {
      await sendTransaction({
        to: ContractAddress,
        data: `0x${data.slice(2, data.length)}`,
        gas: null,
      });
      setFromMarketPlace = false;
      callback(null, null);
    } catch (error) {
      callback(error);
    }
  };

  const sendAcceptRequest = async (
    requestId: any,
    address: any,
    tokenID: any,
    amount: any,
    callback: any
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
        to: '0xb484c76a59074efc3da2fcfab57b03d3cdd96b80',
        data: `0x${dataApprove.slice(2, dataApprove.length)}`,
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
            data: `0x${fullfillOrderData.slice(2, fullfillOrderData.length)}`,
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

export {
  setOpenConnectModalButtonRef
}

export default Login;
