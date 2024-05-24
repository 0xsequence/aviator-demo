// freePlaneGiftMintingWorkerAddress
async function handleRequest(request, env2, ctx) {
  if (env2.PKEY === void 0 || env2.PKEY === "") {
    return new Response("Make sure PKEY is configured in your environment", { status: 400 });
  }
  if (env2.CONTRACT_ADDRESS === void 0 || env2.CONTRACT_ADDRESS === "") {
    return new Response("Make sure CONTRACT_ADDRESS is configured in your environment", { status: 400 });
  }
  if (env2.PROJECT_ACCESS_KEY === void 0 || env2.PROJECT_ACCESS_KEY === "") {
    return new Response("Make sure PROJECT_ACCESS_KEY is configured in your environment", { status: 400 });
  }
  if (env2.CHAIN_HANDLE === void 0 || env2.CHAIN_HANDLE === "") {
    return new Response("Make sure CHAIN_HANDLE is configured in your environment", { status: 400 });
  }
  const chainConfig = findSupportedNetwork(env2.CHAIN_HANDLE);
  if (chainConfig === void 0) {
    return new Response("Unsupported network or unknown CHAIN_HANDLE", { status: 400 });
  }
  if (request.method === "POST") {
    const body = await request.json();
    const { proof, address, tokenId } = body;
    try {
      try {
        const res = await callContract(request, env2, address, tokenId);
        return new Response(`${res.hash}`, { status: 200 });
      } catch (err) {
        console.log(err);
        return new Response(`Something went wrong: ${JSON.stringify(err)}`, { status: 400 });
      }
    } catch (err) {
      return new Response(`Unauthorized ${JSON.stringify(err)}`, { status: 401 });
    }
  } else {
    try {
      const res = await getBlockNumber(env2.CHAIN_HANDLE, request);
      return new Response(`Block Number: ${res}`);
    } catch (err) {
      return new Response(`Something went wrong: ${JSON.stringify(err)}`, { status: 500 });
    }
  }
}
var getBlockNumber = async (chainId, request) => {
  const nodeUrl = `https://next-nodes.sequence.app/${chainId}`;
  const provider = new ethers_exports.providers.JsonRpcProvider({ url: nodeUrl, skipFetchSetup: true });
  return await provider.getBlockNumber();
};
var callContract = async (request, env2, address, tokenId) => {
  const nodeUrl = `https://next-nodes.sequence.app/${env2.CHAIN_HANDLE}`;
  const relayerUrl = `https://next-${env2.CHAIN_HANDLE}-relayer.sequence.app`;
  const provider = new ethers_exports.providers.JsonRpcProvider({ url: nodeUrl, skipFetchSetup: true });
  const contractAddress = env2.CONTRACT_ADDRESS;
  const walletEOA = new ethers_exports.Wallet(env2.PKEY, provider);
  const settings = {
    networks: [{
      ...networks[findSupportedNetwork(env2.CHAIN_HANDLE).chainId],
      rpcUrl: findSupportedNetwork(env2.CHAIN_HANDLE).rpcUrl,
      provider,
      relayer: {
        url: relayerUrl,
        provider: {
          url: findSupportedNetwork(env2.CHAIN_HANDLE).rpcUrl
        }
      }
    }]
  };
  const session = await Session.singleSigner({
    settings,
    signer: walletEOA,
    projectAccessKey: env2.PROJECT_ACCESS_KEY
  });
  const signer2 = session.account.getSigner(findSupportedNetwork(env2.CHAIN_HANDLE).chainId);
  console.log(signer2.account.address);
  const collectibleInterface = new ethers_exports.utils.Interface([
    "function mint(address to, uint256 tokenId, uint256 amount, bytes data)"
  ]);
  const data = collectibleInterface.encodeFunctionData(
    "mint",
    [address, tokenId, 1, "0x00"]
  );
  const txn = { to: contractAddress, data };
  try {
    return await signer2.sendTransaction(txn);
  } catch (err) {
    throw err;
  }
};
var src_default = {
  async fetch(request, env2, ctx) {
    const response = await handleRequest(request, env2, ctx);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  }
};
export {
  src_default as default
};