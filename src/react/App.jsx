import React from 'react';
import Login from './Login.jsx';
import SignOut from './SignOut.jsx';

import { KitProvider, getKitConnectWallets } from '@0xsequence/kit';
import { getDefaultWaasConnectors } from '@0xsequence/kit-connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrumSepolia, Chain } from 'wagmi/chains';

const queryClient = new QueryClient();
console.log(ENV.appleClientId)
const chains = [mainnet, arbitrumSepolia];
const projectAccessKey = ENV.projectAccessKey;
const waasConfigKey = ENV.waasConfigKey;
const googleClientId = ENV.googleClientId;
const appleClientId = ENV.appleClientId;

// TODO: update this
const appleRedirectURI = 'https://' + window.location.host;

function App(props) {
  const connectors = [
    ...getDefaultWaasConnectors({
      walletConnectProjectId: ENV.walletConnectId,
      defaultChainId: 421614,
      waasConfigKey,
      googleClientId,
      appleClientId,
      appleRedirectURI,
      appName: 'demo app',
      projectAccessKey,
      enableConfirmationModal: false,
    }),
    ...getKitConnectWallets(projectAccessKey, []),
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
