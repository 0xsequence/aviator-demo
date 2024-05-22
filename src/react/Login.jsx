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
import { acheivementsContractAddress, boltContractAddress, orderbookContractAddress } from '../constants.js';
import { AuthModes, GameModes } from '../gameConstants.js';

let setFromMarketPlace = false;

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
        sendTransactionRequest
      );
      props.scene.switchGameMode(GameModes.Intro);
      props.scene.sequenceController.switchAuthMode(AuthModes.Completed);
    }
  }, [isConnected, walletClient]);

  const sendBurnToken = async (tokenID, amount, callback) => {
    const contractABI = ['function burn(uint256 tokenId, uint256 amount)']; // Replace with your contract's ABI
    const contract = new ethers.Contract(acheivementsContractAddress, contractABI);
    const data = contract.interface.encodeFunctionData('burn', [
      tokenID,
      amount,
    ]);

    try {
      await sendTransaction({
        to: acheivementsContractAddress,
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

  const sendTransactionRequest = async (
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
      orderbookContractAddress,
      String(amount),
    ]);

    try {
      setFromMarketPlace = true;
      await sendTransaction({
        to: boltContractAddress,
        data: dataApprove,
        value: '0',
        gas: null,
      });
    } catch (error) {
      alert('there was an error in approving tokens, refresh the page')
      console.log(error)
    }
    callback(null)
  };

  useEffect(() => {
    if (txnData && setFromMarketPlace) {
      setTimeout(async () => {
        try{
          setFromMarketPlace = false;
          await sendTransaction({
            to: orderbookContractAddress,
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
