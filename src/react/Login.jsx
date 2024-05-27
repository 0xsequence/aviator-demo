import React, { useEffect, useState } from 'react';
import { useOpenConnectModal } from '@0xsequence/kit';
import {
  useDisconnect,
  useAccount,
  useWalletClient,
  useSendTransaction
} from 'wagmi';
import './styles.css';
import { arbitrumSepolia } from 'wagmi/chains';

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
    sendTransactionAsync,
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
    // setInterval(() => {
    //   if (document.getElementById('webpack-dev-server-client-overlay'))
    //     document.getElementById('webpack-dev-server-client-overlay').remove();
    // }, 10);

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
    const chainID = arbitrumSepolia.id.toString();
    try {
      await sendTransaction({
        chainId: chainID,
        chainID: chainID,
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
    amount,
  ) => {
    const erc20Interface = new ethers.utils.Interface([
      'function approve(address spender, uint256 amount) public returns (bool)',
    ]);

    const sequenceMarketInterface = new ethers.utils.Interface([
      "function acceptRequest(uint256 requestId, uint256 quantity, address recipient, uint256[] calldata additionalFees, address[] calldata additionalFeeRecipients)"
    ]);

    const dataApprove = erc20Interface.encodeFunctionData('approve', [
      orderbookContractAddress,
      String(amount),
    ]);

    const dataAcceptRequest = sequenceMarketInterface.encodeFunctionData('acceptRequest', [
      requestId,
      1,
      address,
      [],
      [],
    ]);

    const txApprove = {
      to: boltContractAddress, // an ERC20 token contract
      data: dataApprove,
      gas: null
    };

    const tx = {
      to: orderbookContractAddress, // sequence market contract (same address on all offered networks)
      data: dataAcceptRequest,
      gas: null
    };

    await sendTransactionAsync(txApprove);
    await sendTransactionAsync(tx);
  };

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
