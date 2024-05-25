export async function fulfillSellOrder(orderId) {
  const wallet = sequence.getWallet();
  const signer = wallet.getSigner(421614); // on arbitrum-sepolia

  const erc20Interface = new ethers.utils.Interface([
    "function approve(address spender, uint256 amount) public returns (bool)",
  ]);

  const sequenceMarketInterface = new ethers.utils.Interface([
    "function acceptRequest(uint256 requestId, uint256 quantity, address recipient, uint256[] calldata additionalFees, address[] calldata additionalFeeRecipients)",
  ]);

  const amountBigNumber = ethers.utils.parseUnits(String(price), 18); // currency price based on correct decimals for token contract

  const dataApprove = erc20Interface.encodeFunctionData("approve", [
    "0xB537a160472183f2150d42EB1c3DD6684A55f74c", // sequence market contract (same address on all offered networks)
    amountBigNumber,
  ]);

  const dataAcceptRequest = sequenceMarketInterface.encodeFunctionData(
    "acceptRequest",
    [requestId, quantity, recipientAddress, [], []]
  );

  const txApprove = {
    to: "0xa9c88358862211870db6f18bc9b3f6e4f8b3eae7", // an ERC20 token contract
    data: dataApprove,
  };

  const tx = {
    to: "0xB537a160472183f2150d42EB1c3DD6684A55f74c", // sequence market contract (same address on all offered networks)
    data: dataAcceptRequest,
  };

  await signer.sendTransaction([txApprove, tx]);
}
