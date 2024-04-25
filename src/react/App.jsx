import React from 'react';
import Login from './Login.jsx';
import SignOut from './SignOut.jsx';

import { KitProvider, getKitConnectWallets } from '@0xsequence/kit';
import { getDefaultWaasConnectors } from '@0xsequence/kit-connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrumSepolia, Chain } from 'wagmi/chains';

const queryClient = new QueryClient();
const chains = [mainnet, arbitrumSepolia];
const projectAccessKey = process.env.PROJECT_ACCESS_KEY_PROD;
const waasConfigKey = process.env.WAAS_CONFIG_KEY;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const appleClientId = process.env.APPLE_CLIENT_ID;

// TODO: update this
const appleRedirectURI =
  'https://' + window.location.host + '/waas-airplane-demo';

function App(props) {
  const connectors = [
    ...getDefaultWaasConnectors({
      walletConnectProjectId: process.env.WALLET_CONNECT_ID,
      defaultChainId: arbitrumSepolia.id,
      waasConfigKey,
      googleClientId,
      appleClientId,
      appleRedirectURI,
      appName: 'Embedded Wallet Airplane Demo',
      projectAccessKey,
      enableConfirmationModal: false,
    })
  ];

  const transports = {};

  chains.forEach(chain => {
    transports[chain.id] = http();
  });

  const config = createConfig({
    transports,
    connectors,
    chains,
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <KitProvider
          config={{ defaultTheme: 'light', signIn: { showEmailInput: false } }}
        >
          <div id="app">
            <Login scene={props.scene} />
            <SignOut scene={props.scene} />
          </div>
        </KitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
