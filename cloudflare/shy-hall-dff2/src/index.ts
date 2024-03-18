import { ethers } from 'ethers';
import { sequence } from '0xsequence';
import { networks, findSupportedNetwork } from '@0xsequence/network';
import { Session, SessionSettings } from '@0xsequence/auth';

export interface Env {
	PKEY: string; // Private key for EOA wallet
	CONTRACT_ADDRESS: string; // Deployed ERC1155 or ERC721 contract address
	PROJECT_ACCESS_KEY: string; // From sequence.build
	CHAIN_HANDLE: string; // Standardized chain name – See https://docs.sequence.xyz/multi-chain-support
}

// export default {
// 	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

// 		// TODO: ip restriction
// 		// const ipAddress = request.headers.get('CF-Connecting-IP')
// 		// if(ipAddress == '76.71.90.178'){
// 		// 	return new Response(`Hello World`, {
// 		// 		headers: { 'content-type': 'text/plain' },
// 		// 	})
// 		// }else {
// 		// 	return new Response(`Nahsee IP address is ${ipAddress}`, {
// 		// 		headers: { 'content-type': 'text/plain' },
// 		// 	})
// 		// }

// 		const url = new URL(request.url);

// 		// Get the pathname and split it into segments
// 		const pathSegments = url.pathname.split('/').filter(segment => segment !== '');

// 		// Assuming the slug is the last part of the pathname
// 		const slug = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '';
// 		const address = url.searchParams.get("address"); // Get the value of "query" parameter
//   		const tokenId = url.searchParams.get("tokenId"); // Get the value of "sort" parameter

// 		return new Response(`Slug: ${slug} address ${address} tokenId ${tokenId}`, {
// 			headers: { 'content-type': 'text/plain' },
// 		})
// 	}
// };

async function generateSigner(env: any): Promise<any> {
	const nodeUrl = `https://nodes.sequence.app/${env.CHAIN_HANDLE}`;
	const relayerUrl = `https://dev-${env.CHAIN_HANDLE}-relayer.sequence.app`;
	const provider = new ethers.providers.JsonRpcProvider({ url: nodeUrl, skipFetchSetup: true });

	// create EOA from private key
	const walletEOA = new ethers.Wallet(env.PKEY, provider);

	// instantiate settings
	const settings: Partial<SessionSettings> = {
		networks: [
			{
				...networks[findSupportedNetwork(env.CHAIN_HANDLE)!.chainId],
				rpcUrl: findSupportedNetwork(env.CHAIN_HANDLE)!.rpcUrl,
				provider: provider,
				relayer: {
					url: relayerUrl,
					provider: {
						url: findSupportedNetwork(env.CHAIN_HANDLE)!.rpcUrl,
					},
				},
			},
		],
	};

	// create a single signer sequence wallet session
	const session = await Session.singleSigner({
		settings: settings,
		signer: walletEOA,
		projectAccessKey: env.PROJECT_ACCESS_KEY,
	});

	// get signer
	return session.account.getSigner(findSupportedNetwork(env.CHAIN_HANDLE)!.chainId);
}

const callContract = async (
	request: Request,
	env: Env,
	address: string,
	tokenId: number,
): Promise<ethers.providers.TransactionResponse> => {
	const contractAddress = env.CONTRACT_ADDRESS;
	const signer = await generateSigner(env);

	// create interface from partial abi
	const collectibleInterface = new ethers.utils.Interface(['function mint(address to, uint256 tokenId, uint256 amount, bytes data)']);

	// create calldata
	const data = collectibleInterface.encodeFunctionData('mint', [address, tokenId, 1, '0x00']);

	// create transaction object
	const txn = { to: contractAddress, data };
	try {
		return await signer.sendTransaction(txn);
	} catch (err) {
		throw err;
	}
};

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	if (env.PKEY === undefined || env.PKEY === '') {
		return new Response('Make sure PKEY is configured in your environment', { status: 400 });
	}

	if (env.CONTRACT_ADDRESS === undefined || env.CONTRACT_ADDRESS === '') {
		return new Response('Make sure CONTRACT_ADDRESS is configured in your environment', { status: 400 });
	}

	if (env.PROJECT_ACCESS_KEY === undefined || env.PROJECT_ACCESS_KEY === '') {
		return new Response('Make sure PROJECT_ACCESS_KEY is configured in your environment', { status: 400 });
	}

	if (env.CHAIN_HANDLE === undefined || env.CHAIN_HANDLE === '') {
		return new Response('Make sure CHAIN_HANDLE is configured in your environment', { status: 400 });
	}

	const chainConfig = findSupportedNetwork(env.CHAIN_HANDLE);

	if (chainConfig === undefined) {
		return new Response('Unsupported network or unknown CHAIN_HANDLE', { status: 400 });
	}

	const url = new URL(request.url);

	// Get the pathname and split it into segments
	const pathSegments = url.pathname.split('/').filter((segment) => segment !== '');

	// Assuming the slug is the last part of the pathname
	const slug = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '';
	const address = url.searchParams.get('address'); // Get the value of "query" parameter
	const tokenId = url.searchParams.get('tokenId');

	// POST request
	if (address && tokenId) {
		try {
			const res = await callContract(request, env, address, Number(tokenId));
			return new Response(`${res.hash}`, { status: 200 });
		} catch (err: any) {
			console.log(err);
			return new Response(`Something went wrong: ${JSON.stringify(err)}`, { status: 400 });
		}
	} else {
		try {
			// mocked call
			const res = await getBlockNumber(env.CHAIN_HANDLE, request);
			const signer = await generateSigner(env);
			return new Response(`Block Number: ${res} 🖱️ & Relayer: ${signer.account.address} 🔏`);
		} catch (err: any) {
			return new Response(`Something went wrong: ${JSON.stringify(err)}`, { status: 500 });
		}
	}
}

const getBlockNumber = async (chainId: string, request: Request): Promise<number> => {
	const nodeUrl = `https://nodes.sequence.app/${chainId}`;
	const provider = new ethers.providers.JsonRpcProvider({ url: nodeUrl, skipFetchSetup: true });
	return await provider.getBlockNumber();
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// Process the request and create a response
		const response = await handleRequest(request, env, ctx);

		// Set CORS headers
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

		// return response
		return response;
	},
};
